"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useReducedMotion } from "framer-motion";
import { streamChatResponse } from "../api/stream-assistant-response";
import {
  appendAssistantDelta,
  attachAssistantSources,
  replaceAssistantWithError,
} from "../state/assistant-conversation";
import { MAX_MESSAGE_LENGTH } from "../constants";
import type { ChatMessage } from "../types";
import { activeWorkflowInstanceId } from "../state/active-workflow-instance";
import type { AssistantWorkflowStart } from "@/contracts/assistant.contract";

const REVEAL_INTERVAL_MS = 16;

function getRevealLength(backlogLength: number) {
  if (backlogLength > 160) {
    return 96;
  }

  if (backlogLength > 48) {
    return 48;
  }

  return backlogLength;
}

export function useAssistant() {
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [previousResponseId, setPreviousResponseId] = useState<string | null>(null);

  const [workflowInstanceId, setWorkflowInstanceId] = useState<string | null>(null);

  const shouldReduceMotion = useReducedMotion();

  const reduceMotionImmediately =
    shouldReduceMotion ||
    (typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  const bufferedTextRef = useRef("");

  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revealCompleteRef = useRef<(() => void) | null>(null);

  const isMountedRef = useRef(true);

  const activeRequestIdRef = useRef(0);

  const submissionInProgressRef = useRef(false);

  const clearRevealWork = useCallback(() => {
    bufferedTextRef.current = "";

    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    revealCompleteRef.current?.();
    revealCompleteRef.current = null;
  }, []);

  const cancelPendingRequest = useCallback(() => {
    activeRequestIdRef.current += 1;
    clearRevealWork();
  }, [clearRevealWork]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cancelPendingRequest();
    };
  }, [cancelPendingRequest]);

  const canSubmit = useMemo(() => {
    const trimmed = input.trim();

    return trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH && !isLoading;
  }, [input, isLoading]);

  const submitMessage = useCallback(
    async (rawMessage: string, workflowStart: AssistantWorkflowStart | null = null) => {
      const message = rawMessage.trim();

      if (!message || message.length > MAX_MESSAGE_LENGTH || submissionInProgressRef.current) {
        return;
      }

      submissionInProgressRef.current = true;

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        sources: [],
      };

      const requestId = activeRequestIdRef.current + 1;

      activeRequestIdRef.current = requestId;

      let scheduleReveal: (() => void) | undefined;

      function waitForRevealToFinish() {
        if (!bufferedTextRef.current && !revealTimerRef.current) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
          revealCompleteRef.current = resolve;
        });
      }

      function revealNextChunk() {
        revealTimerRef.current = null;

        const chunkLength = getRevealLength(bufferedTextRef.current.length);

        const chunk = bufferedTextRef.current.slice(0, chunkLength);

        bufferedTextRef.current = bufferedTextRef.current.slice(chunkLength);

        if (chunk && isMountedRef.current) {
          setMessages((current) => appendAssistantDelta(current, assistantMessage.id, chunk));
        }

        if (bufferedTextRef.current) {
          scheduleReveal?.();

          return;
        }

        revealCompleteRef.current?.();
        revealCompleteRef.current = null;
      }

      scheduleReveal = () => {
        if (!revealTimerRef.current) {
          revealTimerRef.current = setTimeout(revealNextChunk, REVEAL_INTERVAL_MS);
        }
      };

      setMessages((current) => [
        ...current,
        { id: `user-${Date.now()}`, role: "user", content: message },
        assistantMessage,
      ]);
      setInput("");
      setIsLoading(true);
      setErrorMessage(null);

      try {
        await streamChatResponse(
          message,
          previousResponseId,
          workflowInstanceId,
          {
            onDelta(delta) {
              if (!isMountedRef.current || activeRequestIdRef.current !== requestId) {
                return;
              }

              if (reduceMotionImmediately) {
                setMessages((current) => appendAssistantDelta(current, assistantMessage.id, delta));

                return;
              }

              bufferedTextRef.current += delta;
              scheduleReveal?.();
            },
            onResponseId(responseId) {
              if (!isMountedRef.current || activeRequestIdRef.current !== requestId) {
                return;
              }

              setPreviousResponseId(responseId);
            },
            onWorkflow(instance) {
              if (isMountedRef.current && activeRequestIdRef.current === requestId) {
                setWorkflowInstanceId(activeWorkflowInstanceId(instance));
              }
            },
            onSources(sources) {
              if (!isMountedRef.current || activeRequestIdRef.current !== requestId) {
                return;
              }

              setMessages((current) =>
                attachAssistantSources(current, assistantMessage.id, sources),
              );
            },
          },
          workflowStart,
        );

        if (!reduceMotionImmediately) {
          await waitForRevealToFinish();
        }
      } catch (error) {
        cancelPendingRequest();
        const messageText =
          error instanceof Error
            ? error.message
            : "Something went wrong while fetching a response.";

        const errorResponse: ChatMessage = {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: messageText,
          error: true,
        };

        if (isMountedRef.current) {
          setErrorMessage(messageText);
          setMessages((current) =>
            replaceAssistantWithError(current, assistantMessage.id, errorResponse),
          );
        }
      } finally {
        submissionInProgressRef.current = false;
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [cancelPendingRequest, previousResponseId, reduceMotionImmediately, workflowInstanceId],
  );

  const clearError = useCallback(() => setErrorMessage(null), []);

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

  return {
    canSubmit,
    clearError,
    errorMessage,
    handleInputChange,
    handleKeyDown,
    handleSubmit,
    input,
    isLoading,
    messages,
    shouldReduceMotion,
    submitMessage,
  };
}
