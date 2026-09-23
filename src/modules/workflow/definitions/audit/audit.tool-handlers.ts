import type { Prisma } from "@/generated/prisma/client";
import type { IAuditService } from "@/modules/audit/public";
import type { WorkflowExecutionContext, WorkflowExecutionResult } from "../../workflow.types";
import {
  auditStateSchema,
  noAuditArgumentsSchema,
  updateAuditContextSchema,
  type AuditState,
  type AuditUpdateField,
} from "./audit.schema";
import {
  PREPARE_AUDIT_SUBMISSION_TOOL,
  SUBMIT_AUDIT_TOOL,
  UPDATE_AUDIT_CONTEXT_TOOL,
} from "./audit.tools";

const REQUIRED_FIELDS = [
  "focus",
  "currentProcess",
  "friction",
  "desiredOutcome",
  "name",
  "email",
] as const;

type RequiredAuditField = (typeof REQUIRED_FIELDS)[number];

type ExecuteAuditToolInput = {
  auditService: IAuditService;
  name: string;
  rawArguments: string;
  state: AuditState;
  context: WorkflowExecutionContext;
};

export async function executeAuditTool({
  auditService,
  name,
  rawArguments,
  state,
  context,
}: ExecuteAuditToolInput): Promise<WorkflowExecutionResult<AuditState>> {
  const args = parseArguments(rawArguments);

  if (args === null) {
    return active(state, invalidArguments());
  }

  if (name === UPDATE_AUDIT_CONTEXT_TOOL.name) {
    const parsed = updateAuditContextSchema.safeParse(args);

    return parsed.success
      ? updateContext(state, parsed.data.updates)
      : active(state, invalidArguments());
  }

  if (name === PREPARE_AUDIT_SUBMISSION_TOOL.name) {
    return noAuditArgumentsSchema.safeParse(args).success
      ? prepareSubmission(state, context)
      : active(state, invalidArguments());
  }

  if (name === SUBMIT_AUDIT_TOOL.name) {
    return noAuditArgumentsSchema.safeParse(args).success
      ? submitAudit(auditService, state, context)
      : active(state, invalidArguments());
  }

  return active(state, {
    error: "unknown_tool",
    message: "The requested workflow action is not available.",
  });
}

export function missingAuditFields(state: AuditState): RequiredAuditField[] {
  return REQUIRED_FIELDS.filter((field) => !state[field]);
}

function updateContext(
  state: AuditState,
  updates: Array<{ field: AuditUpdateField; value: string | null }>,
): WorkflowExecutionResult<AuditState> {
  const next: AuditState = { ...state };

  for (const update of updates) {
    const parsed = parseFieldValue(update.field, update.value);

    if (!parsed.success) {
      return active(state, {
        error: "invalid_audit_detail",
        field: update.field,
        message: "One audit detail was invalid. Correct it before continuing.",
      });
    }

    assignAuditField(next, update.field, parsed.data);
  }

  const validated = auditStateSchema.safeParse(next);

  if (!validated.success) {
    return active(state, invalidArguments());
  }

  const changed = updates.some(({ field }) => state[field] !== validated.data[field]);

  const nextState = changed ? { ...validated.data, preparedInteractionId: null } : validated.data;

  return active(nextState, {
    kind: "context_updated",
    missingRequiredFields: missingAuditFields(nextState),
    message:
      missingAuditFields(nextState).length > 0
        ? "Ask only for the remaining required audit details."
        : "All required audit details are available. Prepare the submission summary next.",
  });
}

function prepareSubmission(
  state: AuditState,
  context: WorkflowExecutionContext,
): WorkflowExecutionResult<AuditState> {
  const missing = missingAuditFields(state);

  if (missing.length > 0) {
    return active(state, {
      error: "incomplete_audit",
      missingRequiredFields: missing,
      message: "Collect only the missing required audit details before preparing a summary.",
    });
  }

  const nextState = { ...state, preparedInteractionId: context.interactionId };

  return active(nextState, {
    kind: "audit_preparation",
    summary: submissionSummary(nextState),
    requiresConfirmation: true,
    message: "Present this summary and ask the visitor to confirm it explicitly.",
  });
}

async function submitAudit(
  auditService: IAuditService,
  state: AuditState,
  context: WorkflowExecutionContext,
): Promise<WorkflowExecutionResult<AuditState>> {
  const missing = missingAuditFields(state);

  if (missing.length > 0 || !state.preparedInteractionId) {
    return active(state, {
      error: "preparation_required",
      message: "Prepare a complete audit summary before submission.",
    });
  }

  if (state.preparedInteractionId === context.interactionId) {
    return active(state, {
      error: "confirmation_requires_new_input",
      message: "Wait for the visitor to explicitly confirm the prepared summary.",
    });
  }

  await auditService.submit({
    workflowInstanceId: context.workflowInstanceId,
    focus: state.focus!,
    currentProcess: state.currentProcess!,
    friction: state.friction!,
    desiredOutcome: state.desiredOutcome!,
    name: state.name!,
    email: state.email!,
    businessName: state.businessName,
    websiteUrl: state.websiteUrl,
    additionalContext: state.additionalContext,
  });

  return {
    state,
    status: "completed",
    output: {
      kind: "audit_submitted",
      message:
        "The audit request was submitted for Freeman's personal review and is expected within 48 hours. Offer a short meeting, but start meeting booking only if the visitor accepts in a later message.",
    },
  };
}

function parseFieldValue(field: AuditUpdateField, value: string | null) {
  const optional = ["businessName", "websiteUrl", "additionalContext"].includes(field);

  if (value === null) {
    return optional ? ({ success: true, data: null } as const) : ({ success: false } as const);
  }

  const fieldSchema = auditStateSchema.shape[field].unwrap();

  return fieldSchema.safeParse(value);
}

function assignAuditField(state: AuditState, field: AuditUpdateField, value: string | null): void {
  Object.assign(state, { [field]: value });
}

function submissionSummary(state: AuditState): Prisma.JsonObject {
  return {
    focus: state.focus!,
    currentProcess: state.currentProcess!,
    friction: state.friction!,
    desiredOutcome: state.desiredOutcome!,
    name: state.name!,
    email: state.email!,
    businessName: state.businessName,
    websiteUrl: state.websiteUrl,
    additionalContext: state.additionalContext,
  };
}

function parseArguments(rawArguments: string): unknown | null {
  try {
    return JSON.parse(rawArguments);
  } catch {
    return null;
  }
}

function active(state: AuditState, output: Prisma.JsonObject): WorkflowExecutionResult<AuditState> {
  return { state, status: "active", output };
}

function invalidArguments() {
  return {
    error: "invalid_arguments",
    message: "Tool arguments did not match the required schema.",
  };
}
