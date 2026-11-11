"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  OPEN_PORTFOLIO_CHAT_EVENT,
  type AssistantDraft,
  type OpenPortfolioChatDetail,
} from "../assistant.events";
import type { ChatMessage } from "../types";

function useMedia(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);

      media.addEventListener("change", onChange);

      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useAssistantSurface({
  onDraft,
  lastMessage,
  isLoading,
}: {
  onDraft: (draft: AssistantDraft) => void;
  lastMessage: ChatMessage | undefined;
  isLoading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const isMobile = useMedia("(max-width: 639px), (max-height: 530px) and (orientation: landscape)");

  const shouldReduceMotion = useMedia("(prefers-reduced-motion: reduce)");

  const launcherRef = useRef<HTMLButtonElement>(null);

  const closeRef = useRef<HTMLButtonElement>(null);

  const returnFocus = useRef<HTMLElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  function openChat() {
    returnFocus.current = launcherRef.current;
    setIsOpen(true);
  }

  const openFromEvent = useEffectEvent(
    ({ draft, returnFocus: origin }: OpenPortfolioChatDetail) => {
      returnFocus.current = origin;
      onDraft(draft);
      setIsOpen(true);
      closeRef.current?.focus({ preventScroll: true });
    },
  );

  useEffect(() => {
    function handleOpen(event: Event) {
      const { detail } = event as CustomEvent<OpenPortfolioChatDetail>;

      if (detail) {
        openFromEvent(detail);
      }
    }

    window.addEventListener(OPEN_PORTFOLIO_CHAT_EVENT, handleOpen);

    return () => window.removeEventListener(OPEN_PORTFOLIO_CHAT_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen && lastMessage) {
      messagesEndRef.current?.scrollIntoView({
        block: "nearest",
        behavior: shouldReduceMotion ? "auto" : "smooth",
      });
    }
  }, [isOpen, lastMessage, isLoading, shouldReduceMotion]);

  return {
    isOpen,
    setIsOpen,
    isMobile,
    shouldReduceMotion,
    launcherRef,
    closeRef,
    returnFocus,
    messagesEndRef,
    openChat,
  };
}
