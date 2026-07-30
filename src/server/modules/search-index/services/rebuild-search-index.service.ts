import "server-only";

import { findAllIndexableSources } from "../repositories/indexing-source.repository";
import { indexSourceRecord } from "./index-source-record.service";

export async function rebuildSearchIndex() {
  const totals = { created: 0, changed: 0, unchanged: 0, deleted: 0 };
  const results: { sourceType: string; sourceId: string; result: typeof totals }[] = [];
  for (const source of await findAllIndexableSources()) {
    const result = await indexSourceRecord({ sourceType: source.sourceType, sourceId: source.record.id });
    totals.created += result.created; totals.changed += result.changed; totals.unchanged += result.unchanged; totals.deleted += result.deleted;
    results.push({ sourceType: source.sourceType, sourceId: source.record.id, result });
  }
  return { totals, results };
}
