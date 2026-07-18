import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("queue trigger migration uses null-safe semantic change predicates and stale-lock recovery", () => {
  const migration = readFileSync(new URL("../../prisma/migrations/20260718120000_add_search_index_queue/migration.sql", import.meta.url), "utf8");
  for (const trigger of ["projects", "services", "principles", "experiences", "content_blocks"]) {
    assert.match(migration, new RegExp(`CREATE TRIGGER ${trigger}_index_update[\\s\\S]*?WHEN \\(.*?IS DISTINCT FROM`));
  }
  assert.match(migration, /AFTER UPDATE OF "title"[\s\S]*?WHEN \(OLD\."title" IS DISTINCT FROM NEW\."title"/);
  assert.match(migration, /AFTER UPDATE OF "key"[\s\S]*?WHEN \(OLD\."key" IS DISTINCT FROM NEW\."key"/);
});
