import type { AssistantWorkflowStart } from "@/contracts/assistant.contract";

export type AssistantResponseInput = {
  message: string;
  previousResponseId: string | null;
  workflowInstanceId: string | null;
  workflowStart: AssistantWorkflowStart | null;
  signal: AbortSignal;
};
