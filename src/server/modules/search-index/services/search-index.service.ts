import "server-only";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import type { IOpenAIProvider } from "@/server/infrastructure/openai/interfaces/openai.provider.interface";
import { prepareSiteChunks } from "../chunking/text-chunker";
import type {
  ISearchIndexJobRepository,
  SearchIndexJob,
} from "../interfaces/search-index-job.repository.interface";
import type { ISourceRecordRepository } from "../interfaces/source-record.repository.interface";
import type {
  ISearchIndexService,
  IndexSourceResult,
  RebuildSummary,
} from "../interfaces/search-index.service.interface";
import type { ISiteChunkRepository } from "../interfaces/site-chunk.repository.interface";
import { mapSourceDocument } from "../mappers/source-document.mapper";
import type { IndexSourceInput } from "../schemas/index-source-input.schema";

function sameChunks(
  existing: Awaited<ReturnType<ISiteChunkRepository["findBySource"]>>,
  prepared: ReturnType<typeof prepareSiteChunks>,
  model: string,
) {
  return (
    existing.length === prepared.length &&
    existing.every(
      (chunk, index) =>
        chunk.chunkIndex === prepared[index]?.chunkIndex &&
        chunk.contentHash === prepared[index]?.contentHash &&
        chunk.embeddingModel === model,
    )
  );
}

export class SearchIndexService implements ISearchIndexService {
  constructor(
    private readonly sources: ISourceRecordRepository,
    private readonly chunks: ISiteChunkRepository,
    private readonly jobs: ISearchIndexJobRepository,
    private readonly openai: IOpenAIProvider,
    private readonly logger: ILogger,
  ) {}

  async indexSource(input: IndexSourceInput): Promise<IndexSourceResult> {
    const source = await this.sources.findById(input.sourceType, input.sourceId);

    if (!source) {
      return this.removeSource(input);
    }

    const document = mapSourceDocument(source);

    const prepared = prepareSiteChunks(document);

    if (!prepared.length) {
      throw new Error(`Indexing produced no chunks for ${input.sourceType}:${input.sourceId}.`);
    }

    const existing = await this.chunks.findBySource(input.sourceType, input.sourceId);

    const model = this.openai.getEmbeddingModel();

    if (sameChunks(existing, prepared, model)) {
      return { created: 0, changed: 0, unchanged: prepared.length, deleted: 0 };
    }

    const embeddings = await this.openai.createEmbeddings(
      prepared.map((chunk) => chunk.embeddingInput),
    );

    if (embeddings.length !== prepared.length) {
      throw new Error(
        `Embedding provider returned ${embeddings.length} embeddings for ${prepared.length} chunks.`,
      );
    }

    const embeddedAt = new Date();

    const embedded = prepared.map((chunk, index) => {
      const embedding = embeddings[index];

      if (!embedding || embedding.embedding.length !== 1536) {
        throw new Error(`Invalid embedding for ${chunk.id}.`);
      }

      return {
        ...chunk,
        embedding: embedding.embedding,
        embeddingModel: embedding.embeddingModel,
        embeddedAt,
      };
    });

    await this.chunks.replaceSource(input.sourceType, input.sourceId, embedded);

    return {
      created: existing.length ? 0 : prepared.length,
      changed: existing.length ? prepared.length : 0,
      unchanged: 0,
      deleted: 0,
    };
  }

  async removeSource(input: IndexSourceInput): Promise<IndexSourceResult> {
    return {
      created: 0,
      changed: 0,
      unchanged: 0,
      deleted: await this.chunks.deleteSource(input.sourceType, input.sourceId),
    };
  }

  async preview(
    input: IndexSourceInput,
  ): Promise<Awaited<ReturnType<ISearchIndexService["preview"]>>> {
    const source = await this.sources.findById(input.sourceType, input.sourceId);

    if (!source) {
      throw new Error(`Source not found: ${input.sourceType}:${input.sourceId}`);
    }

    const document = mapSourceDocument(source);

    const chunks = prepareSiteChunks(document);

    const existing = await this.chunks.findBySource(input.sourceType, input.sourceId);

    const model = this.openai.getEmbeddingModel();

    return {
      input,
      document,
      chunks,
      expectedAction: sameChunks(existing, chunks, model) ? "unchanged" : "replace",
    };
  }

  async rebuild(options: { clean?: boolean } = {}) {
    const sources = await this.sources.findAll();

    if (options.clean) {
      this.logger.info("Clean search index rebuild started", { sourceRecords: sources.length });
      await this.chunks.clear();
      await this.jobs.clear();
    }

    const summary: RebuildSummary = {
      sourceRecords: sources.length,
      sourcesIndexed: 0,
      sourcesSkipped: 0,
      chunksCreated: 0,
      embeddingsGenerated: 0,
      sourcesFailed: 0,
    };

    const results: Array<{ sourceType: string; sourceId: string; result: IndexSourceResult }> = [];

    for (const source of sources) {
      try {
        const result = await this.indexSource({
          sourceType: source.sourceType,
          sourceId: source.record.id,
        });

        results.push({ sourceType: source.sourceType, sourceId: source.record.id, result });
        if (result.unchanged) {
          summary.sourcesSkipped += 1;
        } else {
          summary.sourcesIndexed += 1;
        }

        summary.chunksCreated += result.created + result.changed;
        summary.embeddingsGenerated += result.created + result.changed;
      } catch (error) {
        summary.sourcesFailed += 1;
        this.logger.error("Search index rebuild source failed", {
          sourceType: source.sourceType,
          sourceId: source.record.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    if (summary.sourcesFailed) {
      throw Object.assign(
        new Error(`Search index rebuild failed for ${summary.sourcesFailed} source(s).`),
        { summary, results },
      );
    }

    return { summary, results };
  }

  getJobStatus() {
    return this.jobs.getStatus();
  }

  async processPendingJobs(limit = 5) {
    const jobs = await this.jobs.claim(limit);

    const result = { claimed: jobs.length, completed: 0, retried: 0, failed: 0 };

    for (const job of jobs) {
      const outcome = await this.processJob(job);

      if (outcome === "completed") {
        result.completed += 1;
      }

      if (outcome === "retried") {
        result.retried += 1;
      }

      if (outcome === "failed") {
        result.failed += 1;
      }
    }

    return result;
  }

  private async processJob(
    job: SearchIndexJob,
  ): Promise<"completed" | "retried" | "failed" | "unsettled"> {
    const details = {
      jobId: job.id,
      operation: job.operation,
      sourceType: job.sourceType,
      sourceId: job.sourceId,
    };

    try {
      const result =
        job.operation === "upsert"
          ? await this.indexSource({ sourceType: job.sourceType, sourceId: job.sourceId })
          : await this.removeSource({ sourceType: job.sourceType, sourceId: job.sourceId });

      if (!(await this.jobs.complete(job.id))) {
        return "unsettled";
      }

      this.logger.info("Search index job completed", { ...details, result });

      return "completed";
    } catch (error) {
      const failed = await this.jobs.fail(job.id, error);

      const outcome =
        failed?.status === "pending"
          ? "retried"
          : failed?.status === "failed"
            ? "failed"
            : "unsettled";

      this.logger.error("Search index job failed", {
        ...details,
        error: error instanceof Error ? error.message : "Unknown error",
        outcome,
      });

      return outcome;
    }
  }
}
