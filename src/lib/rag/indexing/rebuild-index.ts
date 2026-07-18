import "server-only";
import { prisma } from "@/lib/prisma";
import { loadAllSourceRecords } from "../data/source-reader";
import { indexableSourceTypes } from "../source-config";
import { indexSourceRecord, previewSourceRecord } from "./index-source-record";
import { removeIndexedSource } from "./remove-indexed-source";

export async function rebuildSearchIndex({ dryRun = false } = {}) {
  const records = await loadAllSourceRecords();
  const totals = { created: 0, changed: 0, unchanged: 0, deleted: 0 };
  for (const sourceType of indexableSourceTypes) for (const record of records[sourceType]) {
    if (dryRun) { await previewSourceRecord({ sourceType, sourceId: record.id }); totals.unchanged += 1; }
    else { const result = await indexSourceRecord({ sourceType, sourceId: record.id }); for (const key of Object.keys(totals) as Array<keyof typeof totals>) totals[key] += result[key]; }
  }
  if (!dryRun) {
    const chunks = await prisma.siteChunk.findMany({ select: { sourceType: true, sourceId: true } });
    for (const chunk of chunks) if (indexableSourceTypes.includes(chunk.sourceType as never) && !records[chunk.sourceType as keyof typeof records].some((record) => record.id === chunk.sourceId)) totals.deleted += (await removeIndexedSource({ sourceType: chunk.sourceType as never, sourceId: chunk.sourceId })).deleted;
  }
  return totals;
}
