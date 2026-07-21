import assert from "node:assert/strict";
import test from "node:test";
import { createRemoveIndexedSource } from "@/features/search-index/server/remove-indexed-source";

test("removeIndexedSource maps a successful deletion count", async () => {
  const calls: [string, string][] = [];
  const operation = createRemoveIndexedSource({
    deleteIndexedSource: async (sourceType, sourceId) => {
      calls.push([sourceType, sourceId]);
      return 3;
    },
  });

  const result = await operation({
    sourceType: "projects",
    sourceId: "project-1",
  });

  assert.deepEqual(calls, [["projects", "project-1"]]);
  assert.deepEqual(result, {
    created: 0,
    changed: 0,
    unchanged: 0,
    deleted: 3,
  });
});

test("removeIndexedSource succeeds when the source was already deleted", async () => {
  const calls: [string, string][] = [];
  const operation = createRemoveIndexedSource({
    deleteIndexedSource: async (sourceType, sourceId) => {
      calls.push([sourceType, sourceId]);
      return 0;
    },
  });

  const result = await operation({
    sourceType: "services",
    sourceId: "service-1",
  });

  assert.deepEqual(calls, [["services", "service-1"]]);
  assert.deepEqual(result, {
    created: 0,
    changed: 0,
    unchanged: 0,
    deleted: 0,
  });
});

test("removeIndexedSource wraps repository failures and preserves the cause", async () => {
  const repositoryError = new Error("repository unavailable");
  const operation = createRemoveIndexedSource({
    deleteIndexedSource: async () => {
      throw repositoryError;
    },
  });

  await assert.rejects(
    operation({
      sourceType: "experiences",
      sourceId: "experience-1",
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(
        error.message,
        "Failed to remove indexed source experiences:experience-1: repository unavailable",
      );
      assert.equal(error.cause, repositoryError);
      return true;
    },
  );
});
