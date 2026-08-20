import type { ReadableStream } from "node:stream/web";
import type { AssistantWorkflowStart } from "@/contracts/assistant.contract";

export type AssistantResponseInput = {
  message: string;
  previousResponseId: string | null;
  workflowInstanceId: string | null;
  workflowStart: AssistantWorkflowStart | null;
  signal: AbortSignal;
};
export type AssistantRateLimitResult =
  | { allowed: true }
  | { allowed: false; error: string; limit: number; remaining: number; resetAt: number };

export interface IAssistantService {
  createResponse(input: AssistantResponseInput): globalThis.ReadableStream<Uint8Array>;
  checkRateLimit(clientIdentifier: string): AssistantRateLimitResult;
}
