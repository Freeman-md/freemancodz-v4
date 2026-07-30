import "server-only";

import { createOpenAIClient, getResponseModel } from "@/server/infrastructure/openai/openai-client";

export function streamOpenAIResponse(input: string, instructions: string, previousResponseId: string | null, signal: AbortSignal) {
  return createOpenAIClient().responses.create({
    model: getResponseModel(),
    instructions,
    input,
    previous_response_id: previousResponseId,
    store: true,
    stream: true,
  }, { signal });
}
