import assert from "node:assert/strict";
import test from "node:test";
import {
  executePortfolioContentSync,
  parsePortfolioContentSyncArguments,
} from "@/server/entrypoints/maintenance/portfolio-content-sync.arguments";
import { services } from "../../../content/portfolio/services";
import { projects } from "../../../content/portfolio/projects";
import { PortfolioContentRepository } from "@/server/modules/portfolio/repositories/portfolio-content.repository";
import { PortfolioContentService } from "@/server/modules/portfolio/services/portfolio-content.service";

type StoredService = (typeof services)[number];
type StoredProject = (typeof projects)[number] & {
  collaboration: string | null;
  future: string | null;
  positioning: string | null;
};

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

function createProjectRepository(stored: Map<string, StoredProject>) {
  const repository = new PortfolioContentRepository({
    $transaction: async (callback: (database: unknown) => unknown) =>
      callback({
        project: {
          findUnique: async ({ where: { key } }: { where: { key: string } }) =>
            stored.get(key) ?? null,
          create: async ({ data }: { data: StoredProject }) => {
            stored.set(data.key, data);
          },
          update: async ({ where: { key }, data }: { where: { key: string }; data: StoredProject }) => {
            stored.set(key, data);
          },
        },
      }),
  } as never);

  return repository;
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

test("project sync converges when optional content fields are omitted", async () => {
  const repository = createProjectRepository(new Map());

  const first = await repository.sync("projects");

  const second = await repository.sync("projects");

  assert.equal(first.inserted, projects.length);
  assert.deepEqual(second, { inserted: 0, updated: 0, unchanged: projects.length });
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

test("sync argument parsing filters recognised flags and rejects unknown scopes before execution", async () => {
  const production = parsePortfolioContentSyncArguments(
    ["--production", "--confirm-production", "projects"],
    ["home", "projects"],
  );

  assert.deepEqual(production.scopes, ["projects"]);
  assert.equal(production.isProduction, true);
  assert.equal(production.confirmProduction, true);
  assert.throws(
    () => parsePortfolioContentSyncArguments(["unknown"], ["home", "projects"]),
    /Unknown content scope: unknown/,
  );

  let writes = 0;

  await assert.rejects(
    executePortfolioContentSync(
      parsePortfolioContentSyncArguments(["--production", "projects"], ["projects"]),
      { confirmProduction: () => undefined, sync: async () => { writes++; } },
    ),
    /--confirm-production/,
  );
  assert.equal(writes, 0);
});

test("audit is accepted as a content-sync scope", () => {
  assert.deepEqual(parsePortfolioContentSyncArguments(["audit"], ["home", "audit"]).scopes, ["audit"]);
});

test("confirmed production sync executes only its selected scope", async () => {
  const calls: string[] = [];

  const argumentsResult = parsePortfolioContentSyncArguments(
    ["--production", "--confirm-production", "projects"],
    ["home", "projects"],
  );

  await executePortfolioContentSync(argumentsResult, {
    confirmProduction: () => calls.push("confirmed"),
    sync: async (scopes) => calls.push(...scopes),
  });

  assert.deepEqual(calls, ["confirmed", "projects"]);
});
