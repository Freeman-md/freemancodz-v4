import { z } from "zod";

const actionSchema = z.object({
  label: z.literal("Start My Free Audit"),
  prompt: z.string().trim().min(1).max(500),
});

const itemSchema = z.object({ key: z.string(), title: z.string(), copy: z.string() });

export const AuditPageDataSchema = z.object({
  hero: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    copy: z.string(),
    audience: z.string(),
    deliverables: z.array(z.string()).length(3),
    reassurance: z.string(),
    action: actionSchema,
    example: z.object({
      label: z.literal("Example audit preview"),
      steps: z.array(z.object({ label: z.string(), emphasis: z.boolean() })).length(4),
      frictionLabel: z.literal("Main friction"),
      frictionCopy: z.string(),
      recommendationLabel: z.literal("Recommended improvement"),
      recommendationCopy: z.string(),
    }),
  }),
  problemSignals: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    copy: z.string(),
    items: z.array(itemSchema).length(4),
    closing: z.string(),
  }),
  deliverable: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    copy: z.string(),
    previewLabel: z.literal("Your audit"),
    items: z.array(itemSchema).length(4),
    boundary: z.string(),
    process: z.array(z.object({ title: z.string(), copy: z.string() })).length(3),
    reassurance: z.string(),
    action: actionSchema,
  }),
  proof: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    copy: z.string(),
    items: z
      .array(
        z.object({ key: z.string(), title: z.string(), outcome: z.string(), label: z.string() }),
      )
      .length(3),
  }),
  finalCta: z.object({
    headline: z.string(),
    copy: z.string(),
    microcopy: z.string(),
    action: actionSchema,
  }),
});
export type AuditPageData = z.infer<typeof AuditPageDataSchema>;
