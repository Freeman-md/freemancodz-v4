import type { Service } from "@/generated/prisma/client";
import { document, sentences } from "./shared";

export function buildServiceDocuments(service: Service) {
  return [document({
    sourceType: "services", sourceId: service.id, title: service.title, category: "Service", url: "/",
    content: sentences([`Lead: ${service.lead}`, `Description: ${service.description}`, service.assistantPrompt ? `Assistant context: ${service.assistantPrompt}` : null]),
    keywords: [service.title, service.lead],
  })];
}
