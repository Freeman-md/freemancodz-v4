import "server-only";

import { getEmbeddingModel } from "@/server/infrastructure/openai/openai-client";
import { prepareSiteChunk } from "../factories/site-chunk.factory";
import { buildSearchDocuments } from "../mappers/search-document.mapper";
import { findIndexableSource } from "../repositories/indexing-source.repository";
import { findIndexedChunksBySource } from "../repositories/site-chunk.repository";
import type { IndexSourceInput } from "../schemas/index-source-input.schema";

export async function previewSearchIndex(input: IndexSourceInput) {
  const source = await findIndexableSource(input.sourceType, input.sourceId);
  if (!source) throw new Error(`Source not found: ${input.sourceType}:${input.sourceId}`);
  const chunks = buildSearchDocuments(source).map(prepareSiteChunk);
  const existing = await findIndexedChunksBySource(input.sourceType, input.sourceId);
  const existingById = new Map(existing.map((chunk) => [chunk.id, chunk]));
  const model = getEmbeddingModel();
  const currentIds = new Set(chunks.map((chunk) => chunk.id));
  return {
    input,
    chunks: chunks.map((chunk) => ({ ...chunk, expectedAction: !existingById.has(chunk.id) ? "create" : existingById.get(chunk.id)?.contentHash !== chunk.contentHash || existingById.get(chunk.id)?.embeddingModel !== model ? "update" : "unchanged" })),
    obsoleteIds: existing.filter((chunk) => !currentIds.has(chunk.id)).map((chunk) => chunk.id),
  };
}
