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
import { PREPARE_AUDIT_SUBMISSION_TOOL, UPDATE_AUDIT_CONTEXT_TOOL } from "./audit.tools";

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
    if (state.confirmedRevision != null) {
      return "Submission has been accepted. Details are frozen; use the application retry control if recovery is needed.";
    }

    const missing = this.progress.getMissingRequiredFields(state);

    if (state.preparedInteractionId) {
      return `${AUDIT_INSTRUCTIONS}\nA complete summary has been prepared. The application displays its confirmation button. Only that button can authorise submission, never a chat reply. If the visitor corrects anything, save every correction first and prepare a new summary.`;
    }

    if (missing.length === 0) {
      return `${AUDIT_INSTRUCTIONS}\nAll required details are known. Call prepare_audit_submission, present its semantic summary, and ask for explicit confirmation.`;
    }

    return `${AUDIT_INSTRUCTIONS}\nInternal missing fields: ${missing.join(", ")}. Do not present this list as a checklist or ask for all six required details. Save all valid details in the visitor's message together, then ask for the next useful missing answer, or at most two closely related answers. Narrow a broad request to one journey or workflow.`;
  }

  getTools(state: AuditState): OpenAIResponseTool[] {
    if (state.confirmedRevision != null) {
      return [];
    }

    if (state.preparedInteractionId) {
      return [UPDATE_AUDIT_CONTEXT_TOOL, PREPARE_AUDIT_SUBMISSION_TOOL];
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

const AUDIT_INSTRUCTIONS = `You are coordinating Freeman's free customer journey and workflow Audit.
Start with a brief conversational acknowledgement and an ordinary chat question about the problem or customer journey the visitor wants to improve, unless they have already explained it. Do not open with a form, a six-field intake request, or contact details before understanding the problem.
Prefer ordinary chat for substantive questions about the current process, friction and desired outcome. Collect gradually: normally one answer, or at most two closely related answers. Follow what the visitor tells you rather than reciting every missing field.
Extract and save all valid audit details the visitor supplies together, including corrections, even when they answer more than you asked. Never repeat a question for known information. Treat your suggestions, examples and possible diagnoses as unconfirmed, not facts to save, unless the visitor explicitly adopts them.
The visitor may ask unrelated portfolio questions; answer those through the global website search without cancelling this workflow. Do not force hiring, project, role or general collaboration enquiries into this Audit.
A durable submission requires a prepared summary and the application confirmation button. Supplying details, or saying continue never counts as confirmation to submit the audit.`;
