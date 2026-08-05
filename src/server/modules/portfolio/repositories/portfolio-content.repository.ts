import "server-only";

import { portfolioContent, type PortfolioContentScope } from "../../../../../content/portfolio";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type {
  IPortfolioContentRepository,
  PortfolioContentSyncCounts,
} from "../interfaces/portfolio-content.repository.interface";

type RecordWithKey = { key: string };

function changed(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
  fields: readonly string[],
) {
  return fields.some(
    (field) => JSON.stringify(existing[field]) !== JSON.stringify(incoming[field]),
  );
}

export class PortfolioContentRepository implements IPortfolioContentRepository {
  constructor(private readonly database: PrismaClient) {}

  async sync(scope: PortfolioContentScope): Promise<PortfolioContentSyncCounts> {
    return this.database.$transaction(async (database) => {
      switch (scope) {
        case "home":
          return this.syncContentBlocks(database, portfolioContent.home);
        case "about":
          return this.syncContentBlocks(database, portfolioContent.about);
        case "services":
          return this.syncRecords(
            portfolioContent.services,
            (key) => database.service.findUnique({ where: { key } }),
            (data) => database.service.create({ data }),
            (key, data) => database.service.update({ where: { key }, data }),
            ["title", "lead", "description", "cta", "assistantPrompt", "position"],
          );
        case "projects":
          return this.syncRecords(
            portfolioContent.projects,
            (key) => database.project.findUnique({ where: { key } }),
            (data) => database.project.create({ data }),
            (key, data) => database.project.update({ where: { key }, data }),
            [
              "title",
              "summary",
              "category",
              "role",
              "outcome",
              "detail",
              "future",
              "collaboration",
              "positioning",
              "featured",
              "position",
              "stacks",
              "links",
            ],
          );
        case "experience":
          return this.syncRecords(
            portfolioContent.experience,
            (key) => database.experience.findUnique({ where: { key } }),
            (data) =>
              database.experience.create({ data: { ...data, location: data.location ?? null } }),
            (key, data) =>
              database.experience.update({
                where: { key },
                data: { ...data, location: data.location ?? null },
              }),
            ["title", "company", "dates", "location", "category", "focus", "position"],
          );
        case "principles":
          return this.syncRecords(
            portfolioContent.principles,
            (key) => database.principle.findUnique({ where: { key } }),
            (data) => database.principle.create({ data }),
            (key, data) => database.principle.update({ where: { key }, data }),
            ["section", "title", "body", "position"],
          );
      }
    });
  }

  private async syncContentBlocks(
    database: Prisma.TransactionClient,
    records: typeof portfolioContent.home,
  ) {
    let inserted = 0;

    let updated = 0;

    let unchanged = 0;

    for (const record of records) {
      const existing = await database.contentBlock.findUnique({ where: { key: record.key } });

      const incoming = {
        page: record.page,
        section: record.section as never,
        position: record.position,
        content: record.content as Prisma.InputJsonValue,
      };

      if (!existing) {
        await database.contentBlock.create({ data: { key: record.key, ...incoming } });
        inserted++;
        continue;
      }

      if (
        changed(
          existing as unknown as Record<string, unknown>,
          incoming as Record<string, unknown>,
          ["page", "section", "position", "content"],
        )
      ) {
        await database.contentBlock.update({ where: { key: record.key }, data: incoming });
        updated++;
      } else {unchanged++;}
    }

    return { inserted, updated, unchanged };
  }

  private async syncRecords<
    T extends RecordWithKey & Record<string, unknown>,
    E extends Record<string, unknown>,
  >(
    records: T[],
    find: (key: string) => Promise<E | null>,
    create: (record: T) => Promise<unknown>,
    update: (key: string, record: T) => Promise<unknown>,
    fields: (keyof T)[],
  ) {
    let inserted = 0;

    let updated = 0;

    let unchanged = 0;

    for (const record of records) {
      const existing = await find(record.key);

      if (!existing) {
        await create(record);
        inserted++;
        continue;
      }

      if (changed(existing, record, fields as string[])) {
        await update(record.key, record);
        updated++;
      } else {unchanged++;}
    }

    return { inserted, updated, unchanged };
  }
}
