import { randomUUID } from "node:crypto";
import type { Prisma, WorkflowInstance } from "@/generated/prisma/client";
import type { WorkflowProgress } from "@/contracts/workflow-progress.contract";
import type { Logger } from "@/infrastructure/logging/logger";
import { WorkflowService } from "@/modules/workflow/service";
import { WorkflowServiceError, WorkflowInstanceStoreError } from "@/modules/workflow/errors";
import type {
  IWorkflowDefinition,
  IWorkflowInstanceRepository,
} from "@/modules/workflow/interfaces";
import type { WorkflowDefinitionRegistry } from "@/modules/workflow/registry";
import type {
  WorkflowPublicInstance,
  WorkflowToolExecutionResult,
  WorkflowExecutionResult,
  SaveWorkflowInstanceInput,
} from "@/modules/workflow/types";
import { WorkflowInstanceStatusSchema } from "@/modules/workflow/schemas/workflow-control.schema";
import { MEETING_BOOKING_WORKFLOW_ID } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.definition";
import {
  meetingBookingStateSchema,
  type MeetingBookingState,
} from "@/modules/workflow/definitions/meeting-booking/meeting-booking.schema";
import { V1BookingDefinition } from "./v1-booking-definition";

export type V1BookingStore = IWorkflowInstanceRepository & {
  claimMeetingBooking(input: SaveWorkflowInstanceInput): Promise<WorkflowInstance>;
};

// Keeps the historical writer available to the v1 fixture and provider regressions only.
export class V1BookingWriter extends WorkflowService {
  constructor(
    private readonly v1Registry: WorkflowDefinitionRegistry,
    private readonly v1Store: V1BookingStore,
    globalToolNames: readonly string[],
    private readonly v1Logger: Logger,
  ) {
    super(v1Registry, v1Store, globalToolNames, v1Logger);
  }

  override confirmWorkflow(instanceId: string, actionKey: string, revision: number) {
    if (actionKey !== "book-meeting") {
      throw new Error("Invalid fixture action");
    }

    return this.confirmMeetingBooking(instanceId, revision);
  }

  override retryWorkflow(instanceId: string) {
    return this.retryMeetingBooking(instanceId);
  }

  async confirmMeetingBooking(
    instanceId: string,
    expectedRevision: number,
  ): Promise<WorkflowToolExecutionResult> {
    if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
      throw new WorkflowServiceError("invalid_request", "The booking revision is invalid.");
    }

    const instance = await this.loadMeetingInstance(instanceId);

    const definition = this.v1Definition(instance);

    const state = definition.stateSchema.parse(instance.state);

    if (instance.status !== "active" || isWorkflowExecutionFrozen(instance, state)) {
      return this.currentBookingResult(instance, definition);
    }

    if (instance.revision !== expectedRevision) {
      return this.currentBookingResult(instance, definition, {
        error: "stale_booking_summary",
        message: "The booking details changed. Review the updated summary and confirm again.",
      });
    }

    if (!(definition instanceof V1BookingDefinition)) {
      throw new WorkflowServiceError(
        "configuration_error",
        "The booking definition is unavailable.",
      );
    }

    const execution = await definition.confirmLegacy(
      meetingBookingStateSchema.parse(state),
      randomUUID(),
      expectedRevision,
    );

    if (execution.state === state) {
      return this.currentBookingResult(instance, definition, execution.output);
    }

    let saved: WorkflowToolExecutionResult;

    try {
      saved = await this.persistV1(instance, definition, execution, !("error" in execution.output));
    } catch (error) {
      if (error instanceof WorkflowServiceError && error.code === "slot_unavailable") {
        return this.rejectV1UnavailableMeetingSlot(instance, definition, state);
      }

      if (!isBookingPersistenceFailure(error)) {
        throw error;
      }

      const current = await this.loadMeetingInstance(instance.id);

      return this.currentBookingResult(current, definition, {
        error: "booking_changed",
        message:
          "The booking changed while confirming. Review its current status before continuing.",
      });
    }

    if ("error" in execution.output) {
      return saved;
    }

    const operation = meetingBookingStateSchema.parse(execution.state).bookingOperation;

    this.v1Logger.info("workflow.booking_accepted", {
      workflowInstanceId: instance.id,
      bookingOperationId: operation?.id,
      revision: saved.instance.revision,
    });

    // Only the persisted operation may reach the Calendar; retries reuse that identity.
    return this.retryMeetingBooking(instance.id);
  }

  private async rejectV1UnavailableMeetingSlot(
    instance: WorkflowInstance,
    definition: IWorkflowDefinition,
    state: Prisma.JsonObject,
  ): Promise<WorkflowToolExecutionResult> {
    this.v1Logger.info("workflow.booking_slot_conflict", {
      workflowInstanceId: instance.id,
      revision: instance.revision,
      category: "slot_unavailable",
    });
    const next = {
      ...state,
      step: "collecting",
      selectedSlot: null,
      availableSlots: [],
      availabilityCheckedAt: null,
      preparedInteractionId: null,
    };

    try {
      return await this.persistV1(instance, definition, {
        state: next,
        status: "active",
        output: {
          error: "slot_unavailable",
          message: "That slot is no longer available. Choose a new time before confirming again.",
        },
      });
    } catch (error) {
      if (!isBookingPersistenceFailure(error)) {
        throw error;
      }

      const current = await this.loadMeetingInstance(instance.id);

      return this.currentBookingResult(current, definition, {
        error: "booking_changed",
        message: "The booking changed. Review its current status before continuing.",
      });
    }
  }

  async retryMeetingBooking(instanceId: string): Promise<WorkflowToolExecutionResult> {
    const instance = await this.loadMeetingInstance(instanceId);

    const definition = this.v1Definition(instance);

    const state = definition.stateSchema.parse(instance.state);

    if (instance.status !== "active") {
      return this.currentBookingResult(instance, definition);
    }

    const parsed = meetingBookingStateSchema.parse(state);

    if (!parsed.pendingBooking && !parsed.bookingOperation) {
      return this.currentBookingResult(instance, definition, {
        error: "booking_recovery_blocked",
        message:
          "This saved booking cannot be retried safely. Please contact Freeman to check its status.",
      });
    }

    if (!(definition instanceof V1BookingDefinition)) {
      throw new WorkflowServiceError(
        "configuration_error",
        "The booking definition is unavailable.",
      );
    }

    const execution = await definition.bookLegacy(parsed);

    try {
      const result = await this.persistV1(instance, definition, execution);

      if (result.instance.status === "completed") {
        this.v1Logger.info("workflow.booking_completed", {
          workflowInstanceId: instance.id,
          bookingOperationId: parsed.bookingOperation?.id,
          revision: result.instance.revision,
        });
      }

      return result;
    } catch (error) {
      if (!isBookingPersistenceFailure(error)) {
        throw error;
      }

      const current = await this.loadMeetingInstance(instance.id);

      const currentState = meetingBookingStateSchema.parse(current.state);

      this.v1Logger.error("workflow.booking_completion_save_failed", {
        workflowInstanceId: instance.id,
        bookingOperationId: parsed.bookingOperation?.id,
        category: error instanceof WorkflowServiceError ? error.code : "unexpected",
        reconciled: current.status === "completed" && hasSameBookingIdentity(parsed, currentState),
      });

      if (!hasSameBookingIdentity(parsed, currentState)) {
        throw new WorkflowServiceError(
          "invalid_transition",
          "The saved booking operation changed. Please contact Freeman to check its status.",
        );
      }

      return this.currentBookingResult(current, definition);
    }
  }

  private async loadMeetingInstance(instanceId: string): Promise<WorkflowInstance> {
    const instance = await this.v1Store.findById(instanceId);

    if (!instance || instance.workflowId !== MEETING_BOOKING_WORKFLOW_ID) {
      throw new WorkflowServiceError("invalid_request", "This request is not a meeting booking.");
    }

    return instance;
  }

  private currentBookingResult(
    instance: WorkflowInstance,
    definition: IWorkflowDefinition,
    output?: Prisma.JsonObject,
  ): WorkflowToolExecutionResult {
    const state = definition.stateSchema.parse(instance.state);

    const status = parseWorkflowInstanceStatus(instance.status);

    const progress = definition.getProgress(state, status);

    const publicInstance = toWorkflowPublicInstance(instance, progress);

    if (instance.status === "completed") {
      return {
        instance: publicInstance,
        output: {
          kind: "meeting_booking",
          status: "confirmed",
          message: "Your meeting is booked. A calendar invitation will be sent to your email.",
        },
      };
    }

    if (instance.status === "cancelled") {
      return {
        instance: publicInstance,
        output: { message: "This meeting request was cancelled. No booking action was taken." },
      };
    }

    if (publicInstance.confirmationAction === "blocked") {
      return {
        instance: publicInstance,
        output: {
          error: "booking_recovery_blocked",
          message:
            "This saved booking cannot be retried safely. Please contact Freeman to check its status.",
        },
      };
    }

    return {
      instance: publicInstance,
      output: output ?? {
        error: "booking_recovery_required",
        message: "Your booking still needs checking. Use Retry booking to safely check it again.",
      },
    };
  }

  private v1Definition(instance: WorkflowInstance) {
    const definition = this.v1Registry.get(instance.workflowId, instance.workflowVersion);

    if (!definition) {
      throw new Error("Missing historical booking definition");
    }

    return definition;
  }

  private async persistV1(
    instance: WorkflowInstance,
    definition: IWorkflowDefinition,
    execution: WorkflowExecutionResult<Prisma.JsonObject>,
    claim = false,
  ): Promise<WorkflowToolExecutionResult> {
    const input = {
      id: instance.id,
      expectedRevision: instance.revision,
      state: execution.state,
      status: execution.status,
      completedAt: execution.status === "completed" ? new Date() : null,
    };

    try {
      const saved = claim
        ? await this.v1Store.claimMeetingBooking(input)
        : await this.v1Store.save(input);

      return {
        output: execution.output,
        instance: toWorkflowPublicInstance(
          saved,
          definition.getProgress(execution.state, execution.status),
        ),
      };
    } catch (error) {
      const code =
        error instanceof WorkflowInstanceStoreError && error.code === "slot_unavailable"
          ? "slot_unavailable"
          : "persistence_failed";

      throw new WorkflowServiceError(code, "Historical fixture write failed.", { cause: error });
    }
  }
}

function toWorkflowPublicInstance(
  instance: WorkflowInstance,
  progress: WorkflowProgress,
): WorkflowPublicInstance {
  return {
    id: instance.id,
    workflowId: instance.workflowId,
    workflowVersion: instance.workflowVersion,
    revision: instance.revision,
    status: parseWorkflowInstanceStatus(instance.status),
    progress,
    ...getConfirmationAction(instance, progress),
  };
}

function isWorkflowExecutionFrozen(instance: WorkflowInstance, state: Prisma.JsonObject) {
  return (
    instance.workflowId === MEETING_BOOKING_WORKFLOW_ID &&
    Boolean(state.bookingOperation || state.pendingBooking || state.step === "confirmed")
  );
}

function isBookingPersistenceFailure(error: unknown) {
  return (
    error instanceof WorkflowServiceError &&
    (error.code === "persistence_failed" || error.code === "invalid_transition")
  );
}

function getConfirmationAction(
  instance: WorkflowInstance,
  progress: WorkflowProgress,
): Pick<WorkflowPublicInstance, "confirmationAction"> {
  if (instance.status !== "active") {
    return {};
  }

  if (instance.workflowId !== MEETING_BOOKING_WORKFLOW_ID) {
    return {};
  }

  const state = meetingBookingStateSchema.parse(instance.state);

  if (state.pendingBooking || (state.bookingOperation && state.step === "confirmed")) {
    return { confirmationAction: "retry" };
  }

  if (state.step === "confirmed" || state.bookingOperation) {
    return { confirmationAction: "blocked" };
  }

  return state.step === "awaiting_confirmation" &&
    state.preparedInteractionId &&
    progress.missingRequiredFields.length === 0
    ? { confirmationAction: "confirm" }
    : {};
}

function hasSameBookingIdentity(expected: MeetingBookingState, current: MeetingBookingState) {
  if (expected.bookingOperation) {
    return expected.bookingOperation.id === current.bookingOperation?.id;
  }

  return Boolean(
    expected.pendingBooking &&
    expected.pendingBooking.googleEventId === current.pendingBooking?.googleEventId,
  );
}

function parseWorkflowInstanceStatus(status: string) {
  return WorkflowInstanceStatusSchema.parse(status);
}
