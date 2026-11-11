"use client";

import { useCallback, useRef, useState } from "react";
import {
  MAX_MESSAGE_LENGTH,
  type ActiveWorkflow,
  type AssistantSource,
} from "@/contracts/assistant.contract";
import { approveWorkflow } from "../api/approve-workflow";
import { fetchActiveWorkflow } from "../api/fetch-active-workflow";
import { streamAssistant } from "../api/stream-assistant-response";
import type { ChatMessage } from "../types";

const EMPTY_DRAFT: { text: string; subject: string | null } = {
  text: "",
  subject: null,
};

export function useAssistant() {
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const [replyOptions, setReplyOptions] = useState<string[]>([]);

  const [workflow, setWorkflow] = useState<ActiveWorkflow | null>(null);

  const [workflowRestoreFailed, setWorkflowRestoreFailed] = useState(false);

  const [approvalError, setApprovalError] = useState<string | null>(null);

  const [isApproving, setIsApproving] = useState(false);

  const approvalInProgress = useRef(false);

  const workflowRestore = useRef<AbortController | null>(null);

  const cancelWorkflowRestore = useCallback(() => {
    workflowRestore.current?.abort();
  }, []);

  const restoreWorkflow = useCallback(() => {
    const controller = new AbortController();

    workflowRestore.current?.abort();
    workflowRestore.current = controller;

    void fetchActiveWorkflow(controller.signal)
      .then((instance) => {
        if (!controller.signal.aborted) {
          setWorkflow(instance);
          setWorkflowRestoreFailed(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setWorkflowRestoreFailed(true);
        }
      });

    return () => controller.abort();
  }, []);

  const previousResponseId = useRef<string | null>(null);

  const submissionInProgress = useRef(false);

  const context = draft.subject ? `Context: ${draft.subject}\n\n` : "";

  const maxLength = Math.max(0, MAX_MESSAGE_LENGTH - context.length);

  const text = draft.text.trim();

  const canSubmit = !isLoading && text.length > 0 && text.length <= maxLength;

  function setInput(text: string) {
    setDraft((current) => ({ ...current, text }));
  }

  async function submitMessage(rawMessage: string) {
    const message = rawMessage.trim();

    if (!message || message.length > MAX_MESSAGE_LENGTH || submissionInProgress.current) {
      return;
    }

    submissionInProgress.current = true;
    setIsLoading(true);
    setDraft(EMPTY_DRAFT);
    setReplyOptions([]);

    const turnId = crypto.randomUUID();

    const assistantMessageId = `${turnId}-assistant`;

    setMessages((current) => [
      ...current,
      { id: `${turnId}-user`, role: "user", content: message },
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);

    function updateReply(update: (message: ChatMessage) => ChatMessage) {
      setMessages((current) =>
        current.map((item) => (item.id === assistantMessageId ? update(item) : item)),
      );
    }

    let responseId: string | null = null;

    let options: string[] = [];

    let sources: AssistantSource[] | undefined;

    try {
      for await (const event of streamAssistant({
        message,
        previousResponseId: previousResponseId.current,
        observedWorkflow: workflow ? { id: workflow.id, revision: workflow.revision } : undefined,
      })) {
        switch (event.type) {
          case "delta":
            updateReply((reply) => ({ ...reply, content: reply.content + event.delta }));
            break;

          case "options":
            options = event.options;
            break;

          case "sources":
            sources = event.sources;
            break;

          case "workflow_instance":
            workflowRestore.current?.abort();
            setWorkflow(event.instance);
            setWorkflowRestoreFailed(false);
            break;

          case "response_id":
            responseId = event.responseId;
            break;

          case "done":
            if (!responseId) {
              throw new Error("The assistant reply was interrupted. Please try again.");
            }

            previousResponseId.current = responseId;
            setReplyOptions(options);

            if (sources) {
              updateReply((reply) => ({ ...reply, sources }));
            }

            break;
        }
      }
    } catch (error) {
      const content =
        error instanceof Error
          ? error.message
          : "The assistant could not respond. Please try again.";

      updateReply((reply) => ({ ...reply, content, error: true }));
    } finally {
      submissionInProgress.current = false;
      setIsLoading(false);
    }
  }

  async function confirmReview() {
    if (!workflow?.review || approvalInProgress.current) {return;}

    approvalInProgress.current = true;
    cancelWorkflowRestore();
    setIsApproving(true);
    setApprovalError(null);

    try {
      const result = await approveWorkflow({
        reviewId: workflow.review.id,
        expectedRevision: workflow.revision,
      });

      if (result.status === "accepted") {
        setWorkflow(result.workflow);
      } else {
        setApprovalError("The review changed. Check the latest details.");
        restoreWorkflow();
      }
    } catch {
      setApprovalError("Could not confirm the request. Check its saved progress.");
      restoreWorkflow();
    } finally {
      approvalInProgress.current = false;
      setIsApproving(false);
    }
  }

  function submitDraft() {
    if (canSubmit) {
      return submitMessage(context + text);
    }
  }

  return {
    draft,
    setInput,
    openDraft: setDraft,
    maxLength,
    canSubmit,
    messages,
    isLoading,
    replyOptions,
    workflow,
    workflowRestoreFailed,
    restoreWorkflow,
    cancelWorkflowRestore,
    confirmReview,
    approvalError,
    isApproving,
    submitDraft,
    submitMessage,
  };
}
