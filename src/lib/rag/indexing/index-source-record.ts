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
import { planIndexing, type PreparedDocument } from "./indexing-plan.core";
import { indexSourceRecordCore, type IndexSourceDependencies, type IndexingResult } from "./index-source-record.core";
export type { IndexSourceDependencies, IndexingResult } from "./index-source-record.core";

export type SourcePreview =
  | (PreparedDocument & { expectedAction: "create" | "change" | "skip" })
  | { id: string; expectedAction: "delete" };
const productionDependencies: IndexSourceDependencies = {
  preview: previewSourceRecord,
  findExisting: findSourceChunks,
  embeddingModel: getEmbeddingModel,
  async embed(model, input) {
    const response = await createOpenAIClient().embeddings.create({ model, input });
    return response.data.map((item) => item.embedding);
  },
  write: writeSourceChunks,
};

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
  const plan = planIndexing(documents, existing, model);
  const previews: SourcePreview[] = plan.current;
  for (const id of plan.obsoleteIds) {
    previews.push({ id, expectedAction: "delete" });
  }
  return previews;
}

export function indexSourceRecord(source: { sourceType: IndexableSourceType; sourceId: string }, dependencies = productionDependencies): Promise<IndexingResult> {
  return indexSourceRecordCore(source, dependencies);
}
