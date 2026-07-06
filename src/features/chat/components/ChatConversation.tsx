"use client";

import type { RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "../types";
import { isExternalUrl } from "../utils";

type ChatConversationProps = {
  isLoading: boolean;
  messages: ChatMessage[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  shouldReduceMotion: boolean | null;
};

export function ChatConversation({
  isLoading,
  messages,
  messagesEndRef,
  shouldReduceMotion,
}: ChatConversationProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-b border-black/8 bg-[#fbfbfa]">
      <CardHeader className="border-b border-black/8 bg-white px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <CardTitle className="font-sans text-[15px] font-medium text-ink">
            Portfolio Chat
          </CardTitle>
          <p className="mt-1 font-mono text-[11px] tracking-[0.03em] text-muted">
            Ask about projects, experience, or current research.
          </p>
        </div>
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
                  Ask about selected work, systems thinking, AI projects, or what Freeman is focused on now.
                </p>
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
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {message.content}
                  </p>

                  {message.sources?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.sources.map((source) =>
                        isExternalUrl(source.url) ? (
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

            <AnimatePresence initial={false}>
              {isLoading ? (
                <motion.div
                  key="thinking"
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -16, y: 8 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 320, damping: 28 }
                  }
                  className="max-w-[90%] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/62 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.16)]"
                >
                  Thinking…
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </div>
  );
}
