import type { ReadableStream } from "node:stream/web";

export type AssistantResponseInput = {
  message: string;
  previousResponseId: string | null;
  signal: AbortSignal;
};
export type AssistantRateLimitResult =
  | { allowed: true }
  | { allowed: false; error: string; limit: number; remaining: number; resetAt: number };

export interface IAssistantService {
  createResponse(input: AssistantResponseInput): globalThis.ReadableStream<Uint8Array>;
  checkRateLimit(clientIdentifier: string): AssistantRateLimitResult;
}
