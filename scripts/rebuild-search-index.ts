import { rebuildSearchIndex } from "@/lib/rag/indexing/rebuild-index";
console.log(JSON.stringify(await rebuildSearchIndex({ dryRun: process.argv.includes("--dry-run") }), null, 2));
