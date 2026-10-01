import "server-only";

import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import type { AuditService } from "@/modules/audit/service";
import type { IWorkflowDefinition, IWorkflowProgressProjector } from "../../interfaces";
import type {
  WorkflowExecutionContext,
  WorkflowExecutionResult,
  WorkflowStartContext,
} from "../../types";
import { auditStateSchema, type AuditState } from "./audit.schema";
import { executeAuditTool } from "./audit.tool-handlers";
import {
  PREPARE_AUDIT_SUBMISSION_TOOL,
  SUBMIT_AUDIT_TOOL,
  UPDATE_AUDIT_CONTEXT_TOOL,
} from "./audit.tools";

export const AUDIT_WORKFLOW_ID = "audit";

export class AuditWorkflowDefinition implements IWorkflowDefinition<AuditState> {
  readonly id = AUDIT_WORKFLOW_ID;

  readonly version = 1;

  readonly description = "Request a free review of one customer journey or operational workflow.";

  readonly stateSchema = auditStateSchema;

  constructor(
    private readonly auditService: Pick<AuditService, "submit">,
    private readonly progress: IWorkflowProgressProjector<AuditState>,
  ) {}

  createInitialState(_context: WorkflowStartContext): AuditState {
    return {
      focus: null,
      currentProcess: null,
      friction: null,
      desiredOutcome: null,
      name: null,
      email: null,
      businessName: null,
      websiteUrl: null,
      additionalContext: null,
      preparedInteractionId: null,
    };
  }

  getProgress(state: AuditState, status: "active" | "completed" | "cancelled") {
    return this.progress.getProgress(state, status);
  }

  getInstructions(state: AuditState): string {
    const missing = this.progress.getMissingRequiredFields(state);

    if (state.preparedInteractionId) {
      return `${AUDIT_INSTRUCTIONS}\nA complete summary has been prepared. Present it and wait for explicit confirmation in a later visitor message before calling submit_audit. If the visitor corrects anything, save every correction first and prepare a new summary.`;
    }

    if (missing.length === 0) {
      return `${AUDIT_INSTRUCTIONS}\nAll required details are known. Call prepare_audit_submission, present its semantic summary, and ask for explicit confirmation.`;
    }

    return `${AUDIT_INSTRUCTIONS}\nStill missing: ${missing.join(", ")}. Save every useful detail in the visitor's message together, then ask only for genuinely missing required information. Narrow a broad request to one journey or workflow.`;
  }

  getTools(state: AuditState): OpenAIResponseTool[] {
    if (state.preparedInteractionId) {
      return [UPDATE_AUDIT_CONTEXT_TOOL, PREPARE_AUDIT_SUBMISSION_TOOL, SUBMIT_AUDIT_TOOL];
    }

    return this.progress.getMissingRequiredFields(state).length === 0
      ? [UPDATE_AUDIT_CONTEXT_TOOL, PREPARE_AUDIT_SUBMISSION_TOOL]
      : [UPDATE_AUDIT_CONTEXT_TOOL];
  }

  executeTool(
    name: string,
    rawArguments: string,
    state: AuditState,
    context: WorkflowExecutionContext,
  ): Promise<WorkflowExecutionResult<AuditState>> {
    return executeAuditTool({
      auditService: this.auditService,
      progress: this.progress,
      name,
      rawArguments,
      state,
      context,
    });
  }
}

const AUDIT_INSTRUCTIONS = `You are coordinating Freeman's free customer journey and workflow Audit. Extract and save every useful audit detail the visitor supplies, including corrections. Never repeat a question for known information. The visitor may ask unrelated portfolio questions; answer those through the global website search without cancelling this workflow. Do not force hiring, project, role or general collaboration enquiries into this Audit. A durable submission requires a prepared summary and explicit confirmation in a subsequent visitor interaction.`;
