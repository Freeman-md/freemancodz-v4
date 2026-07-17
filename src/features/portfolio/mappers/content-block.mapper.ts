import type { ContentBlock, ContentPage, ContentSection } from "@/generated/prisma/client";
import { parseAboutHeaderContent } from "@/features/portfolio/schemas/content-blocks/about-header.schema";
import { parseCurrentDirectionContent } from "@/features/portfolio/schemas/content-blocks/current-direction.schema";
import { parseEducationContent } from "@/features/portfolio/schemas/content-blocks/education.schema";
import { parseHeroContent } from "@/features/portfolio/schemas/content-blocks/hero.schema";
import { parseOutsideEngineeringContent } from "@/features/portfolio/schemas/content-blocks/outside-engineering.schema";
import { parsePhilosophyContent } from "@/features/portfolio/schemas/content-blocks/philosophy.schema";
import { parseTextBlockContent } from "@/features/portfolio/schemas/content-blocks/text-block.schema";

export function assertContentBlockIdentity(
  block: ContentBlock,
  expected: { key: string; page: ContentPage; section: ContentSection },
) {
  if (block.key !== expected.key || block.page !== expected.page || block.section !== expected.section) {
    throw new Error(`Unexpected content block identity: ${expected.key}`);
  }
}

export function mapHeroBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, { key: "home.hero", page: "HOME", section: "HERO" });
  return parseHeroContent(block.content, block.key);
}

export function mapPhilosophyBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, { key: "home.philosophy", page: "HOME", section: "PHILOSOPHY" });
  return parsePhilosophyContent(block.content, block.key);
}

export function mapCurrentDirectionBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, { key: "home.current-direction", page: "HOME", section: "CURRENT_DIRECTION" });
  return parseCurrentDirectionContent(block.content, block.key);
}

export function mapAboutHeaderBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, { key: "about.header", page: "ABOUT", section: "ABOUT_HEADER" });
  return parseAboutHeaderContent(block.content, block.key);
}

export function mapEducationBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, { key: "about.education", page: "ABOUT", section: "EDUCATION" });
  return parseEducationContent(block.content, block.key);
}

export function mapTextBlock(block: ContentBlock) {
  return parseTextBlockContent(block.content, `block: ${block.key}`);
}

export function mapOutsideEngineeringBlock(block: ContentBlock) {
  return parseOutsideEngineeringContent(block.content, `block: ${block.key}`);
}
