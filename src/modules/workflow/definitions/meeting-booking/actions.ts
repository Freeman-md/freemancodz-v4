import "server-only";

import { z } from "zod";
import {
  CalendarEventError,
  type CalendarClient,
  type CreatedCalendarEvent,
} from "@/infrastructure/google-calendar/types";
import { ResendClientError } from "@/infrastructure/resend/client";
import type { MeetingOwnerNotice } from "@/modules/meeting/owner-notice";
import { assertMatchingCalendarEvent, assertMatchingMeeting } from "@/modules/meeting/service";
import {
  MeetingBookingError,
  type MeetingRecord,
  type MeetingRecordInput,
  type MeetingAvailability,
  type MeetingReservationStore,
} from "@/modules/meeting/types";
import type { WorkflowAction, WorkflowStepInput, WorkflowStepResult } from "../../types";
import { meetingBookingPayloadSchema } from "./schema";

const CALENDAR = "calendar";

const BOOKING = "booking";

const NOTICE = "owner-notice";

const NOTICE_WINDOW_MS = 24 * 60 * 60 * 1000;

const eventSchema = z.strictObject({
  id: z.string(),
  htmlLink: z.string().nullable(),
  payload: z.record(z.string(), z.json()),
});

const noticeSchema = z.strictObject({
  from: z.string().min(1),
  to: z.email(),
  replyTo: z.email(),
  subject: z.string().min(1),
  text: z.string().min(1),
  idempotencyKey: z.string().min(1),
});

const dispatchSchema = z.object({ dispatching: z.boolean() });

export function createMeetingBookingAction(
  availability: Pick<MeetingAvailability, "isSlotAvailable">,
  calendar: CalendarClient,
  store: MeetingReservationStore,
  notices: Pick<MeetingOwnerNotice, "prepareMeetingNotice" | "sendMeetingNotice">,
): WorkflowAction {
  function resultForEvent(context: WorkflowStepInput, event: CreatedCalendarEvent) {
    const { booking, eventId } = meeting(context);

    assertMatchingCalendarEvent(event, booking, eventId);

    return {
      kind: "success",
      outcome: { id: event.id, htmlLink: event.htmlLink, payload: event.payload },
    } as const;
  }

  async function sendNotice(
    context: WorkflowStepInput,
    reconcile: boolean,
  ): Promise<WorkflowStepResult> {
    const { eventId } = meeting(context);

    if (context.now.getTime() - context.firstEffect.getTime() >= NOTICE_WINDOW_MS) {
      return { kind: "terminal", reason: "notice_window_expired" };
    }

    const saved = noticeSchema.safeParse(context.checkpoint);

    let notice;

    if (saved.success) {
      notice = saved.data;
    } else if (context.checkpoint !== null) {
      return { kind: "terminal", reason: "notice_payload_unavailable" };
    } else if (reconcile) {
      return { kind: "retry", reason: "notice_not_dispatched" };
    } else {
      const booked = await store.findMeetingByGoogleEventId(eventId);

      if (!booked || booked.status !== "confirmed") {
        return { kind: "terminal", reason: "booking_missing" };
      }

      try {
        notice = notices.prepareMeetingNotice(booked);
      } catch {
        return { kind: "terminal", reason: "notice_configuration" };
      }

      if (!(await context.saveCheckpoint(notice))) {
        return { kind: "uncertain", reason: "claim_lost" };
      }
    }

    context.signal.throwIfAborted();
    try {
      const receipt = await notices.sendMeetingNotice(notice, context.signal);

      return { kind: "success", outcome: { receipt } };
    } catch (error) {
      const kind = error instanceof ResendClientError ? error.outcome : "uncertain";

      return { kind, reason: "owner_notice_unavailable" };
    }
  }

  return {
    payloadSchema: meetingBookingPayloadSchema,
    getStatus: (successful) => (successful.has(BOOKING) ? "Booking confirmed" : undefined),
    steps: [
      {
        key: CALENDAR,
        label: "Create Calendar event",
        async execute(context) {
          const { booking, eventId, record } = meeting(context);

          const reservation = await store.reserve(record);

          if (!reservation) {
            return { kind: "terminal", reason: "slot_reserved" };
          }

          assertMatchingMeeting({ ...reservation, status: "confirmed" }, booking, eventId);

          let available;

          try {
            available = await availability.isSlotAvailable(booking.slot, context.signal);
          } catch {
            return { kind: "retry", reason: "availability_unavailable" };
          }

          if (!available) {
            return (await context.saveCheckpoint({ dispatching: false }, (tx) =>
              store.release(tx, eventId),
            ))
              ? { kind: "terminal", reason: "slot_unavailable" }
              : { kind: "uncertain", reason: "claim_lost" };
          }

          context.signal.throwIfAborted();
          if (!(await context.saveCheckpoint({ dispatching: true }))) {
            return { kind: "uncertain", reason: "claim_lost" };
          }

          try {
            const event = await calendar.createEvent(
              {
                eventId,
                bookingOperationId: booking.bookingOperationId,
                summary: `Meeting with ${booking.name}`,
                description: booking.reason,
                attendeeEmail: booking.email,
                start: record.startsAt,
                end: record.endsAt,
                timezone: record.timezone,
              },
              context.signal,
            );

            return resultForEvent(context, event);
          } catch (error) {
            if (error instanceof MeetingBookingError) {
              return { kind: "terminal", reason: "calendar_mismatch" };
            }

            if (
              error instanceof CalendarEventError &&
              error.outcome !== "uncertain" &&
              (await context.saveCheckpoint(
                { dispatching: false },
                error.outcome === "terminal" ? (tx) => store.release(tx, eventId) : undefined,
              ))
            ) {
              return { kind: error.outcome, reason: "calendar_insert_rejected" };
            }

            return { kind: "uncertain", reason: "calendar_insert_unconfirmed" };
          }
        },
        async reconcile(context) {
          const { eventId } = meeting(context);

          const event = await calendar.findEvent(eventId, context.signal);

          if (!event) {
            const dispatch = dispatchSchema.safeParse(context.checkpoint);

            return context.checkpoint === null || (dispatch.success && !dispatch.data.dispatching)
              ? { kind: "safe" }
              : { kind: "uncertain", reason: "calendar_event_not_visible" };
          }

          try {
            return resultForEvent(context, event);
          } catch (error) {
            if (!(error instanceof MeetingBookingError)) {throw error;}

            return { kind: "terminal", reason: "calendar_mismatch" };
          }
        },
      },
      {
        key: BOOKING,
        label: "Save booking",
        async execute(context) {
          const { booking, eventId, record } = meeting(context);

          const event = eventSchema.parse(context.previous.get(CALENDAR));

          const existing = await store.findMeetingByGoogleEventId(eventId);

          const saved =
            existing?.status === "confirmed"
              ? existing
              : await store.confirm({
                  ...record,
                  status: "confirmed",
                  googleEventUrl: event.htmlLink,
                  rawProviderPayload: event.payload,
                });

          return bookingOutcome(saved, booking, eventId);
        },
        async reconcile(context) {
          const { booking, eventId } = meeting(context);

          const saved = await store.findMeetingByGoogleEventId(eventId);

          if (saved?.status === "pending") {
            assertMatchingMeeting({ ...saved, status: "confirmed" }, booking, eventId);

            return { kind: "safe" };
          }

          return bookingOutcome(saved, booking, eventId);
        },
      },
      {
        key: NOTICE,
        label: "Notify owner",
        execute: (context) => sendNotice(context, false),
        async reconcile(context) {
          const result = await sendNotice(context, true);

          return result.kind === "retry"
            ? context.checkpoint === null
              ? { kind: "safe" }
              : { kind: "uncertain", reason: result.reason }
            : result;
        },
      },
    ],
  };
}

function meeting(context: WorkflowStepInput) {
  const payload = meetingBookingPayloadSchema.parse(context.payload);

  const booking = { ...payload, bookingOperationId: context.runId };

  const eventId = `b${context.runId.replaceAll("-", "").toLowerCase()}`;

  const record: MeetingRecordInput = {
    googleEventId: eventId,
    name: payload.name,
    email: payload.email,
    timezone: payload.slot.timezone,
    reason: payload.reason,
    startsAt: new Date(payload.slot.start),
    endsAt: new Date(payload.slot.end),
    status: "pending",
    googleEventUrl: null,
    rawProviderPayload: {},
  };

  return { booking, eventId, record };
}

function bookingOutcome(
  record: MeetingRecord | null,
  booking: ReturnType<typeof meeting>["booking"],
  eventId: string,
) {
  if (!record) {
    return { kind: "terminal", reason: "booking_reservation_missing" } as const;
  }

  try {
    assertMatchingMeeting(record, booking, eventId);

    return { kind: "success", outcome: { meetingId: record.id } } as const;
  } catch (error) {
    if (!(error instanceof MeetingBookingError)) {throw error;}

    return { kind: "terminal", reason: "booking_mismatch" } as const;
  }
}
