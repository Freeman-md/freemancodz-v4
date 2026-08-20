"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useReducedMotion, type Transition } from "framer-motion";
import { OPEN_PORTFOLIO_CHAT_EVENT, type OpenPortfolioChatDetail } from "../assistant.events";
import { stageWhenOpening } from "../state/assistant-conversation";
import type { ChatMessage, ChatStage } from "../models/chat-message";
import type { AssistantWorkflowStart } from "@/contracts/assistant.contract";

interface UseFloatingPanelOptions {
  clearError: () => void;
  isLoading: boolean;
  messages: ChatMessage[];
  submitMessage: (message: string, workflowStart?: AssistantWorkflowStart | null) => Promise<void>;
}

export function useFloatingPanel({
  clearError,
  isLoading,
  messages,
  submitMessage,
}: UseFloatingPanelOptions) {
  const [stage, setStage] = useState<ChatStage>("launcher");

  const shouldReduceMotion = useReducedMotion();

  const shellRef = useRef<HTMLDivElement | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isOpen = stage !== "launcher";

  const isConversation = stage === "conversation";

  function openChat() {
    setStage(stageWhenOpening(messages));
  }

  function closeChat() {
    setStage("launcher");
  }

  function showConversation() {
    setStage("conversation");
  }

  const handleTriggerOpen = useEffectEvent(async (detail?: OpenPortfolioChatDetail) => {
    clearError();

    if (detail?.message) {
      showConversation();
      await submitMessage(detail.message, detail.workflowStart ?? null);

      return;
    }

    openChat();
  });

  useEffect(() => {
    function handleOpenEvent(event: Event) {
      void handleTriggerOpen((event as CustomEvent<OpenPortfolioChatDetail>).detail);
    }

    window.addEventListener(OPEN_PORTFOLIO_CHAT_EVENT, handleOpenEvent);

    return () => window.removeEventListener(OPEN_PORTFOLIO_CHAT_EVENT, handleOpenEvent);
  }, []);

  useEffect(() => {
    if (stage !== "launcher") {
      textareaRef.current?.focus();
    }
  }, [stage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      block: "end",
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  }, [messages, isLoading, stage, shouldReduceMotion]);

  useEffect(() => {
    if (stage === "launcher" || isLoading) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && !shellRef.current?.contains(target)) {
        closeChat();
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        closeChat();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isLoading, stage]);

  const surfaceTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 420, damping: 38, mass: 0.9 };

  return {
    closeChat,
    isConversation,
    isOpen,
    messagesEndRef,
    openChat,
    shellRef,
    showConversation,
    shouldReduceMotion,
    stage,
    surfaceTransition,
    textareaRef,
  };
}
