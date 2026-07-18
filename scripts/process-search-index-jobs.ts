import { processIndexingJobs } from "@/lib/rag/indexing/process-indexing-jobs";
console.log(JSON.stringify(await processIndexingJobs(), null, 2));
