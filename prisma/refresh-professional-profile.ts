import "server-only";
import type { PrismaClient } from "../src/generated/prisma/client";
import { contentSeeds, experienceSeeds, profileSeed, projectSeeds } from "./portfolio-seed-data";

/** Apply the reviewed CV refresh without resetting media, actions or other CMS content. */
export async function refreshProfessionalProfile(database: PrismaClient) {
  return database.$transaction(async (tx) => {
    await tx.profile.update({ where: { id: "global" }, data: profileSeed });

    for (const key of ["home.hero", "about.hero", "about.journey", "about.explore"]) {
      const seed = contentSeeds.find((block) => block.key === key)!;

      const records = await tx.contentBlock.findMany({
        where: { url: seed.url, parent: null },
        select: { id: true },
      });

      if (records.length !== 1) {
        throw new Error(`Expected one content block for ${key}.`);
      }

      await tx.contentBlock.update({
        where: { id: records[0]!.id },
        data: { title: seed.title, copy: seed.copy },
      });
    }

    for (const slug of ["jpscents", "debby-arts", "pay4me-withradius", "across-the-horizon"]) {
      const seed = projectSeeds.find((project) => project.slug === slug)!;

      await tx.project.update({
        where: { slug },
        data: {
          category: seed.category,
          problem: seed.problem,
          solution: seed.solution,
          outcome: seed.outcome,
          ...(seed.markdown ? { markdown: seed.markdown } : {}),
        },
      });
    }

    // Release the superseded positions before moving Pay4Me and adding Novier.
    // Unknown or concurrent CMS additions are never deleted.
    await tx.experience.deleteMany({
      where: {
        title: {
          in: [
            "The Hippodrome Casino",
            "Live operations",
            "Beyond the interface",
            "Today",
            "Product Engineer · Freemancodz",
          ],
        },
      },
    });
    for (const seed of [...experienceSeeds].reverse()) {
      const oldTitle = seed.title.includes("Pay4Me") ? "Pay4Me" : "Novier Labs";

      const previousLocalTitle = seed.title.includes("Pay4Me")
        ? "Production interfaces"
        : "From requirements to delivery";

      const existing = await tx.experience.findMany({
        where: { title: { in: [seed.title, oldTitle, previousLocalTitle] } },
        select: { id: true },
      });

      if (existing.length > 1) {
        throw new Error(`Duplicate employment records for ${oldTitle}.`);
      }

      const { icons: _icons, ...data } = seed;

      if (existing[0]) {
        await tx.experience.update({ where: { id: existing[0].id }, data });
      } else {
        await tx.experience.create({ data });
      }
    }

    return { experiences: await tx.experience.count(), projectsUpdated: 4, blocksUpdated: 4 };
  });
}
