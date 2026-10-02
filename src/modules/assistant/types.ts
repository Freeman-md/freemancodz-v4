import type { AssistantRequest, AssistantWorkflowStart } from "@/contracts/assistant.contract";
import type { AssistantInteractionReply } from "@/contracts/assistant-ui.contract";

export type AssistantResponseInput = {
  message?: string;
  interactionReply?: AssistantInteractionReply;
  interactionContext?: AssistantRequest["interactionContext"];
  previousResponseId: string | null;
  workflowInstanceId: string | null;
  workflowStart: AssistantWorkflowStart | null;
  signal: AbortSignal;
};
