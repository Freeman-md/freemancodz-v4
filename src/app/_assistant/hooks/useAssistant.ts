"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { streamAssistant } from "../api/stream-assistant-response";
import { ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY, MAX_MESSAGE_LENGTH } from "../constants";
import type { ChatMessage } from "../types";
import {
  workflowInstanceIdSchema,
  type AssistantWorkflowStart,
  type WorkflowPublicInstance,
  type AssistantRequest,
} from "@/contracts/assistant.contract";
import type { AssistantInteractionReply } from "@/contracts/assistant-ui.contract";

export function useAssistant() {
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const [workflowInstance, setWorkflowInstance] = useState<WorkflowPublicInstance | null>(null);

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

  const submitRequest = useCallback(
    async (
      request: Pick<
        AssistantRequest,
        "message" | "workflowStart" | "interactionReply" | "interactionContext"
      >,
    ) => {
      if (submissionInProgress.current) {
        return;
      }

      submissionInProgress.current = true;
      setIsLoading(true);
      setInput("");

      const timestamp = Date.now();

      const assistantMessageId = `assistant-${timestamp}`;

      setMessages((current) => [
        ...current.map((item) =>
          request.message && item.interaction && item.interactionResult?.status !== "accepted"
            ? {
                ...item,
                interactionResult: { interactionId: item.interaction.id, status: "stale" as const },
              }
            : item,
        ),
        ...(request.message
          ? [{ id: `user-${timestamp}`, role: "user" as const, content: request.message }]
          : []),
        { id: assistantMessageId, role: "assistant", content: "", sources: [] },
      ]);
      let receivedResult = false;

      const updateAssistantMessage = (update: (message: ChatMessage) => ChatMessage) => {
        setMessages((current) =>
          current.map((item) => (item.id === assistantMessageId ? update(item) : item)),
        );
      };

      try {
        for await (const event of streamAssistant({
          ...request,
          previousResponseId: previousResponseId.current,
          workflowInstanceId: workflowInstanceId.current,
        })) {
          if (event.type === "interaction") {
            setMessages((current) =>
              current.map((item) => {
                if (item.id === assistantMessageId) {
                  return {
                    ...item,
                    interaction: event.interaction,
                    interactionValues: Object.fromEntries(
                      event.interaction.controls.map((control) => [control.field, control.value]),
                    ),
                  };
                }

                return item.interaction && item.interactionResult?.status !== "accepted"
                  ? {
                      ...item,
                      interactionResult: {
                        interactionId: item.interaction.id,
                        status: "stale" as const,
                      },
                    }
                  : item;
              }),
            );
          }

          if (event.type === "interaction_result") {
            receivedResult = true;
            setMessages((current) => {
              const updated = current.map((item) =>
                item.interaction?.id === event.result.interactionId
                  ? { ...item, interactionResult: event.result }
                  : item,
              );

              if (event.result.status === "accepted") {
                const index = updated.findIndex((item) => item.id === assistantMessageId);

                updated.splice(index, 0, {
                  id: `user-${timestamp}`,
                  role: "user",
                  content: event.result.summary,
                });
              }

              return updated;
            });
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
        if (request.interactionReply && !receivedResult) {
          setMessages((current) =>
            current.map((item) =>
              item.interaction?.id === request.interactionReply?.interactionId
                ? { ...item, interactionUncertain: true }
                : item,
            ),
          );
        }

        if (request.interactionReply) {
          setMessages((current) =>
            current.filter(
              (item) =>
                item.id !== assistantMessageId ||
                item.content ||
                item.interaction ||
                item.error ||
                item.sources?.length,
            ),
          );
        }

        submissionInProgress.current = false;
        setIsLoading(false);
      }
    },
    [],
  );

  const submitMessage = useCallback(
    async (rawMessage: string, workflowStart: AssistantWorkflowStart | null = null) => {
      const message = rawMessage.trim();

      if (!message || message.length > MAX_MESSAGE_LENGTH) {
        return;
      }

      const pending = messages.findLast(
        (item) =>
          item.interaction &&
          item.interactionResult?.status !== "accepted" &&
          item.interactionResult?.status !== "stale",
      );

      await submitRequest({
        message,
        ...(workflowStart ? { workflowStart } : {}),
        ...(pending?.interaction && !workflowStart
          ? {
              interactionContext: {
                ...pending.interaction,
                question: pending.content.trim().slice(0, 4000) || pending.interaction.heading,
              },
            }
          : {}),
      });
    },
    [messages, submitRequest],
  );

  const submitInteraction = useCallback(
    async (interactionReply: AssistantInteractionReply) => {
      const presented = messages.find(
        (item) => item.interaction?.id === interactionReply.interactionId,
      );

      if (
        !presented ||
        presented.interactionUncertain ||
        presented.interactionResult?.status === "accepted" ||
        presented.interactionResult?.status === "stale"
      ) {
        return;
      }

      await submitRequest({
        interactionReply: {
          ...interactionReply,
          ...(presented.interaction?.workflowInstanceId === null
            ? {
                interaction: {
                  ...presented.interaction,
                  question:
                    presented.content.trim().slice(0, 4000) || presented.interaction.heading,
                },
              }
            : {}),
        },
      });
    },
    [messages, submitRequest],
  );

  const updateInteractionValue = useCallback(
    (interactionId: string, field: string, value: string) => {
      if (submissionInProgress.current) {
        return;
      }

      setMessages((current) =>
        current.map((item) => {
          if (
            item.interaction?.id !== interactionId ||
            item.interactionUncertain ||
            item.interactionResult?.status === "accepted" ||
            item.interactionResult?.status === "stale" ||
            !item.interaction.controls.some((control) => control.field === field)
          ) {
            return item;
          }

          return {
            ...item,
            interactionValues: { ...item.interactionValues, [field]: value },
          };
        }),
      );
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
    submitInteraction,
    updateInteractionValue,
    workflowInstance,
  };
}
