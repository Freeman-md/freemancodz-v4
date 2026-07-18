import "server-only";
import { createOpenAIClient, getEmbeddingModel } from "@/lib/openai";
import { formatEmbeddingInput, hashEmbeddingInput, chunkId } from "../embedding-input";
import { loadSourceRecord } from "../data/source-reader";
import { findSourceChunks, writeSourceChunks } from "../data/site-chunk.repository";
import { buildContentBlockDocuments } from "../builders/content-block.builder";
import { buildProjectDocuments } from "../builders/project.builder";
import { buildServiceDocuments } from "../builders/service.builder";
import { buildPrincipleDocuments } from "../builders/principle.builder";
import { buildExperienceDocuments } from "../builders/experience.builder";
import type { IndexableRecord } from "../data/source-reader";
import type { IndexableSourceType, SearchDocument } from "../types";

type PreparedDocument = SearchDocument & { id: string; input: string; contentHash: string };
export type SourcePreview = PreparedDocument & { expectedAction: "create" | "change" | "skip" };
export type IndexingResult = { created: number; changed: number; unchanged: number; deleted: number; preview: PreparedDocument[] };

function buildDocuments(type: IndexableSourceType, record: IndexableRecord): SearchDocument[] {
  switch (type) {
    case "content_blocks": return buildContentBlockDocuments(record as never);
    case "projects": return buildProjectDocuments(record as never);
    case "services": return buildServiceDocuments(record as never);
    case "principles": return buildPrincipleDocuments(record as never);
    case "experiences": return buildExperienceDocuments(record as never);
  }
}

export async function previewSourceRecord({ sourceType, sourceId }: { sourceType: IndexableSourceType; sourceId: string }) {
  const record = await loadSourceRecord(sourceType, sourceId);
  if (!record) throw new Error(`Cannot index missing source ${sourceType}:${sourceId}`);
  return buildDocuments(sourceType, record).map((document) => {
    const input = formatEmbeddingInput(document);
    return { ...document, id: chunkId(document), input, contentHash: hashEmbeddingInput(input) };
  });
}

export async function inspectSourceRecord({ sourceType, sourceId }: { sourceType: IndexableSourceType; sourceId: string }): Promise<SourcePreview[]> {
  const [documents, existing, model] = await Promise.all([previewSourceRecord({ sourceType, sourceId }), findSourceChunks(sourceType, sourceId), Promise.resolve(getEmbeddingModel())]);
  const byId = new Map(existing.map((chunk) => [chunk.id, chunk]));
  return documents.map((document) => {
    const previous = byId.get(document.id);
    return { ...document, expectedAction: !previous ? "create" : previous.contentHash === document.contentHash && previous.embeddingModel === model ? "skip" : "change" };
  });
}

export async function indexSourceRecord({ sourceType, sourceId }: { sourceType: IndexableSourceType; sourceId: string }): Promise<IndexingResult> {
  try {
    const [documents, existing, model] = await Promise.all([previewSourceRecord({ sourceType, sourceId }), findSourceChunks(sourceType, sourceId), Promise.resolve(getEmbeddingModel())]);
    const existingById = new Map(existing.map((chunk) => [chunk.id, chunk]));
    const changed = documents.filter((document) => {
      const previous = existingById.get(document.id);
      return !previous || previous.contentHash !== document.contentHash || previous.embeddingModel !== model;
    });
    const embeddings = new Map<string, number[]>();
    if (changed.length) {
      const response = await createOpenAIClient().embeddings.create({ model, input: changed.map((document) => document.input) });
      for (const [index, item] of response.data.entries()) {
        if (!item.embedding || item.embedding.length !== 1536) throw new Error(`Embedding length was invalid for ${sourceType}:${sourceId}`);
        embeddings.set(changed[index].id, item.embedding);
      }
    }
    const obsoleteIds = existing.filter((chunk) => !documents.some((document) => document.id === chunk.id)).map((chunk) => chunk.id);
    await writeSourceChunks(changed.map((document) => ({ ...document, sourceType, sourceId, chunkIndex: document.documentIndex, embedding: embeddings.get(document.id)!, embeddingModel: model, embeddedAt: new Date() })), obsoleteIds);
    return { created: changed.filter((document) => !existingById.has(document.id)).length, changed: changed.filter((document) => existingById.has(document.id)).length, unchanged: documents.length - changed.length, deleted: obsoleteIds.length, preview: documents };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Indexing ${sourceType}:${sourceId} failed: ${detail}`, { cause: error });
  }
}
