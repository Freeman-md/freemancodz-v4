"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import Link from "next/link";
import { ArrowUpIcon, MessageSquareIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ChatStage = "launcher" | "composer" | "conversation";

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
const FALLBACK_ANSWER = "I don’t have enough information to answer that.";

function isExternalUrl(url: string) {
  return /^https?:\/\//.test(url);
}

export function FloatingPortfolioChat() {
  const [stage, setStage] = useState<ChatStage>("launcher");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const shouldReduceMotion = useReducedMotion();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isOpen = stage !== "launcher";
  const isConversation = stage === "conversation";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      block: "end",
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  }, [messages, isLoading, stage, shouldReduceMotion]);

  useEffect(() => {
    if (stage !== "launcher") {
      textareaRef.current?.focus();
    }
  }, [stage]);

  useEffect(() => {
    if (stage === "launcher" || isLoading) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && !shellRef.current?.contains(target)) {
        setStage("launcher");
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setStage("launcher");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [stage, isLoading]);

  const canSubmit = useMemo(() => {
    const trimmed = input.trim();
    return trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH && !isLoading;
  }, [input, isLoading]);

  function openChat() {
    setStage(messages.length > 0 ? "conversation" : "composer");
  }

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

    setStage("conversation");
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
          content: typeof payload.answer === "string" ? payload.answer : FALLBACK_ANSWER,
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

  const transition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 340, damping: 30, mass: 0.9 };

  const surfaceTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 420, damping: 38, mass: 0.9 };

  const composerForm = (
    <form
      className="flex h-16 items-center gap-3 px-4 sm:px-5"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <label htmlFor="portfolio-chat-input" className="sr-only">
        Ask a question about Freeman&apos;s portfolio
      </label>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
        <MessageSquareIcon aria-hidden="true" className="size-4.5" />
      </span>

      <div className="min-w-0 flex-1">
        <Textarea
          id="portfolio-chat-input"
          ref={textareaRef}
          value={input}
          aria-label="Ask a question about Freeman's portfolio"
          placeholder={errorMessage || "Ask me a question"}
          className={cn(
            "h-10 max-h-10 min-h-10 resize-none overflow-y-auto border-0 bg-transparent px-0 py-2 text-sm leading-6 text-ink shadow-none placeholder:font-mono placeholder:text-[12px] placeholder:tracking-[0.02em] placeholder:text-muted focus-visible:ring-0",
            errorMessage ? "placeholder:text-red-700" : null,
          )}
          onChange={(event) => {
            setInput(event.target.value);
            if (errorMessage) {
              setErrorMessage(null);
            }
          }}
          onKeyDown={handleKeyDown}
          maxLength={MAX_MESSAGE_LENGTH}
        />
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        variant="default"
        size="icon"
        className="size-10 shrink-0 rounded-full bg-black text-white hover:bg-black/88"
      >
        <ArrowUpIcon />
      </Button>
      <Button
        type="button"
        aria-label="Collapse portfolio chat"
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        onClick={() => setStage("launcher")}
        disabled={isLoading}
      >
        <XIcon />
      </Button>
    </form>
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-4 sm:pb-[max(env(safe-area-inset-bottom),1.25rem)]">
      <div ref={shellRef} className="mx-auto flex w-full max-w-[40rem] justify-center">
        <motion.div
          layout
          animate={{
            maxWidth: isOpen ? 640 : 320,
            backgroundColor: isOpen ? "#ffffff" : "#000000",
            borderColor:
              isOpen ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)",
            boxShadow:
              isOpen
                ? "0 28px 80px -38px rgba(0,0,0,0.36)"
                : "0 26px 80px -34px rgba(0,0,0,0.72)",
          }}
          transition={surfaceTransition}
          style={{ transformOrigin: "50% 100%" }}
          className={cn(
            "pointer-events-auto flex w-full flex-col overflow-hidden rounded-[2rem] border",
            isConversation ? "h-[min(72vh,38rem)] sm:h-[min(52vh,38rem)]" : "h-16",
          )}
        >
          {stage === "launcher" ? (
            <button
              type="button"
              aria-label="Open portfolio chat"
              onClick={openChat}
              onFocus={openChat}
              className="flex h-16 w-full items-center gap-3 px-4 text-left text-white"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white">
                <MessageSquareIcon aria-hidden="true" className="size-4.5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/58">
                  Ask AI
                </span>
                <span className="truncate text-sm font-medium text-white">
                  Ask about work, systems, or research
                </span>
              </span>
              <span className="ml-1 size-2 shrink-0 rounded-full bg-[#5b4df8]" />
            </button>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              {isConversation ? (
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
              ) : null}

              <CardContent className="shrink-0 p-0">
                {composerForm}
              </CardContent>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
