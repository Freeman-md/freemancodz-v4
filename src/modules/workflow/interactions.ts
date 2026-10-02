import { z } from "zod";
import {
  assistantInteractionSchema,
  type AssistantPresentation,
  type AssistantInteraction,
} from "@/contracts/assistant-ui.contract";
import type { IWorkflowDefinition } from "./interfaces";
import type { Prisma } from "@/generated/prisma/client";
import { WorkflowServiceError } from "./errors";

export const pendingInteractionSchema = z
  .object({
    interaction: assistantInteractionSchema,
    operation: z.enum(["fields", "workflow_choice"]),
    targetWorkflowId: z.string().nullable(),
  })
  .strict();

export function bindInteractionControls(
  presentation: AssistantPresentation,
  definition: IWorkflowDefinition,
  state: Prisma.JsonObject,
): AssistantInteraction["controls"] {
  if (
    new Set(presentation.controls.map(({ field }) => field)).size !== presentation.controls.length
  ) {
    throw new WorkflowServiceError("invalid_request", "Each field may appear only once.");
  }

  if (presentation.operation === "workflow_choice") {
    const [control] = presentation.controls;

    if (
      presentation.controls.length !== 1 ||
      control.field !== "choice" ||
      control.component !== "OptionSelector" ||
      control.inputType !== null ||
      !control.options ||
      control.options.length !== 2 ||
      new Set(control.options.map(({ value }) => value)).size !== 2 ||
      !control.options.every(({ value }) => value === "continue" || value === "switch")
    ) {
      throw new WorkflowServiceError("invalid_request", "The workflow choice is invalid.");
    }

    return [{ ...control, required: true, maxLength: 8, value: "" }];
  }

  if (presentation.targetWorkflowId !== null || !definition.inputCapabilities) {
    throw new WorkflowServiceError("invalid_request", "These workflow inputs are unavailable.");
  }

  const permitted = definition.inputCapabilities.getFields(state);

  return presentation.controls.map((control) => {
    const field = permitted.find(({ field }) => field === control.field);

    if (
      !field ||
      field.component !== control.component ||
      field.inputType !== control.inputType ||
      control.options !== null
    ) {
      throw new WorkflowServiceError("invalid_request", "That field or control is unavailable.");
    }

    return { ...control, ...field, options: null };
  });
}
