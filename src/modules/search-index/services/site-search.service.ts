import "server-only";
import type { ISiteChunkRepository } from "../interfaces/site-chunk.repository.interface";
import type { ISiteSearchService } from "../interfaces/site-search.service.interface";
export class SiteSearchService implements ISiteSearchService {
  constructor(private readonly chunks: ISiteChunkRepository) {}

  async search(queryEmbedding: number[]) {
    return this.chunks.match(queryEmbedding, 6, 0.25);
  }
}
