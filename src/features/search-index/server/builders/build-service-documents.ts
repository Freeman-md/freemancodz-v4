import type { Service } from "@/generated/prisma/client";
import type { SearchDocument } from "@/features/search-index/types";

export function buildServiceDocuments(service: Service): SearchDocument[] {
  const content = [
    `Overview: ${service.lead}`,
    `Description: ${service.description}`,
    service.assistantPrompt
      ? `Example request: ${service.assistantPrompt}`
      : null,
  ]
    .filter((section): section is string => section !== null)
    .join("\n\n");

  return [
    {
      sourceType: "services",
      sourceId: service.id,
      documentIndex: 0,
      title: service.title,
      category: "Service",
      url: "/",
      content,
      keywords: [service.title, "Service"].sort(),
    },
  ];
}