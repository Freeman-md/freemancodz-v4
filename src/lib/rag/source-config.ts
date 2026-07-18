import type { IndexableSourceType } from "./types";

export const indexableSourceTypes = [
  "content_blocks", "projects", "services", "principles", "experiences",
] as const satisfies readonly IndexableSourceType[];

export function isIndexableSourceType(value: string): value is IndexableSourceType {
  return (indexableSourceTypes as readonly string[]).includes(value);
}

export const retrievalDecisions = {
  projects: { url: "/work", documentsPerRow: 1 },
  services: { url: "/", category: "Service", documentsPerRow: 1 },
  principles: { documentsPerRow: 1 },
  experiences: { url: "/about", documentsPerRow: 1 },
  content_blocks: { documentsPerRow: 1, allowUnknown: false },
} as const;
