import assert from "node:assert/strict";
import test from "node:test";
import { getPortfolioSeedData } from "../../prisma/seed-data/portfolio-seed";
import { PortfolioSeedService } from "@/server/modules/portfolio/services/portfolio-seed.service";

test("portfolio seed service delegates persistence and returns a data-derived summary", async () => {
  const data = getPortfolioSeedData(); let received = false;
  const service = new PortfolioSeedService({ replace: async (input) => { received = input === data; } });
  assert.deepEqual(await service.seed(data), { contentBlocks: data.contentBlocks.length, principles: data.principles.length, services: data.services.length, experiences: data.experiences.length, projects: data.projects.length }); assert.equal(received, true);
});
test("portfolio seed service wraps repository failures", async () => { const service = new PortfolioSeedService({ replace: async () => { throw new Error("database unavailable"); } }); await assert.rejects(service.seed(getPortfolioSeedData()), /Portfolio seed failed: database unavailable/); });
