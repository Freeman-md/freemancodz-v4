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

function base(block: ContentBlock, title: string, category: string, content: string, keywords: string[]) {
  return [document({ sourceType: "content_blocks", sourceId: block.id, title, category, url: block.page === "HOME" ? "/" : "/about", content, keywords })];
}

export function buildContentBlockDocuments(block: ContentBlock) {
  switch (block.key) {
    case "home.hero": { const v = parseContentBlock(heroContentSchema, block.content, block.key); return base(block, v.name, "Profile", `Headline: ${v.headline}. Introduction: ${v.intro} Note: ${v.heroNote}`, [v.name, v.headline]); }
    case "home.philosophy": { const v = parseContentBlock(philosophyContentSchema, block.content, block.key); return base(block, "Engineering philosophy", "Profile", v.philosophyQuestion, ["engineering philosophy"]); }
    case "home.current-direction": { const v = parseContentBlock(currentDirectionContentSchema, block.content, block.key); return base(block, "Current direction", "Profile", `Current direction: ${v.currentDirection}. ${v.currentDirectionSupport}`, ["current direction", v.currentDirection]); }
    case "about.header": { const v = parseContentBlock(aboutHeaderContentSchema, block.content, block.key); return base(block, "About Freeman", "Profile", v.aboutHeadline, ["about"]); }
    case "about.education": { const v = parseContentBlock(educationContentSchema, block.content, block.key); return base(block, "Education and research", "Education", `Current: ${v.current}. Previous: ${v.previous}. Research: ${v.research}. ${v.support}`, ["education", v.current, v.previous, v.research]); }
    default:
      break;
  }
  if (block.page !== "ABOUT") return [];
  if (block.section === "ABOUT_INTRO") { const v = parseContentBlock(textBlockContentSchema, block.content, block.key); return base(block, "About Freeman", "Profile", v.body, ["about"]); }
  if (block.section === "WORK_PROCESS") { const v = parseContentBlock(textBlockContentSchema, block.content, block.key); return base(block, "Work process", "Work Process", v.body, ["work process"]); }
  if (block.section === "OUTSIDE_ENGINEERING") { const v = parseContentBlock(outsideEngineeringContentSchema, block.content, block.key); return base(block, v.title, "Outside Engineering", v.description, [v.title, "outside engineering"]); }
  return [];
}
