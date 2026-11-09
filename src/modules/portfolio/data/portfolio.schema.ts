import { z } from "zod";
import { projectKindSchema } from "@/contracts/public-portfolio.contract";
import { technologyLabels } from "./technology-labels";

const text = z.string().trim().min(1);

export const stableKey = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const position = z.number().int().positive().max(2_147_483_647);

const strings = z.array(text);

const https = z.url({ protocol: /^https$/ }).refine((value) => {
  if (!URL.canParse(value)) {
    return false;
  }

  const url = new URL(value);

  return !url.username && !url.password;
}, "Use an HTTPS URL without credentials.");

const imagePath = z
  .string()
  .regex(/^\/images\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:avif|gif|jpe?g|png|svg|webp)$/i);

const videoPath = z.string().regex(/^\/videos\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:mp4|webm)$/i);

export const coverSchema = z.strictObject({
  source: imagePath,
  altText: text,
  provenance: text,
  reference: https,
});
export const linksSchema = z
  .array(
    z.strictObject({
      kind: z.enum(["live-site", "repository"]),
      label: text,
      url: https,
    }),
  )
  .refine((links) => new Set(links.map(({ url }) => url)).size === links.length, "Duplicate link.");
export const featuredSchema = z.strictObject({ problem: text, outcome: text, questions: strings });
export const offerSchema = z.strictObject({ title: text, description: text });

export const profileSchema = z.strictObject({
  key: z.literal("global"),
  name: text,
  headline: text,
  intro: text,
  philosophy: text,
});
export const projectSchema = z.strictObject({
  slug: stableKey,
  title: text,
  summary: text,
  kind: projectKindSchema,
  category: text,
  company: text.optional(),
  cover: coverSchema,
  links: linksSchema,
  featured: featuredSchema.optional(),
  questions: strings.default([]),
  displayOrder: position,
  serviceKeys: z
    .array(stableKey)
    .nonempty()
    .refine((keys) => new Set(keys).size === keys.length, "Duplicate service key."),
});
const clip = z.union([videoPath, https]).nullable().default(null);

export const caseStudySchema = z
  .strictObject({
    projectSlug: stableKey,
    role: text,
    problem: text,
    contribution: text,
    outcome: text,
    capabilities: strings,
    technologyKeys: z.array(
      z.custom<keyof typeof technologyLabels>(
        (key) => typeof key === "string" && Object.hasOwn(technologyLabels, key),
        "Unknown technology key.",
      ),
    ),
    evidenceUrls: z.array(https).default([]),
    beforeUrl: clip,
    afterUrl: clip,
    serviceOffer: offerSchema.optional(),
  })
  .refine(
    ({ beforeUrl, afterUrl }) => Boolean(beforeUrl) === Boolean(afterUrl),
    "Supply both clip URLs or neither.",
  );

export const experienceSchema = z.strictObject({
  key: stableKey,
  name: text,
  period: text,
  role: text,
  label: text,
  details: strings.nonempty(),
  questions: strings.default([]),
  displayOrder: position,
});
export const serviceSchema = z.strictObject({
  key: stableKey,
  title: text,
  description: text,
  requestDraft: text,
  examples: strings,
  questions: strings.default([]),
  displayOrder: position,
});

export const seedPortfolioSchema = z
  .strictObject({
    profile: profileSchema,
    projects: z.array(projectSchema),
    caseStudies: z.array(caseStudySchema),
    experience: z.array(experienceSchema),
    services: z.array(serviceSchema),
  })
  .superRefine((batch, ctx) => {
    const keyed = {
      projects: batch.projects.map(({ slug }) => slug),
      caseStudies: batch.caseStudies.map(({ projectSlug }) => projectSlug),
      experience: batch.experience.map(({ key }) => key),
      services: batch.services.map(({ key }) => key),
    };

    for (const [name, keys] of Object.entries(keyed)) {
      if (new Set(keys).size !== keys.length) {
        ctx.addIssue({ code: "custom", path: [name], message: "Duplicate stable key." });
      }
    }
  });

export type PortfolioSeed = z.infer<typeof seedPortfolioSchema>;
export type PortfolioProfile = z.infer<typeof profileSchema>;
export type PortfolioService = z.infer<typeof serviceSchema>;
export type PortfolioProject = Omit<z.infer<typeof projectSchema>, "serviceKeys">;
export type PortfolioCaseStudy = z.infer<typeof caseStudySchema>;
