import assert from "node:assert/strict";
import test from "node:test";
import {
  actionSeeds,
  contentSeeds,
  experienceSeeds,
  mediaSeeds,
  profileCollections,
  profileSeed,
  projectSeeds,
} from "../../../prisma/portfolio-seed-data";
import {
  assertProductionPortfolioIsUninitialised,
  portfolioIsInitialised,
  seedPortfolio,
} from "../../../prisma/portfolio-bootstrap";
import type { PrismaClient } from "@/generated/prisma/client";
import type { PortfolioStorage } from "@/modules/portfolio/types";

test("canonical seed values and relationship allocation match the approved artifacts", () => {
  assert.equal(profileSeed.name, "Freeman Madudili");
  assert.equal(profileCollections.length, 6);
  assert.deepEqual(
    projectSeeds.map(({ title }) => title),
    [
      "JPScents",
      "Debby Art & Prints",
      "Pay4Me / WithRadius",
      "Portfolio Assistant",
      "Email PA",
      "AcrossTheHorizon",
      "Shifty",
      "Self-Healing Backend Operations System",
    ],
  );
  assert.deepEqual(
    experienceSeeds.map(({ title }) => title),
    ["Software Engineer · Novier Labs", "Frontend Developer · Pay4Me"],
  );
  assert.equal(contentSeeds.filter(({ parent }) => !parent).length, 22);
  assert.equal(
    contentSeeds.some((block) => "projects" in block || "experiences" in block),
    false,
  );
  assert.equal(mediaSeeds.filter(({ source }) => source?.startsWith("/images/work/")).length, 2);
  assert.deepEqual(
    mediaSeeds
      .filter(({ source }) => source?.startsWith("/images/projects/"))
      .map(({ key, source }) => [key, source]),
    [
      ["cover.jpscents", "/images/projects/jpscents.webp"],
      ["cover.debby-arts", "/images/projects/debby-arts.webp"],
    ],
  );
  assert.equal(
    mediaSeeds.some(({ source }) => source?.includes("/api/blob")),
    false,
  );
  assert.equal(
    actionSeeds.find(({ key }) => key === "action.work.conversation")?.assistantMessage,
    "I’ve been looking through your work and I’d like to talk about something I’m working on.",
  );
});

test("production bootstrap refuses every independently initialised portfolio table", async () => {
  const modelNames = [
    "profile",
    "contentBlock",
    "iconBlock",
    "mediaBlock",
    "actionBlock",
    "project",
    "experience",
  ] as const;

  for (const populatedModel of modelNames) {
    const database = Object.fromEntries(
      modelNames.map((modelName) => [
        modelName,
        { count: async () => Number(modelName === populatedModel) },
      ]),
    ) as unknown as PrismaClient;

    await assert.rejects(
      assertProductionPortfolioIsUninitialised(database),
      /already initialised; refusing to overwrite/,
    );
  }
});

test("a failed database seed transaction does not leave an initialised portfolio", async () => {
  let initialised = false;

  let nextId = 0;

  const transaction = {
    iconBlock: {
      create: async () => ({ id: `icon-${++nextId}` }),
      count: async () => Number(initialised),
    },
    actionBlock: { create: async () => ({}), count: async () => 0 },
    mediaBlock: { create: async () => ({}), count: async () => 0 },
    profile: {
      create: async () => {
        initialised = true;

        return { id: "global" };
      },
      count: async () => Number(initialised),
    },
    contentBlock: {
      create: async () => {
        throw new Error("simulated seed failure");
      },
      count: async () => 0,
    },
    project: { count: async () => 0 },
    experience: { count: async () => 0 },
  };

  const database = {
    ...transaction,
    $transaction: async (run: (tx: typeof transaction) => Promise<unknown>) => {
      const snapshot = initialised;

      try {
        return await run(transaction);
      } catch (error) {
        initialised = snapshot;
        throw error;
      }
    },
  } as unknown as PrismaClient;

  const storage: PortfolioStorage = {
    ensurePublicBucket: async () => undefined,
    getPublicUrl: (objectPath) => `https://example.test/${objectPath}`,
  };

  await assert.rejects(seedPortfolio(database, storage), /simulated seed failure/);
  assert.equal(await portfolioIsInitialised(database), false);
});
