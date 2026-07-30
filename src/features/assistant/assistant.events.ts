export const OPEN_PORTFOLIO_CHAT_EVENT = "portfolio-chat:open";

export type OpenPortfolioChatDetail = {
  message?: string;
};

export function dispatchOpenPortfolioChat(detail: OpenPortfolioChatDetail = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<OpenPortfolioChatDetail>(OPEN_PORTFOLIO_CHAT_EVENT, {
      detail,
    }),
  );
}
