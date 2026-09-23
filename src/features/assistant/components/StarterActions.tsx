"use client";

import type { AssistantWorkflowStart } from "@/contracts/assistant.contract";
import { Button } from "@/shared/components/ui/Button";

export type StarterAction = {
  label: string;
  message: string;
  workflowStart: AssistantWorkflowStart | null;
};

export const ASSISTANT_STARTER_ACTIONS: readonly StarterAction[] = [
  {
    label: "Ask about my work",
    message: "Tell me about Freeman's work.",
    workflowStart: null,
  },
  {
    label: "Request a free audit",
    message: "I'd like to request a free audit.",
    workflowStart: {
      workflowId: "audit",
      originPage: "/",
      originEntry: "assistant-starter-audit",
    },
  },
  {
    label: "Book a meeting",
    message: "I'd like to book a meeting with Freeman.",
    workflowStart: {
      workflowId: "meeting-booking",
      originPage: "/",
      originEntry: "assistant-starter-meeting",
    },
  },
  {
    label: "Leave a message",
    message: "I'd like to leave Freeman a message.",
    workflowStart: {
      workflowId: "contact",
      originPage: "/",
      originEntry: "assistant-starter-contact",
    },
  },
];

export function StarterActions({
  disabled,
  onSelect,
}: {
  disabled: boolean;
  onSelect: (action: StarterAction) => void;
}) {
  return (
    <div className="grid gap-2" aria-label="Start a conversation">
      {ASSISTANT_STARTER_ACTIONS.map((action) => (
        <Button
          key={action.label}
          type="button"
          variant="outline"
          className="h-auto justify-start whitespace-normal px-4 py-3 text-left"
          disabled={disabled}
          onClick={() => onSelect(action)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
