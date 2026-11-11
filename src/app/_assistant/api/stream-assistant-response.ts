import { assistantStreamEventSchema, type AssistantRequest } from "@/contracts/assistant.contract";

type ChatRequest = Pick<
  Extract<AssistantRequest, { message: string }>,
  "message" | "previousResponseId"
>;

export async function* streamAssistant(request: ChatRequest) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);

    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : "The assistant request failed.";

    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("The assistant response was unavailable.");
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        throw new Error("The assistant reply was interrupted. Please try again.");
      }

      buffer += value;

      const lines = buffer.split("\n");

      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        const event = assistantStreamEventSchema.parse(JSON.parse(line));

        if (event.type === "error") {
          throw new Error(event.error);
        }

        yield event;

        if (event.type === "done") {
          return;
        }
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
