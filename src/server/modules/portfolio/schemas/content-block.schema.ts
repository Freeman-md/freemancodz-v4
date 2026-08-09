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
const auditActionContentSchema = z.object({
  label: z.literal("Start My Free Audit"),
  prompt: z.string().trim().min(1).max(500),
});

const auditItemSchema = z.object({ key: z.string().min(1), title: z.string().min(1), copy: z.string().min(1) });

export const auditHeroContentSchema = z.object({
  eyebrow: z.string().min(1), headline: z.string().min(1), copy: z.string().min(1), audience: z.string().min(1),
  deliverables: z.array(z.string().min(1)).length(3), reassurance: z.string().min(1), action: auditActionContentSchema,
  example: z.object({ label: z.literal("Example audit preview"), steps: z.array(z.object({ label: z.string().min(1), emphasis: z.boolean() })).length(4), frictionLabel: z.literal("Main friction"), frictionCopy: z.string().min(1), recommendationLabel: z.literal("Recommended improvement"), recommendationCopy: z.string().min(1) }),
});
export const auditProblemSignalsContentSchema = z.object({ eyebrow: z.string().min(1), headline: z.string().min(1), copy: z.string().min(1), items: z.array(auditItemSchema).length(4), closing: z.string().min(1) });
export const auditDeliverableContentSchema = z.object({ eyebrow: z.string().min(1), headline: z.string().min(1), copy: z.string().min(1), previewLabel: z.literal("Your audit"), items: z.array(auditItemSchema).length(4), boundary: z.string().min(1), process: z.array(z.object({ title: z.string().min(1), copy: z.string().min(1) })).length(3), reassurance: z.string().min(1), action: auditActionContentSchema });
export const auditProofContentSchema = z.object({ eyebrow: z.string().min(1), headline: z.string().min(1), copy: z.string().min(1), items: z.array(z.object({ projectKey: z.string().min(1), label: z.string().min(1) })).length(3) });
export const auditFinalCtaContentSchema = z.object({ headline: z.string().min(1), copy: z.string().min(1), microcopy: z.string().min(1), action: auditActionContentSchema });
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
export type AuditHeroContent = z.infer<typeof auditHeroContentSchema>;
export type AuditProblemSignalsContent = z.infer<typeof auditProblemSignalsContentSchema>;
export type AuditDeliverableContent = z.infer<typeof auditDeliverableContentSchema>;
export type AuditProofContent = z.infer<typeof auditProofContentSchema>;
export type AuditFinalCtaContent = z.infer<typeof auditFinalCtaContentSchema>;
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
