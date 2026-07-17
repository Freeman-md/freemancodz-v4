import { z } from "zod";

export const currentDirectionContentSchema = z.object({
  currentDirection: z.string(),
  currentDirectionSupport: z.string(),
});

export type CurrentDirectionContent = z.infer<typeof currentDirectionContentSchema>;
