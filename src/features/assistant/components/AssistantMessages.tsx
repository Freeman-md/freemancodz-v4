"use client";

import type { ReactNode, RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { ScrollArea } from "@/shared/components/ui/ScrollArea";
import { cn } from "@/shared/utils/class-names";
import type { ChatMessage } from "@/features/assistant/types";
import { AssistantMarkdown } from "./AssistantMarkdown";
import type { AssistantWorkflowStart } from "@/contracts/assistant.contract";
import { Button } from "@/shared/components/ui/Button";

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
  headerActions?: ReactNode;
  isLoading: boolean;
  messages: ChatMessage[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  shouldReduceMotion: boolean | null;
  onStarterAction: (action: StarterAction) => void;
};

export function AssistantMessages({
  className,
  headerActions,
  isLoading,
  messages,
  messagesEndRef,
  shouldReduceMotion,
  onStarterAction,
}: AssistantMessagesProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain border-b border-black/8 bg-[#fbfbfa]",
        className,
      )}
    >
      <CardHeader className="relative border-b border-black/8 bg-white px-4 py-3 sm:px-5">
        <div className="min-w-0 pr-20 sm:pr-0">
          <CardTitle
            id="portfolio-chat-title"
            className="font-sans text-[15px] font-medium text-ink"
          >
            Portfolio Chat
          </CardTitle>
          <p className="mt-1 font-mono text-[11px] tracking-[0.03em] text-muted">
            Ask about projects, experience, or current research.
          </p>
        </div>
        {headerActions ? (
          <div className="absolute right-3 top-3 flex items-center gap-1 sm:hidden">
            {headerActions}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 px-0">
        <ScrollArea className="h-full w-full">
          <div className="flex min-h-full flex-col gap-4 px-4 py-4 sm:px-5">
            {messages.length === 0 ? (
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-dashed border-black/10 bg-black/[0.02] px-4 py-4"
              >
                <p className="text-sm leading-6 text-muted">
                  Ask about selected work, systems thinking, AI projects, or what Freeman is focused
                  on now.
                </p>
                <div className="mt-4">
                  <div className="grid gap-2" aria-label="Start a conversation">
                    {ASSISTANT_STARTER_ACTIONS.map((action) => (
                      <Button
                        key={action.label}
                        type="button"
                        variant="outline"
                        className="h-auto justify-start whitespace-normal px-4 py-3 text-left"
                        disabled={isLoading}
                        onClick={() => onStarterAction(action)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : null}

            <AnimatePresence initial={false}>
              {messages.map((message) => (
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
                    "max-w-[90%] rounded-2xl px-4 py-3 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.2)]",
                    message.role === "user"
                      ? "ml-auto bg-black text-white"
                      : message.error
                        ? "border border-red-200 bg-red-50 text-red-950"
                        : "border border-black/10 bg-white text-black",
                  )}
                >
                  <div className="whitespace-pre-wrap text-sm leading-6">
                    {message.content ? (
                      <AssistantMarkdown content={message.content} />
                    ) : message.role === "assistant" && isLoading && !message.error ? (
                      "Thinking…"
                    ) : null}
                  </div>

                  {message.sources?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.sources.map((source) =>
                        /^https?:\/\//.test(source.url) ? (
                          <a
                            key={source.id}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-black/10 bg-white px-3 py-1.5 font-mono text-[11px] font-medium text-ink transition hover:border-black/20 hover:bg-black/[0.03]"
                          >
                            {source.title}
                          </a>
                        ) : (
                          <Link
                            key={source.id}
                            href={source.url}
                            className="rounded-full border border-black/10 bg-white px-3 py-1.5 font-mono text-[11px] font-medium text-ink transition hover:border-black/20 hover:bg-black/[0.03]"
                          >
                            {source.title}
                          </Link>
                        ),
                      )}
                    </div>
                  ) : null}
                </motion.article>
              ))}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </div>
  );
}
