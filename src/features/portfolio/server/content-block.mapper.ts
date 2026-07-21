import type { ContentBlock, ContentPage, ContentSection } from "@/generated/prisma/client";
import { aboutHeaderContentSchema } from "@/features/portfolio/schemas/content-blocks/about-header.schema";
import { currentDirectionContentSchema } from "@/features/portfolio/schemas/content-blocks/current-direction.schema";
import { educationContentSchema } from "@/features/portfolio/schemas/content-blocks/education.schema";
import { heroContentSchema } from "@/features/portfolio/schemas/content-blocks/hero.schema";
import { outsideEngineeringContentSchema } from "@/features/portfolio/schemas/content-blocks/outside-engineering.schema";
import { parseContentBlock } from "@/features/portfolio/helpers";
import { philosophyContentSchema } from "@/features/portfolio/schemas/content-blocks/philosophy.schema";
import { textBlockContentSchema } from "@/features/portfolio/schemas/content-blocks/text-block.schema";

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
  return parseContentBlock(heroContentSchema, block.content, block.key);
}

export function mapPhilosophyBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, { key: "home.philosophy", page: "HOME", section: "PHILOSOPHY" });
  return parseContentBlock(philosophyContentSchema, block.content, block.key);
}

export function mapCurrentDirectionBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, { key: "home.current-direction", page: "HOME", section: "CURRENT_DIRECTION" });
  return parseContentBlock(currentDirectionContentSchema, block.content, block.key);
}

export function mapAboutHeaderBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, { key: "about.header", page: "ABOUT", section: "ABOUT_HEADER" });
  return parseContentBlock(aboutHeaderContentSchema, block.content, block.key);
}

export function mapEducationBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, { key: "about.education", page: "ABOUT", section: "EDUCATION" });
  return parseContentBlock(educationContentSchema, block.content, block.key);
}

export function mapTextBlock(block: ContentBlock) {
  return parseContentBlock(textBlockContentSchema, block.content, block.key);
}

export function mapOutsideEngineeringBlock(block: ContentBlock) {
  return parseContentBlock(outsideEngineeringContentSchema, block.content, block.key);
}
