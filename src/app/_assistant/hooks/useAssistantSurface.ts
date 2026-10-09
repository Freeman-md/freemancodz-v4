"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import type { Transition } from "framer-motion";
import { OPEN_PORTFOLIO_CHAT_EVENT, type OpenPortfolioChatDetail } from "../assistant.events";
import type { ChatMessage } from "../types";
import type { AssistantWorkflowStart } from "@/contracts/assistant.contract";

type UseAssistantSurfaceOptions = {
  isLoading: boolean;
  messages: ChatMessage[];
  shouldReduceMotion: boolean | null;
  submitMessage: (message: string, workflowStart?: AssistantWorkflowStart | null) => Promise<void>;
};

const MOBILE_MEDIA_QUERY = "(max-width: 639px)";

function subscribeToMobileViewport(onChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);

  mediaQuery.addEventListener("change", onChange);

  return () => mediaQuery.removeEventListener("change", onChange);
}

function getMobileViewportSnapshot() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function getServerMobileViewportSnapshot() {
  return false;
}

export function useAssistantSurface({
  isLoading,
  messages,
  shouldReduceMotion,
  submitMessage,
}: UseAssistantSurfaceOptions) {
  const [isOpen, setIsOpen] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);

  const [shouldRestoreLauncherFocus, setShouldRestoreLauncherFocus] = useState(false);

  const isMobile = useSyncExternalStore(
    subscribeToMobileViewport,
    getMobileViewportSnapshot,
    getServerMobileViewportSnapshot,
  );

  const shellRef = useRef<HTMLDivElement | null>(null);

  const launcherRef = useRef<HTMLButtonElement | null>(null);

  const shouldIgnoreLauncherFocusRef = useRef(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const latestMessage = messages.at(-1);

  function openChat() {
    setIsOpen(true);
  }

  function closeChat() {
    shouldIgnoreLauncherFocusRef.current = true;
    setIsOpen(false);
    setIsExpanded(false);
    setShouldRestoreLauncherFocus(true);
  }

  function handleLauncherFocus() {
    if (shouldIgnoreLauncherFocusRef.current) {
      shouldIgnoreLauncherFocusRef.current = false;
      setShouldRestoreLauncherFocus(false);

      return;
    }

    if (!isMobile) {
      openChat();
    }
  }

  function toggleExpanded() {
    setIsExpanded((expanded) => !expanded);
  }

  const handleTriggerOpen = useEffectEvent(async (detail?: OpenPortfolioChatDetail) => {
    openChat();

    if (detail?.message) {
      await submitMessage(detail.message, detail.workflowStart ?? null);
    }
  });

  useEffect(() => {
    function handleOpenEvent(event: Event) {
      void handleTriggerOpen((event as CustomEvent<OpenPortfolioChatDetail>).detail);
    }

    window.addEventListener(OPEN_PORTFOLIO_CHAT_EVENT, handleOpenEvent);

    return () => window.removeEventListener(OPEN_PORTFOLIO_CHAT_EVENT, handleOpenEvent);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);

    function resetExpansionOnDesktop() {
      if (!mediaQuery.matches) {
        setIsExpanded(false);
      }
    }

    mediaQuery.addEventListener("change", resetExpansionOnDesktop);

    return () => mediaQuery.removeEventListener("change", resetExpansionOnDesktop);
  }, []);

  useEffect(() => {
    if (isOpen && !isMobile) {
      textareaRef.current?.focus();
    }
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (!isOpen && shouldRestoreLauncherFocus) {
      launcherRef.current?.focus();
    }
  }, [isOpen, shouldRestoreLauncherFocus]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      block: "end",
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  }, [
    isLoading,
    isOpen,
    messages.length,
    latestMessage?.content,
    latestMessage?.sources,
    shouldReduceMotion,
  ]);

  useEffect(() => {
    if (!isOpen) {
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

    if (!isMobile) {
      document.addEventListener("pointerdown", handlePointerDown);
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobile, isOpen]);

  const surfaceTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 420, damping: 38, mass: 0.9 };

  return {
    closeChat,
    handleLauncherFocus,
    isExpanded,
    isMobile,
    isOpen,
    launcherRef,
    messagesEndRef,
    openChat,
    shellRef,
    surfaceTransition,
    textareaRef,
    toggleExpanded,
  };
}
