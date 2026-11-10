import "server-only";
import { randomUUID } from "node:crypto";
import type { Logger } from "@/infrastructure/logging/logger";
import type { Prisma, WorkflowExecution, WorkflowInstance } from "@/generated/prisma/client";
import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import {
  workflowProgressSchema,
  type WorkflowProgress,
} from "@/contracts/workflow-progress.contract";
import { WorkflowInstanceStoreError, WorkflowServiceError } from "./errors";
import type {
  IWorkflowDefinition,
  IWorkflowInstanceRepository,
  IWorkflowService,
} from "./interfaces";
import {
  type CreateWorkflowInstanceInput,
  type WorkflowAssistantContext,
  type WorkflowExecutionResult,
  type WorkflowInstanceStatus,
  type WorkflowPublicInstance,
  type WorkflowStartContext,
  type WorkflowToolCall,
  type WorkflowToolExecutionResult,
} from "./types";
import { WorkflowDefinitionRegistry } from "./registry";
import {
  CancelWorkflowArgumentsSchema,
  StartWorkflowArgumentsSchema,
  WorkflowInstanceStatusSchema,
  WorkflowStartContextSchema,
} from "./schemas/workflow-control.schema";
import {
  CANCEL_WORKFLOW_TOOL_NAME,
  START_WORKFLOW_TOOL_NAME,
  SWITCH_WORKFLOW_TOOL_NAME,
} from "./constants";
import { MEETING_BOOKING_WORKFLOW_ID } from "./definitions/meeting-booking/meeting-booking.definition";
import { meetingBookingStateSchema } from "./definitions/meeting-booking/meeting-booking.schema";

import { workflowReviewSchema } from "@/contracts/assistant.contract";
import { MAX_EXECUTION_ATTEMPTS, type WorkflowExecutionRepository } from "./execution.repository";
import { MEETING_BOOKING_ACTION } from "./definitions/meeting-booking/meeting-booking.definition";

const INSTANCE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class WorkflowService implements IWorkflowService {
  private readonly globalToolNames: ReadonlySet<string>;

  constructor(
    private readonly registry: WorkflowDefinitionRegistry,
    private readonly repository: IWorkflowInstanceRepository,
    globalToolNames: readonly string[],
    private readonly logger: Logger,
    private readonly clock: () => Date = () => new Date(),
    private readonly executions?: WorkflowExecutionRepository,
  ) {
    this.globalToolNames = new Set(globalToolNames);

    if (
      this.globalToolNames.has(START_WORKFLOW_TOOL_NAME) ||
      this.globalToolNames.has(CANCEL_WORKFLOW_TOOL_NAME) ||
      this.globalToolNames.has(SWITCH_WORKFLOW_TOOL_NAME)
    ) {
      throw new WorkflowServiceError(
        "configuration_error",
        "A global assistant tool collides with workflow control.",
      );
    }
  }

  async start(workflowId: string, context: WorkflowStartContext): Promise<WorkflowPublicInstance> {
    const definition = this.registry.getLatest(workflowId);

    if (!definition) {
      throw new WorkflowServiceError(
        "unavailable_definition",
        "The requested workflow is unavailable.",
      );
    }

    const validatedContext = WorkflowStartContextSchema.safeParse(context);

    if (!validatedContext.success) {
      throw new WorkflowServiceError("invalid_request", "The workflow origin is invalid.");
    }

    const initialState = this.createInitialState(definition, validatedContext.data);

    this.getDefinitionInstructions(definition, initialState);
    this.getDefinitionTools(definition, initialState);
    this.getDefinitionProgress(definition, initialState, "active");

    const instance = await this.runRepositoryOperation(() =>
      this.repository.create({
        workflowId: definition.id,
        workflowVersion: definition.version,
        state: initialState,
        ...validatedContext.data,
      }),
    );

    return this.present(instance, definition, initialState, "active");
  }

  async getAssistantContext(instanceId: string | null): Promise<WorkflowAssistantContext> {
    if (instanceId === null) {
      return this.createStartContext();
    }

    const instance = await this.loadInstance(instanceId);

    // A retired workflow can leave a saved ID in the browser.
    if (!this.registry.getLatest(instance.workflowId)) {
      return this.createStartContext();
    }

    const definition = this.resolveDefinition(instance);

    const state = this.validateState(definition, instance.state);

    const status = parseWorkflowInstanceStatus(instance.status);

    const execution = await this.executions?.latest(instance.id);

    const publicInstance = this.present(instance, definition, state, status, execution);

    if (
      instance.status !== "active" ||
      isWorkflowExecutionFrozen(instance, state) ||
      (execution && execution.step !== "failed")
    ) {
      return {
        instructions:
          instance.status === "active" ? this.getDefinitionInstructions(definition, state) : "",
        tools: [],
        instance: publicInstance,
      };
    }

    return {
      instructions: this.getDefinitionInstructions(definition, state),
      tools: [
        createCancelWorkflowTool(),
        ...createSwitchWorkflowTools(this.registry.listRoutable(), instance.workflowId),
        ...this.getDefinitionTools(definition, state),
      ],
      instance: publicInstance,
    };
  }

  async executeTool(
    instanceId: string | null,
    toolCall: WorkflowToolCall,
  ): Promise<WorkflowToolExecutionResult> {
    validateToolCall(toolCall);

    if (instanceId === null) {
      return this.executeStartTool(toolCall);
    }

    const instance = await this.loadInstance(instanceId);

    if (instance.status !== "active") {
      throw new WorkflowServiceError(
        "invalid_transition",
        "The workflow instance is already terminal.",
      );
    }

    if (toolCall.name === START_WORKFLOW_TOOL_NAME) {
      throw new WorkflowServiceError(
        "invalid_transition",
        "Another workflow cannot start while one is active.",
      );
    }

    const definition = this.resolveDefinition(instance);

    const state = this.validateState(definition, instance.state);

    const executionRow = await this.executions?.latest(instance.id);

    if (
      isWorkflowExecutionFrozen(instance, state) ||
      (executionRow && executionRow.step !== "failed")
    ) {
      throw new WorkflowServiceError(
        "invalid_transition",
        "Details cannot change after confirmation has been accepted.",
      );
    }

    if (toolCall.name === SWITCH_WORKFLOW_TOOL_NAME) {
      return this.switchWorkflow(instance, state, toolCall);
    }

    if (toolCall.name === CANCEL_WORKFLOW_TOOL_NAME) {
      parseControlArguments(toolCall.rawArguments, CancelWorkflowArgumentsSchema);
      const cancelled = await this.cancelLoadedInstance(instance, state);

      return {
        output: { message: "The workflow was cancelled." },
        instance: toWorkflowPublicInstance(
          cancelled,
          this.getDefinitionProgress(definition, state, "cancelled"),
        ),
      };
    }

    const currentTools = this.getDefinitionTools(definition, state);

    if (!currentTools.some((tool) => tool.name === toolCall.name)) {
      throw new WorkflowServiceError(
        "unavailable_tool",
        "That workflow action is no longer available.",
      );
    }

    const execution = await this.executeDefinitionTool(definition, toolCall, state, instance.id);

    return this.persistExecution(instance, definition, execution);
  }

  async confirmWorkflow(
    instanceId: string,
    actionKey: string,
    expectedRevision: number,
  ): Promise<WorkflowToolExecutionResult> {
    const instance = await this.loadInstance(instanceId);

    const definition = this.resolveDefinition(instance);

    const state = this.validateState(definition, instance.state);

    const review = definition.getReview?.(state);

    if (
      instance.status !== "active" ||
      instance.revision !== expectedRevision ||
      review?.actionKey !== actionKey
    ) {
      return this.approvalResult(
        instanceId,
        "The review changed. Check the saved details before confirming.",
      );
    }

    if (!this.executions) {
      throw new WorkflowServiceError("configuration_error", "Workflow execution is unavailable.");
    }

    const id = randomUUID();

    const approved = definition.prepareApproval?.(state, id, expectedRevision);

    if (!approved || approved.actionKey !== actionKey) {
      return this.approvalResult(instanceId, "Review the complete details before confirming.");
    }

    const result = await this.executions.approve({
      ...approved,
      id,
      instanceId,
      revision: expectedRevision,
    });

    if (result.status === "occupied") {
      return this.rejectUnavailableMeetingSlot(instance, definition, state);
    }

    if (result.status === "stale") {
      return this.approvalResult(instanceId, "The review changed. Check the current status.");
    }

    return {
      ...(await this.approvalResult(
        instanceId,
        "Your approval was saved. The request is pending.",
      )),
      executionId: result.executionId,
    };
  }

  async retryWorkflow(instanceId: string): Promise<WorkflowToolExecutionResult> {
    if (!this.executions) {
      throw new WorkflowServiceError("configuration_error", "Workflow execution is unavailable.");
    }

    const execution = await this.executions.latest(instanceId);

    const result = await this.approvalResult(instanceId, "Check the saved booking status.");

    if (
      execution &&
      ["calendar", "owner_notice"].includes(execution.step) &&
      execution.attempt < MAX_EXECUTION_ATTEMPTS &&
      execution.nextAttemptAt <= this.clock() &&
      (!execution.leaseExpiresAt || execution.leaseExpiresAt <= this.clock())
    ) {
      result.executionId = execution.id;
    }

    return result;
  }

  async adoptLegacyApprovals(signal?: AbortSignal) {
    if (!this.executions) {
      return;
    }

    for (const instance of await this.executions.legacyCandidates()) {
      if (signal?.aborted) {
        break;
      }

      const definition = this.resolveDefinition(instance);

      const parsed = meetingBookingStateSchema.safeParse(instance.state);

      const id = parsed.success ? (parsed.data.bookingOperation?.id ?? randomUUID()) : randomUUID();

      const operation = parsed.success ? parsed.data.bookingOperation : null;

      const approved =
        parsed.success && (!operation || operation.preparedRevision < instance.revision)
          ? definition.adoptApproval?.(parsed.data, id)
          : null;

      const base = { id, instanceId: instance.id, revision: instance.revision };

      if (approved) {
        try {
          const result = await this.executions.approve({ ...base, ...approved });

          if (result.status !== "occupied") {
            continue;
          }
        } catch {
          this.logger.error("workflow.legacy_approval_conflict", {
            workflowInstanceId: instance.id,
            category: "legacy_identity_unverified",
          });
        }
      }

      await this.executions.approve({
        ...base,
        id: randomUUID(),
        actionKey: MEETING_BOOKING_ACTION,
        approvedInput: {},
        acceptedState: instance.state as Prisma.InputJsonObject,
        checkpoint: {},
        needsReview: true,
      });
    }
  }

  private async approvalResult(
    instanceId: string,
    message: string,
  ): Promise<WorkflowToolExecutionResult> {
    const context = await this.getAssistantContext(instanceId);

    if (!context.instance) {
      throw new WorkflowServiceError("not_found", "The workflow instance was not found.");
    }

    return { instance: context.instance, output: { message } };
  }

  private present(
    instance: WorkflowInstance,
    definition: IWorkflowDefinition,
    state: Prisma.JsonObject,
    status: WorkflowInstanceStatus,
    execution?: WorkflowExecution | null,
  ): WorkflowPublicInstance {
    const progress = this.getDefinitionProgress(definition, state, status);

    const base = toWorkflowPublicInstance(instance, progress);

    const review = workflowReviewSchema.safeParse(definition.getReview?.(state));

    if (!this.executions) {
      return status === "active" && review.success ? { ...base, review: review.data } : base;
    }

    const { confirmationAction: _legacyAction, ...current } = base;

    if (execution && execution.step !== "failed") {
      const booked = status === "completed";

      return {
        ...current,
        confirmationAction:
          status === "active" && execution.step === "needs_review" ? "blocked" : undefined,
        outcome: {
          booking: booked
            ? "confirmed"
            : execution.step === "needs_review"
              ? "needs_review"
              : "pending",
          ownerNotice:
            execution.step === "done"
              ? "accepted"
              : booked
                ? execution.step === "needs_review"
                  ? "needs_review"
                  : "pending"
                : "not_started",
          retryAt:
            execution.category && ["calendar", "owner_notice"].includes(execution.step)
              ? execution.nextAttemptAt.toISOString()
              : undefined,
        },
      };
    }

    if (status === "active" && review.success) {
      return { ...current, review: review.data, confirmationAction: "confirm" };
    }

    if (status === "active" && isWorkflowExecutionFrozen(instance, state)) {
      return {
        ...current,
        confirmationAction: "blocked",
        outcome: { booking: "needs_review", ownerNotice: "not_started" },
      };
    }

    return execution
      ? { ...current, outcome: { booking: "not_booked", ownerNotice: "not_started" } }
      : current;
  }

  private async rejectUnavailableMeetingSlot(
    instance: WorkflowInstance,
    definition: IWorkflowDefinition,
    state: Prisma.JsonObject,
  ): Promise<WorkflowToolExecutionResult> {
    this.logger.info("workflow.booking_slot_conflict", {
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
      return await this.persistExecution(instance, definition, {
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

      return this.approvalResult(instance.id, "The booking changed. Review its current status.");
    }
  }

  private async persistExecution(
    instance: WorkflowInstance,
    definition: IWorkflowDefinition,
    execution: WorkflowExecutionResult<Prisma.JsonObject>,
  ): Promise<WorkflowToolExecutionResult> {
    const nextState = this.validateState(definition, execution.state);

    const { output, status } = execution;

    if (status === "active") {
      this.getDefinitionInstructions(definition, nextState);
      this.getDefinitionTools(definition, nextState);
    }

    this.getDefinitionProgress(definition, nextState, status);

    const completedAt = status === "completed" ? this.clock() : null;

    const input = {
      id: instance.id,
      expectedRevision: instance.revision,
      state: nextState,
      status,
      completedAt,
    };

    const saved = await this.runRepositoryOperation(() => this.repository.save(input));

    return { output, instance: this.present(saved, definition, nextState, status) };
  }

  async cancel(instanceId: string): Promise<WorkflowPublicInstance> {
    const instance = await this.loadInstance(instanceId);

    if (instance.status !== "active") {
      throw new WorkflowServiceError(
        "invalid_transition",
        "The workflow instance is already terminal.",
      );
    }

    const definition = this.resolveDefinition(instance);

    const state = this.validateState(definition, instance.state);

    const execution = await this.executions?.latest(instance.id);

    if (isWorkflowExecutionFrozen(instance, state) || (execution && execution.step !== "failed")) {
      throw new WorkflowServiceError(
        "invalid_transition",
        "Details cannot change after confirmation has been accepted.",
      );
    }

    const cancelled = await this.cancelLoadedInstance(instance, state);

    return toWorkflowPublicInstance(
      cancelled,
      this.getDefinitionProgress(definition, state, "cancelled"),
    );
  }

  private createStartContext(): WorkflowAssistantContext {
    const routable = this.registry.listRoutable();

    if (routable.length === 0) {
      return { instructions: "", tools: [], instance: null };
    }

    const descriptions = routable
      .map((definition) => `- ${definition.id}: ${definition.description}`)
      .join("\n");

    return {
      instructions: [
        "Start a workflow only when the visitor clearly requests one of these outcomes:",
        descriptions,
      ].join("\n"),
      tools: [createStartWorkflowTool(routable)],
      instance: null,
    };
  }

  private async executeStartTool(toolCall: WorkflowToolCall): Promise<WorkflowToolExecutionResult> {
    if (toolCall.name !== START_WORKFLOW_TOOL_NAME) {
      throw new WorkflowServiceError("unavailable_tool", "That workflow action is not available.");
    }

    if (!toolCall.startContext) {
      throw new WorkflowServiceError("invalid_request", "The workflow origin is required.");
    }

    const argumentsResult = parseControlArguments(
      toolCall.rawArguments,
      StartWorkflowArgumentsSchema,
    );

    const instance = await this.start(argumentsResult.workflowId, toolCall.startContext);

    return {
      output: {
        message: "The workflow started.",
        workflowId: instance.workflowId,
      },
      instance,
    };
  }

  private async cancelLoadedInstance(
    instance: WorkflowInstance,
    state: Prisma.JsonObject,
  ): Promise<WorkflowInstance> {
    return this.runRepositoryOperation(() =>
      this.repository.save({
        id: instance.id,
        expectedRevision: instance.revision,
        status: "cancelled",
        state,
        completedAt: null,
      }),
    );
  }

  private async switchWorkflow(
    instance: WorkflowInstance,
    state: Prisma.JsonObject,
    toolCall: WorkflowToolCall,
  ): Promise<WorkflowToolExecutionResult> {
    if (!toolCall.startContext) {
      throw new WorkflowServiceError("invalid_request", "The workflow origin is required.");
    }

    const { workflowId } = parseControlArguments(
      toolCall.rawArguments,
      StartWorkflowArgumentsSchema,
    );

    if (workflowId === instance.workflowId) {
      const definition = this.resolveDefinition(instance);

      return {
        output: { message: "That workflow is already active.", workflowId },
        instance: toWorkflowPublicInstance(
          instance,
          this.getDefinitionProgress(definition, state, "active"),
        ),
      };
    }

    if (!this.registry.getLatest(workflowId)) {
      throw new WorkflowServiceError(
        "unavailable_definition",
        "The requested workflow is unavailable.",
      );
    }

    const target = this.registry.getLatest(workflowId)!;

    const replacementState = this.createInitialState(target, toolCall.startContext);

    const saved = await this.runRepositoryOperation(() =>
      this.repository.save({
        id: instance.id,
        expectedRevision: instance.revision,
        state,
        status: "cancelled",
        completedAt: null,
        replacement: {
          workflowId: target.id,
          workflowVersion: target.version,
          state: replacementState,
          ...toolCall.startContext!,
        },
      }),
    );

    const replacement = toWorkflowPublicInstance(
      saved,
      this.getDefinitionProgress(target, replacementState, "active"),
    );

    return {
      output: { message: "The workflow was switched.", workflowId: replacement.workflowId },
      instance: replacement,
    };
  }

  private async loadInstance(instanceId: string): Promise<WorkflowInstance> {
    if (!INSTANCE_ID_PATTERN.test(instanceId)) {
      throw new WorkflowServiceError("not_found", "The workflow instance was not found.");
    }

    const instance = await this.runRepositoryOperation(() => this.repository.findById(instanceId));

    if (!instance) {
      throw new WorkflowServiceError("not_found", "The workflow instance was not found.");
    }

    return instance;
  }

  private resolveDefinition(instance: WorkflowInstance): IWorkflowDefinition {
    const definition = this.registry.get(instance.workflowId, instance.workflowVersion);

    if (!definition) {
      throw new WorkflowServiceError(
        "unavailable_definition",
        "The workflow definition is unavailable.",
      );
    }

    return definition;
  }

  private createInitialState(
    definition: IWorkflowDefinition,
    context: WorkflowStartContext,
  ): Prisma.JsonObject {
    try {
      return this.validateState(definition, definition.createInitialState(context));
    } catch (error) {
      if (error instanceof WorkflowServiceError) {
        throw error;
      }

      throw new WorkflowServiceError("execution_failed", "The workflow could not be started.", {
        cause: error,
      });
    }
  }

  private validateState(definition: IWorkflowDefinition, state: unknown): Prisma.JsonObject {
    const result = definition.stateSchema.safeParse(state);

    if (!result.success) {
      throw new WorkflowServiceError("invalid_state", "The workflow state is invalid.");
    }

    return result.data;
  }

  private getDefinitionInstructions(
    definition: IWorkflowDefinition,
    state: Prisma.JsonObject,
  ): string {
    try {
      return definition.getInstructions(state);
    } catch (error) {
      throw new WorkflowServiceError(
        "configuration_error",
        "The workflow instructions are unavailable.",
        { cause: error },
      );
    }
  }

  private getDefinitionTools(
    definition: IWorkflowDefinition,
    state: Prisma.JsonObject,
  ): OpenAIResponseTool[] {
    let tools: OpenAIResponseTool[];

    try {
      tools = definition.getTools(state);
    } catch (error) {
      throw new WorkflowServiceError("configuration_error", "The workflow tools are unavailable.", {
        cause: error,
      });
    }

    for (const tool of tools) {
      if (
        tool.name === START_WORKFLOW_TOOL_NAME ||
        tool.name === CANCEL_WORKFLOW_TOOL_NAME ||
        tool.name === SWITCH_WORKFLOW_TOOL_NAME ||
        this.globalToolNames.has(tool.name)
      ) {
        throw new WorkflowServiceError(
          "configuration_error",
          "The workflow tool configuration collides with a reserved tool.",
        );
      }
    }

    return tools;
  }

  private getDefinitionProgress(
    definition: IWorkflowDefinition,
    state: Prisma.JsonObject,
    status: WorkflowPublicInstance["status"],
  ): WorkflowProgress {
    let progress: unknown;

    try {
      progress = definition.getProgress(state, status);
    } catch (error) {
      throw new WorkflowServiceError(
        "configuration_error",
        "The workflow progress is unavailable.",
        { cause: error },
      );
    }

    const result = workflowProgressSchema.safeParse(progress);

    if (!result.success || !progressPhaseMatchesStatus(result.data.phase, status)) {
      throw new WorkflowServiceError("configuration_error", "The workflow progress is invalid.");
    }

    return result.data;
  }

  private async executeDefinitionTool(
    definition: IWorkflowDefinition,
    toolCall: WorkflowToolCall,
    state: Prisma.JsonObject,
    workflowInstanceId: string,
  ): Promise<WorkflowExecutionResult<Prisma.JsonObject>> {
    try {
      return await definition.executeTool(toolCall.name, toolCall.rawArguments, state, {
        workflowInstanceId,
        interactionId: toolCall.interactionId,
      });
    } catch (error) {
      throw new WorkflowServiceError(
        "execution_failed",
        "The workflow action could not be completed.",
        { cause: error },
      );
    }
  }

  private async runRepositoryOperation<Result>(operation: () => Promise<Result>): Promise<Result> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof WorkflowInstanceStoreError && error.code === "slot_unavailable") {
        throw new WorkflowServiceError("slot_unavailable", "That slot is no longer available.", {
          cause: error,
        });
      }

      if (error instanceof WorkflowInstanceStoreError && error.code === "terminal") {
        throw new WorkflowServiceError(
          "invalid_transition",
          "The workflow instance is already terminal.",
          { cause: error },
        );
      }

      if (error instanceof WorkflowInstanceStoreError && error.code === "not_found") {
        throw new WorkflowServiceError("not_found", "The workflow instance was not found.", {
          cause: error,
        });
      }

      throw new WorkflowServiceError("persistence_failed", "The workflow could not be saved.", {
        cause: error,
      });
    }
  }
}

function validateToolCall(toolCall: WorkflowToolCall): void {
  if (!toolCall.name || toolCall.name.trim() !== toolCall.name) {
    throw new WorkflowServiceError("invalid_request", "The workflow action is invalid.");
  }

  if (typeof toolCall.rawArguments !== "string") {
    throw new WorkflowServiceError("invalid_request", "The workflow arguments are invalid.");
  }

  if (!INSTANCE_ID_PATTERN.test(toolCall.interactionId)) {
    throw new WorkflowServiceError("invalid_request", "The workflow interaction is invalid.");
  }
}

function parseControlArguments<Output>(
  rawArguments: string,
  schema: { safeParse(value: unknown): { success: true; data: Output } | { success: false } },
): Output {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawArguments);
  } catch {
    throw new WorkflowServiceError("invalid_request", "The workflow arguments are invalid.");
  }

  const result = schema.safeParse(parsed);

  if (!result.success) {
    throw new WorkflowServiceError("invalid_request", "The workflow arguments are invalid.");
  }

  return result.data;
}

function createStartWorkflowTool(definitions: readonly IWorkflowDefinition[]): OpenAIResponseTool {
  return {
    type: "function",
    name: START_WORKFLOW_TOOL_NAME,
    description: "Start one available workflow that matches the visitor's requested outcome.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["workflowId"],
      properties: {
        workflowId: {
          type: "string",
          enum: definitions.map((definition) => definition.id),
        },
      },
    },
  };
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

function parseWorkflowInstanceStatus(status: string): WorkflowInstanceStatus {
  const result = WorkflowInstanceStatusSchema.safeParse(status);

  if (!result.success) {
    throw new WorkflowServiceError("invalid_state", "The workflow status is invalid.");
  }

  return result.data;
}

function progressPhaseMatchesStatus(
  phase: WorkflowProgress["phase"],
  status: WorkflowPublicInstance["status"],
) {
  if (status === "active") {
    return phase !== "completed" && phase !== "cancelled";
  }

  return phase === status;
}

function createCancelWorkflowTool(): OpenAIResponseTool {
  return {
    type: "function",
    name: CANCEL_WORKFLOW_TOOL_NAME,
    description: "Cancel the active workflow when the visitor asks to stop it.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      required: [],
      properties: {},
    },
  };
}

function createSwitchWorkflowTools(
  definitions: readonly IWorkflowDefinition[],
  activeWorkflowId: string,
): OpenAIResponseTool[] {
  const workflowIds = definitions.filter(({ id }) => id !== activeWorkflowId).map(({ id }) => id);

  if (workflowIds.length === 0) {
    return [];
  }

  return [
    {
      type: "function",
      name: SWITCH_WORKFLOW_TOOL_NAME,
      description:
        "Cancel the active workflow and start another one only after the visitor explicitly chooses to switch.",
      strict: true,
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["workflowId"],
        properties: {
          workflowId: {
            type: "string",
            enum: workflowIds,
          },
        },
      },
    },
  ];
}
