import type { BookMeetingInput } from "../schemas/tools/book-meeting.schema";

export function bookMeeting(input: BookMeetingInput) {
  return {
    kind: "dummy_booking",
    status: "dummy_success",
    meeting: input,
    externalStateCreated: false,
    message: "This is a dummy booking only. No calendar event or database record was created.",
  };
}
