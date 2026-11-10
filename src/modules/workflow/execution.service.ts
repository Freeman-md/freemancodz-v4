import "server-only";
import { z } from "zod";
import type { WorkflowExecution } from "@/generated/prisma/client";
import type { Logger } from "@/infrastructure/logging/logger";
import type { MeetingService } from "@/modules/meeting/service";
import { MeetingBookingError } from "@/modules/meeting/types";
import type { NotificationService } from "@/modules/notification/service";
import { MAX_EXECUTION_ATTEMPTS, type WorkflowExecutionRepository } from "./execution.repository";
import { MEETING_BOOKING_ACTION } from "./definitions/meeting-booking/meeting-booking.definition";
import {
  meetingBookingStateSchema,
  meetingSlotSchema,
} from "./definitions/meeting-booking/meeting-booking.schema";

const bookingInput = z.strictObject({
  name: z.string().min(1).max(160),
  email: z.email().max(320),
  reason: z.string().min(1).max(1000),
  slot: meetingSlotSchema,
  eventId: z.string().regex(/^[a-zA-Z0-9_-]{5,1024}$/),
  lookupOnly: z.boolean(),
  possiblyDispatched: z.boolean(),
});

const bookingCheckpoint = z.object({ releaseState: meetingBookingStateSchema });

const noticeCheckpoint = z.object({
  notice: z.strictObject({
    from: z.string().min(1),
    to: z.email(),
    replyTo: z.email(),
    subject: z.string().min(1),
    text: z.string().min(1),
    idempotencyKey: z.string().min(1),
  }),
});

const NOTICE_RETRY_WINDOW_MS = 24 * 60 * 60 * 1000;

const BACKOFF_MS = [2000, 5000];

export class WorkflowExecutionService {
  constructor(
    private readonly repository: WorkflowExecutionRepository,
    private readonly meeting: Pick<MeetingService, "resolveApprovedCalendar">,
    private readonly notifications: Pick<
      NotificationService,
      "prepareMeetingNotice" | "sendPreparedNotice"
    >,
    private readonly logger: Logger,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async runDue(id?: string) {
    const beganAt = this.clock().getTime();

    let handled = 0;

    await this.repository.expireExhausted(this.clock(), id);
    while (handled < (id ? 2 : 4) && this.clock().getTime() - beganAt < 15_000) {
      const run = await this.repository.claim(this.clock(), id);

      if (!run) {
        break;
      }

      handled += 1;
      this.logger.info("workflow.execution_started", {
        executionId: run.id,
        step: run.step,
        attempt: run.attempt,
      });
      try {
        if (run.step === "calendar") {
          await this.calendar(run);
        } else {
          await this.ownerNotice(run);
        }
      } catch {
        // A database failure leaves the claim recoverable after its lease expires.
        this.logger.error("workflow.execution_interrupted", {
          executionId: run.id,
          step: run.step,
          attempt: run.attempt,
          category: "persistence_unavailable",
        });
      }
    }

    return { handled };
  }

  private async calendar(run: WorkflowExecution) {
    const input = bookingInput.safeParse(run.approvedInput);

    const checkpoint = bookingCheckpoint.safeParse(run.checkpoint);

    if (run.actionKey !== MEETING_BOOKING_ACTION || !input.success || !checkpoint.success) {
      await this.stop(run, "invalid_approved_input");

      return;
    }

    const { eventId, lookupOnly, possiblyDispatched, ...details } = input.data;

    let couldHaveCreated = Boolean(run.stepStartedAt) || possiblyDispatched;

    let calendarMeeting;

    try {
      calendarMeeting = await this.meeting.resolveApprovedCalendar(
        { ...details, bookingOperationId: run.id },
        eventId,
        lookupOnly,
        async () => {
          const marked = await this.repository.markStarted(run, this.clock());

          couldHaveCreated ||= marked;

          return marked;
        },
      );
    } catch (error) {
      const code = error instanceof MeetingBookingError ? error.code : "unavailable";

      if (code === "conflict" || code === "invalid_operation") {
        await this.stop(run, "calendar_identity_conflict");

        return;
      }

      if (code !== "slot_unavailable" && run.attempt < MAX_EXECUTION_ATTEMPTS) {
        await this.retry(run, code);

        return;
      }

      if (couldHaveCreated || code === "uncertain") {
        await this.stop(run, "calendar_outcome_uncertain");

        return;
      }

      await this.repository.settle(
        run,
        this.clock(),
        { step: "failed", category: code },
        {
          releaseEventId: eventId,
          releaseState: checkpoint.data.releaseState,
        },
      );

      return;
    }

    const reservation = await this.repository.meeting(eventId);

    if (!reservation) {
      await this.stop(run, "reservation_missing");

      return;
    }

    let notice;

    try {
      notice = this.notifications.prepareMeetingNotice({
        ...reservation,
        googleEventUrl: calendarMeeting.googleEventUrl,
      });
    } catch {
      await this.repository.settle(
        run,
        this.clock(),
        { step: "needs_review", category: "owner_notice_configuration" },
        {
          meeting: calendarMeeting,
          complete: true,
        },
      );

      return;
    }

    await this.repository.settle(
      run,
      this.clock(),
      {
        step: "owner_notice",
        checkpoint: { notice },
        attempt: 0,
        nextAttemptAt: this.clock(),
        stepStartedAt: null,
        category: null,
      },
      { meeting: calendarMeeting, complete: true },
    );
  }

  private async ownerNotice(run: WorkflowExecution) {
    const payload = noticeCheckpoint.safeParse(run.checkpoint);

    if (!payload.success) {
      await this.stop(run, "owner_notice_invalid");

      return;
    }

    const now = this.clock();

    if (
      run.stepStartedAt &&
      now.getTime() - run.stepStartedAt.getTime() >= NOTICE_RETRY_WINDOW_MS
    ) {
      await this.stop(run, "owner_notice_window_expired");

      return;
    }

    if (!(await this.repository.markStarted(run, now))) {
      return;
    }

    try {
      await this.notifications.sendPreparedNotice(payload.data.notice);
    } catch (error) {
      const retryable = !(
        error instanceof Error &&
        "retryable" in error &&
        error.retryable === false
      );

      if (retryable && run.attempt < MAX_EXECUTION_ATTEMPTS) {
        await this.retry(run, "owner_notice_unavailable");
      } else {
        await this.stop(run, "owner_notice_unconfirmed");
      }

      return;
    }

    await this.repository.settle(run, this.clock(), {
      step: "done",
      checkpoint: {},
      category: null,
    });
  }

  private async retry(run: WorkflowExecution, category: string) {
    const now = this.clock();

    await this.repository.settle(run, now, {
      category,
      nextAttemptAt: new Date(now.getTime() + BACKOFF_MS[run.attempt - 1]),
    });
    this.logger.info("workflow.execution_retry_scheduled", {
      executionId: run.id,
      step: run.step,
      attempt: run.attempt,
      category,
    });
  }

  private async stop(run: WorkflowExecution, category: string) {
    await this.repository.settle(run, this.clock(), { step: "needs_review", category });
    this.logger.error("workflow.execution_needs_review", {
      executionId: run.id,
      step: run.step,
      attempt: run.attempt,
      category,
    });
  }
}
