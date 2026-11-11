"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import {
  OPEN_PORTFOLIO_CHAT_EVENT,
  type AssistantDraft,
  type OpenPortfolioChatDetail,
} from "../assistant.events";
import type { ChatMessage } from "../types";

function useMedia(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);

      media.addEventListener("change", onChange);

      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useAssistantSurface({
  messages,
  isLoading,
  setInput,
}: {
  messages: ChatMessage[];
  isLoading: boolean;
  setInput: (text: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const [subject, setSubject] = useState<string | null>(null);

  const isMobile = useMedia("(max-width: 639px), (max-height: 530px) and (orientation: landscape)");

  const shouldReduceMotion = useMedia("(prefers-reduced-motion: reduce)");

  const launcherRef = useRef<HTMLButtonElement>(null);

  const closeRef = useRef<HTMLButtonElement>(null);

  const returnFocus = useRef<HTMLElement | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const latestMessage = messages.at(-1);

  function openChat() {
    returnFocus.current = launcherRef.current;
    setIsOpen(true);
  }

  function closeWithoutFocusReturn() {
    returnFocus.current = null;
    setIsOpen(false);
  }

  function openDraft(draft: AssistantDraft) {
    setInput(draft.text);
    setSubject(draft.subject);
    setIsOpen(true);
  }

  const handleTriggerOpen = useEffectEvent((detail?: OpenPortfolioChatDetail) => {
    if (!detail) {
      return;
    }

    returnFocus.current = detail.returnFocus;
    openDraft(detail.draft);
    closeRef.current?.focus({ preventScroll: true });
  });

  useEffect(() => {
    function handleOpenEvent(event: Event) {
      handleTriggerOpen((event as CustomEvent<OpenPortfolioChatDetail>).detail);
    }

    window.addEventListener(OPEN_PORTFOLIO_CHAT_EVENT, handleOpenEvent);

    return () => window.removeEventListener(OPEN_PORTFOLIO_CHAT_EVENT, handleOpenEvent);
  }, []);

  useEffect(() => {
    if (isOpen && latestMessage) {
      messagesEndRef.current?.scrollIntoView({
        block: "nearest",
        behavior: shouldReduceMotion ? "auto" : "smooth",
      });
    }
  }, [isLoading, isOpen, latestMessage, shouldReduceMotion]);

  return {
    isOpen,
    setIsOpen,
    subject,
    setSubject,
    isMobile,
    shouldReduceMotion,
    launcherRef,
    closeRef,
    returnFocus,
    textareaRef,
    messagesEndRef,
    openChat,
    closeWithoutFocusReturn,
  };
}
