import type { AssistantRequest } from "@/contracts/assistant.contract";

export type AssistantResponseInput = AssistantRequest & { signal: AbortSignal };
