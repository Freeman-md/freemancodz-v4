import { activeWorkflowSchema } from "@/contracts/assistant.contract";

export async function fetchActiveWorkflow(signal: AbortSignal) {
  const response = await fetch("/api/chat", { cache: "no-store", signal });

  if (!response.ok) {
    throw new Error("Could not restore workflow progress.");
  }

  return activeWorkflowSchema.nullable().parse(await response.json());
}
