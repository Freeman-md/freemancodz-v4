import assert from "node:assert/strict";
import test from "node:test";
import { getPortfolioSeedData } from "../../prisma/seed-data/portfolio-seed";
import { createSeedPortfolioData } from "@/server/modules/portfolio/public";

test("portfolio seed service delegates persistence and returns a data-derived summary", async () => {
  const data = getPortfolioSeedData();
  let received = false;
  const seedPortfolioData = createSeedPortfolioData({
    replacePortfolioSeedData: async (input) => {
      received = input === data;
    },
  });

  const result = await seedPortfolioData(data);

  assert.equal(received, true);
  assert.deepEqual(result, {
    contentBlocks: data.contentBlocks.length,
    principles: data.principles.length,
    services: data.services.length,
    experiences: data.experiences.length,
    projects: data.projects.length,
  });
});

test("portfolio seed service wraps repository failures without owning connection cleanup", async () => {
  const seedPortfolioData = createSeedPortfolioData({
    replacePortfolioSeedData: async () => {
      throw new Error("database unavailable");
    },
  });

  await assert.rejects(seedPortfolioData(getPortfolioSeedData()), /Portfolio seed failed: database unavailable/);
});
