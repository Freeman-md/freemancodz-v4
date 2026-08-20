import { z } from "zod";

const shortText = z.string().trim().min(1).max(320);

const longText = z.string().trim().min(1).max(2_000);

export const auditStateSchema = z
  .object({
    focus: longText.nullable(),
    currentProcess: longText.nullable(),
    friction: longText.nullable(),
    desiredOutcome: longText.nullable(),
    name: shortText.nullable(),
    email: z.string().trim().email().max(320).nullable(),
    businessName: shortText.nullable(),
    websiteUrl: z.string().trim().url().max(2_000).nullable(),
    additionalContext: longText.nullable(),
    preparedInteractionId: z.string().uuid().nullable(),
  })
  .strict();

export const auditUpdateFieldSchema = z.enum([
  "focus",
  "currentProcess",
  "friction",
  "desiredOutcome",
  "name",
  "email",
  "businessName",
  "websiteUrl",
  "additionalContext",
]);

export const updateAuditContextSchema = z
  .object({
    updates: z
      .array(
        z
          .object({
            field: auditUpdateFieldSchema,
            value: z.string().max(2_000).nullable(),
          })
          .strict(),
      )
      .min(1)
      .max(9),
  })
  .strict();

export const noAuditArgumentsSchema = z.object({}).strict();

export type AuditState = z.infer<typeof auditStateSchema>;
export type AuditUpdateField = z.infer<typeof auditUpdateFieldSchema>;
export type UpdateAuditContextInput = z.infer<typeof updateAuditContextSchema>;
