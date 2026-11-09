import "server-only";

import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import type { ContactService } from "@/modules/contact/service";
import type { IWorkflowDefinition, IWorkflowProgressProjector } from "../../interfaces";
import type {
  WorkflowExecutionContext,
  WorkflowExecutionResult,
  WorkflowStartContext,
} from "../../types";
import { contactStateSchema, type ContactState } from "./contact.schema";
import { executeContactTool } from "./contact.tool-handlers";
import { PREPARE_CONTACT_SUBMISSION_TOOL, UPDATE_CONTACT_CONTEXT_TOOL } from "./contact.tools";

export const CONTACT_WORKFLOW_ID = "contact";

export class ContactWorkflowDefinition implements IWorkflowDefinition<ContactState> {
  readonly id = CONTACT_WORKFLOW_ID;

  readonly version = 1;

  readonly description = "Send Freeman a project, collaboration, or general enquiry.";

  readonly stateSchema = contactStateSchema;

  constructor(
    private readonly contactService: Pick<ContactService, "submit">,
    private readonly progress: IWorkflowProgressProjector<ContactState>,
  ) {}

  createInitialState(_context: WorkflowStartContext): ContactState {
    return {
      name: null,
      email: null,
      message: null,
      businessName: null,
      preparedInteractionId: null,
    };
  }

  getProgress(state: ContactState, status: "active" | "completed" | "cancelled") {
    return this.progress.getProgress(state, status);
  }

  getInstructions(state: ContactState): string {
    if (state.confirmedRevision != null) {
      return "Submission has been accepted. Details are frozen; use the application retry control if recovery is needed.";
    }

    const missing = this.progress.getMissingRequiredFields(state);

    if (state.preparedInteractionId) {
      return `${CONTACT_INSTRUCTIONS}\nA complete summary has been prepared. The application displays its confirmation button. Only that button can authorise submission, never a chat reply. If the visitor corrects anything, save every correction first and prepare a new summary.`;
    }

    if (missing.length === 0) {
      return `${CONTACT_INSTRUCTIONS}\nAll required details are known. Call prepare_contact_submission, present its summary, and ask for explicit confirmation.`;
    }

    return `${CONTACT_INSTRUCTIONS}\nInternal missing fields: ${missing.join(", ")}. Do not read this list out as a checklist. Save all valid details supplied together, then ask for the next useful missing answer, or at most two closely related answers.`;
  }

  getTools(state: ContactState): OpenAIResponseTool[] {
    if (state.confirmedRevision != null) {
      return [];
    }

    if (state.preparedInteractionId) {
      return [UPDATE_CONTACT_CONTEXT_TOOL, PREPARE_CONTACT_SUBMISSION_TOOL];
    }

    return this.progress.getMissingRequiredFields(state).length === 0
      ? [UPDATE_CONTACT_CONTEXT_TOOL, PREPARE_CONTACT_SUBMISSION_TOOL]
      : [UPDATE_CONTACT_CONTEXT_TOOL];
  }

  executeTool(
    name: string,
    rawArguments: string,
    state: ContactState,
    context: WorkflowExecutionContext,
  ): Promise<WorkflowExecutionResult<ContactState>> {
    return executeContactTool({
      contactService: this.contactService,
      progress: this.progress,
      name,
      rawArguments,
      state,
      context,
    });
  }
}

const CONTACT_INSTRUCTIONS = `You are coordinating a message to Freeman for project enquiries, collaboration enquiries, and other general messages that do not belong in the Meeting Booking workflow.
Begin conversationally with a brief acknowledgement and the next useful question, not a form containing every missing field. Normally collect one answer at a time, or two closely related answers. If the visitor has already explained their message, save it instead of asking them to repeat it.
Extract and save all valid details the visitor supplies together, including corrections, even when they answer more than you asked. Never repeat a question for known information. Your suggestions and examples are not visitor facts unless the visitor explicitly adopts them.
Answer unrelated portfolio questions normally, using website search when needed, without cancelling this workflow or forcing the visitor back into collection.
A durable submission requires a prepared summary and the application confirmation button. Supplying details or saying continue never counts as confirmation to send.`;
