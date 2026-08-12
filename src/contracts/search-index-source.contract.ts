import { z } from "zod";

export const SearchIndexSourceInputSchema = z.object({
  sourceType: z.enum(["content_blocks", "projects", "services", "principles", "experiences"]),
  sourceId: z.string().trim().min(1, "Source ID is required."),
});

export type SearchIndexSourceInput = z.infer<typeof SearchIndexSourceInputSchema>;
export type SearchIndexSourceType = SearchIndexSourceInput["sourceType"];
