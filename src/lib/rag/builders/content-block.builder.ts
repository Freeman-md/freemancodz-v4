import type { ContentBlock } from "@/generated/prisma/client";
import { parseContentBlock } from "@/features/portfolio/helpers";
import { heroContentSchema } from "@/features/portfolio/schemas/content-blocks/hero.schema";
import { philosophyContentSchema } from "@/features/portfolio/schemas/content-blocks/philosophy.schema";
import { currentDirectionContentSchema } from "@/features/portfolio/schemas/content-blocks/current-direction.schema";
import { aboutHeaderContentSchema } from "@/features/portfolio/schemas/content-blocks/about-header.schema";
import { educationContentSchema } from "@/features/portfolio/schemas/content-blocks/education.schema";
import { textBlockContentSchema } from "@/features/portfolio/schemas/content-blocks/text-block.schema";
import { outsideEngineeringContentSchema } from "@/features/portfolio/schemas/content-blocks/outside-engineering.schema";
import { document } from "./shared";

const singletonIdentities = {
  "home.hero": { page: "HOME", section: "HERO" },
  "home.philosophy": { page: "HOME", section: "PHILOSOPHY" },
  "home.current-direction": { page: "HOME", section: "CURRENT_DIRECTION" },
  "about.header": { page: "ABOUT", section: "ABOUT_HEADER" },
  "about.education": { page: "ABOUT", section: "EDUCATION" },
} as const;

function requireIdentity(
  block: ContentBlock,
  expected: { page: ContentBlock["page"]; section: ContentBlock["section"] },
) {
  if (block.page !== expected.page || block.section !== expected.section) {
    throw new Error(
      `Unexpected ContentBlock identity for ${block.key}: expected ${expected.page}/${expected.section}, received ${block.page}/${block.section}`,
    );
  }
}

function base(block: ContentBlock, title: string, category: string, content: string, keywords: string[]) {
  return [document({ sourceType: "content_blocks", sourceId: block.id, title, category, url: block.page === "HOME" ? "/" : "/about", content, keywords })];
}

export function buildContentBlockDocuments(block: ContentBlock) {
  switch (block.key) {
    case "home.hero": { requireIdentity(block, singletonIdentities[block.key]); const v = parseContentBlock(heroContentSchema, block.content, block.key); return base(block, v.name, "Profile", `Headline: ${v.headline}. Introduction: ${v.intro} Note: ${v.heroNote}`, [v.name, v.headline]); }
    case "home.philosophy": { requireIdentity(block, singletonIdentities[block.key]); const v = parseContentBlock(philosophyContentSchema, block.content, block.key); return base(block, "Engineering philosophy", "Profile", v.philosophyQuestion, ["engineering philosophy"]); }
    case "home.current-direction": { requireIdentity(block, singletonIdentities[block.key]); const v = parseContentBlock(currentDirectionContentSchema, block.content, block.key); return base(block, "Current direction", "Profile", `Current direction: ${v.currentDirection}. ${v.currentDirectionSupport}`, ["current direction", v.currentDirection]); }
    case "about.header": { requireIdentity(block, singletonIdentities[block.key]); const v = parseContentBlock(aboutHeaderContentSchema, block.content, block.key); return base(block, "About Freeman", "Profile", v.aboutHeadline, ["about"]); }
    case "about.education": { requireIdentity(block, singletonIdentities[block.key]); const v = parseContentBlock(educationContentSchema, block.content, block.key); return base(block, "Education and research", "Education", `Current: ${v.current}. Previous: ${v.previous}. Research: ${v.research}. ${v.support}`, ["education", v.current, v.previous, v.research]); }
    default:
      break;
  }
  if (block.page !== "ABOUT") return [];
  if (block.section === "ABOUT_INTRO") { const v = parseContentBlock(textBlockContentSchema, block.content, block.key); return base(block, "About Freeman", "Profile", v.body, ["about"]); }
  if (block.section === "WORK_PROCESS") { const v = parseContentBlock(textBlockContentSchema, block.content, block.key); return base(block, "Work process", "Work Process", v.body, ["work process"]); }
  if (block.section === "OUTSIDE_ENGINEERING") { const v = parseContentBlock(outsideEngineeringContentSchema, block.content, block.key); return base(block, v.title, "Outside Engineering", v.description, [v.title, "outside engineering"]); }
  return [];
}
