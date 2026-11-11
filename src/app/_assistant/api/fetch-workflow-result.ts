import {
  workflowResultResponseSchema,
  type WorkflowResultRequest,
} from "@/contracts/assistant.contract";

export async function fetchWorkflowResult(request: WorkflowResultRequest) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  return response.ok ? workflowResultResponseSchema.parse(await response.json()) : null;
}
