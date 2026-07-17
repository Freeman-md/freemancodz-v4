import { z } from "zod";

export const educationContentSchema = z.object({
  current: z.string(),
  previous: z.string(),
  research: z.string(),
  support: z.string(),
});

export type EducationContent = z.infer<typeof educationContentSchema>;
