import type { Experience } from "@/generated/prisma/client";
import { document, sentences } from "./shared";

export function buildExperienceDocuments(experience: Experience) {
  return [document({
    sourceType: "experiences", sourceId: experience.id, title: experience.title, category: experience.category, url: "/about",
    content: sentences([`Company: ${experience.company}.`, `Dates: ${experience.dates}.`, experience.location ? `Location: ${experience.location}.` : null, `Focus: ${experience.focus}`]),
    keywords: [experience.title, experience.company, experience.category, experience.focus],
  })];
}
