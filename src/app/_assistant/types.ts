import type { AssistantSource } from "@/contracts/assistant.contract";
import type {
  AssistantInteraction,
  AssistantInteractionReply,
  AssistantInteractionResult,
} from "@/contracts/assistant-ui.contract";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: AssistantSource[];
  error?: boolean;
  interaction?: AssistantInteraction;
  interactionValues?: AssistantInteractionReply["values"];
  interactionResult?: AssistantInteractionResult;
  interactionUncertain?: boolean;
};
