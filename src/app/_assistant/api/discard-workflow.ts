import type { WorkflowObservation } from "@/contracts/assistant.contract";

export async function discardWorkflow(draft: WorkflowObservation) {
  const response = await fetch("/api/workflow/discard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });

  if (response.status === 409) {
    return false;
  }

  if (!response.ok) {
    throw new Error("Could not discard the draft.");
  }

  return true;
}
