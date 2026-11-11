"use client";

import { useCallback, useRef, useState } from "react";
import {
  MAX_MESSAGE_LENGTH,
  type ActiveWorkflow,
  type AssistantActivity,
  type AssistantSource,
  type WorkflowObservation,
} from "@/contracts/assistant.contract";
import { approveWorkflow } from "../api/approve-workflow";
import { discardWorkflow } from "../api/discard-workflow";
import { fetchActiveWorkflow } from "../api/fetch-active-workflow";
import { fetchWorkflowResult } from "../api/fetch-workflow-result";
import { streamAssistant } from "../api/stream-assistant-response";
import type { ChatMessage } from "../types";

const EMPTY_DRAFT: { text: string; subject: string | null } = {
  text: "",
  subject: null,
};

function savedResultText(workflow: ActiveWorkflow | null) {
  const run = workflow?.run;

  if (run?.businessStatus) {
    const time = workflow?.details.find(({ key }) => key === "time")?.value;

    return time ? `${run.businessStatus} for ${time}.` : `${run.businessStatus}.`;
  }

  switch (run?.outcome) {
    case "success":
      return "Your request is complete.";
    case "pending":
      return "Your request is saved and still waiting to finish.";
    case "failure":
      return "I couldn’t complete the request. Contact Freeman for help.";
    case "uncertain":
      return "I can’t verify the outcome yet. Check the saved workflow status before trying again.";
    default:
      return "I couldn’t verify the confirmation. Check the saved workflow before trying again.";
  }
}

export function useAssistant() {
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [activityLabel, setActivityLabel] = useState<string | null>(null);

  function recordActivity({ label, status }: AssistantActivity) {
    switch (status) {
      case "started":
        setActivityLabel(label);
        break;
      case "retrying":
        setActivityLabel("Retrying");
        break;
      case "checking":
        setActivityLabel("Checking outcome");
        break;
      case "retry_scheduled":
        setActivityLabel("Waiting to retry");
        break;
      case "check_scheduled":
        setActivityLabel("Waiting to check the outcome");
        break;
      default:
        setActivityLabel(null);
    }
  }

  const [isLoading, setIsLoading] = useState(false);

  const [replyOptions, setReplyOptions] = useState<string[]>([]);

  const [workflow, setWorkflow] = useState<ActiveWorkflow | null>(null);

  const [workflowRestoreFailed, setWorkflowRestoreFailed] = useState(false);

  const [isApproving, setIsApproving] = useState(false);

  const workflowUpdateInProgress = useRef(false);

  const [discardTarget, setDiscardTarget] = useState<WorkflowObservation | null>(null);

  const [discardError, setDiscardError] = useState<string | null>(null);

  const [isDiscarding, setIsDiscarding] = useState(false);

  const discardConfirmation =
    workflow &&
    !workflow.run &&
    workflow.id === discardTarget?.id &&
    workflow.revision === discardTarget.revision
      ? discardTarget
      : null;

  const workflowRestore = useRef<AbortController | null>(null);

  const cancelWorkflowRestore = useCallback(() => {
    workflowRestore.current?.abort();
  }, []);

  const restoreWorkflow = useCallback(() => {
    const controller = new AbortController();

    workflowRestore.current?.abort();
    workflowRestore.current = controller;

    return fetchActiveWorkflow(controller.signal)
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
  }, []);

  const previousResponseId = useRef<string | null>(null);

  const submissionInProgress = useRef(false);

  const context = draft.subject ? `Context: ${draft.subject}\n\n` : "";

  const maxLength = Math.max(0, MAX_MESSAGE_LENGTH - context.length);

  const text = draft.text.trim();

  const canSubmit =
    !isLoading && !isApproving && !isDiscarding && text.length > 0 && text.length <= maxLength;

  function setInput(text: string) {
    setDraft((current) => ({ ...current, text }));
  }

  async function submitMessage(rawMessage: string) {
    const message = rawMessage.trim();

    if (
      !message ||
      message.length > MAX_MESSAGE_LENGTH ||
      submissionInProgress.current ||
      workflowUpdateInProgress.current
    ) {
      return;
    }

    submissionInProgress.current = true;
    setIsLoading(true);
    setActivityLabel(null);
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
          case "activity":
            recordActivity(event);
            break;
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

          case "confirm_workflow_discard":
            setDiscardError(null);
            setDiscardTarget(event.draft);
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
    if (!workflow?.review || workflowUpdateInProgress.current || submissionInProgress.current) {
      return;
    }

    workflowUpdateInProgress.current = true;
    cancelWorkflowRestore();
    setIsApproving(true);
    setActivityLabel(null);
    setReplyOptions([]);

    const { id: reviewId, label } = workflow.review;

    const turnId = crypto.randomUUID();

    const replyId = `${turnId}-assistant`;

    setMessages((current) => [
      ...current,
      { id: `${turnId}-user`, role: "user", content: label },
      { id: replyId, role: "assistant", content: "" },
    ]);

    function showResult(content: string) {
      setMessages((current) =>
        current.map((message) => (message.id === replyId ? { ...message, content } : message)),
      );
    }

    try {
      const approval = await approveWorkflow(
        {
          reviewId,
          expectedRevision: workflow.revision,
        },
        recordActivity,
      ).catch(() => null);

      if (approval?.status === "conflict") {
        setWorkflow(null);
        await restoreWorkflow();
        showResult("The review changed. Check the latest details before confirming.");

        return;
      }

      const result = await fetchWorkflowResult({
        reviewId,
        previousResponseId: previousResponseId.current,
      }).catch(() => null);

      const saved = result?.workflow ?? approval?.workflow ?? null;

      if (saved) {
        cancelWorkflowRestore();
        setWorkflow(saved);
        setWorkflowRestoreFailed(false);
      } else {
        setWorkflow(null);
        await restoreWorkflow();
      }

      if (result?.reply) {
        previousResponseId.current = result.reply.responseId;
      }

      showResult(result?.reply?.text ?? savedResultText(saved));
    } finally {
      workflowUpdateInProgress.current = false;
      setIsApproving(false);
    }
  }

  function requestDiscard() {
    if (workflow?.status === "active" && !workflow.run) {
      setDiscardError(null);
      setDiscardTarget({ id: workflow.id, revision: workflow.revision });
    }
  }

  async function confirmDiscard() {
    if (!discardConfirmation || workflowUpdateInProgress.current || submissionInProgress.current) {
      return;
    }

    workflowUpdateInProgress.current = true;
    cancelWorkflowRestore();
    setIsDiscarding(true);
    setDiscardError(null);

    try {
      if (await discardWorkflow(discardConfirmation)) {
        setWorkflow(null);
        previousResponseId.current = null;
        setReplyOptions([]);
      } else {
        setDiscardError("The draft changed. Check the latest details.");
      }

      setDiscardTarget(null);
      restoreWorkflow();
    } catch {
      setDiscardError("Could not discard the draft. Try again.");
    } finally {
      workflowUpdateInProgress.current = false;
      setIsDiscarding(false);
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
    activityLabel,
    isLoading,
    replyOptions,
    workflow,
    workflowRestoreFailed,
    restoreWorkflow,
    cancelWorkflowRestore,
    confirmReview,
    isApproving,
    requestDiscard,
    confirmDiscard,
    discardConfirmation,
    keepDraft: () => setDiscardTarget(null),
    discardError,
    isDiscarding,
    submitDraft,
    submitMessage,
  };
}
