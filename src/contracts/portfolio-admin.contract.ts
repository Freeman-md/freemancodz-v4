import { z } from "zod";
import {
  portfolioIconNameSchema,
  projectVisualNameSchema,
} from "./portfolio-presentation.contract";

export const MAX_PORTFOLIO_MEDIA_BYTES = 8 * 1024 * 1024;
export const MAX_PORTFOLIO_MEDIA_REQUEST_BYTES = MAX_PORTFOLIO_MEDIA_BYTES + 64 * 1024;

const requiredText = (label: string, maximum = 4_000) =>
  z.string().trim().min(1, `${label} is required.`).max(maximum, `${label} is too long.`);

const nullableText = (maximum = 20_000) => z.string().trim().max(maximum).nullable();

const orderSchema = z.number().int().min(0).max(10_000);

const idSchema = z.string().uuid();

export const portfolioPageSchema = z.enum(["home", "work", "about", "audit"]);
export const profileCollectionSchema = z.enum([
  "AUDIENCE",
  "PRINCIPLES",
  "THINKING_PRINCIPLES",
  "PROCESS_PRINCIPLES",
  "CONTROL_PRINCIPLES",
  "OUTCOMES",
]);
export const actionVariantSchema = z.enum(["PRIMARY", "SECONDARY", "GHOST", "LINK"]);
export const mediaTypeSchema = z.enum(["IMAGE", "VIDEO"]);

export const updateProfileSchema = z.object({
  name: requiredText("Name", 120),
  title: requiredText("Title", 200),
  positioning: requiredText("Positioning", 2_000),
  email: z.string().trim().email().max(320),
  linkedInUrl: z.string().url().max(2_000),
  githubUrl: z.string().url().max(2_000),
});

export const updateContentBlockSchema = z.object({
  id: idSchema,
  eyebrow: nullableText(200),
  title: nullableText(500),
  copy: nullableText(),
  order: orderSchema.nullable(),
});

export const orderedRelationSchema = z.object({ id: idSchema, order: orderSchema });
export const orderedRelationsSchema = z
  .array(orderedRelationSchema)
  .max(100)
  .superRefine((items, context) => {
    if (new Set(items.map(({ id }) => id)).size !== items.length) {
      context.addIssue({ code: "custom", message: "Items must be unique." });
    }

    if (new Set(items.map(({ order }) => order)).size !== items.length) {
      context.addIssue({ code: "custom", message: "Ordering positions must be unique." });
    }
  });

export const updateProfileCollectionSchema = z.object({
  collection: profileCollectionSchema,
  items: orderedRelationsSchema,
});

const reusableIconFields = {
  iconName: portfolioIconNameSchema.nullable(),
  label: requiredText("Label", 240),
  copy: nullableText(4_000),
  // The approved content sources define no named colour tokens yet; preserve the default only.
  colour: z.null(),
};

export const upsertIconBlockSchema = z.object(reusableIconFields);

export const actionDestinationSchema = z
  .string()
  .trim()
  .max(2_000)
  .refine((value) => {
    if (/^\/(?!\/)[^\s\\]*$/.test(value)) {
      return true;
    }

    try {
      const destination = new URL(value);

      return destination.protocol === "https:" || destination.protocol === "http:";
    } catch {
      return false;
    }
  }, "Use a safe site path or HTTP(S) URL.");

export const upsertActionBlockSchema = z
  .object({
    ...reusableIconFields,
    variant: actionVariantSchema,
    url: actionDestinationSchema.nullable(),
    assistantMessage: nullableText(4_000),
  })
  .refine(({ url, assistantMessage }) => Boolean(url || assistantMessage), {
    message: "Provide a destination URL or an assistant message.",
    path: ["url"],
  });

export const upsertMediaBlockSchema = z.object({
  ...reusableIconFields,
  type: mediaTypeSchema,
  source: z.string().url().max(4_000),
  altText: requiredText("Alternative text", 500),
});

export const upsertProjectSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: requiredText("Title", 240),
  category: requiredText("Category", 160),
  problem: requiredText("Problem", 10_000),
  solution: requiredText("Solution", 10_000),
  outcome: nullableText(10_000),
  externalLinks: z.array(z.string().url().max(2_000)).max(20),
  featured: z.boolean(),
  order: orderSchema,
  markdown: nullableText(50_000),
  visualBlock: projectVisualNameSchema.nullable(),
  visualText: nullableText(2_000),
});

const nullableDate = z.union([z.coerce.date(), z.null()]);

export const upsertExperienceSchema = z
  .object({
    title: requiredText("Title", 240),
    tag: nullableText(160),
    copy: requiredText("Copy", 10_000),
    insight: nullableText(10_000),
    role: nullableText(240),
    startDate: nullableDate,
    endDate: nullableDate,
    order: orderSchema,
  })
  .refine(({ startDate, endDate }) => !startDate || !endDate || startDate <= endDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });

export const entityMutationSchema = z.object({ id: idSchema });
export const contentRelationMutationSchema = z.object({
  id: idSchema,
  relation: z.enum(["children", "icons", "media", "actions"]),
  items: orderedRelationsSchema,
});
export const experienceIconsMutationSchema = z.object({
  id: idSchema,
  items: orderedRelationsSchema,
});

export const mediaOwnerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("profile") }),
  z.object({ type: z.literal("media-block"), id: idSchema }),
  z.object({ type: z.literal("project-cover"), id: idSchema }),
]);

export type PortfolioAdminPage = z.infer<typeof portfolioPageSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateContentBlockMutation = z.infer<typeof updateContentBlockSchema>;
export type OrderedRelationInput = z.infer<typeof orderedRelationSchema>;
export type UpdateProfileCollectionInput = z.infer<typeof updateProfileCollectionSchema>;
export type UpsertIconBlockInput = z.infer<typeof upsertIconBlockSchema>;
export type UpsertActionBlockInput = z.infer<typeof upsertActionBlockSchema>;
export type UpsertMediaBlockInput = z.infer<typeof upsertMediaBlockSchema>;
export type UpsertProjectInput = z.infer<typeof upsertProjectSchema>;
export type UpsertExperienceInput = z.infer<typeof upsertExperienceSchema>;
export type MediaOwnerInput = z.infer<typeof mediaOwnerSchema>;
