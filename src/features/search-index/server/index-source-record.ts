

import { buildSearchDocuments } from "@/features/search-index/server/build-search-documents";
import {
  findIndexedChunksBySource,
  replaceIndexedSource,
} from "@/features/search-index/server/data/site-chunk.repository";
import { findIndexableSource } from "@/features/search-index/server/data/indexing-source.repository";
import { createEmbeddings } from "@/features/search-index/server/create-embeddings";
import { prepareSiteChunk } from "@/features/search-index/server/prepare-site-chunk";
import type {
  EmbeddedSiteChunk,
  ExistingSiteChunk,
  IndexableSource,
  IndexableSourceType,
  IndexSourceResult,
  PreparedSiteChunk,
  ReplaceIndexedSourceInput,
} from "@/features/search-index/types";
import { getEmbeddingModel } from "@/lib/openai";
import type { GeneratedEmbedding } from "@/features/search-index/server/create-embeddings";

type IndexSourceRecordInput = {
  sourceType: IndexableSourceType;
  sourceId: string;
};

type IndexSourceRecordDependencies = {
  findIndexableSource: (
    sourceType: IndexableSourceType,
    sourceId: string,
  ) => Promise<IndexableSource | null>;
  findIndexedChunksBySource: (
    sourceType: IndexableSourceType,
    sourceId: string,
  ) => Promise<ExistingSiteChunk[]>;
  createEmbeddings: (inputs: string[]) => Promise<GeneratedEmbedding[]>;
  replaceIndexedSource: (input: ReplaceIndexedSourceInput) => Promise<void>;
  getEmbeddingModel: () => string;
};

export function createIndexSourceRecord({
  findIndexableSource,
  findIndexedChunksBySource,
  createEmbeddings,
  replaceIndexedSource,
  getEmbeddingModel,
}: IndexSourceRecordDependencies) {
  return async function indexSourceRecord({
    sourceType,
    sourceId,
  }: IndexSourceRecordInput): Promise<IndexSourceResult> {
    try {
      const source = await findIndexableSource(sourceType, sourceId);

      if (!source) {
        throw new Error("Source record was not found.");
      }

      const preparedChunks = buildSearchDocuments(source).map(prepareSiteChunk);
      const existingChunks = await findIndexedChunksBySource(
        sourceType,
        sourceId,
      );

      const existingById = new Map(
        existingChunks.map((chunk) => [chunk.id, chunk]),
      );

      const embeddingModel = getEmbeddingModel();

      const unchanged: PreparedSiteChunk[] = [];
      const changed: PreparedSiteChunk[] = [];
      const created: PreparedSiteChunk[] = [];

      for (const chunk of preparedChunks) {
        const existing = existingById.get(chunk.id);

        if (!existing) {
          created.push(chunk);
          continue;
        }

        if (
          existing.contentHash === chunk.contentHash &&
          existing.embeddingModel === embeddingModel
        ) {
          unchanged.push(chunk);
          continue;
        }

        changed.push(chunk);
      }

      const currentIds = new Set(preparedChunks.map((chunk) => chunk.id));

      const obsoleteIds = existingChunks
        .filter((chunk) => !currentIds.has(chunk.id))
        .map((chunk) => chunk.id);

      const chunksToEmbed = [...created, ...changed];

      const generatedEmbeddings = chunksToEmbed.length > 0
        ? await createEmbeddings(
            chunksToEmbed.map((chunk) => chunk.embeddingInput),
          )
        : [];

      const embeddedAt = new Date();

      const upserts: EmbeddedSiteChunk[] = chunksToEmbed.map(
        (chunk, index) => {
          const generated = generatedEmbeddings[index];

          if (!generated) {
            throw new Error(`Missing embedding for chunk ${chunk.id}.`);
          }

          return {
            ...chunk,
            embedding: generated.embedding,
            embeddingModel: generated.embeddingModel,
            embeddedAt,
          };
        },
      );

      await replaceIndexedSource({
        sourceType,
        sourceId,
        upserts,
        obsoleteIds,
      });

      return {
        created: created.length,
        changed: changed.length,
        unchanged: unchanged.length,
        deleted: obsoleteIds.length,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);

      throw new Error(
        `Failed to index ${sourceType}:${sourceId}: ${detail}`,
        { cause: error },
      );
    }
  };
}

export const indexSourceRecord = createIndexSourceRecord({
  findIndexableSource,
  findIndexedChunksBySource,
  createEmbeddings,
  replaceIndexedSource,
  getEmbeddingModel,
});
