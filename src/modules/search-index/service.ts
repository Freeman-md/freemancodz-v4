import "server-only";

import type { SearchIndexWorkerResult } from "@/contracts/search-index-worker.contract";
import type { Logger } from "@/infrastructure/logging/logger";
import type { OpenAITransport } from "@/infrastructure/openai/types";
import type { PortfolioReadService } from "@/modules/portfolio/services/read.service";
import type { SearchIndexJobStore } from "./types";
import type { SiteChunkStore } from "./types";
import { mapPortfolioSnapshot } from "./mappers/portfolio-snapshot.mapper";
import { prepareSiteChunks } from "./mappers/site-chunk.mapper";
import type { ClaimedSearchIndexJob } from "./types";
import type { EmbeddedSiteChunk, PreparedSiteChunk } from "./types";

const EMBEDDING_DIMENSIONS = 1_536;

type ProcessingStage = "claim" | "snapshot" | "embedding" | "replacement" | "settlement";

const SAFE_FAILURE_SUMMARIES: Record<Exclude<ProcessingStage, "claim">, string> = {
  snapshot: "Portfolio search documents could not be prepared.",
  embedding: "Portfolio search embeddings could not be prepared.",
  replacement: "The portfolio search snapshot could not be replaced.",
  settlement: "Portfolio search processing could not be settled.",
};

class SearchIndexProcessingError extends Error {
  constructor() {
    super("Search index processing failed.");
    this.name = "SearchIndexProcessingError";
  }
}

function safeErrorKind(error: unknown): "Error" | "UnknownError" {
  return error instanceof Error ? "Error" : "UnknownError";
}

function validatePreparedChunks(chunks: PreparedSiteChunk[]): void {
  if (!chunks.length) {
    throw new Error("Portfolio indexing produced an empty chunk snapshot.");
  }

  const identities = new Set<string>();

  for (const chunk of chunks) {
    if (
      !chunk.id.trim() ||
      !chunk.sourceId.trim() ||
      !chunk.title.trim() ||
      !chunk.category.trim() ||
      !chunk.url.trim() ||
      !chunk.content.trim() ||
      !chunk.embeddingInput.trim() ||
      !chunk.contentHash.trim()
    ) {
      throw new Error("Portfolio indexing produced invalid chunk metadata.");
    }

    if (identities.has(chunk.id)) {
      throw new Error("Portfolio indexing produced duplicate chunk identities.");
    }

    identities.add(chunk.id);
  }
}

function buildEmbeddedChunks(
  prepared: PreparedSiteChunk[],
  generated: Awaited<ReturnType<OpenAITransport["createEmbeddings"]>>,
  expectedModel: string,
): EmbeddedSiteChunk[] {
  if (!expectedModel.trim() || generated.length !== prepared.length) {
    throw new Error("The embedding response did not match the prepared snapshot.");
  }

  const embeddedAt = new Date();

  return prepared.map((chunk, index) => {
    const generatedEmbedding = generated[index];

    if (
      !generatedEmbedding ||
      generatedEmbedding.embeddingModel !== expectedModel ||
      !Array.isArray(generatedEmbedding.embedding) ||
      generatedEmbedding.embedding.length !== EMBEDDING_DIMENSIONS ||
      generatedEmbedding.embedding.some(
        (value) => typeof value !== "number" || !Number.isFinite(value),
      )
    ) {
      throw new Error("The embedding response contained invalid metadata or values.");
    }

    return {
      ...chunk,
      embedding: generatedEmbedding.embedding,
      embeddingModel: generatedEmbedding.embeddingModel,
      embeddedAt,
    };
  });
}

export class SearchIndexService {
  constructor(
    private readonly portfolio: Pick<
      PortfolioReadService,
      "getHomePageData" | "getWorkPageData" | "getAboutPageData" | "getAuditPageData"
    >,
    private readonly chunks: SiteChunkStore,
    private readonly jobs: SearchIndexJobStore,
    private readonly openai: OpenAITransport,
    private readonly logger: Logger,
  ) {}

  requestRebuild(): Promise<void> {
    return this.jobs.requestRebuild();
  }

  async processPendingJob(): Promise<SearchIndexWorkerResult> {
    const startedAt = Date.now();

    this.logger.info("search_index.worker_started");

    let claim: Awaited<ReturnType<SearchIndexJobStore["claim"]>>;

    try {
      claim = await this.jobs.claim();
    } catch (error) {
      this.logFailure("claim", null, startedAt, error);
      throw new SearchIndexProcessingError();
    }

    if (claim.staleJobRecovered) {
      this.logger.info("search_index.stale_job_recovered");
    }

    if (!claim.job) {
      this.logger.info("search_index.worker_skipped", { durationMs: Date.now() - startedAt });

      return { outcome: "skipped" };
    }

    const job = claim.job;

    if (job.attempts < 1) {
      await this.failClaim(job, "snapshot", startedAt, new Error("Invalid claimed attempt."));
    }

    let stage: Exclude<ProcessingStage, "claim"> = "snapshot";

    try {
      const [home, work, about, audit] = await Promise.all([
        this.portfolio.getHomePageData(),
        this.portfolio.getWorkPageData(),
        this.portfolio.getAboutPageData(),
        this.portfolio.getAuditPageData(),
      ]);

      const documents = mapPortfolioSnapshot({ home, work, about, audit });

      const prepared = documents.flatMap((document) => {
        const documentChunks = prepareSiteChunks(document);

        if (!documentChunks.length) {
          throw new Error("Portfolio indexing produced a document without chunks.");
        }

        return documentChunks;
      });

      validatePreparedChunks(prepared);

      stage = "embedding";

      const embeddingModel = this.openai.getEmbeddingModel();

      const generated = await this.openai.createEmbeddings(
        prepared.map((chunk) => chunk.embeddingInput),
      );

      const embedded = buildEmbeddedChunks(prepared, generated, embeddingModel);

      stage = "replacement";
      await this.chunks.replacePortfolioSnapshot(embedded, job.claimedAt);

      stage = "settlement";

      const completed = await this.jobs.complete(job.claimedAt);

      if (!completed || (completed.status !== "completed" && completed.status !== "pending")) {
        throw new Error("Search index completion did not settle the claimed job.");
      }

      const result: SearchIndexWorkerResult = {
        outcome: "processed",
        attempt: job.attempts,
        documentCount: documents.length,
        chunkCount: embedded.length,
        finalState: completed.status,
      };

      this.logger.info("search_index.worker_completed", {
        attempt: job.attempts,
        documentCount: documents.length,
        chunkCount: embedded.length,
        embeddingModel,
        finalState: completed.status,
        durationMs: Date.now() - startedAt,
      });

      return result;
    } catch (error) {
      return this.failClaim(job, stage, startedAt, error);
    }
  }

  private async failClaim(
    job: ClaimedSearchIndexJob,
    stage: Exclude<ProcessingStage, "claim">,
    startedAt: number,
    error: unknown,
  ): Promise<never> {
    let finalState: string | null = null;

    try {
      const failed = await this.jobs.fail(job.claimedAt, SAFE_FAILURE_SUMMARIES[stage]);

      finalState = failed?.status ?? null;
    } catch {
      finalState = null;
    }

    this.logger.error("search_index.worker_failed", {
      attempt: job.attempts,
      stage,
      finalState,
      durationMs: Date.now() - startedAt,
      errorKind: safeErrorKind(error),
    });

    throw new SearchIndexProcessingError();
  }

  private logFailure(
    stage: ProcessingStage,
    attempt: number | null,
    startedAt: number,
    error: unknown,
  ): void {
    this.logger.error("search_index.worker_failed", {
      attempt,
      stage,
      finalState: null,
      durationMs: Date.now() - startedAt,
      errorKind: safeErrorKind(error),
    });
  }
}
