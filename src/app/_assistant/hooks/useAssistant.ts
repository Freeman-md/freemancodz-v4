"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AssistantStreamInterruptedError,
  streamAssistant,
  WorkflowAccessError,
} from "../api/stream-assistant-response";
import { ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY } from "../constants";
import type { ChatMessage } from "../types";
import {
  MAX_MESSAGE_LENGTH,
  workflowReferenceSchema,
  type WorkflowPublicInstance,
  type AssistantWorkflowAction,
  type AssistantRequest,
} from "@/contracts/assistant.contract";
import type { AssistantChoice } from "@/contracts/assistant-choice.contract";

export function useAssistant() {
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const [workflowInstance, setWorkflowInstance] = useState<WorkflowPublicInstance | null>(null);

  const [workflowStatusError, setWorkflowStatusError] = useState<string | null>(null);

  const [choice, setChoice] = useState<AssistantChoice | null>(null);

  const previousResponseId = useRef<string | null>(null);

  const workflowInstanceId = useRef<string | null>(null);

  const submissionInProgress = useRef(false);

  const workflowGeneration = useRef(0);

  const statusInProgress = useRef(false);

  useEffect(() => {
    const storedId = window.sessionStorage.getItem(ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY);

    const parsedId = workflowReferenceSchema.safeParse(storedId);

    if (parsedId.success) {
      workflowInstanceId.current = parsedId.data;

      return;
    }

    if (storedId !== null) {
      window.sessionStorage.removeItem(ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY);
    }
  }, []);

  const saveWorkflow = useCallback((instance: WorkflowPublicInstance | null) => {
    setWorkflowInstance(instance);
    workflowInstanceId.current = instance?.id ?? null;

    if (instance) {
      window.sessionStorage.setItem(ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY, instance.id);
    } else {
      previousResponseId.current = null;
      window.sessionStorage.removeItem(ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY);
    }
  }, []);

  const refreshWorkflowStatus = useCallback(async () => {
    const id = workflowInstanceId.current;

    if (!id || submissionInProgress.current || statusInProgress.current) {
      return;
    }

    statusInProgress.current = true;
    const generation = workflowGeneration.current;

    const current = () =>
      generation === workflowGeneration.current && id === workflowInstanceId.current;

    try {
      let instance: WorkflowPublicInstance | null | undefined;

      for await (const event of streamAssistant({
        action: "workflow_status",
        workflowInstanceId: id,
      })) {
        if (event.type === "workflow_instance") {
          instance = event.instance;
        }
      }

      if (instance === undefined) {
        throw new Error("The status response was missing its workflow state.");
      }

      if (current()) {
        saveWorkflow(instance);
        setWorkflowStatusError(null);
      }
    } catch (error) {
      if (current()) {
        if (error instanceof WorkflowAccessError) {
          saveWorkflow(null);
          setWorkflowStatusError("This saved booking is unavailable in this browser session.");
        } else {
          setWorkflowStatusError(
            "Couldn’t load the saved booking. Reopen the assistant to try again.",
          );
        }
      }
    } finally {
      statusInProgress.current = false;
    }
  }, [saveWorkflow]);

  const submitRequest = useCallback(
    async (request: AssistantRequest, message: string) => {
      if (!message || message.length > MAX_MESSAGE_LENGTH || submissionInProgress.current) {
        return;
      }

      submissionInProgress.current = true;
      workflowGeneration.current += 1;
      setWorkflowStatusError(null);
      if ("action" in request) {
        // Booking actions have no model checkpoint; the next message reloads saved state.
        previousResponseId.current = null;
      } else {
        setInput("");
      }

      setIsLoading(true);
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

      let nextCheckpoint = previousResponseId.current;

      try {
        for await (const event of streamAssistant(request)) {
          if (event.type === "choice") {
            setChoice(event.choice);
            // The structured choice owns the question, replacing any provisional model text.
            updateAssistantMessage((current) => ({ ...current, content: event.choice.question }));
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
            nextCheckpoint = event.responseId;
          }

          if (event.type === "workflow_instance") {
            saveWorkflow(event.instance);
            if (!event.instance) {
              nextCheckpoint = null;
            }
          }

          if (event.type === "done") {
            previousResponseId.current = nextCheckpoint;
          }
        }
      } catch (error) {
        if (error instanceof WorkflowAccessError) {
          saveWorkflow(null);
        }

        setChoice(null);
        const messageText =
          "action" in request && error instanceof AssistantStreamInterruptedError
            ? "The booking response was interrupted. Check the saved status before confirming again."
            : error instanceof Error
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
    [saveWorkflow],
  );

  const submitMessage = useCallback(
    (rawMessage: string) =>
      submitRequest(
        {
          message: rawMessage.trim(),
          previousResponseId: previousResponseId.current,
          workflowInstanceId:
            workflowInstance?.status === "completed" || workflowInstance?.status === "cancelled"
              ? null
              : workflowInstanceId.current,
        },
        rawMessage.trim(),
      ),
    [submitRequest, workflowInstance?.status],
  );

  const submitWorkflowAction = useCallback(
    (request: AssistantWorkflowAction) => {
      return submitRequest(
        request,
        {
          confirm_workflow: "Confirm",
          retry_workflow: "Check retry",
        }[request.action],
      );
    },
    [submitRequest],
  );

  const trimmedInput = input.trim();

  return {
    canSubmit: trimmedInput.length > 0 && trimmedInput.length <= MAX_MESSAGE_LENGTH && !isLoading,
    input,
    isLoading,
    messages,
    setInput,
    submitMessage,
    submitWorkflowAction,
    choice,
    dismissChoice: () => setChoice(null),
    workflowInstance,
    refreshWorkflowStatus,
    workflowStatusError,
  };
}
