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
  createInitialState: () => ({ reason: null }),
} satisfies WorkflowDefinition<z.infer<typeof stateSchema>>;
