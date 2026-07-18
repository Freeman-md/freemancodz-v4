import { isIndexableSourceType } from "@/lib/rag/source-config";
import { indexSourceRecord, inspectSourceRecord } from "@/lib/rag/indexing/index-source-record";

const [sourceType, sourceId, ...flags] = process.argv.slice(2);
if (!sourceType || !sourceId || !isIndexableSourceType(sourceType)) throw new Error("Usage: npm run index:source -- <sourceType> <sourceId> [--dry-run]");
const result = flags.includes("--dry-run") ? await inspectSourceRecord({ sourceType, sourceId }) : await indexSourceRecord({ sourceType, sourceId });
console.log(JSON.stringify(result, null, 2));
