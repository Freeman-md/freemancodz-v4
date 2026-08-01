import type { ContentBlock } from "@/generated/prisma/client";
import {
  aboutHeaderContentSchema,
  currentDirectionContentSchema,
  educationContentSchema,
  heroContentSchema,
  outsideEngineeringContentSchema,
  philosophyContentSchema,
  textBlockContentSchema,
} from "@/server/modules/portfolio/schemas/content-block.schema";
import type { IndexDocument } from "./source-document.mapper";

type ContentBlockDocument = Omit<IndexDocument, "sourceType" | "sourceId">;

function document(block: ContentBlock, value: ContentBlockDocument): IndexDocument {
  return { sourceType: "content_blocks", sourceId: block.id, ...value };
}

function textBlockSubject(body: string): string {
  const firstSentence = body.trim().split(/[.!?]/, 1)[0]?.trim() || "Freeman's story";

  return firstSentence.length > 80 ? `${firstSentence.slice(0, 77).trim()}…` : firstSentence;
}

function textBlockTitle(prefix: string, key: string, body: string): string {
  const suffix = key.slice(key.lastIndexOf(".") + 1);

  return /^\d+$/.test(suffix)
    ? `${prefix}: ${textBlockSubject(body)}`
    : `${prefix}: ${suffix.replaceAll("-", " ")}`;
}

export function mapContentBlockDocument(block: ContentBlock): IndexDocument {
  if (block.key === "home.hero" && block.page === "HOME" && block.section === "HERO") {
    const parsed = heroContentSchema.safeParse(block.content);

    if (parsed.success) {
      return document(block, {
        title: "Freeman profile",
        category: "Profile",
        url: "/",
        keywords: ["Freeman", "Profile"],
        paragraphs: [
          `Profile: Freeman is ${parsed.data.name}. ${parsed.data.headline}`,
          parsed.data.intro,
          parsed.data.heroNote,
        ],
      });
    }
  }

  if (block.key === "home.philosophy" && block.page === "HOME" && block.section === "PHILOSOPHY") {
    const parsed = philosophyContentSchema.safeParse(block.content);

    if (parsed.success) {
      return document(block, {
        title: "Freeman's engineering philosophy",
        category: "Profile",
        url: "/",
        keywords: ["Engineering philosophy", "Freeman"],
        paragraphs: [
          `Engineering philosophy: Freeman's perspective is ${parsed.data.philosophyQuestion}`,
        ],
      });
    }
  }

  if (
    block.key === "home.current-direction" &&
    block.page === "HOME" &&
    block.section === "CURRENT_DIRECTION"
  ) {
    const parsed = currentDirectionContentSchema.safeParse(block.content);

    if (parsed.success) {
      return document(block, {
        title: "Freeman's current direction",
        category: "Profile",
        url: "/",
        keywords: ["Current direction", "Freeman"],
        paragraphs: [
          `Current direction: Freeman is ${parsed.data.currentDirection}`,
          parsed.data.currentDirectionSupport,
        ],
      });
    }
  }

  if (block.key === "about.header" && block.page === "ABOUT" && block.section === "ABOUT_HEADER") {
    const parsed = aboutHeaderContentSchema.safeParse(block.content);

    if (parsed.success) {
      return document(block, {
        title: "About Freeman",
        category: "Profile",
        url: "/about",
        keywords: ["About", "Freeman", "Profile"],
        paragraphs: [`Profile: Freeman ${parsed.data.aboutHeadline}`],
      });
    }
  }

  if (block.key === "about.education" && block.page === "ABOUT" && block.section === "EDUCATION") {
    const parsed = educationContentSchema.safeParse(block.content);

    if (parsed.success) {
      return document(block, {
        title: "Freeman's education and research",
        category: "Education",
        url: "/about",
        keywords: ["Education", "Freeman", "Research"],
        paragraphs: [
          `Education: Freeman's current education is ${parsed.data.current}`,
          `Previous education: ${parsed.data.previous}`,
          `Research: ${parsed.data.research}`,
          parsed.data.support,
        ],
      });
    }
  }

  if (
    block.page === "ABOUT" &&
    block.section === "ABOUT_INTRO" &&
    block.key.startsWith("about.intro.")
  ) {
    const parsed = textBlockContentSchema.safeParse(block.content);

    if (parsed.success) {
      return document(block, {
        title: textBlockTitle("Freeman's background", block.key, parsed.data.body),
        category: "Profile",
        url: "/about",
        keywords: ["About", "Freeman", "Profile", textBlockSubject(parsed.data.body)],
        paragraphs: [`Profile: Freeman's background includes ${parsed.data.body}`],
      });
    }
  }

  if (
    block.page === "ABOUT" &&
    block.section === "WORK_PROCESS" &&
    block.key.startsWith("about.work-process.")
  ) {
    const parsed = textBlockContentSchema.safeParse(block.content);

    if (parsed.success) {
      return document(block, {
        title: textBlockTitle("Freeman's work process", block.key, parsed.data.body),
        category: "Work process",
        url: "/about",
        keywords: [
          "Engineering process",
          "Freeman",
          "Work process",
          textBlockSubject(parsed.data.body),
        ],
        paragraphs: [`Work process: Freeman ${parsed.data.body}`],
      });
    }
  }

  if (
    block.page === "ABOUT" &&
    block.section === "OUTSIDE_ENGINEERING" &&
    block.key.startsWith("about.outside-engineering.")
  ) {
    const parsed = outsideEngineeringContentSchema.safeParse(block.content);

    if (parsed.success) {
      return document(block, {
        title: `Freeman outside engineering: ${parsed.data.title}`,
        category: "Outside engineering",
        url: "/about",
        keywords: ["Freeman", "Outside engineering", parsed.data.title],
        paragraphs: [
          `Outside engineering: Freeman's ${parsed.data.title} is ${parsed.data.description}`,
        ],
      });
    }
  }

  throw new Error(`Unsupported or invalid content block: ${block.key}`);
}
