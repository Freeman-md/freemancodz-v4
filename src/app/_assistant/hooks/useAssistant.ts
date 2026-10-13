"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { streamAssistant } from "../api/stream-assistant-response";
import { ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY, MAX_MESSAGE_LENGTH } from "../constants";
import type { ChatMessage } from "../types";
import {
  workflowInstanceIdSchema,
  type AssistantWorkflowStart,
  type WorkflowPublicInstance,
} from "@/contracts/assistant.contract";
import type { AssistantChoice } from "@/contracts/assistant-choice.contract";

export function useAssistant() {
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const [workflowInstance, setWorkflowInstance] = useState<WorkflowPublicInstance | null>(null);

  const [choice, setChoice] = useState<AssistantChoice | null>(null);

  const previousResponseId = useRef<string | null>(null);

  const workflowInstanceId = useRef<string | null>(null);

  const submissionInProgress = useRef(false);

  useEffect(() => {
    const storedId = window.sessionStorage.getItem(ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY);

    const parsedId = workflowInstanceIdSchema.safeParse(storedId);

    if (parsedId.success) {
      workflowInstanceId.current = parsedId.data;

      return;
    }

    if (storedId !== null) {
      window.sessionStorage.removeItem(ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY);
    }
  }, []);

  const submitMessage = useCallback(
    async (rawMessage: string, workflowStart: AssistantWorkflowStart | null = null) => {
      const message = rawMessage.trim();

      if (!message || message.length > MAX_MESSAGE_LENGTH || submissionInProgress.current) {
        return;
      }

      submissionInProgress.current = true;
      setIsLoading(true);
      setInput("");
      setChoice(null);

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
          ...(workflowStart ? { workflowStart } : {}),
          previousResponseId: previousResponseId.current,
          workflowInstanceId: workflowInstanceId.current,
        })) {
          if (event.type === "choice") {
            setChoice(event.choice);
            // The reply panel owns this turn's question; don't repeat it in the transcript.
            updateAssistantMessage((current) => ({ ...current, content: "" }));
          }

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
            setWorkflowInstance(event.instance);

            if (event.instance.status === "active") {
              workflowInstanceId.current = event.instance.id;
              window.sessionStorage.setItem(
                ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY,
                event.instance.id,
              );
            } else {
              workflowInstanceId.current = null;
              window.sessionStorage.removeItem(ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY);
            }
          }
        }
      } catch (error) {
        setChoice(null);
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
    choice,
    dismissChoice: () => setChoice(null),
    workflowInstance,
  };
}
