import type { Experience } from "@/generated/prisma/client";
import type { SearchDocument } from "@/server/modules/search-index/models/search-index.model";

export function buildExperienceDocuments(
  experience: Experience,
): SearchDocument[] {
  const content = [
    `Role: ${experience.title}`,
    `Company: ${experience.company}`,
    `Dates: ${experience.dates}`,
    experience.location ? `Location: ${experience.location}` : null,
    `Focus: ${experience.focus}`,
  ]
    .filter((section): section is string => section !== null)
    .join("\n\n");

  return [
    {
      sourceType: "experiences",
      sourceId: experience.id,
      documentIndex: 0,
      title: `${experience.title} at ${experience.company}`,
      category: experience.category,
      url: "/about",
      content,
      keywords: [...new Set([
        experience.category,
        experience.title,
        experience.company,
      ])].sort(),
    },
  ];
}