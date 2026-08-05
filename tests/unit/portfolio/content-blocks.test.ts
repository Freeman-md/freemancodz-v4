import assert from "node:assert/strict";
import test from "node:test";
import type { ContentBlock } from "@/generated/prisma/client";
import {
  assertContentBlockIdentity,
  mapHeroBlock,
} from "@/server/modules/portfolio/mappers/content-block.mapper";
import { heroContentSchema } from "@/server/modules/portfolio/schemas/content-block.schema";
import { parseStoredContent } from "@/server/modules/portfolio/schemas/content-block.schema";
import { textBlockContentSchema } from "@/server/modules/portfolio/schemas/content-block.schema";

const hero = {
  key: "home.hero",
  page: "HOME",
  section: "HERO",
  content: { name: "Freeman", headline: "Headline", intro: "Intro", heroNote: "Note", primaryLabel: "Audit", primaryHref: "/audit", secondaryLabel: "Work", secondaryHref: "/work" },
} as unknown as ContentBlock;

test("maps a valid required hero block", () => {
  assert.deepEqual(mapHeroBlock(hero), hero.content);
});

test("rejects mismatched required content block identity", () => {
  assert.throws(
    () =>
      assertContentBlockIdentity(
        { ...hero, section: "PHILOSOPHY" },
        { key: "home.hero", page: "HOME", section: "HERO" },
      ),
    /Unexpected content block identity: home\.hero/,
  );
});

test("rejects malformed repeatable content", () => {
  assert.throws(
    () => parseStoredContent(textBlockContentSchema, { body: 1 }, "about.intro.0"),
    /Invalid content stored for block: about\.intro\.0/,
  );
});

test("rejects malformed hero content at the JSON boundary", () => {
  assert.throws(
    () =>
      parseStoredContent(
        heroContentSchema,
        { name: "Freeman", headline: "Headline", intro: "Intro" },
        "home.hero",
      ),
    /Invalid content stored for block: home\.hero/,
  );
});
