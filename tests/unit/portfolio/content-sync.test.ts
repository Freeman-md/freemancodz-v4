import assert from "node:assert/strict";
import test from "node:test";
import { services } from "../../../content/portfolio/services";
import { PortfolioContentRepository } from "@/server/modules/portfolio/repositories/portfolio-content.repository";
import { PortfolioContentService } from "@/server/modules/portfolio/services/portfolio-content.service";

type StoredService = (typeof services)[number];

function createServiceRepository(stored: Map<string, StoredService>) {
  const created: StoredService[] = [];

  const updated: StoredService[] = [];

  const repository = new PortfolioContentRepository({
    $transaction: async (callback: (database: unknown) => unknown) =>
      callback({
        service: {
          findUnique: async ({ where: { key } }: { where: { key: string } }) =>
            stored.get(key) ?? null,
          create: async ({ data }: { data: StoredService }) => {
            stored.set(data.key, data);
            created.push(data);
          },
          update: async ({ where: { key }, data }: { where: { key: string }; data: StoredService }) => {
            stored.set(key, data);
            updated.push(data);
          },
        },
      }),
  } as never);

  return { repository, created, updated };
}

test("content sync inserts missing records and leaves unmentioned records untouched", async () => {
  const stored = new Map<string, StoredService>([
    [
      "unmentioned-service",
      { ...services[0], key: "unmentioned-service", title: "Unmentioned" },
    ],
  ]);

  const { repository, created } = createServiceRepository(stored);

  const result = await repository.sync("services");

  assert.deepEqual(result, { inserted: 2, updated: 0, unchanged: 0 });
  assert.equal(created.length, 2);
  assert.equal(stored.get("unmentioned-service")?.title, "Unmentioned");
});

test("content sync updates changed records and skips unchanged records", async () => {
  const changed = { ...services[0], lead: "Old lead" };

  const stored = new Map<string, StoredService>([
    [changed.key, changed],
    [services[1].key, services[1]],
  ]);

  const { repository, updated } = createServiceRepository(stored);

  const result = await repository.sync("services");

  assert.deepEqual(result, { inserted: 0, updated: 1, unchanged: 1 });
  assert.equal(updated[0].key, services[0].key);
  assert.equal(stored.get(services[0].key)?.lead, services[0].lead);
});

test("content validation rejects duplicate selected scopes before repository writes", async () => {
  let calls = 0;

  const service = new PortfolioContentService({
    sync: async () => {
      calls++;

      return { inserted: 0, updated: 0, unchanged: 0 };
    },
  });

  await assert.rejects(service.sync(["services", "services"]), /Duplicate stable key/);
  assert.equal(calls, 0);
});

test("content sync sends only the selected scope to its repository", async () => {
  const scopes: string[] = [];

  const service = new PortfolioContentService({
    sync: async (scope) => {
      scopes.push(scope);

      return { inserted: 0, updated: 0, unchanged: 1 };
    },
  });

  await service.sync(["services"]);

  assert.deepEqual(scopes, ["services"]);
});
