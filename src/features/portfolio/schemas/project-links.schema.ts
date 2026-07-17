import type { Project } from "@/types/content";

export function parseProjectLinks(value: unknown, projectTitle: string): Project["links"] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid links stored for project: ${projectTitle}`);
  }

  return value.map((link) => {
    if (!link || typeof link !== "object" || Array.isArray(link)) {
      throw new Error(`Invalid links stored for project: ${projectTitle}`);
    }

    const { label, href } = link as Record<string, unknown>;
    if (typeof label !== "string" || typeof href !== "string") {
      throw new Error(`Invalid links stored for project: ${projectTitle}`);
    }

    return { label, href };
  });
}
