import { z } from "zod";

const optionSchema = z
  .object({ value: z.string().min(1).max(100), label: z.string().trim().min(1).max(120) })
  .strict();

export const assistantControlPresentationSchema = z
  .object({
    component: z.enum(["InputField", "TextArea", "OptionSelector"]),
    field: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,79}$/),
    label: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .describe(
        "A short field name, such as Name or Project goal. Put questions and instructions in introduction, not label.",
      ),
    inputType: z.enum(["text", "email"]).nullable(),
    options: z.array(optionSchema).min(1).max(6).nullable(),
  })
  .strict();

export const assistantPresentationSchema = z
  .object({
    introduction: z
      .string()
      .trim()
      .min(1)
      .max(500)
      .describe(
        "Briefly acknowledge the visitor's intent or latest answer and explain the next useful question. This copy is shown if no conversational text was streamed.",
      ),
    heading: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .describe(
        "A short group title, not a repeated question. The introduction contains the conversational question.",
      ),
    operation: z.enum(["conversation", "fields", "workflow_choice"]),
    targetWorkflowId: z
      .string()
      .min(1)
      .max(80)
      .nullable()
      .describe(
        "Only workflow_choice uses a target workflow ID. For fields or conversation this must be null, including after switching workflows; the application already knows the active workflow.",
      ),
    controls: z.array(assistantControlPresentationSchema).min(1).max(6),
  })
  .strict();

export const assistantInteractionSchema = z
  .object({
    id: z.string().uuid(),
    workflowInstanceId: z.string().uuid().nullable(),
    revision: z.number().int().nonnegative(),
    heading: z.string().trim().min(1).max(160),
    controls: z
      .array(
        assistantControlPresentationSchema.extend({
          required: z.boolean(),
          maxLength: z.number().int().positive(),
          value: z.string().max(4000),
        }),
      )
      .min(1)
      .max(6),
  })
  .strict();

export const assistantInteractionContextSchema = assistantInteractionSchema.extend({
  question: z.string().trim().min(1).max(4000),
});

export const assistantInteractionReplySchema = z
  .object({
    interactionId: z.string().uuid(),
    revision: z.number().int().nonnegative(),
    // Conversational controls carry no authority; the server validates this as visitor input.
    interaction: assistantInteractionContextSchema.optional(),
    values: z
      .record(z.string().min(1).max(80), z.string().max(4000))
      .refine(
        (values) => Object.keys(values).length >= 1 && Object.keys(values).length <= 6,
        "Provide between one and six answers.",
      ),
  })
  .strict();

export const assistantInteractionResultSchema = z.discriminatedUnion("status", [
  z
    .object({
      interactionId: z.string().uuid(),
      status: z.literal("accepted"),
      summary: z.string().max(26000),
    })
    .strict(),
  z
    .object({
      interactionId: z.string().uuid(),
      status: z.literal("invalid"),
      fieldErrors: z.record(z.string(), z.string().max(200)),
    })
    .strict(),
  z.object({ interactionId: z.string().uuid(), status: z.literal("stale") }).strict(),
]);

export type AssistantPresentation = z.infer<typeof assistantPresentationSchema>;
export type AssistantInteraction = z.infer<typeof assistantInteractionSchema>;
export type AssistantInteractionReply = z.infer<typeof assistantInteractionReplySchema>;
export type AssistantInteractionResult = z.infer<typeof assistantInteractionResultSchema>;
