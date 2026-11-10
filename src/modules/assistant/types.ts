import type {
  AssistantWorkflowAction,
  AssistantWorkflowStatusAction,
} from "@/contracts/assistant.contract";

export type AssistantResponseInput = (
  | {
      message: string;
      previousResponseId: string | null;
      workflowInstanceId: string | null;
    }
  | AssistantWorkflowAction
  | AssistantWorkflowStatusAction
) & { signal: AbortSignal };
