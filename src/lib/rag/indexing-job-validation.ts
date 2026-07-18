import { isIndexableSourceType } from "./source-config";
import type { IndexingJob } from "./types";

export function parseIndexingJob(value: { sourceType: string; sourceId: string; operation: string }): IndexingJob {
  if (!isIndexableSourceType(value.sourceType) || !value.sourceId || (value.operation !== "upsert" && value.operation !== "delete")) throw new Error("Invalid search indexing job payload");
  return value as IndexingJob;
}
