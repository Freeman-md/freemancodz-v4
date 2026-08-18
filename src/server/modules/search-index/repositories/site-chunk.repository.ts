import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type { ISiteChunkRepository } from "../interfaces/site-chunk.repository.interface";
import type { EmbeddedSiteChunk } from "../models/site-chunk";
import type { SiteSearchResult } from "../models/site-search-result";

const EMBEDDING_DIMENSIONS = 1_536;

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

function validateSnapshot(chunks: EmbeddedSiteChunk[]): void {
  if (!chunks.length) {
    throw new Error("A portfolio search snapshot must contain at least one chunk.");
  }

  for (const chunk of chunks) {
    if (
      chunk.embedding.length !== EMBEDDING_DIMENSIONS ||
      chunk.embedding.some((value) => !Number.isFinite(value))
    ) {
      throw new Error(`Search chunk ${chunk.id} has an invalid embedding.`);
    }
  }
}

export class SiteChunkRepository implements ISiteChunkRepository {
  constructor(private readonly database: PrismaClient) {}

  async replacePortfolioSnapshot(chunks: EmbeddedSiteChunk[], claimedAt: Date): Promise<void> {
    validateSnapshot(chunks);

    await this.database.$transaction(async (transaction) => {
      const currentClaim = await transaction.$queryRaw<Array<{ jobKey: string }>>`
        SELECT job_key AS "jobKey"
        FROM public.search_index_jobs
        WHERE job_key = 'portfolio'
          AND status = 'processing'
          AND claimed_at = ${claimedAt}
        FOR UPDATE
      `;

      if (!currentClaim.length) {
        throw new Error("The search index claim is no longer current.");
      }

      await transaction.siteChunk.deleteMany();

      for (const chunk of chunks) {
        await transaction.$executeRaw`
          INSERT INTO public.site_chunks (
            id,
            source_type,
            source_id,
            chunk_index,
            title,
            category,
            url,
            content,
            keywords,
            embedding,
            content_hash,
            embedding_model,
            embedded_at
          )
          VALUES (
            ${chunk.id},
            ${chunk.sourceType},
            ${chunk.sourceId},
            ${chunk.chunkIndex},
            ${chunk.title},
            ${chunk.category},
            ${chunk.url},
            ${chunk.content},
            ${chunk.keywords},
            ${toVectorLiteral(chunk.embedding)}::vector,
            ${chunk.contentHash},
            ${chunk.embeddingModel},
            ${chunk.embeddedAt}
          )
        `;
      }
    });
  }

  async match(queryEmbedding: number[], matchCount = 6, matchThreshold = 0.25) {
    if (queryEmbedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `matchSiteChunks expected a ${EMBEDDING_DIMENSIONS}-length embedding, received ${queryEmbedding.length}.`,
      );
    }

    const vector = toVectorLiteral(queryEmbedding);

    return this.database.$queryRaw<
      SiteSearchResult[]
    >`SELECT * FROM public.match_site_chunks(${vector}::vector, ${matchCount}, ${matchThreshold});`;
  }
}
