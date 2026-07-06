import type { ChatSource } from "./types";

type ChatStreamEvent =
  | { type: "sources"; sources: ChatSource[] }
  | { type: "response_id"; responseId: string }
  | { type: "delta"; delta: string }
  | { type: "done" }
  | { type: "error"; error: string };

type StreamChatResponseHandlers = {
  onDelta: (delta: string) => void;
  onResponseId: (responseId: string) => void;
  onSources: (sources: ChatSource[]) => void;
};

function parseStreamEvent(line: string): ChatStreamEvent {
  return JSON.parse(line) as ChatStreamEvent;
}

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    return typeof payload.error === "string" ? payload.error : "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export async function streamChatResponse(
  message: string,
  previousResponseId: string | null,
  handlers: StreamChatResponseHandlers,
) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, previousResponseId }),
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

    const event = parseStreamEvent(line);

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

    if (event.type === "error") {
      throw new Error(event.error);
    }

    return event.type === "done";
  }

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
}
