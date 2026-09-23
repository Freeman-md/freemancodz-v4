import type { Prisma } from "@/generated/prisma/client";
import type { ContactService } from "@/modules/contact/service";
import type { WorkflowExecutionContext, WorkflowExecutionResult } from "../../types";
import {
  contactStateSchema,
  noContactArgumentsSchema,
  updateContactContextSchema,
  type ContactState,
  type ContactUpdateField,
} from "./contact.schema";
import {
  PREPARE_CONTACT_SUBMISSION_TOOL,
  SUBMIT_CONTACT_TOOL,
  UPDATE_CONTACT_CONTEXT_TOOL,
} from "./contact.tools";

const REQUIRED_FIELDS = ["name", "email", "message"] as const;

export function missingContactFields(state: ContactState) {
  return REQUIRED_FIELDS.filter((field) => !state[field]);
}

export async function executeContactTool({
  contactService,
  name,
  rawArguments,
  state,
  context,
}: {
  contactService: Pick<ContactService, "submit">;
  name: string;
  rawArguments: string;
  state: ContactState;
  context: WorkflowExecutionContext;
}): Promise<WorkflowExecutionResult<ContactState>> {
  const args = parseArguments(rawArguments);

  if (args === null) {
    return active(state, invalidArguments());
  }

  if (name === UPDATE_CONTACT_CONTEXT_TOOL.name) {
    const parsed = updateContactContextSchema.safeParse(args);

    return parsed.success
      ? updateContext(state, parsed.data.updates)
      : active(state, invalidArguments());
  }

  if (name === PREPARE_CONTACT_SUBMISSION_TOOL.name) {
    return noContactArgumentsSchema.safeParse(args).success
      ? prepareSubmission(state, context)
      : active(state, invalidArguments());
  }

  if (name === SUBMIT_CONTACT_TOOL.name) {
    return noContactArgumentsSchema.safeParse(args).success
      ? submitContact(contactService, state, context)
      : active(state, invalidArguments());
  }

  return active(state, {
    error: "unknown_tool",
    message: "The requested workflow action is not available.",
  });
}

function updateContext(
  state: ContactState,
  updates: Array<{ field: ContactUpdateField; value: string | null }>,
): WorkflowExecutionResult<ContactState> {
  const next: ContactState = { ...state };

  for (const update of updates) {
    const parsed = parseFieldValue(update.field, update.value);

    if (!parsed.success) {
      return active(state, {
        error: "invalid_contact_detail",
        field: update.field,
        message: "One contact detail was invalid. Correct it before continuing.",
      });
    }

    Object.assign(next, { [update.field]: parsed.data });
  }

  const validated = contactStateSchema.safeParse(next);

  if (!validated.success) {
    return active(state, invalidArguments());
  }

  const changed = updates.some(({ field }) => state[field] !== validated.data[field]);

  const nextState = changed ? { ...validated.data, preparedInteractionId: null } : validated.data;

  const missing = missingContactFields(nextState);

  return active(nextState, {
    kind: "context_updated",
    missingRequiredFields: missing,
    message:
      missing.length > 0
        ? "Ask only for the remaining required contact details."
        : "All required contact details are available. Prepare the submission summary next.",
  });
}

function prepareSubmission(
  state: ContactState,
  context: WorkflowExecutionContext,
): WorkflowExecutionResult<ContactState> {
  const missing = missingContactFields(state);

  if (missing.length > 0) {
    return active(state, {
      error: "incomplete_contact",
      missingRequiredFields: missing,
      message: "Collect only the missing required contact details before preparing a summary.",
    });
  }

  const nextState = { ...state, preparedInteractionId: context.interactionId };

  return active(nextState, {
    kind: "contact_preparation",
    summary: {
      name: nextState.name!,
      email: nextState.email!,
      message: nextState.message!,
      businessName: nextState.businessName,
    },
    requiresConfirmation: true,
    message: "Present this summary and ask the visitor to confirm it explicitly.",
  });
}

async function submitContact(
  contactService: Pick<ContactService, "submit">,
  state: ContactState,
  context: WorkflowExecutionContext,
): Promise<WorkflowExecutionResult<ContactState>> {
  if (missingContactFields(state).length > 0 || !state.preparedInteractionId) {
    return active(state, {
      error: "preparation_required",
      message: "Prepare a complete contact summary before submission.",
    });
  }

  if (state.preparedInteractionId === context.interactionId) {
    return active(state, {
      error: "confirmation_requires_new_input",
      message: "Wait for the visitor to explicitly confirm the prepared summary.",
    });
  }

  await contactService.submit({
    workflowInstanceId: context.workflowInstanceId,
    name: state.name!,
    email: state.email!,
    message: state.message!,
    businessName: state.businessName,
  });

  return {
    state,
    status: "completed",
    output: {
      kind: "contact_submitted",
      message: "Your message was sent to Freeman.",
    },
  };
}

function parseFieldValue(field: ContactUpdateField, value: string | null) {
  if (value === null) {
    return field === "businessName"
      ? ({ success: true, data: null } as const)
      : ({ success: false } as const);
  }

  return contactStateSchema.shape[field].unwrap().safeParse(value);
}

function parseArguments(rawArguments: string): unknown | null {
  try {
    return JSON.parse(rawArguments);
  } catch {
    return null;
  }
}

function active(
  state: ContactState,
  output: Prisma.JsonObject,
): WorkflowExecutionResult<ContactState> {
  return { state, status: "active", output };
}

function invalidArguments() {
  return {
    error: "invalid_arguments",
    message: "Tool arguments did not match the required schema.",
  };
}
