import type { IndexWorkerBatchResult } from "../models/search-index";

export interface ISearchIndexWorkerService { runBatch(limit?: number): Promise<IndexWorkerBatchResult>; }
