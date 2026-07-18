import "server-only";
import { prisma } from "@/lib/prisma";
import { loadAllSourceRecords } from "../data/source-reader";
import { indexSourceRecord, previewSourceRecord } from "./index-source-record";
import { removeIndexedSource } from "./remove-indexed-source";
import { rebuildSearchIndexCore, type RebuildDependencies } from "./rebuild-index.core";
export type { RebuildDependencies } from "./rebuild-index.core";

const productionDependencies: RebuildDependencies = {
  loadAll: loadAllSourceRecords,
  preview: previewSourceRecord,
  index: indexSourceRecord,
  listChunks: () => prisma.siteChunk.findMany({ select: { sourceType: true, sourceId: true } }),
  remove: removeIndexedSource,
};

export function rebuildSearchIndex(options: { dryRun?: boolean } = {}, dependencies = productionDependencies) {
  return rebuildSearchIndexCore(options, dependencies);
}
