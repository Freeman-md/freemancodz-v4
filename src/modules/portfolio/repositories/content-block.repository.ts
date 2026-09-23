import "server-only";
import type { OrderedRelationInput } from "@/contracts/portfolio-admin.contract";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type {
  ContentBlockStore,
  PortfolioPagePath,
} from "../types";
import type { ContentBlockNode } from "../types";
import type { UpdateContentBlockInput } from "../types";

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

export class ContentBlockRepository implements ContentBlockStore {
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

  async update(id: string, input: UpdateContentBlockInput) {
    await this.database.contentBlock.update({ where: { id }, data: input });
  }

  async replaceChildren(id: string, children: OrderedRelationInput[]) {
    await this.database.$transaction(async (transaction) => {
      const existing = await transaction.contentBlockChild.findMany({
        where: { parentId: id },
        select: { childId: true },
      });

      const existingIds = existing.map(({ childId }) => childId).toSorted();

      const requestedIds = children.map(({ id: childId }) => childId).toSorted();

      if (existingIds.join("\0") !== requestedIds.join("\0")) {
        throw new Error("Known content-block children may be reordered but not replaced.");
      }

      await transaction.contentBlockChild.deleteMany({ where: { parentId: id } });
      if (children.length > 0) {
        await transaction.contentBlockChild.createMany({
          data: children.map(({ id: childId, order }) => ({
            parentId: id,
            childId,
            order: order + 1,
          })),
        });
      }
    });
  }

  replaceIcons(id: string, icons: OrderedRelationInput[]) {
    return this.replaceRelations("icon", id, icons);
  }

  replaceMedia(id: string, media: OrderedRelationInput[]) {
    return this.replaceRelations("media", id, media);
  }

  replaceActions(id: string, actions: OrderedRelationInput[]) {
    return this.replaceRelations("action", id, actions);
  }

  private async replaceRelations(
    type: "icon" | "media" | "action",
    contentBlockId: string,
    items: OrderedRelationInput[],
  ) {
    await this.database.$transaction(async (transaction) => {
      if (type === "icon") {
        await transaction.contentBlockIconBlock.deleteMany({ where: { contentBlockId } });
        if (items.length > 0) {
          await transaction.contentBlockIconBlock.createMany({
            data: items.map(({ id: iconBlockId, order }) => ({
              contentBlockId,
              iconBlockId,
              order: order + 1,
            })),
          });
        }

        return;
      }

      if (type === "media") {
        await transaction.contentBlockMediaBlock.deleteMany({ where: { contentBlockId } });
        if (items.length > 0) {
          await transaction.contentBlockMediaBlock.createMany({
            data: items.map(({ id: mediaBlockId, order }) => ({
              contentBlockId,
              mediaBlockId,
              order: order + 1,
            })),
          });
        }

        return;
      }

      await transaction.contentBlockActionBlock.deleteMany({ where: { contentBlockId } });
      if (items.length > 0) {
        await transaction.contentBlockActionBlock.createMany({
          data: items.map(({ id: actionBlockId, order }) => ({
            contentBlockId,
            actionBlockId,
            order: order + 1,
          })),
        });
      }
    });
  }
}
