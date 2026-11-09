import { z } from "zod";

export const projectKindSchema = z.enum(["real-project", "exploration"]);

export const experienceStopSchema = z
  .object({
    key: z.string().trim().min(1),
    name: z.string().trim().min(1),
    period: z.string().trim().min(1),
    role: z.string().trim().min(1),
    label: z.string().trim().min(1),
    detail: z.union([z.string().trim().min(1), z.array(z.string().trim().min(1)).min(1)]),
    questions: z.array(z.string().trim().min(1)),
  })
  .strict();

export type ProjectKind = z.infer<typeof projectKindSchema>;
export type ExperienceStop = z.infer<typeof experienceStopSchema>;
