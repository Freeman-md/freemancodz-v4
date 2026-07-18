import { indexableSourceTypes } from "../source-config";
import type { IndexableSourceType } from "../types";
import type { IndexingResult } from "./index-source-record.core";

type SourceRecords = Record<IndexableSourceType, Array<{ id: string }>>;
export type RebuildDependencies = {
  loadAll: () => Promise<SourceRecords>;
  preview: (source: { sourceType: IndexableSourceType; sourceId: string }) => Promise<unknown>;
  index: (source: { sourceType: IndexableSourceType; sourceId: string }) => Promise<IndexingResult>;
  listChunks: () => Promise<Array<{ sourceType: string; sourceId: string }>>;
  remove: (source: { sourceType: IndexableSourceType; sourceId: string }) => Promise<{ deleted: number }>;
};

export async function rebuildSearchIndexCore({ dryRun = false } = {}, dependencies: RebuildDependencies) {
  const records = await dependencies.loadAll();
  const totals = { created: 0, changed: 0, unchanged: 0, deleted: 0 };
  for (const sourceType of indexableSourceTypes) for (const record of records[sourceType]) {
    if (dryRun) { await dependencies.preview({ sourceType, sourceId: record.id }); totals.unchanged += 1; }
    else { const result = await dependencies.index({ sourceType, sourceId: record.id }); for (const key of Object.keys(totals) as Array<keyof typeof totals>) totals[key] += result[key]; }
  }
  if (!dryRun) for (const chunk of await dependencies.listChunks()) {
    if (indexableSourceTypes.includes(chunk.sourceType as IndexableSourceType) && !records[chunk.sourceType as IndexableSourceType].some((record) => record.id === chunk.sourceId)) totals.deleted += (await dependencies.remove({ sourceType: chunk.sourceType as IndexableSourceType, sourceId: chunk.sourceId })).deleted;
  }
  return totals;
}
