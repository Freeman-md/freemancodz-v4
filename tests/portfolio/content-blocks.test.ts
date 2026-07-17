import assert from "node:assert/strict";
import test from "node:test";
import type { ContentBlock } from "@/generated/prisma/client";
import { assertContentBlockIdentity, mapHeroBlock } from "@/features/portfolio/mappers/content-block.mapper";
import { parseHeroContent } from "@/features/portfolio/schemas/content-blocks/hero.schema";
import { parseTextBlockContent } from "@/features/portfolio/schemas/content-blocks/text-block.schema";

const hero = {
  key: "home.hero",
  page: "HOME",
  section: "HERO",
  content: { name: "Freeman", headline: "Headline", intro: "Intro", heroNote: "Note" },
} as unknown as ContentBlock;

test("maps a valid required hero block", () => {
  assert.deepEqual(mapHeroBlock(hero), hero.content);
});

test("rejects mismatched required content block identity", () => {
  assert.throws(
    () => assertContentBlockIdentity({ ...hero, section: "PHILOSOPHY" }, { key: "home.hero", page: "HOME", section: "HERO" }),
    /Unexpected content block identity: home\.hero/,
  );
});

test("rejects malformed repeatable content", () => {
  assert.throws(() => parseTextBlockContent({ body: 1 }, "block: about.intro.0"), /Invalid content stored/);
});

test("rejects malformed hero content at the JSON boundary", () => {
  assert.throws(
    () => parseHeroContent({ name: "Freeman", headline: "Headline", intro: "Intro" }, "home.hero"),
    /Invalid content stored for block: home\.hero/,
  );
});
