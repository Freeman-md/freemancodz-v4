import { z, type ZodType } from "zod";

export const aboutHeaderContentSchema = z.object({ aboutHeadline: z.string() });
export const currentDirectionContentSchema = z.object({
  currentDirection: z.string(),
  currentDirectionSupport: z.string(),
});
export const educationContentSchema = z.object({
  current: z.string(),
  previous: z.string(),
  research: z.string(),
  support: z.string(),
});
export const heroContentSchema = z.object({
  name: z.string(),
  headline: z.string(),
  intro: z.string(),
  heroNote: z.string(),
  primaryLabel: z.string(),
  primaryHref: z.string(),
  secondaryLabel: z.string(),
  secondaryHref: z.string(),
});
export const homeServicesIntroContentSchema = z.object({ title: z.string(), copy: z.string() });
const homeProofActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("external"), label: z.string(), href: z.url() }),
  z.object({ type: z.literal("assistant"), label: z.string(), prompt: z.string() }),
]);

export const homeProofOfWorkContentSchema = z.object({
  title: z.string(),
  copy: z.string(),
  items: z.array(z.object({ projectKey: z.string(), action: homeProofActionSchema.nullable() })),
});
export const homeAuditOfferContentSchema = z.object({
  label: z.string(),
  title: z.string(),
  copy: z.string(),
  actionLabel: z.string(),
  actionHref: z.string(),
  checklist: z.array(z.string()).min(1),
});
export const homeFinalCtaContentSchema = z.object({
  title: z.string(),
  primaryLabel: z.string(),
  primaryHref: z.string(),
  secondaryLabel: z.string(),
  secondaryHref: z.string(),
});
export const outsideEngineeringContentSchema = z.object({
  title: z.string(),
  description: z.string(),
});
export const philosophyContentSchema = z.object({ philosophyQuestion: z.string() });
export const textBlockContentSchema = z.object({ body: z.string() });
export const projectLinkSchema = z.object({ label: z.string(), href: z.url() });
export const projectLinksSchema = z.array(projectLinkSchema);

export type AboutHeaderContent = z.infer<typeof aboutHeaderContentSchema>;
export type CurrentDirectionContent = z.infer<typeof currentDirectionContentSchema>;
export type EducationContent = z.infer<typeof educationContentSchema>;
export type HeroContent = z.infer<typeof heroContentSchema>;
export type HomeServicesIntroContent = z.infer<typeof homeServicesIntroContentSchema>;
export type HomeProofOfWorkContent = z.infer<typeof homeProofOfWorkContentSchema>;
export type HomeAuditOfferContent = z.infer<typeof homeAuditOfferContentSchema>;
export type HomeFinalCtaContent = z.infer<typeof homeFinalCtaContentSchema>;
export type OutsideEngineeringContent = z.infer<typeof outsideEngineeringContentSchema>;
export type PhilosophyContent = z.infer<typeof philosophyContentSchema>;
export type TextBlockContent = z.infer<typeof textBlockContentSchema>;
export type ProjectLink = z.infer<typeof projectLinkSchema>;
export type ProjectLinks = z.infer<typeof projectLinksSchema>;

export function parseStoredContent<T>(schema: ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new Error(`Invalid content stored for block: ${label}`, { cause: result.error });
  }

  return result.data;
}

export function parseStoredProjectLinks(value: unknown, projectTitle: string): ProjectLinks {
  const result = projectLinksSchema.safeParse(value);

  if (!result.success) {
    throw new Error(`Invalid links stored for project: ${projectTitle}`, { cause: result.error });
  }

  return result.data;
}
