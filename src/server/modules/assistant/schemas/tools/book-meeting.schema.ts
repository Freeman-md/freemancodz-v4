import { z } from "zod";

export const bookMeetingSchema = z.object({}).strict();

export type BookMeetingInput = z.infer<typeof bookMeetingSchema>;
