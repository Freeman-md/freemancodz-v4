import type { Principle } from "@/generated/prisma/client";
import { document } from "./shared";

export function buildPrincipleDocuments(principle: Principle) {
  return [document({
    sourceType: "principles", sourceId: principle.id, title: principle.title, category: "Principle",
    url: principle.section === "home" ? "/" : "/about", content: `Principle: ${principle.body}`,
    keywords: [principle.title, principle.section],
  })];
}
