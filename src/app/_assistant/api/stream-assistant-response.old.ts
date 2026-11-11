import {
  assistantStreamEventSchema,
  WORKFLOW_ACCESS_DENIED,
  type AssistantRequest,
  type AssistantStreamEvent,
} from "@/contracts/assistant.contract";

export class WorkflowAccessError extends Error {}

async function getResponseError(response: Response) {
  try {
    const body: unknown = await response.json();

    if (typeof body === "object" && body && "error" in body && typeof body.error === "string") {
      return response.status === 403 && "code" in body && body.code === WORKFLOW_ACCESS_DENIED
        ? new WorkflowAccessError(body.error)
        : new Error(body.error);
    }
  } catch {
    // A non-JSON response is deliberately represented by the safe fallback below.
  }

  return new Error("The assistant request failed.");
}

function parseEvent(line: string) {
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

  return result.data;
}

export async function* streamAssistant(
  request: AssistantRequest,
): AsyncGenerator<AssistantStreamEvent> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await getResponseError(response);
  }

  if (!response.body) {
    throw new Error("Chat response stream is unavailable.");
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

  let buffer = "";

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
        if (!line.trim()) {
          continue;
        }

        const event = parseEvent(line);

        if (event.type === "error") {
          throw new Error(event.error);
        }

        yield event;

        if (event.type === "done") {
          return;
        }
      }
    }

    if (buffer.trim()) {
      const event = parseEvent(buffer);

      if (event.type === "error") {
        throw new Error(event.error);
      }

      yield event;
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}
