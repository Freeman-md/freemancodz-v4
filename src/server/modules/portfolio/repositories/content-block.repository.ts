import "server-only";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type {
  IContentBlockRepository,
  PortfolioPagePath,
} from "../interfaces/content-block.repository.interface";
import type { ContentBlockNode } from "../models/portfolio-records";

const relations = {
  iconBlocks: { orderBy: { order: "asc" }, include: { iconBlock: true } },
  mediaBlocks: {
    orderBy: { order: "asc" },
    include: { mediaBlock: { include: { iconBlock: true } } },
  },
  actionBlocks: {
    orderBy: { order: "asc" },
    include: { actionBlock: { include: { iconBlock: true } } },
  },
} satisfies Prisma.ContentBlockInclude;

const childInclude = {
  ...relations,
  children: {
    orderBy: { order: "asc" },
    include: {
      child: {
        include: {
          ...relations,
          children: { orderBy: { order: "asc" }, include: { child: { include: relations } } },
        },
      },
    },
  },
} satisfies Prisma.ContentBlockInclude;

export class ContentBlockRepository implements IContentBlockRepository {
  constructor(private readonly database: PrismaClient) {}

  async findPageTree(page: PortfolioPagePath): Promise<ContentBlockNode[]> {
    const url = page === "/" ? { in: ["/"], startsWith: "/#" } : { startsWith: page };

    const where =
      page === "/"
        ? { parent: null, order: { not: null }, OR: [{ url: "/" }, { url: { startsWith: "/#" } }] }
        : { parent: null, order: { not: null }, url };

    return this.database.contentBlock.findMany({
      where,
      orderBy: { order: "asc" },
      include: childInclude,
    }) as Promise<ContentBlockNode[]>;
  }
}
