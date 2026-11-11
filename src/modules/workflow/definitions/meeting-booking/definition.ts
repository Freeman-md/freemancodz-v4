import { z } from "zod";
import type { WorkflowDefinition } from "../../types";

const stateSchema = z.strictObject({
  reason: z.string().trim().min(1).nullable(),
});

export const meetingBooking = {
  id: "meeting-booking",
  version: 1,
  description: "Book a meeting with Freeman.",
  stateSchema,
  title: "Meeting booking",
  createInitialState: () => ({ reason: null }),
  projectProgress(savedState: unknown) {
    const { reason } = stateSchema.parse(savedState);

    return {
      nextStep: reason === null ? "What would you like to discuss?" : null,
      details: [{ key: "reason", label: "Topic", value: reason }],
    };
  },
} satisfies WorkflowDefinition<z.infer<typeof stateSchema>>;
