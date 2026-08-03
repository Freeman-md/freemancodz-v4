import type { PrepareMeetingInput } from "../schemas/tools/prepare-meeting.schema";

export function prepareMeeting(input: PrepareMeetingInput) {
  return {
    kind: "dummy_meeting_preparation",
    meeting: input,
    confirmationRequired: true,
    message: "This is a dummy meeting preparation. Ask the visitor for confirmation before booking.",
  };
}
