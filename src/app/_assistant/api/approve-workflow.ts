import {
  activeWorkflowSchema,
  type ActiveWorkflow,
  type AssistantActivity,
  type WorkflowApproval,
} from "@/contracts/assistant.contract";
import { readAssistantStream } from "./stream-assistant-response";

export async function approveWorkflow(
  approval: WorkflowApproval,
  onActivity: (activity: AssistantActivity) => void,
) {
  const response = await fetch("/api/workflow/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
    body: JSON.stringify(approval),
  });

  if (response.status === 409) {
    return { status: "conflict" } as const;
  }

  if (!response.ok) {
    throw new Error("Could not confirm the request. Check its saved progress.");
  }

  if (response.headers.get("content-type")?.startsWith("application/x-ndjson")) {
    let workflow: ActiveWorkflow | null = null;

    for await (const event of readAssistantStream(response)) {
      if (event.type === "activity") {
        onActivity(event);
      } else if (event.type === "workflow_instance") {
        workflow = event.instance;
      }
    }

    if (!workflow) {
      throw new Error("Could not read the saved progress.");
    }

    return { status: "accepted", workflow } as const;
  }

  return {
    status: "accepted",
    workflow: activeWorkflowSchema.nullable().parse(await response.json()),
  } as const;
}
