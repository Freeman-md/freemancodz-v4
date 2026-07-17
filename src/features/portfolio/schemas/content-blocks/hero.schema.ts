import { z } from "zod";

export const heroContentSchema = z.object({
  name: z.string(),
  headline: z.string(),
  intro: z.string(),
  heroNote: z.string(),
});

export type HeroContent = z.infer<typeof heroContentSchema>;
