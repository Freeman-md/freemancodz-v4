"use client";

import type { ReactNode, RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";
import { ScrollArea } from "@/app/_components/ui/ScrollArea";
import { cn } from "@/app/_utils/class-names";
import type { ChatMessage } from "../types";
import { AssistantMarkdown } from "./AssistantMarkdown";
import { AssistantSources } from "./AssistantSources";

const ASSISTANT_STARTER_ACTIONS = [
  "Can you show me a few of Freeman’s projects?",
  "How can Freeman help my business?",
  "Tell me about Freeman’s experience.",
] as const;

export type StarterAction = (typeof ASSISTANT_STARTER_ACTIONS)[number];

type AssistantMessagesProps = {
  activityLabel?: string | null;
  children?: ReactNode;
  className?: string;
  isLoading: boolean;
  showStarters?: boolean;
  messages: ChatMessage[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  shouldReduceMotion: boolean | null;
  onStarterAction: (action: StarterAction) => void;
  onInternalSource?: (href: string) => void;
};

export function AssistantMessages({
  activityLabel,
  children,
  className,
  isLoading,
  showStarters = true,
  messages,
  messagesEndRef,
  shouldReduceMotion,
  onStarterAction,
  onInternalSource,
}: AssistantMessagesProps) {
  const pendingReplyId = isLoading ? messages.at(-1)?.id : undefined;

  const pendingLabel = activityLabel ? `${activityLabel}…` : "Thinking…";

  return (
    <ScrollArea
      className={cn("assistant-messages min-h-0 flex-1 overscroll-contain bg-[#fbfbfa]", className)}
    >
      <div className="flex min-h-full flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6">
        {messages.length === 0 && showStarters ? (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-1 flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-balance font-display text-[23px] font-semibold tracking-tight text-ink">
                What would you like to know?
              </h2>
              <p className="max-w-[38ch] text-pretty text-sm/6 text-muted">
                Ask about Freeman’s work, services or experience.
              </p>
            </div>
            <div aria-label="Start a conversation" className="assistant-starters">
              {ASSISTANT_STARTER_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="group relative flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal-400/40 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                  onClick={() => onStarterAction(action)}
                >
                  <span className="block font-sans text-sm/5 font-medium text-ink">{action}</span>
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
              (message) =>
                message.content || message.sources?.length || message.id === pendingReplyId,
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
                  ) : message.role === "assistant" &&
                    message.id === pendingReplyId &&
                    !message.error ? (
                    <span role="status">
                      <motion.span
                        key={pendingLabel}
                        initial={shouldReduceMotion ? false : { opacity: 0.75, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="inline-block"
                      >
                        {pendingLabel}
                      </motion.span>
                    </span>
                  ) : null}
                </div>

                {message.sources ? (
                  <AssistantSources sources={message.sources} onInternalSource={onInternalSource} />
                ) : null}
              </motion.article>
            ))}
        </AnimatePresence>

        {children}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
