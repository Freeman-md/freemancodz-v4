import { z } from "zod";

const shortText = z.string().trim().min(1).max(320);

const messageText = z.string().trim().min(1).max(4_000);

export const contactStateSchema = z
  .object({
    name: shortText.nullable(),
    email: z.string().trim().email().max(320).nullable(),
    message: messageText.nullable(),
    businessName: shortText.nullable(),
    preparedInteractionId: z.string().uuid().nullable(),
  })
  .strict();

export const contactUpdateFieldSchema = z.enum(["name", "email", "message", "businessName"]);

export const updateContactContextSchema = z
  .object({
    updates: z
      .array(
        z
          .object({
            field: contactUpdateFieldSchema,
            value: z.string().max(4_000).nullable(),
          })
          .strict(),
      )
      .min(1)
      .max(4),
  })
  .strict();

export const noContactArgumentsSchema = z.object({}).strict();

export type ContactState = z.infer<typeof contactStateSchema>;
export type ContactUpdateField = z.infer<typeof contactUpdateFieldSchema>;
