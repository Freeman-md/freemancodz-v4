import {
  assistantTriggerEvent,
  assistantTriggerDetailSchema,
  type AssistantTriggerDetail,
} from "@/contracts/assistant.contract";

export type OpenPortfolioChatDetail = AssistantTriggerDetail;

export function dispatchOpenPortfolioChat(detail: OpenPortfolioChatDetail = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const parsed = assistantTriggerDetailSchema.safeParse(detail);

  if (!parsed.success) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<OpenPortfolioChatDetail>(assistantTriggerEvent, {
      detail: parsed.data,
    }),
  );
}

export { assistantTriggerEvent as OPEN_PORTFOLIO_CHAT_EVENT } from "@/contracts/assistant.contract";
