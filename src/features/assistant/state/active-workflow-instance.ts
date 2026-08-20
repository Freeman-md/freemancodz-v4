import type { WorkflowPublicInstance } from "@/contracts/assistant.contract";

export function activeWorkflowInstanceId(instance: WorkflowPublicInstance) {
  return instance.status === "active" ? instance.id : null;
}
