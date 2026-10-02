import "server-only";

import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import type { ContactService } from "@/modules/contact/service";
import type { IWorkflowDefinition, IWorkflowProgressProjector } from "../../interfaces";
import type {
  WorkflowExecutionContext,
  WorkflowExecutionResult,
  WorkflowStartContext,
} from "../../types";
import {
  contactStateSchema,
  CONTACT_TEXT_MAX_LENGTH,
  CONTACT_MESSAGE_MAX_LENGTH,
  type ContactState,
} from "./contact.schema";
import { executeContactTool, updateContactContext } from "./contact.tool-handlers";
import { contactUpdateFieldSchema } from "./contact.schema";
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

  readonly inputCapabilities = {
    getFields: (state: ContactState) =>
      [
        {
          field: "name",
          component: "InputField" as const,
          inputType: "text" as const,
          maxLength: CONTACT_TEXT_MAX_LENGTH,
          value: state.name ?? "",
        },
        {
          field: "email",
          component: "InputField" as const,
          inputType: "email" as const,
          maxLength: CONTACT_TEXT_MAX_LENGTH,
          value: state.email ?? "",
        },
        {
          field: "message",
          component: "TextArea" as const,
          inputType: null,
          maxLength: CONTACT_MESSAGE_MAX_LENGTH,
          value: state.message ?? "",
        },
        {
          field: "businessName",
          component: "InputField" as const,
          inputType: "text" as const,
          maxLength: CONTACT_TEXT_MAX_LENGTH,
          value: state.businessName ?? "",
        },
      ].map((control) => ({
        ...control,
        required: this.progress
          .getProgress(state, "active")
          .fields.some((field) => field.key === control.field && field.required),
      })),
    apply: (state: ContactState, values: Record<string, string>) => {
      const updates = Object.entries(values).map(([field, value]) => ({
        field: contactUpdateFieldSchema.parse(field),
        value: value.trim() || null,
      }));

      const fieldErrors: Record<string, string> = {};

      for (const update of updates) {
        const checked = updateContactContext(this.progress, state, [update]);

        if (checked.output.error) {
          fieldErrors[update.field] = "Enter a valid contact detail.";
        }
      }

      if (Object.keys(fieldErrors).length) {
        return { state, fieldErrors };
      }

      const result = updateContactContext(this.progress, state, updates);

      // Structured collection is never confirmation, even if unchanged values are resubmitted.
      return { state: { ...result.state, preparedInteractionId: null }, fieldErrors };
    },
  };

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

    return `${CONTACT_INSTRUCTIONS}\nInternal missing fields: ${missing.join(", ")}. Do not read this list out as a checklist. Save all valid details supplied together, then ask for the next useful missing answer, or at most two closely related answers.`;
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

const CONTACT_INSTRUCTIONS = `You are coordinating a message to Freeman for project enquiries, collaboration enquiries, and other general messages that do not belong in the Audit or Meeting Booking workflows.
Begin conversationally with a brief acknowledgement and the next useful question, not a form containing every missing field. Normally collect one answer at a time, or two closely related answers. If the visitor has already explained their message, save it instead of asking them to repeat it.
Extract and save all valid details the visitor supplies together, including corrections, even when they answer more than you asked. Never repeat a question for known information. Your suggestions and examples are not visitor facts unless the visitor explicitly adopts them.
Prefer ordinary chat for substantive questions and message content. Use permitted InputField controls when precise name or email collection would help; a TextArea is optional when useful for a longer answer, not a requirement to continue. Briefly introduce any controls conversationally rather than presenting a bare form.
Answer unrelated portfolio questions normally, using website search when needed, without cancelling this workflow or forcing the visitor back into collection.
A durable submission requires a prepared summary and explicit confirmation in a subsequent visitor message. Supplying details, submitting controls, or saying continue never counts as confirmation to send.`;
