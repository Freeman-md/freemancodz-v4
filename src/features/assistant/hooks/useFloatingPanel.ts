"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
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

export function useFloatingPanel({
  clearError,
  isLoading,
  messages,
  submitMessage,
}: UseFloatingPanelOptions) {
  const [stage, setStage] = useState<ChatStage>("launcher");

  const isMobile = useSyncExternalStore(
    subscribeToMobileViewport,
    getMobileViewportSnapshot,
    getServerMobileViewportSnapshot,
  );

  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  const [shouldRestoreLauncherFocus, setShouldRestoreLauncherFocus] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  const shellRef = useRef<HTMLDivElement | null>(null);

  const launcherRef = useRef<HTMLButtonElement | null>(null);

  const shouldIgnoreLauncherFocusRef = useRef(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isOpen = stage !== "launcher";

  const isConversation = stage === "conversation";

  function openChat() {
    setStage(stageWhenOpening(messages));
  }

  function closeChat() {
    shouldIgnoreLauncherFocusRef.current = true;
    setStage("launcher");
    setIsSheetExpanded(false);
    setShouldRestoreLauncherFocus(true);
  }

  function showConversation() {
    setStage("conversation");
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

  function toggleSheetExpanded() {
    setIsSheetExpanded((expanded) => !expanded);
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
    if (!isMobile && stage !== "launcher") {
      textareaRef.current?.focus();
    }
  }, [isMobile, stage]);

  useEffect(() => {
    if (stage === "launcher" && shouldRestoreLauncherFocus) {
      launcherRef.current?.focus();
    }
  }, [shouldRestoreLauncherFocus, stage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      block: "end",
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  }, [messages, isLoading, stage, shouldReduceMotion]);

  useEffect(() => {
    if (stage === "launcher") {
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
  }, [isMobile, stage]);

  useEffect(() => {
    if (!isMobile || !isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, isOpen]);

  const surfaceTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 420, damping: 38, mass: 0.9 };

  return {
    closeChat,
    handleLauncherFocus,
    isMobile,
    isConversation,
    isOpen,
    isSheetExpanded,
    launcherRef,
    messagesEndRef,
    openChat,
    shellRef,
    showConversation,
    shouldReduceMotion,
    stage,
    surfaceTransition,
    textareaRef,
    toggleSheetExpanded,
  };
}
