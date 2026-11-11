import { z } from "zod";

export const assistantChoiceSchema = z
  .object({
    question: z.string().trim().min(1).max(500),
    options: z.array(z.string().trim().min(1).max(240)).min(2).max(6),
  })
  .strict()
  .refine(
    ({ options }) => new Set(options.map((option) => option.toLowerCase())).size === options.length,
    { message: "Options must be unique.", path: ["options"] },
  );

export type AssistantChoice = z.infer<typeof assistantChoiceSchema>;
