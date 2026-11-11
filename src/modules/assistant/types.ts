import type { AssistantRequest } from "@/contracts/assistant.contract";

export type AssistantResponseInput = AssistantRequest & { visitorKey: string; signal: AbortSignal };
