import { activeWorkflowSchema, type WorkflowApproval } from "@/contracts/assistant.contract";

export async function approveWorkflow(approval: WorkflowApproval) {
  const response = await fetch("/api/workflow/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(approval),
  });

  if (response.status === 409) {
    return { status: "conflict" } as const;
  }

  if (!response.ok) {
    throw new Error("Could not confirm the request. Check its saved progress.");
  }

  return {
    status: "accepted",
    workflow: activeWorkflowSchema.nullable().parse(await response.json()),
  } as const;
}
