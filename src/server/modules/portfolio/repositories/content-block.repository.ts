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

export class ContentBlockRepository implements IContentBlockRepository {
  constructor(private readonly database: PrismaClient) {}

  async findPageTree(page: PortfolioPagePath): Promise<ContentBlockNode[]> {
    const pageWhere =
      page === "/"
        ? { OR: [{ url: "/" }, { url: { startsWith: "/#" } }] }
        : { url: { startsWith: page } };

    const records = await this.database.contentBlock.findMany({
      where: pageWhere,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { ...relations, parent: true },
    });

    const nodes = new Map<string, ContentBlockNode>();

    for (const { parent: _parent, ...record } of records) {
      nodes.set(record.id, { ...record, children: [] });
    }

    const roots: ContentBlockNode[] = [];

    for (const record of records) {
      const node = nodes.get(record.id)!;

      if (!record.parent) {
        roots.push(node);
        continue;
      }

      const parent = nodes.get(record.parent.parentId);

      if (!parent) {
        throw new Error(`Portfolio content tree is missing parent ${record.parent.parentId}.`);
      }

      parent.children.push({ order: record.parent.order, child: node });
    }

    for (const node of nodes.values()) {
      node.children.sort((left, right) => left.order - right.order);
    }

    return roots.sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
  }
}
