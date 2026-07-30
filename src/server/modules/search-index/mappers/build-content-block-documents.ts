import type { ContentBlock } from "@/generated/prisma/client";
import { aboutHeaderContentSchema } from "@/server/modules/portfolio/public";
import { currentDirectionContentSchema } from "@/server/modules/portfolio/public";
import { educationContentSchema } from "@/server/modules/portfolio/public";
import { heroContentSchema } from "@/server/modules/portfolio/public";
import { outsideEngineeringContentSchema } from "@/server/modules/portfolio/public";
import { philosophyContentSchema } from "@/server/modules/portfolio/public";
import { textBlockContentSchema } from "@/server/modules/portfolio/public";
import type { SearchDocument } from "@/server/modules/search-index/models/search-index";

function document(
  block: ContentBlock,
  values: Omit<
    SearchDocument,
    "sourceType" | "sourceId" | "documentIndex"
  >,
): SearchDocument[] {
  return [
    {
      sourceType: "content_blocks",
      sourceId: block.id,
      documentIndex: 0,
      ...values,
    },
  ];
}

export function buildContentBlockDocuments(
  block: ContentBlock,
): SearchDocument[] {
  if (
    block.key === "home.hero" &&
    block.page === "HOME" &&
    block.section === "HERO"
  ) {
    const parsed = heroContentSchema.safeParse(block.content);

    if (!parsed.success) {
      return [];
    }

    return document(block, {
      title: parsed.data.name,
      category: "Profile",
      url: "/",
      content: [
        `Name: ${parsed.data.name}`,
        `Headline: ${parsed.data.headline}`,
        `Introduction: ${parsed.data.intro}`,
        `Note: ${parsed.data.heroNote}`,
      ].join("\n\n"),
      keywords: ["Profile", parsed.data.name].sort(),
    });
  }

  if (
    block.key === "home.philosophy" &&
    block.page === "HOME" &&
    block.section === "PHILOSOPHY"
  ) {
    const parsed = philosophyContentSchema.safeParse(block.content);

    if (!parsed.success) {
      return [];
    }

    return document(block, {
      title: "Engineering philosophy",
      category: "Profile",
      url: "/",
      content: parsed.data.philosophyQuestion,
      keywords: ["Engineering philosophy", "Profile"].sort(),
    });
  }

  if (
    block.key === "home.current-direction" &&
    block.page === "HOME" &&
    block.section === "CURRENT_DIRECTION"
  ) {
    const parsed = currentDirectionContentSchema.safeParse(block.content);

    if (!parsed.success) {
      return [];
    }

    return document(block, {
      title: "Current direction",
      category: "Profile",
      url: "/",
      content: [
        parsed.data.currentDirection,
        parsed.data.currentDirectionSupport,
      ].join("\n\n"),
      keywords: ["Current direction", "Profile"].sort(),
    });
  }

  if (
    block.key === "about.header" &&
    block.page === "ABOUT" &&
    block.section === "ABOUT_HEADER"
  ) {
    const parsed = aboutHeaderContentSchema.safeParse(block.content);

    if (!parsed.success) {
      return [];
    }

    return document(block, {
      title: "About Freeman",
      category: "Profile",
      url: "/about",
      content: parsed.data.aboutHeadline,
      keywords: ["About", "Freeman", "Profile"].sort(),
    });
  }

  if (
    block.key === "about.education" &&
    block.page === "ABOUT" &&
    block.section === "EDUCATION"
  ) {
    const parsed = educationContentSchema.safeParse(block.content);

    if (!parsed.success) {
      return [];
    }

    return document(block, {
      title: "Education",
      category: "Education",
      url: "/about",
      content: [
        `Current education: ${parsed.data.current}`,
        `Previous education: ${parsed.data.previous}`,
        `Research: ${parsed.data.research}`,
        `Additional context: ${parsed.data.support}`,
      ].join("\n\n"),
      keywords: ["Education", "Research"].sort(),
    });
  }

  if (
    block.page === "ABOUT" &&
    block.section === "ABOUT_INTRO" &&
    block.key.startsWith("about.intro.")
  ) {
    const parsed = textBlockContentSchema.safeParse(block.content);

    if (!parsed.success) {
      return [];
    }

    return document(block, {
      title: "About Freeman",
      category: "Profile",
      url: "/about",
      content: parsed.data.body,
      keywords: ["About", "Freeman", "Profile"].sort(),
    });
  }

  if (
    block.page === "ABOUT" &&
    block.section === "WORK_PROCESS" &&
    block.key.startsWith("about.work-process.")
  ) {
    const parsed = textBlockContentSchema.safeParse(block.content);

    if (!parsed.success) {
      return [];
    }

    return document(block, {
      title: "How I work",
      category: "Work Process",
      url: "/about",
      content: parsed.data.body,
      keywords: ["Engineering process", "Work Process"].sort(),
    });
  }

  if (
    block.page === "ABOUT" &&
    block.section === "OUTSIDE_ENGINEERING" &&
    block.key.startsWith("about.outside-engineering.")
  ) {
    const parsed = outsideEngineeringContentSchema.safeParse(block.content);

    if (!parsed.success) {
      return [];
    }

    return document(block, {
      title: parsed.data.title,
      category: "Outside Engineering",
      url: "/about",
      content: parsed.data.description,
      keywords: ["Outside Engineering", parsed.data.title].sort(),
    });
  }

  return [];
}