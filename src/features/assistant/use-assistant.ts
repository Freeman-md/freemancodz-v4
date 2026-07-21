"use client";

import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useReducedMotion, type Transition } from "framer-motion";
import { streamChatResponse } from "./client";
import { MAX_MESSAGE_LENGTH } from "./constants";
import {
  OPEN_PORTFOLIO_CHAT_EVENT,
  type OpenPortfolioChatDetail,
} from "./events";
import type { ChatMessage, ChatStage } from "./types";
import {
  createAssistantErrorMessage,
  createAssistantMessage,
  createUserMessage,
} from "./utils/create-search-message";

export function useFloatingPortfolioChat() {
  const [stage, setStage] = useState<ChatStage>("launcher");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previousResponseId, setPreviousResponseId] = useState<string | null>(
    null,
  );

  const shouldReduceMotion = useReducedMotion();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isOpen = stage !== "launcher";
  const isConversation = stage === "conversation";

  async function submitMessage(rawMessage: string) {
    const message = rawMessage.trim();

    if (!message || message.length > MAX_MESSAGE_LENGTH || isLoading) {
      return;
    }

    const assistantMessage = createAssistantMessage("");

    setStage("conversation");
    setMessages((current) => [
      ...current,
      createUserMessage(message),
      assistantMessage,
    ]);
    setInput("");
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await streamChatResponse(message, previousResponseId, {
        onDelta(delta) {
          setMessages((current) =>
            current.map((chatMessage) =>
              chatMessage.id === assistantMessage.id
                ? {
                    ...chatMessage,
                    content: chatMessage.content + delta,
                  }
                : chatMessage,
            ),
          );
        },
        onResponseId(responseId) {
          setPreviousResponseId(responseId);
        },
        onSources(sources) {
          setMessages((current) =>
            current.map((chatMessage) =>
              chatMessage.id === assistantMessage.id
                ? {
                    ...chatMessage,
                    sources,
                  }
                : chatMessage,
            ),
          );
        },
      });
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : "Something went wrong while fetching a response.";
      const errorResponse = createAssistantErrorMessage(messageText);

      setErrorMessage(messageText);
      setMessages((current) =>
        current.map((chatMessage) =>
          chatMessage.id === assistantMessage.id
            ? {
                ...errorResponse,
                id: assistantMessage.id,
              }
            : chatMessage,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

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

  const handleTriggerOpen = useEffectEvent(
    async (detail?: OpenPortfolioChatDetail) => {
      setErrorMessage(null);

      if (detail?.message) {
        await submitMessage(detail.message);
        return;
      }

      setStage(messages.length > 0 ? "conversation" : "composer");
    },
  );

  useEffect(() => {
    function handleOpenEvent(event: Event) {
      void handleTriggerOpen(
        (event as CustomEvent<OpenPortfolioChatDetail>).detail,
      );
    }

    window.addEventListener(OPEN_PORTFOLIO_CHAT_EVENT, handleOpenEvent);

    return () => {
      window.removeEventListener(OPEN_PORTFOLIO_CHAT_EVENT, handleOpenEvent);
    };
  }, []);

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
    await submitMessage(input);
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
