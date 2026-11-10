import type { AssistantWorkflowAction } from "@/contracts/assistant.contract";

export type AssistantResponseInput = (
  | {
      message: string;
      previousResponseId: string | null;
      workflowInstanceId: string | null;
    }
  | AssistantWorkflowAction
) & { signal: AbortSignal };
