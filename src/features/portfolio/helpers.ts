import type { ZodType } from "zod";
import { ProjectLinks, projectLinksSchema } from "./schemas/project-links.schema";

export function parseContentBlock<T>(schema: ZodType<T>, value: unknown, key: string): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new Error(`Invalid content stored for block: ${key}`, { cause: result.error });
  }

  return result.data;
}

export function parseProjectLinks(value: unknown, projectTitle: string): ProjectLinks {
  const result = projectLinksSchema.safeParse(value);

  if (!result.success) {
    throw new Error(`Invalid links stored for project: ${projectTitle}`, { cause: result.error });
  }

  return result.data;
}
