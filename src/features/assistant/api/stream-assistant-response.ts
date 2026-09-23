import {
  assistantStreamEventSchema,
  type AssistantWorkflowStart,
} from "@/contracts/assistant.contract";
import type { StreamChatResponseHandlers } from "../types";

async function getErrorMessage(response: Response) {
  try {
    const body: unknown = await response.json();

    if (typeof body === "object" && body && "error" in body && typeof body.error === "string") {
      return body.error;
    }
  } catch {
    // A non-JSON response is deliberately represented by the safe fallback below.
  }

  return "The assistant request failed.";
}

export async function streamChatResponse(
  message: string,
  previousResponseId: string | null,
  workflowInstanceId: string | null,
  handlers: StreamChatResponseHandlers,
  workflowStart: AssistantWorkflowStart | null = null,
) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      previousResponseId,
      workflowInstanceId,
      ...(workflowStart ? { workflowStart } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  if (!response.body) {
    throw new Error("Chat response stream is unavailable.");
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

  let buffer = "";

  function handleLine(line: string) {
    if (!line.trim()) {
      return false;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(line);
    } catch {
      throw new Error("The assistant returned an invalid response.");
    }

    const result = assistantStreamEventSchema.safeParse(parsed);

    if (!result.success) {
      throw new Error("The assistant returned an invalid response.");
    }

    const event = result.data;

    if (event.type === "sources") {
      handlers.onSources(event.sources);

      return false;
    }

    if (event.type === "delta") {
      handlers.onDelta(event.delta);

      return false;
    }

    if (event.type === "response_id") {
      handlers.onResponseId(event.responseId);

      return false;
    }

    if (event.type === "workflow_instance") {
      handlers.onWorkflow(event.instance);

      return false;
    }

    if (event.type === "error") {
      throw new Error(event.error);
    }

    return event.type === "done";
  }

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += value;
      const lines = buffer.split("\n");

      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (handleLine(line)) {
          return;
        }
      }
    }

    if (buffer.trim()) {
      handleLine(buffer);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}
