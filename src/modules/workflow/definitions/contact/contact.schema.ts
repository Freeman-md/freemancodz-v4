import { z } from "zod";

export const CONTACT_TEXT_MAX_LENGTH = 320;

export const CONTACT_MESSAGE_MAX_LENGTH = 4000;

const shortText = z.string().trim().min(1).max(CONTACT_TEXT_MAX_LENGTH);

const messageText = z.string().trim().min(1).max(CONTACT_MESSAGE_MAX_LENGTH);

export const contactStateSchema = z
  .object({
    name: shortText.nullable(),
    email: z.string().trim().email().max(CONTACT_TEXT_MAX_LENGTH).nullable(),
    message: messageText.nullable(),
    businessName: shortText.nullable(),
    preparedInteractionId: z.string().uuid().nullable(),
    confirmedRevision: z.number().int().nonnegative().nullable().optional(),
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
            value: z.string().max(CONTACT_MESSAGE_MAX_LENGTH).nullable(),
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
