import { z } from "zod";

export const searchWebsiteSchema = z
  .object({
    query: z.string().trim().min(1).max(500),
  })
  .strict();

export type SearchWebsiteInput = z.infer<typeof searchWebsiteSchema>;
