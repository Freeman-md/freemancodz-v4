import { z } from "zod";

export const projectLinkSchema = z.object({
  label: z.string(),
  href: z.url(),
});

export const projectLinksSchema = z.array(projectLinkSchema);

export type ProjectLink = z.infer<typeof projectLinkSchema>;
export type ProjectLinks = z.infer<typeof projectLinksSchema>;
