import "server-only";
import type { SiteChunkStore } from "./types";
import type { SiteSearch } from "./types";
export class SiteSearchService implements SiteSearch {
  constructor(private readonly chunks: SiteChunkStore) {}

  async search(queryEmbedding: number[]) {
    return this.chunks.match(queryEmbedding, 6, 0.25);
  }
}
