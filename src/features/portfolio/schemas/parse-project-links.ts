import { projectLinksSchema, type ProjectLinks } from "./project-links.schema";

export function parseProjectLinks(value: unknown, projectTitle: string): ProjectLinks {
  const result = projectLinksSchema.safeParse(value);

  if (!result.success) {
    throw new Error(`Invalid links stored for project: ${projectTitle}`, { cause: result.error });
  }

  return result.data;
}
