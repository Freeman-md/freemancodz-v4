"use client";

import { ArrowUpRight } from "lucide-react";
import { dispatchOpenPortfolioChat, type AssistantDraft } from "../../_assistant/assistant.events";

export function ServiceRequest({ draft }: { draft: AssistantDraft }) {
  return (
    <button
      type="button"
      className="home-service-request"
      onClick={(event) => dispatchOpenPortfolioChat({ draft, returnFocus: event.currentTarget })}
    >
      Request services
      <ArrowUpRight size={15} aria-hidden="true" />
    </button>
  );
}
