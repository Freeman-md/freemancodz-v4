"use client";

import type { RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";
import { ScrollArea } from "@/app/_components/ui/ScrollArea";
import { cn } from "@/app/_utils/class-names";
import type { ChatMessage } from "../types";
import { AssistantMarkdown } from "./AssistantMarkdown";
import { AssistantSources } from "./AssistantSources";
import type { AssistantWorkflowStart } from "@/contracts/assistant.contract";

export type StarterAction = {
  label: string;
  message: string;
  workflowStart: AssistantWorkflowStart | null;
};

const ASSISTANT_STARTER_ACTIONS: readonly StarterAction[] = [
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

type AssistantMessagesProps = {
  className?: string;
  isLoading: boolean;
  messages: ChatMessage[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  shouldReduceMotion: boolean | null;
  onStarterAction: (action: StarterAction) => void;
};

export function AssistantMessages({
  className,
  isLoading,
  messages,
  messagesEndRef,
  shouldReduceMotion,
  onStarterAction,
}: AssistantMessagesProps) {
  return (
    <ScrollArea
      className={cn("assistant-messages min-h-0 flex-1 overscroll-contain bg-[#fbfbfa]", className)}
    >
      <div className="flex min-h-full flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6">
        {messages.length === 0 ? (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-1 flex-col justify-center gap-7 py-8"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-balance font-sans text-2xl font-semibold tracking-tight text-ink">
                What brings you here?
              </h2>
              <p className="max-w-[38ch] text-pretty text-base/7 text-muted">
                Ask about Freeman’s work, or start a request.
              </p>
            </div>
            <div
              aria-label="Start a conversation"
              className="assistant-starters divide-y divide-black/8"
            >
              {ASSISTANT_STARTER_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="group relative flex min-h-14 w-full items-center justify-between gap-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal-400/40 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                  onClick={() => onStarterAction(action)}
                >
                  <span className="block font-sans text-base/6 font-medium text-ink">
                    {action.label}
                  </span>
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 stroke-muted group-hover:stroke-ink"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}

        <AnimatePresence initial={false}>
          {messages
            .filter(
              (message, index) =>
                message.content ||
                message.sources?.length ||
                (isLoading && index === messages.length - 1),
            )
            .map((message) => (
              <motion.article
                key={message.id}
                initial={
                  shouldReduceMotion
                    ? false
                    : message.role === "user"
                      ? { opacity: 0, x: 20, y: 10, scale: 0.98 }
                      : { opacity: 0, x: -18, y: 12, scale: 0.985 }
                }
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 360, damping: 28 }
                }
                className={cn(
                  "flex flex-col gap-3",
                  message.role === "user"
                    ? "assistant-visitor ml-auto max-w-[85%] rounded-xl bg-[#F5F5F7] px-4 py-3 text-ink"
                    : message.error
                      ? "assistant-error w-full rounded-xl bg-red-50 px-4 py-3 text-red-950 ring-1 ring-red-950/10"
                      : "w-full text-ink",
                )}
              >
                <div className="whitespace-pre-wrap text-base/6">
                  {message.content ? (
                    <AssistantMarkdown content={message.content} />
                  ) : message.role === "assistant" && isLoading && !message.error ? (
                    "Thinking…"
                  ) : null}
                </div>

                {message.sources ? <AssistantSources sources={message.sources} /> : null}
              </motion.article>
            ))}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
