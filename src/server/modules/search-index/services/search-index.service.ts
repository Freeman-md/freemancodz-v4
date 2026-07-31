import "server-only";
import type { IOpenAIProvider } from "@/server/infrastructure/openai/interfaces/openai.provider.interface";
import { prepareSiteChunk } from "../factories/site-chunk.factory";
import type { IIndexingSourceRepository } from "../interfaces/indexing-source.repository.interface";
import type { ISearchIndexJobRepository } from "../interfaces/search-index-job.repository.interface";
import type { ISearchIndexService } from "../interfaces/search-index.service.interface";
import type { ISiteChunkRepository } from "../interfaces/site-chunk.repository.interface";
import { buildSearchDocuments } from "../mappers/search-document.mapper";
import type {
  EmbeddedSiteChunk,
  IndexSourceResult,
  PreparedSiteChunk,
} from "../models/search-index";
import type { IndexSourceInput } from "../schemas/index-source-input.schema";

export class SearchIndexService implements ISearchIndexService {
  constructor(
    private readonly sources: IIndexingSourceRepository,
    private readonly chunks: ISiteChunkRepository,
    private readonly jobs: ISearchIndexJobRepository,
    private readonly openai: IOpenAIProvider,
  ) {}

  async search(queryEmbedding: number[]) {
    return this.diversify(await this.chunks.match(queryEmbedding, 20, 0.25), 6);
  }

  async indexSource(input: IndexSourceInput): Promise<IndexSourceResult> {
    try {
      const source = await this.sources.findById(
        input.sourceType,
        input.sourceId,
      );
      if (!source) throw new Error("Source record was not found.");
      const prepared = buildSearchDocuments(source).map(prepareSiteChunk);
      const existing = await this.chunks.findBySource(
        input.sourceType,
        input.sourceId,
      );
      const byId = new Map(existing.map((chunk) => [chunk.id, chunk]));
      const model = this.openai.getEmbeddingModel();
      const created: PreparedSiteChunk[] = [];
      const changed: PreparedSiteChunk[] = [];
      const unchanged: PreparedSiteChunk[] = [];
      for (const chunk of prepared) {
        const previous = byId.get(chunk.id);
        if (!previous) created.push(chunk);
        else if (
          previous.contentHash === chunk.contentHash &&
          previous.embeddingModel === model
        )
          unchanged.push(chunk);
        else changed.push(chunk);
      }
      const ids = new Set(prepared.map((chunk) => chunk.id));
      const obsoleteIds = existing
        .filter((chunk) => !ids.has(chunk.id))
        .map((chunk) => chunk.id);
      const chunksToEmbed = [...created, ...changed];
      const embeds = chunksToEmbed.length > 0
        ? await this.openai.createEmbeddings(
            chunksToEmbed.map((chunk) => chunk.embeddingInput),
          )
        : [];
      const embeddedAt = new Date();
      const upserts: EmbeddedSiteChunk[] = chunksToEmbed.map(
        (chunk, index) => ({
          ...chunk,
          embedding: embeds[index]!.embedding,
          embeddingModel: embeds[index]!.embeddingModel,
          embeddedAt,
        }),
      );
      await this.chunks.replaceSource({ ...input, upserts, obsoleteIds });
      return {
        created: created.length,
        changed: changed.length,
        unchanged: unchanged.length,
        deleted: obsoleteIds.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to index ${input.sourceType}:${input.sourceId}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  async removeSource(input: IndexSourceInput): Promise<IndexSourceResult> {
    try {
      return {
        created: 0,
        changed: 0,
        unchanged: 0,
        deleted: await this.chunks.deleteSource(
          input.sourceType,
          input.sourceId,
        ),
      };
    } catch (error) {
      throw new Error(
        `Failed to remove indexed source ${input.sourceType}:${input.sourceId}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  async preview(input: IndexSourceInput) {
    const source = await this.sources.findById(
      input.sourceType,
      input.sourceId,
    );
    if (!source)
      throw new Error(
        `Source not found: ${input.sourceType}:${input.sourceId}`,
      );
    const chunks = buildSearchDocuments(source).map(prepareSiteChunk);
    const existing = await this.chunks.findBySource(
      input.sourceType,
      input.sourceId,
    );
    const byId = new Map(existing.map((chunk) => [chunk.id, chunk]));
    const model = this.openai.getEmbeddingModel();
    const ids = new Set(chunks.map((chunk) => chunk.id));
    return {
      input,
      chunks: chunks.map((chunk) => ({
        ...chunk,
        expectedAction: !byId.has(chunk.id)
          ? "create"
          : byId.get(chunk.id)?.contentHash !== chunk.contentHash ||
              byId.get(chunk.id)?.embeddingModel !== model
            ? "update"
            : "unchanged",
      })),
      obsoleteIds: existing
        .filter((chunk) => !ids.has(chunk.id))
        .map((chunk) => chunk.id),
    };
  }

  async rebuild() {
    const totals = { created: 0, changed: 0, unchanged: 0, deleted: 0 };
    const results: Array<{
      sourceType: string;
      sourceId: string;
      result: IndexSourceResult;
    }> = [];
    for (const source of await this.sources.findAll()) {
      const result = await this.indexSource({
        sourceType: source.sourceType,
        sourceId: source.record.id,
      });
      totals.created += result.created;
      totals.changed += result.changed;
      totals.unchanged += result.unchanged;
      totals.deleted += result.deleted;
      results.push({
        sourceType: source.sourceType,
        sourceId: source.record.id,
        result,
      });
    }
    return { totals, results };
  }

  getJobStatus() {
    return this.jobs.getStatus();
  }
  
  private diversify(
    chunks: import("../models/search-index").MatchSiteChunksRow[],
    limit: number,
  ) {
    const seen = new Set<string>();
    return chunks
      .filter((chunk) => {
        const key = `${chunk.title.trim().toLowerCase()}|${chunk.url}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);
  }
}
