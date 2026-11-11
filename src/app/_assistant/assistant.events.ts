export const OPEN_PORTFOLIO_CHAT_EVENT = "portfolio-chat:open";

export type AssistantDraft = { subject: string; text: string };
export type OpenPortfolioChatDetail = { draft: AssistantDraft; returnFocus: HTMLElement };

export function dispatchOpenPortfolioChat(detail: OpenPortfolioChatDetail) {
  window.dispatchEvent(new CustomEvent(OPEN_PORTFOLIO_CHAT_EVENT, { detail }));
}
