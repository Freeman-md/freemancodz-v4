import type { FindMeetingSlotsInput } from "../schemas/tools/find-meeting-slots.schema";
import type { IWorkflowService } from "../interfaces/workflow.service.interface";
import { formatMeetingSlot } from "../mappers/meeting-slot.mapper";
import type { WorkflowState } from "../workflow.state";
import { MEETING_CONFIG, type IMeetingService } from "@/server/modules/meeting/public";

export async function findMeetingSlots(
  input: FindMeetingSlotsInput,
  dependencies: {
    meetingService: IMeetingService;
    workflow: IWorkflowService;
    state: WorkflowState;
  },
) {
  if (dependencies.state.pendingBooking) {
    return {
      output: {
        error: "booking_recovery_required",
        message:
          "Your calendar event is awaiting confirmation in our records. Please retry booking shortly.",
      },
      state: dependencies.state,
    };
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

  return {
    output: {
      kind: "meeting_slots",
      timezone: MEETING_CONFIG.timezone,
      slots: slots.map((slot) => ({ ...slot, label: formatMeetingSlot(slot) })),
    },
    state,
  };
}
