import { z } from "zod";

export const philosophyContentSchema = z.object({
  philosophyQuestion: z.string(),
});

export type PhilosophyContent = z.infer<typeof philosophyContentSchema>;
