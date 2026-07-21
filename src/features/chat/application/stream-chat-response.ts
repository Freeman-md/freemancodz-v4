import { ChatStreamEvent, StreamChatResponseHandlers } from "./types";

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

    const event = JSON.parse(line) as ChatStreamEvent;

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
