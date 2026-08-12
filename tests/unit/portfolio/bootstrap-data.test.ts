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
  MANAGED_PORTFOLIO_ASSETS,
  assertProductionPortfolioIsUninitialised,
  bootstrapMedia,
  portfolioIsInitialised,
  seedPortfolio,
} from "../../../prisma/portfolio-bootstrap";
import type { PrismaClient } from "@/generated/prisma/client";
import type { ISupabaseStorageProvider } from "@/server/modules/portfolio/interfaces/supabase-storage.provider.interface";

test("canonical seed values and relationship allocation match the approved artifacts", () => {
  assert.equal(profileSeed.name, "Freeman Madudili");
  assert.equal(profileCollections.length, 6);
  assert.deepEqual(
    projectSeeds.map(({ title }) => title),
    [
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
    ["Pay4Me", "The Hippodrome Casino", "Beyond the interface", "Today"],
  );
  assert.equal(contentSeeds.filter(({ parent }) => !parent).length, 22);
  assert.equal(
    contentSeeds.some((block) => "projects" in block || "experiences" in block),
    false,
  );
  assert.equal(mediaSeeds.filter(({ source }) => source?.startsWith("/images/work/")).length, 2);
  assert.equal(
    mediaSeeds.some(({ source }) => source?.includes("/api/blob")),
    false,
  );
  assert.equal(
    actionSeeds.find(({ key }) => key === "action.work.conversation")?.assistantMessage,
    "I’ve been looking through your work and I’d like to talk about something I’m working on.",
  );
});

test("media bootstrap uses the six stable paths and skips existing objects", async () => {
  const uploaded: string[] = [];

  const loaded: string[] = [];

  const storage: ISupabaseStorageProvider = {
    ensurePublicBucket: async () => undefined,
    hasObject: async (path) => path === "images/me",
    uploadIfMissing: async ({ objectPath, contentType }) => {
      uploaded.push(`${objectPath}:${contentType}`);

      return `https://example.test/${objectPath}`;
    },
    getPublicUrl: (path) => `https://example.test/${path}`,
  };

  await bootstrapMedia(storage, async (filename) => {
    loaded.push(filename);

    return new Uint8Array([1]);
  });
  assert.deepEqual(
    MANAGED_PORTFOLIO_ASSETS.map(({ objectPath }) => objectPath),
    [
      "images/me",
      "images/strength-training",
      "images/running",
      "images/community",
      "images/learning",
      "documents/cv",
    ],
  );
  assert.equal(uploaded.length, 5);
  assert.equal(loaded.includes("me"), false);
  assert.match(uploaded.at(-1)!, /^documents\/cv:application\/pdf$/);
});

test("production bootstrap refuses an already-initialised portfolio", async () => {
  const database = {
    profile: { count: async () => 1 },
    contentBlock: { count: async () => 0 },
    project: { count: async () => 0 },
    experience: { count: async () => 0 },
  } as unknown as PrismaClient;

  await assert.rejects(
    assertProductionPortfolioIsUninitialised(database),
    /already initialised; refusing to overwrite/,
  );
});

test("a failed database seed transaction does not leave an initialised portfolio", async () => {
  let initialised = false;

  let nextId = 0;

  const transaction = {
    iconBlock: { create: async () => ({ id: `icon-${++nextId}` }) },
    actionBlock: { create: async () => ({}) },
    mediaBlock: { create: async () => ({}) },
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

  const storage: ISupabaseStorageProvider = {
    ensurePublicBucket: async () => undefined,
    hasObject: async () => true,
    uploadIfMissing: async ({ objectPath }) => `https://example.test/${objectPath}`,
    getPublicUrl: (objectPath) => `https://example.test/${objectPath}`,
  };

  await assert.rejects(seedPortfolio(database, storage), /simulated seed failure/);
  assert.equal(await portfolioIsInitialised(database), false);
});
