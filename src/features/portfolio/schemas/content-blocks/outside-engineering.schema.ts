import { z } from "zod";

export const outsideEngineeringContentSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export type OutsideEngineeringContent = z.infer<typeof outsideEngineeringContentSchema>;
