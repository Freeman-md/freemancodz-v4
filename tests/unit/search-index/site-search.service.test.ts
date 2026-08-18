import assert from "node:assert/strict";
import test from "node:test";

import type { ISiteChunkRepository } from "@/server/modules/search-index/interfaces/site-chunk.repository.interface";
import { SiteSearchService } from "@/server/modules/search-index/services/site-search.service";

test("retains the assistant retrieval count and similarity defaults", async () => {
  const calls: Array<{ count: number | undefined; threshold: number | undefined }> = [];

  const repository: ISiteChunkRepository = {
    replacePortfolioSnapshot: async () => undefined,
    match: async (_embedding, count, threshold) => {
      calls.push({ count, threshold });

      return [];
    },
  };

  const service = new SiteSearchService(repository);

  assert.deepEqual(await service.search(Array(1_536).fill(0)), []);
  assert.deepEqual(calls, [{ count: 6, threshold: 0.25 }]);
});
