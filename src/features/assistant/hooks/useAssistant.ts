"use client";

import { useCallback, useRef, useState } from "react";
import { streamAssistant } from "../api/stream-assistant-response";
import { MAX_MESSAGE_LENGTH } from "../constants";
import type { ChatMessage } from "../types";
import type { AssistantWorkflowStart } from "@/contracts/assistant.contract";

export function useAssistant() {
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const previousResponseId = useRef<string | null>(null);

  const workflowInstanceId = useRef<string | null>(null);

  const submissionInProgress = useRef(false);

  const submitMessage = useCallback(
    async (rawMessage: string, workflowStart: AssistantWorkflowStart | null = null) => {
      const message = rawMessage.trim();

      if (!message || message.length > MAX_MESSAGE_LENGTH || submissionInProgress.current) {
        return;
      }

      submissionInProgress.current = true;
      setIsLoading(true);
      setInput("");

      const timestamp = Date.now();

      const assistantMessageId = `assistant-${timestamp}`;

      setMessages((current) => [
        ...current,
        { id: `user-${timestamp}`, role: "user", content: message },
        { id: assistantMessageId, role: "assistant", content: "", sources: [] },
      ]);

      const updateAssistantMessage = (update: (message: ChatMessage) => ChatMessage) => {
        setMessages((current) =>
          current.map((item) => (item.id === assistantMessageId ? update(item) : item)),
        );
      };

      try {
        for await (const event of streamAssistant({
          message,
          previousResponseId: previousResponseId.current,
          workflowInstanceId: workflowInstanceId.current,
          ...(workflowStart ? { workflowStart } : {}),
        })) {
          if (event.type === "delta") {
            updateAssistantMessage((current) => ({
              ...current,
              content: current.content + event.delta,
            }));
          }

          if (event.type === "sources") {
            updateAssistantMessage((current) => ({ ...current, sources: event.sources }));
          }

          if (event.type === "response_id") {
            previousResponseId.current = event.responseId;
          }

          if (event.type === "workflow_instance") {
            workflowInstanceId.current =
              event.instance.status === "active" ? event.instance.id : null;
          }
        }
      } catch (error) {
        const messageText =
          error instanceof Error
            ? error.message
            : "Something went wrong while fetching a response.";

        updateAssistantMessage((current) => ({
          ...current,
          content: messageText,
          sources: [],
          error: true,
        }));
      } finally {
        submissionInProgress.current = false;
        setIsLoading(false);
      }
    },
    [],
  );

  const trimmedInput = input.trim();

  return {
    canSubmit: trimmedInput.length > 0 && trimmedInput.length <= MAX_MESSAGE_LENGTH && !isLoading,
    input,
    isLoading,
    messages,
    setInput,
    submitMessage,
  };
}
