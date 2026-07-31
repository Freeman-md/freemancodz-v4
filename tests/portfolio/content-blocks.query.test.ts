import assert from "node:assert/strict";
import test from "node:test";
import { ContentBlockRepository } from "@/server/modules/portfolio/repositories/content-block.repository";

test("content-block repository reports missing required content by stable key", async () => {
  const repository = new ContentBlockRepository({ contentBlock: { findUnique: async () => null } } as never);
  await assert.rejects(repository.findRequiredByKey("home.hero"), /Required content block not found: home\.hero/);
});

test("content-block repository preserves stored position ordering", async () => {
  let args: unknown;
  const repository = new ContentBlockRepository({ contentBlock: { findMany: async (value: unknown) => { args = value; return []; } } } as never);
  await repository.findBySection("ABOUT", "ABOUT_INTRO");
  assert.deepEqual(args, { where: { page: "ABOUT", section: "ABOUT_INTRO" }, orderBy: { position: "asc" } });
});
