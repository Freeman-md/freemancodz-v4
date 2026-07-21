import type { ContentBlock, ContentPage, ContentSection } from "@/generated/prisma/client";
import { aboutHeaderContentSchema } from "@/features/portfolio/schema";
import { currentDirectionContentSchema } from "@/features/portfolio/schema";
import { educationContentSchema } from "@/features/portfolio/schema";
import { heroContentSchema } from "@/features/portfolio/schema";
import { outsideEngineeringContentSchema } from "@/features/portfolio/schema";
import { parseStoredContent } from "@/features/portfolio/schema";
import { philosophyContentSchema } from "@/features/portfolio/schema";
import { textBlockContentSchema } from "@/features/portfolio/schema";

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
  return parseStoredContent(heroContentSchema, block.content, block.key);
}

export function mapPhilosophyBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, { key: "home.philosophy", page: "HOME", section: "PHILOSOPHY" });
  return parseStoredContent(philosophyContentSchema, block.content, block.key);
}

export function mapCurrentDirectionBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, { key: "home.current-direction", page: "HOME", section: "CURRENT_DIRECTION" });
  return parseStoredContent(currentDirectionContentSchema, block.content, block.key);
}

export function mapAboutHeaderBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, { key: "about.header", page: "ABOUT", section: "ABOUT_HEADER" });
  return parseStoredContent(aboutHeaderContentSchema, block.content, block.key);
}

export function mapEducationBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, { key: "about.education", page: "ABOUT", section: "EDUCATION" });
  return parseStoredContent(educationContentSchema, block.content, block.key);
}

export function mapTextBlock(block: ContentBlock) {
  return parseStoredContent(textBlockContentSchema, block.content, block.key);
}

export function mapOutsideEngineeringBlock(block: ContentBlock) {
  return parseStoredContent(outsideEngineeringContentSchema, block.content, block.key);
}
