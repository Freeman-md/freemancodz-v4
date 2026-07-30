import { z } from "zod";

export const indexSourceInputSchema = z.object({
  sourceType: z.enum(["content_blocks", "projects", "services", "principles", "experiences"]),
  sourceId: z.string().trim().min(1, "Source ID is required."),
});

export type IndexSourceInput = z.infer<typeof indexSourceInputSchema>;
