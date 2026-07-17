import { z } from "zod";

export const aboutHeaderContentSchema = z.object({
  aboutHeadline: z.string(),
});

export type AboutHeaderContent = z.infer<typeof aboutHeaderContentSchema>;
