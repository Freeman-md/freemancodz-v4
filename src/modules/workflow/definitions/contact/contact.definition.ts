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
import {
  PREPARE_CONTACT_SUBMISSION_TOOL,
  SUBMIT_CONTACT_TOOL,
  UPDATE_CONTACT_CONTEXT_TOOL,
} from "./contact.tools";

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
    const missing = this.progress.getMissingRequiredFields(state);

    if (state.preparedInteractionId) {
      return `${CONTACT_INSTRUCTIONS}\nA complete summary has been prepared. Present it and wait for explicit confirmation in a later visitor message before calling submit_contact. If the visitor corrects anything, save every correction first and prepare a new summary.`;
    }

    if (missing.length === 0) {
      return `${CONTACT_INSTRUCTIONS}\nAll required details are known. Call prepare_contact_submission, present its summary, and ask for explicit confirmation.`;
    }

    return `${CONTACT_INSTRUCTIONS}\nStill missing: ${missing.join(", ")}. Save every useful detail supplied together, then ask only for genuinely missing required information.`;
  }

  getTools(state: ContactState): OpenAIResponseTool[] {
    if (state.preparedInteractionId) {
      return [UPDATE_CONTACT_CONTEXT_TOOL, PREPARE_CONTACT_SUBMISSION_TOOL, SUBMIT_CONTACT_TOOL];
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

const CONTACT_INSTRUCTIONS = `You are coordinating a message to Freeman for project enquiries, collaboration enquiries, and other general messages that do not belong in the Audit or Meeting Booking workflows. Extract and save every useful contact detail supplied, including corrections. Never repeat a question for known information. A durable submission requires a prepared summary and explicit confirmation in a subsequent visitor interaction.`;
