"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useReducedMotion, type Transition } from "framer-motion";
import { FALLBACK_ANSWER, MAX_MESSAGE_LENGTH } from "../constants";
import type { ChatMessage, ChatResponse, ChatStage } from "../types";
import {
  createAssistantErrorMessage,
  createAssistantMessage,
  createUserMessage,
} from "../utils";

export function useFloatingPortfolioChat() {
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

  function closeChat() {
    setStage("launcher");
  }

  function handleInputChange(value: string) {
    setInput(value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  }

  async function handleSubmit() {
    const message = input.trim();

    if (!message || message.length > MAX_MESSAGE_LENGTH || isLoading) {
      return;
    }

    setStage("conversation");
    setMessages((current) => [...current, createUserMessage(message)]);
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
        createAssistantMessage(
          typeof payload.answer === "string" ? payload.answer : FALLBACK_ANSWER,
          Array.isArray(payload.sources) ? payload.sources : [],
        ),
      ]);
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : "Something went wrong while fetching a response.";

      setErrorMessage(messageText);
      setMessages((current) => [...current, createAssistantErrorMessage()]);
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

  const surfaceTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 420, damping: 38, mass: 0.9 };

  return {
    canSubmit,
    closeChat,
    errorMessage,
    handleInputChange,
    handleKeyDown,
    handleSubmit,
    input,
    isConversation,
    isLoading,
    isOpen,
    messages,
    messagesEndRef,
    openChat,
    shellRef,
    shouldReduceMotion,
    stage,
    surfaceTransition,
    textareaRef,
  };
}
