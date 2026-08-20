import "server-only";

import type { OpenAIResponseTool } from "@/server/infrastructure/openai/models/openai-response-request";
import type { IWorkflowDefinition } from "../interfaces/workflow-definition.interface";
import type { IWorkflowInstanceRepository } from "../interfaces/workflow-instance.repository.interface";
import { WorkflowInstanceRepositoryError } from "../interfaces/workflow-instance.repository.interface";
import type { IWorkflowService } from "../interfaces/workflow.service.interface";
import type {
  WorkflowExecutionResult,
  WorkflowSemanticOutput,
} from "../models/workflow-definition";
import { WorkflowDefinitionRegistry } from "../models/workflow-definition-registry";
import {
  toWorkflowPublicInstance,
  type WorkflowInstance,
  type WorkflowStartContext,
} from "../models/workflow-instance";
import { toWorkflowJsonObject, type WorkflowJsonObject } from "../models/workflow-json";
import {
  WorkflowServiceError,
  type WorkflowAssistantContext,
  type WorkflowToolCall,
  type WorkflowToolExecutionResult,
} from "../models/workflow-service";
import {
  CancelWorkflowArgumentsSchema,
  StartWorkflowArgumentsSchema,
  WorkflowStartContextSchema,
} from "../schemas/workflow-control.schema";
import { CANCEL_WORKFLOW_TOOL_NAME, START_WORKFLOW_TOOL_NAME } from "../workflow.constants";

const INSTANCE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class WorkflowService implements IWorkflowService {
  private readonly globalToolNames: ReadonlySet<string>;

  constructor(
    private readonly registry: WorkflowDefinitionRegistry,
    private readonly repository: IWorkflowInstanceRepository,
    globalToolNames: readonly string[],
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.globalToolNames = validateGlobalToolNames(globalToolNames);
  }

  async start(workflowId: string, context: WorkflowStartContext): Promise<WorkflowInstance> {
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

    return this.runRepositoryOperation(() =>
      this.repository.create({
        workflowId: definition.id,
        workflowVersion: definition.version,
        state: initialState,
        ...validatedContext.data,
      }),
    );
  }

  async getAssistantContext(instanceId: string | null): Promise<WorkflowAssistantContext> {
    if (instanceId === null) {
      return this.createStartContext();
    }

    const instance = await this.loadInstance(instanceId);

    const definition = this.resolveDefinition(instance);

    const state = this.validateState(definition, instance.state);

    if (instance.status !== "active") {
      return {
        instructions: "",
        tools: [],
        instance: toWorkflowPublicInstance(instance),
      };
    }

    return {
      instructions: this.getDefinitionInstructions(definition, state),
      tools: [createCancelWorkflowTool(), ...this.getDefinitionTools(definition, state)],
      instance: toWorkflowPublicInstance(instance),
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

    if (toolCall.name === CANCEL_WORKFLOW_TOOL_NAME) {
      parseControlArguments(toolCall.rawArguments, CancelWorkflowArgumentsSchema);
      const cancelled = await this.cancelLoadedInstance(instance);

      return {
        output: { message: "The workflow was cancelled." },
        instance: toWorkflowPublicInstance(cancelled),
      };
    }

    const definition = this.resolveDefinition(instance);

    const state = this.validateState(definition, instance.state);

    const currentTools = this.getDefinitionTools(definition, state);

    if (!currentTools.some((tool) => tool.name === toolCall.name)) {
      throw new WorkflowServiceError(
        "unavailable_tool",
        "That workflow action is no longer available.",
      );
    }

    const execution = await this.executeDefinitionTool(definition, toolCall, state);

    const nextState = this.validateState(definition, execution.state);

    const output = this.validateSemanticOutput(execution.output);

    const status = validateExecutionStatus(execution);

    if (status === "active") {
      this.getDefinitionInstructions(definition, nextState);
      this.getDefinitionTools(definition, nextState);
    }

    const completedAt = status === "completed" ? this.clock() : null;

    const saved = await this.runRepositoryOperation(() =>
      this.repository.save({
        id: instance.id,
        state: nextState,
        status,
        completedAt,
      }),
    );

    return { output, instance: toWorkflowPublicInstance(saved) };
  }

  async cancel(instanceId: string): Promise<WorkflowInstance> {
    const instance = await this.loadInstance(instanceId);

    if (instance.status !== "active") {
      throw new WorkflowServiceError(
        "invalid_transition",
        "The workflow instance is already terminal.",
      );
    }

    return this.cancelLoadedInstance(instance);
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
      instance: toWorkflowPublicInstance(instance),
    };
  }

  private async cancelLoadedInstance(instance: WorkflowInstance): Promise<WorkflowInstance> {
    const definition = this.resolveDefinition(instance);

    const state = this.validateState(definition, instance.state);

    return this.runRepositoryOperation(() =>
      this.repository.save({
        id: instance.id,
        status: "cancelled",
        state,
        completedAt: null,
      }),
    );
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
  ): WorkflowJsonObject {
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

  private validateState(definition: IWorkflowDefinition, state: unknown): WorkflowJsonObject {
    const result = definition.stateSchema.safeParse(state);

    if (!result.success) {
      throw new WorkflowServiceError("invalid_state", "The workflow state is invalid.");
    }

    try {
      return toWorkflowJsonObject(result.data);
    } catch (error) {
      throw new WorkflowServiceError("invalid_state", "The workflow state is invalid.", {
        cause: error,
      });
    }
  }

  private getDefinitionInstructions(
    definition: IWorkflowDefinition,
    state: WorkflowJsonObject,
  ): string {
    try {
      const instructions = definition.getInstructions(state);

      if (typeof instructions !== "string") {
        throw new Error("Workflow instructions must be text.");
      }

      return instructions;
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
    state: WorkflowJsonObject,
  ): OpenAIResponseTool[] {
    let tools: OpenAIResponseTool[];

    try {
      tools = definition.getTools(state);
    } catch (error) {
      throw new WorkflowServiceError("configuration_error", "The workflow tools are unavailable.", {
        cause: error,
      });
    }

    const seen = new Set<string>();

    for (const tool of tools) {
      if (!tool.name || tool.name.trim() !== tool.name || seen.has(tool.name)) {
        throw new WorkflowServiceError(
          "configuration_error",
          "The workflow tool configuration is invalid.",
        );
      }

      if (
        tool.name === START_WORKFLOW_TOOL_NAME ||
        tool.name === CANCEL_WORKFLOW_TOOL_NAME ||
        this.globalToolNames.has(tool.name)
      ) {
        throw new WorkflowServiceError(
          "configuration_error",
          "The workflow tool configuration collides with a reserved tool.",
        );
      }

      seen.add(tool.name);
    }

    return [...tools];
  }

  private async executeDefinitionTool(
    definition: IWorkflowDefinition,
    toolCall: WorkflowToolCall,
    state: WorkflowJsonObject,
  ): Promise<WorkflowExecutionResult<WorkflowJsonObject>> {
    try {
      return await definition.executeTool(toolCall.name, toolCall.rawArguments, state, {
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

  private validateSemanticOutput(output: unknown): WorkflowSemanticOutput {
    try {
      return toWorkflowJsonObject(output);
    } catch (error) {
      throw new WorkflowServiceError(
        "execution_failed",
        "The workflow returned an invalid result.",
        { cause: error },
      );
    }
  }

  private async runRepositoryOperation<Result>(operation: () => Promise<Result>): Promise<Result> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof WorkflowInstanceRepositoryError && error.code === "terminal") {
        throw new WorkflowServiceError(
          "invalid_transition",
          "The workflow instance is already terminal.",
          { cause: error },
        );
      }

      if (error instanceof WorkflowInstanceRepositoryError && error.code === "not_found") {
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

function validateGlobalToolNames(globalToolNames: readonly string[]): ReadonlySet<string> {
  const names = new Set<string>();

  for (const name of globalToolNames) {
    if (!name || name.trim() !== name || names.has(name)) {
      throw new WorkflowServiceError(
        "configuration_error",
        "The global assistant tool configuration is invalid.",
      );
    }

    if (name === START_WORKFLOW_TOOL_NAME || name === CANCEL_WORKFLOW_TOOL_NAME) {
      throw new WorkflowServiceError(
        "configuration_error",
        "A global assistant tool collides with workflow control.",
      );
    }

    names.add(name);
  }

  return names;
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

function validateExecutionStatus(
  execution: WorkflowExecutionResult<WorkflowJsonObject>,
): "active" | "completed" {
  if (execution.status !== "active" && execution.status !== "completed") {
    throw new WorkflowServiceError(
      "execution_failed",
      "The workflow returned an invalid lifecycle result.",
    );
  }

  return execution.status;
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
