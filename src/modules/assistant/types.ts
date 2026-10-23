import type {
  AssistantWorkflowStart,
  AssistantWorkflowAction,
} from "@/contracts/assistant.contract";

export type AssistantResponseInput = (
  | {
      message: string;
      previousResponseId: string | null;
      workflowInstanceId: string | null;
      workflowStart: AssistantWorkflowStart | null;
    }
  | AssistantWorkflowAction
) & { signal: AbortSignal };
