import type { FindMeetingSlotsInput } from "../schemas/tools/find-meeting-slots.schema";
import type { IMeetingWorkflowService } from "../interfaces/meeting-workflow.service.interface";
import type { MeetingWorkflowState } from "../workflow/meeting-workflow.state";
import type { IMeetingService } from "@/server/modules/meeting/public";
import { MEETING_CONFIG } from "@/server/modules/meeting/meeting.config";

export async function findMeetingSlots(
  input: FindMeetingSlotsInput,
  dependencies: {
    meetingService: IMeetingService;
    workflow: IMeetingWorkflowService;
    state: MeetingWorkflowState;
  },
) {
  if (dependencies.state.pendingBooking) {
    return { output: { error: "booking_recovery_required", message: "Your calendar event is awaiting confirmation in our records. Please retry booking shortly." }, state: dependencies.state };
  }

  const start = new Date(`${input.startDate}T00:00:00Z`);

  const end = new Date(`${input.endDate}T00:00:00Z`);

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: MEETING_CONFIG.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((parts, part) => {
      parts[part.type] = part.value;

      return parts;
    }, {});

  const todayInAvailabilityTimezone = `${today.year}-${today.month}-${today.day}`;

  if (
    start > end ||
    end.getTime() - start.getTime() > MEETING_CONFIG.maximumRangeDays * 86_400_000 ||
    input.endDate < todayInAvailabilityTimezone
  ) {
    return {
      output: {
        error: "invalid_date_range",
        message: "Choose a future date range of up to 14 days.",
      },
      state: dependencies.state,
    };
  }

  const slots = await dependencies.meetingService.findAvailableSlots({
    startDate: input.startDate,
    endDate: input.endDate,
  });

  const state = dependencies.workflow.recordAvailability(
    dependencies.state,
    slots,
    new Date().toISOString(),
  );

  return { output: { kind: "meeting_slots", timezone: input.timezone, slots }, state };
}
