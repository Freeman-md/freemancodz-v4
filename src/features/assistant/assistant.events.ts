export const OPEN_PORTFOLIO_CHAT_EVENT = "portfolio-chat:open";

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
    new CustomEvent<OpenPortfolioChatDetail>(OPEN_PORTFOLIO_CHAT_EVENT, {
      detail: parsed.data,
    }),
  );
}

import {
  assistantTriggerDetailSchema,
  type AssistantTriggerDetail,
} from "@/contracts/assistant.contract";
