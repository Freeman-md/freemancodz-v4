import "server-only";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type {
  EmbeddedDocument,
  PortfolioSearchRepository,
  SearchDocument,
} from "../services/portfolio-search.service";

export class PrismaPortfolioSearchRepository implements PortfolioSearchRepository {
  constructor(private readonly db: PrismaClient) {}

  async replace(documents: readonly EmbeddedDocument[]) {
    if (!documents.length) {
      throw new Error("The search index cannot be empty.");
    }

    await this.db.$transaction(async (tx) => {
      await tx.$executeRaw`DELETE FROM public.portfolio_search_documents`;
      await tx.$executeRaw`
        INSERT INTO public.portfolio_search_documents
          (key, source_kind, source_key, title, excerpt, embedding)
        VALUES ${Prisma.join(
          documents.map(
            (doc) => Prisma.sql`
          (${doc.key}, ${doc.sourceKind}, ${doc.sourceKey}, ${doc.title}, ${doc.excerpt},
           ${JSON.stringify(doc.embedding)}::vector)
        `,
          ),
        )}
      `;
    });
  }

  find(embedding: readonly number[], maxDistance: number, limit: number) {
    const vector = JSON.stringify(embedding);

    return this.db.$queryRaw<SearchDocument[]>`
      SELECT key, source_kind AS "sourceKind", source_key AS "sourceKey", title, excerpt
      FROM public.portfolio_search_documents
      WHERE embedding <=> ${vector}::vector <= ${maxDistance}
      ORDER BY embedding <=> ${vector}::vector, key
      LIMIT ${limit}
    `;
  }
}
