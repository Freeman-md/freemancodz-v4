import { assistantTriggerEvent } from "@/contracts/assistant.contract";

export type AssistantDraft = { subject: string; text: string };
export type OpenPortfolioChatDetail = { draft: AssistantDraft; returnFocus: HTMLElement };

export function dispatchOpenPortfolioChat(detail: OpenPortfolioChatDetail) {
  window.dispatchEvent(new CustomEvent(assistantTriggerEvent, { detail }));
}

export { assistantTriggerEvent as OPEN_PORTFOLIO_CHAT_EVENT } from "@/contracts/assistant.contract";
