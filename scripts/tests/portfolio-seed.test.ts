import assert from "node:assert/strict";

import {
  getPortfolioSeedData,
  seedPortfolioData,
} from "../lib/portfolio-seed";
import type { PrismaClient } from "@/generated/prisma/client";

type TableName =
  | "profile"
  | "education"
  | "principle"
  | "service"
  | "contentItem"
  | "experience"
  | "project";
type Store = Record<TableName, unknown[]>;

const tableNames: TableName[] = [
  "profile",
  "education",
  "principle",
  "service",
  "contentItem",
  "experience",
  "project",
];

function createStore(): Store {
  return Object.fromEntries(tableNames.map((table) => [table, []])) as unknown as Store;
}

function createClient(store: Store, failure?: Error): PrismaClient & { disconnected: boolean } {
  const writer = Object.fromEntries(
    tableNames.map((table) => [
      table,
      {
        deleteMany: async () => {
          store[table] = [];
        },
        createMany: async ({ data }: { data: readonly unknown[] }) => {
          if (failure && table === "project") {
            throw failure;
          }

          store[table] = [...data];
        },
      },
    ]),
  );

  return {
    ...writer,
    disconnected: false,
    async $transaction(operation: (transaction: typeof writer) => Promise<unknown>) {
      const snapshot = structuredClone(store);

      try {
        return await operation(writer);
      } catch (error) {
        Object.assign(store, snapshot);
        throw error;
      }
    },
    async $disconnect(this: { disconnected: boolean }) {
      this.disconnected = true;
    },
  } as unknown as PrismaClient & { disconnected: boolean };
}

async function run() {
  const data = getPortfolioSeedData();
  assert.equal(data.profiles.length, 1);
  assert.equal(data.educations.length, 1);
  assert.equal(data.principles.length, 9);
  assert.equal(data.services.length, 2);
  assert.equal(data.contentItems.length, 14);
  assert.equal(data.experiences.length, 3);
  assert.equal(data.projects.length, 5);
  assert.deepEqual(data.projects[0]?.stacks, ["Nuxt.js", "Vue.js", "Tailwind CSS", "Laravel"]);
  assert.deepEqual(data.projects[0]?.links, [
    { label: "Live", href: "https://pay4me.app" },
    { label: "Current brand", href: "https://withradius.com" },
    { label: "Provider-specific product", href: "https://pay.pay4me.app" },
  ]);

  const store = createStore();
  const firstClient = createClient(store);
  await seedPortfolioData(firstClient);
  const firstRun = structuredClone(store);
  const secondClient = createClient(store);
  await seedPortfolioData(secondClient);

  assert.deepEqual(store, firstRun);
  assert.equal(firstClient.disconnected, true);
  assert.equal(secondClient.disconnected, true);

  const failureStore = createStore();
  const failureClient = createClient(failureStore, new Error("database unavailable"));

  await assert.rejects(
    seedPortfolioData(failureClient),
    /Portfolio seed failed: database unavailable/,
  );
  assert.deepEqual(failureStore, createStore());
  assert.equal(failureClient.disconnected, true);
}

run()
  .then(() => console.log("portfolio seed tests passed"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
