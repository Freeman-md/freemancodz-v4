import "server-only";
import type { PrismaClient } from "../src/generated/prisma/client";
import type { ISupabaseStorageProvider } from "../src/server/modules/portfolio/interfaces/supabase-storage.provider.interface";
import {
  actionSeeds,
  contentSeeds,
  experienceSeeds,
  iconSeeds,
  mediaSeeds,
  profileCollections,
  profileSeed,
  projectSeeds,
} from "./portfolio-seed-data";

export async function portfolioIsInitialised(database: PrismaClient) {
  const counts = await Promise.all([
    database.profile.count(),
    database.contentBlock.count(),
    database.iconBlock.count(),
    database.mediaBlock.count(),
    database.actionBlock.count(),
    database.project.count(),
    database.experience.count(),
  ]);

  return counts.some(Boolean);
}

export async function assertProductionPortfolioIsUninitialised(database: PrismaClient) {
  if (await portfolioIsInitialised(database)) {
    throw new Error(
      "Production portfolio content is already initialised; refusing to overwrite it.",
    );
  }
}

export async function resetPortfolio(database: PrismaClient) {
  await database.$transaction(async (tx) => {
    await tx.project.deleteMany();
    await tx.contentBlock.deleteMany();
    await tx.experience.deleteMany();
    await tx.profile.deleteMany();
    await tx.actionBlock.deleteMany();
    await tx.mediaBlock.deleteMany();
    await tx.iconBlock.deleteMany();
  });
}

export async function seedPortfolio(database: PrismaClient, storage: ISupabaseStorageProvider) {
  await database.$transaction(
    async (tx) => {
      const ids = new Map<string, string>();

      const createIcon = async (seed: {
        key: string;
        iconName: string | null;
        label: string;
        copy?: string;
      }) => {
        const record = await tx.iconBlock.create({
          data: { iconName: seed.iconName, label: seed.label, copy: seed.copy },
        });

        ids.set(seed.key, record.id);

        return record.id;
      };

      for (const seed of iconSeeds) {
        await createIcon(seed);
      }

      for (const group of profileCollections) {
        for (const seed of group.items) {
          if (!ids.has(seed.key)) {
            await createIcon(seed);
          }
        }
      }

      for (const seed of actionSeeds) {
        const id = await createIcon(seed);

        await tx.actionBlock.create({
          data: {
            id,
            variant: seed.variant,
            url: seed.url,
            assistantMessage: seed.assistantMessage,
          },
        });
      }

      for (const seed of mediaSeeds) {
        const id = await createIcon(seed);

        await tx.mediaBlock.create({
          data: {
            id,
            type: seed.type,
            source: seed.source ?? storage.getPublicUrl(seed.objectPath!),
            altText: seed.altText,
          },
        });
      }

      await tx.profile.create({
        data: {
          ...profileSeed,
          coverImage: storage.getPublicUrl("images/me"),
          iconCollections: {
            create: profileCollections.flatMap((group) =>
              group.items.map((seed, index) => ({
                collection: group.collection,
                order: index + 1,
                iconBlockId: ids.get(seed.key)!,
              })),
            ),
          },
        },
      });
      const blocks = new Map<string, string>();

      for (const seed of contentSeeds) {
        const block = await tx.contentBlock.create({
          data: {
            eyebrow: seed.eyebrow,
            title: seed.title,
            copy: seed.copy,
            url: seed.url,
            order: seed.parent ? null : seed.order,
            iconBlocks: {
              create: (seed.icons ?? []).map((key, index) => ({
                order: index + 1,
                iconBlockId: ids.get(key)!,
              })),
            },
            mediaBlocks: {
              create: (seed.media ?? []).map((key, index) => ({
                order: index + 1,
                mediaBlockId: ids.get(key)!,
              })),
            },
            actionBlocks: {
              create: (seed.actions ?? []).map((key, index) => ({
                order: index + 1,
                actionBlockId: ids.get(key)!,
              })),
            },
          },
        });

        blocks.set(seed.key, block.id);
      }

      for (const seed of contentSeeds.filter((item) => item.parent)) {
        await tx.contentBlockChild.create({
          data: {
            parentId: blocks.get(seed.parent!)!,
            childId: blocks.get(seed.key)!,
            order: seed.order,
          },
        });
      }

      for (const seed of experienceSeeds) {
        const experience = await tx.experience.create({
          data: {
            title: seed.title,
            tag: seed.tag,
            copy: seed.copy,
            insight: seed.insight,
            order: seed.order,
          },
        });

        for (const [index, item] of seed.icons.entries()) {
          const iconBlockId = await createIcon(item);

          await tx.experienceIconBlock.create({
            data: { experienceId: experience.id, iconBlockId, order: index + 1 },
          });
        }
      }

      for (const seed of projectSeeds) {
        const { cover, ...data } = seed;

        await tx.project.create({
          data: {
            ...data,
            outcome: "outcome" in data ? data.outcome : undefined,
            visualText: "visualText" in data ? data.visualText : undefined,
            visualBlock: "visualBlock" in data ? data.visualBlock : undefined,
            coverId: cover ? ids.get(cover) : undefined,
          },
        });
      }
    },
    { timeout: 30_000 },
  );
}

export async function verifyPortfolio(database: PrismaClient) {
  const [profiles, projects, experiences, topLevelBlocks] = await Promise.all([
    database.profile.count(),
    database.project.count(),
    database.experience.count(),
    database.contentBlock.count({ where: { parent: null } }),
  ]);

  if (profiles !== 1 || projects !== 6 || experiences !== 4 || topLevelBlocks !== 22) {
    throw new Error(
      `Portfolio bootstrap verification failed (${profiles} profile, ${projects} projects, ${experiences} experiences, ${topLevelBlocks} top-level blocks).`,
    );
  }

  return { profiles, projects, experiences, topLevelBlocks };
}
