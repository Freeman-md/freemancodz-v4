import { z } from "zod";

export const textBlockContentSchema = z.object({
  body: z.string(),
});

export type TextBlockContent = z.infer<typeof textBlockContentSchema>;
