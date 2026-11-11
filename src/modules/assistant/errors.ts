export const ASSISTANT_ERRORS = {
  PORTFOLIO_SEARCH_FAILED: {
    code: "assistant.portfolio_search_failed",
    publicMessage: "I couldn’t search the portfolio just now. Please try again shortly.",
  },
  RESPONSE_FAILED: {
    code: "assistant.response_failed",
    publicMessage: "The assistant could not respond. Please try again.",
  },
} as const;

type AssistantFailure = (typeof ASSISTANT_ERRORS)[keyof typeof ASSISTANT_ERRORS];

export class AssistantError extends Error {
  constructor(readonly failure: AssistantFailure, options?: ErrorOptions) {
    super(failure.code, options);
  }
}
