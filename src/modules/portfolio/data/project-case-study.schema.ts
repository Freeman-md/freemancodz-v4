import { experienceStopSchema, projectKindSchema } from "@/contracts/public-portfolio.contract";
import { z } from "zod";
import { technologyLabels } from "./technology-labels";

export const serviceLabels = {
  "product-development": "Product development",
  "automation-ai": "Automation + AI",
} as const;

const text = z.string().trim().min(1);

const https = z.url({ protocol: /^https$/ }).refine((value) => {
  const url = new URL(value);

  return !url.username && !url.password;
}, "Use a public HTTPS URL without credentials.");

const imagePath = z
  .string()
  .regex(/^\/images\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:avif|gif|jpe?g|png|svg|webp)$/i);

const videoPath = z.string().regex(/^\/videos\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:mp4|webm)$/i);

const artwork = z
  .object({
    source: imagePath,
    altText: text,
    provenance: text,
    reference: https,
  })
  .strict();

const media = z
  .object({
    poster: artwork,
    caption: text,
    video: z.union([videoPath, https]).optional(),
  })
  .strict();

const projectCaseStudy = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: text,
    summary: text,
    kind: projectKindSchema,
    category: text,
    company: text.optional(),
    cover: artwork,
    cardCover: artwork.optional(),
    services: z.array(z.enum(["product-development", "automation-ai"])).nonempty(),
    capabilities: z.array(text).nonempty(),
    technologies: z
      .array(
        z.enum(
          Object.keys(technologyLabels) as [
            keyof typeof technologyLabels,
            ...(keyof typeof technologyLabels)[],
          ],
        ),
      )
      .nonempty(),
    problem: text,
    contribution: z.object({ role: text, description: text }).strict(),
    outcome: z.object({ summary: text }).strict(),
    links: z.array(
      z.object({ kind: z.enum(["live-site", "repository"]), label: text, url: https }).strict(),
    ),
    suggestedQuestions: z.array(text).nonempty(),
    featured: z
      .object({ problem: text, outcome: text, questions: z.array(text).nonempty() })
      .strict()
      .optional(),
    catalogueTags: z.array(text).nonempty(),
    evidence: z.array(https).nonempty(),
    comparison: z.object({ title: text, before: media, after: media }).strict().optional(),
    walkthrough: media.optional(),
    serviceOffer: z.object({ title: text, description: text }).strict().optional(),
  })
  .strict()
  .refine((project) => !(project.comparison && project.walkthrough), {
    message: "Choose a comparison or a walkthrough.",
  });

export const projectCatalogueSchema = z
  .array(projectCaseStudy)
  .nonempty()
  .refine(
    (projects) => new Set(projects.map(({ slug }) => slug)).size === projects.length,
    "Project slugs must be unique.",
  );

export const experienceStopsSchema = z.array(experienceStopSchema).nonempty();
export type ProjectCaseStudy = z.infer<typeof projectCaseStudy>;
export type ProjectMedia = z.infer<typeof media>;
