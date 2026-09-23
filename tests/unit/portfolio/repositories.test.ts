import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "@/generated/prisma/client";
import { ActionBlockRepository } from "@/modules/portfolio/repositories/action-block.repository";
import { ContentBlockRepository } from "@/modules/portfolio/repositories/content-block.repository";
import { ExperienceRepository } from "@/modules/portfolio/repositories/experience.repository";
import { IconBlockRepository } from "@/modules/portfolio/repositories/icon-block.repository";
import { MediaBlockRepository } from "@/modules/portfolio/repositories/media-block.repository";
import { ProfileRepository } from "@/modules/portfolio/repositories/profile.repository";
import { ProjectRepository } from "@/modules/portfolio/repositories/project.repository";

test("seven portfolio repositories expose ordered domain reads and subtype bases", async () => {
  const calls: Array<[string, unknown]> = [];

  const model = (name: string) => ({
    findUnique: async (args: unknown) => {
      calls.push([`${name}.unique`, args]);

      return name === "profile"
        ? { id: "global", iconCollections: [] }
        : { id: "one", iconBlock: {} };
    },
    findMany: async (args: unknown) => {
      calls.push([`${name}.many`, args]);

      return [];
    },
  });

  const database = {
    profile: model("profile"),
    contentBlock: model("content"),
    iconBlock: model("icon"),
    mediaBlock: model("media"),
    actionBlock: model("action"),
    project: model("project"),
    experience: model("experience"),
  } as unknown as PrismaClient;

  await new ProfileRepository(database).findSingleton();
  await new ContentBlockRepository(database).findPageTree("/about");
  await new IconBlockRepository(database).findById("one");
  await new MediaBlockRepository(database).findById("one");
  await new ActionBlockRepository(database).findById("one");
  const projects = new ProjectRepository(database);

  await projects.findAll();
  await projects.findBySlug("one");
  await projects.findBySlugs(["one"]);
  await projects.findFeatured();
  await new ExperienceRepository(database).findAll();
  assert.equal(calls.length, 10);
  assert.match(
    JSON.stringify(calls.find(([name]) => name === "profile.unique")?.[1]),
    /iconCollections.*collection.*order/,
  );
  assert.match(
    JSON.stringify(calls.find(([name]) => name === "content.many")?.[1]),
    /orderBy.*order.*parent/,
  );
  assert.match(
    JSON.stringify(calls.find(([name]) => name === "experience.many")?.[1]),
    /iconBlocks.*order/,
  );
  assert.match(
    JSON.stringify(calls.filter(([name]) => name.startsWith("project"))),
    /cover.*iconBlock/,
  );
});

test("profile repository requires the database-enforced singleton", async () => {
  const database = { profile: { findUnique: async () => null } } as unknown as PrismaClient;

  await assert.rejects(new ProfileRepository(database).findSingleton(), /not initialised/);
});

test("content repository assembles complete recursively traversable trees from flat records", async () => {
  const relationFields = { iconBlocks: [], mediaBlocks: [], actionBlocks: [] };

  const records = [
    { id: "second", order: 2, parent: null, ...relationFields },
    { id: "leaf", order: null, parent: { parentId: "child", order: 1 }, ...relationFields },
    { id: "first", order: 1, parent: null, ...relationFields },
    { id: "child", order: null, parent: { parentId: "first", order: 2 }, ...relationFields },
  ];

  const database = {
    contentBlock: { findMany: async () => records },
  } as unknown as PrismaClient;

  const result = await new ContentBlockRepository(database).findPageTree("/audit");

  assert.deepEqual(
    result.map(({ id }) => id),
    ["first", "second"],
  );
  assert.equal(result[0]?.children[0]?.child.id, "child");
  assert.equal(result[0]?.children[0]?.child.children[0]?.child.id, "leaf");
  assert.deepEqual(result[0]?.children[0]?.child.children[0]?.child.children, []);
});
