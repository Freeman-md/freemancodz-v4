import type { AssistantPresentation } from "@/contracts/assistant-ui.contract";
import type { IWorkflowService } from "@/modules/workflow/interfaces";
import { WorkflowServiceError } from "@/modules/workflow/errors";
import type { AssistantToolResult } from "../execute";
import { prepareConversationalInteraction } from "../../interactions";

export async function presentUI(
  presentation: AssistantPresentation,
  workflow: Pick<IWorkflowService, "prepareInteraction">,
  context: {
    workflowInstanceId: string | null;
    requestedWorkflowId?: string;
    conversationOnly?: boolean;
    workflowFields?: readonly string[];
  },
): Promise<AssistantToolResult> {
  try {
    if (context.conversationOnly && presentation.operation !== "conversation") {
      return unavailableInputs();
    }

    if (presentation.operation === "fields" && presentation.targetWorkflowId !== null) {
      return unavailableInputs(
        "For operation fields, targetWorkflowId must be null, not the active workflow ID. Retry present_ui with targetWorkflowId null and the permitted inputFields. Only workflow_choice uses a targetWorkflowId.",
      );
    }

    if (
      presentation.operation === "conversation" &&
      presentation.controls.some(({ field }) => context.workflowFields?.includes(field))
    ) {
      return unavailableInputs(
        "These fields belong to the active workflow. Use its permitted field controls or collect them through ordinary chat.",
      );
    }

    const interaction =
      presentation.operation === "conversation"
        ? prepareConversationalInteraction(presentation)
        : await workflow.prepareInteraction(
            context.workflowInstanceId,
            presentation,
            context.requestedWorkflowId,
          );

    if (
      !interaction ||
      (context.requestedWorkflowId && presentation.operation === "conversation")
    ) {
      return unavailableInputs();
    }

    return {
      output: { message: "Inputs presented. Wait for the visitor to submit them." },
      sources: [],
      interaction,
      introduction: presentation.introduction,
    };
  } catch (error) {
    if (
      error instanceof WorkflowServiceError &&
      (error.code === "invalid_request" || error.code === "invalid_transition")
    ) {
      return unavailableInputs();
    }

    throw error;
  }
}

function unavailableInputs(
  message = "Those inputs are not permitted for this request.",
): AssistantToolResult {
  return {
    output: {
      error: "unavailable_inputs",
      message,
    },
    sources: [],
  };
}
