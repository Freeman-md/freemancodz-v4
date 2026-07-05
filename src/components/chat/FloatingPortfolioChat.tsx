"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowUpIcon, ChevronDownIcon, MessageSquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ChatSource = {
  id: string;
  title: string;
  url: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  error?: boolean;
};

type ChatResponse = {
  answer: string;
  sources: ChatSource[];
};

const MAX_MESSAGE_LENGTH = 500;

function isExternalUrl(url: string) {
  return /^https?:\/\//.test(url);
}

export function FloatingPortfolioChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isLoading]);

  const canSubmit = useMemo(() => {
    const trimmed = input.trim();
    return trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH && !isLoading;
  }, [input, isLoading]);

  async function handleSubmit() {
    const message = input.trim();

    if (!message || message.length > MAX_MESSAGE_LENGTH || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    };

    setIsOpen(true);
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const payload = (await response.json()) as Partial<ChatResponse> & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Request failed.");
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            typeof payload.answer === "string"
              ? payload.answer
              : "I don't know based on the provided website context.",
          sources: Array.isArray(payload.sources) ? payload.sources : [],
        },
      ]);
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : "Something went wrong while fetching a response.";

      setErrorMessage(messageText);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "I couldn’t complete that request right now. Please try again.",
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 px-3 sm:bottom-5 sm:px-4">
      <div className="mx-auto flex w-full max-w-[40rem] justify-center">
        {!isOpen ? (
          <button
            type="button"
            aria-label="Open portfolio chat"
            onClick={() => setIsOpen(true)}
            onFocus={() => setIsOpen(true)}
            className="pointer-events-auto flex w-full items-center justify-between rounded-full border border-black/10 bg-white/95 px-4 py-3 text-left shadow-[0_18px_50px_-24px_rgba(0,0,0,0.28)] backdrop-blur-sm transition hover:border-black/20"
          >
            <span className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-black text-white">
                <MessageSquareIcon aria-hidden="true" className="size-4" />
              </span>
              <span className="font-mono text-[12px] tracking-[0.02em] text-muted">
                Ask me a question
              </span>
            </span>
            <span className="rounded-full border border-black/10 px-2.5 py-1 font-mono text-[11px] tracking-[0.04em] text-ink">
              Chat
            </span>
          </button>
        ) : (
          <Card className="pointer-events-auto h-[min(70vh,38rem)] w-full border border-black/10 bg-white/95 py-0 shadow-[0_28px_80px_-36px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:h-[min(50vh,38rem)]">
            <CardHeader className="border-b border-black/6 px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="font-sans text-[15px] font-medium tracking-[-0.02em] text-ink">
                    Portfolio Chat
                  </CardTitle>
                  <p className="mt-1 font-mono text-[11px] tracking-[0.03em] text-muted">
                    Ask about projects, experience, or current research.
                  </p>
                </div>
                <Button
                  aria-label="Collapse portfolio chat"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsOpen(false)}
                >
                  <ChevronDownIcon />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 px-0">
              <ScrollArea className="h-full w-full">
                <div className="flex min-h-full flex-col gap-4 px-4 py-4 sm:px-5">
                  {messages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-black/10 bg-black/[0.02] px-4 py-4">
                      <p className="text-sm leading-6 text-muted">
                        Ask about selected work, systems thinking, AI projects, or what Freeman is focused on now.
                      </p>
                    </div>
                  ) : null}

                  {messages.map((message) => (
                    <article
                      key={message.id}
                      className={cn(
                        "max-w-[90%] rounded-2xl px-4 py-3",
                        message.role === "user"
                          ? "ml-auto bg-black text-white"
                          : message.error
                            ? "border border-red-200 bg-red-50 text-red-950"
                            : "border border-black/8 bg-black/[0.03] text-ink",
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
                                className="rounded-full border border-black/10 bg-white px-3 py-1.5 font-mono text-[11px] text-ink transition hover:border-black/20 hover:bg-black/[0.03]"
                              >
                                {source.title}
                              </a>
                            ) : (
                              <Link
                                key={source.id}
                                href={source.url}
                                className="rounded-full border border-black/10 bg-white px-3 py-1.5 font-mono text-[11px] text-ink transition hover:border-black/20 hover:bg-black/[0.03]"
                              >
                                {source.title}
                              </Link>
                            ),
                          )}
                        </div>
                      ) : null}
                    </article>
                  ))}

                  {isLoading ? (
                    <div className="max-w-[90%] rounded-2xl border border-black/8 bg-black/[0.03] px-4 py-3 text-sm text-muted">
                      Thinking…
                    </div>
                  ) : null}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            <CardFooter className="border-t border-black/6 bg-white px-4 py-4 sm:px-5">
              <form
                className="flex w-full flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSubmit();
                }}
              >
                <label htmlFor="portfolio-chat-input" className="sr-only">
                  Ask a question about Freeman&apos;s portfolio
                </label>
                <Textarea
                  id="portfolio-chat-input"
                  value={input}
                  autoFocus
                  aria-label="Ask a question about Freeman's portfolio"
                  placeholder="Ask me a question"
                  className="min-h-24 resize-none border-black/10 bg-white px-3 py-3 text-sm leading-6 shadow-none placeholder:font-mono placeholder:text-[12px] placeholder:tracking-[0.02em] focus-visible:border-black/20 focus-visible:ring-black/5"
                  onChange={(event) => {
                    setInput(event.target.value);
                    if (errorMessage) {
                      setErrorMessage(null);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  maxLength={MAX_MESSAGE_LENGTH}
                />

                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    {errorMessage ? (
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    ) : (
                      <p className="font-mono text-[11px] tracking-[0.03em] text-muted">
                        Enter to send. Shift+Enter for a new line.
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    variant="default"
                    size="lg"
                    className="rounded-full bg-black px-4 text-white hover:bg-black/85"
                  >
                    Ask
                    <ArrowUpIcon data-icon="inline-end" />
                  </Button>
                </div>
              </form>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
