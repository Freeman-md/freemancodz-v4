"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Bot, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { followHomeAnchor } from "../../_components/layout/follow-home-anchor";
import { useAssistant } from "../hooks/useAssistant";
import { useAssistantSurface } from "../hooks/useAssistantSurface";
import { AssistantComposer } from "./AssistantComposer";
import { AssistantMessages } from "./AssistantMessages";
import { AssistantWorkflowConfirmation } from "./AssistantWorkflowConfirmation";
import { AssistantWorkflowProgress } from "./AssistantWorkflowProgress";

export function FloatingPortfolioChat() {
  const chat = useAssistant();

  const {
    isOpen,
    setIsOpen,
    isMobile,
    shouldReduceMotion,
    launcherRef,
    closeRef,
    returnFocus: returnFocusRef,
    messagesEndRef,
    openChat,
  } = useAssistantSurface({
    onDraft: chat.openDraft,
    lastMessage: chat.messages.at(-1),
    isLoading: chat.isLoading || chat.isApproving,
  });

  const { workflow, workflowRestoreFailed, restoreWorkflow, cancelWorkflowRestore } = chat;

  useEffect(() => {
    if (isOpen) {
      void restoreWorkflow();

      return cancelWorkflowRestore;
    }
  }, [isOpen, restoreWorkflow, cancelWorkflowRestore]);

  const runStatus = workflow?.run?.status;

  const shouldPoll = runStatus === "queued" || runStatus === "running" || runStatus === "retry";

  const workflowId = workflow?.id;

  useEffect(() => {
    if (!isOpen || !shouldPoll) {
      return;
    }

    const interval = window.setInterval(restoreWorkflow, 5000);

    return () => {
      window.clearInterval(interval);
      cancelWorkflowRestore();
    };
  }, [isOpen, shouldPoll, workflowId, restoreWorkflow, cancelWorkflowRestore]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pendingSource = useRef<string | null>(null);

  const showReplyOptions =
    !chat.isLoading &&
    !chat.draft.subject &&
    !chat.draft.text.trim() &&
    chat.replyOptions.length > 0;

  function closeForSource(href: string) {
    pendingSource.current = href;
    returnFocusRef.current = null;
    setIsOpen(false);
  }

  function finishClose(open: boolean) {
    if (open || !pendingSource.current) {
      return;
    }

    const href = pendingSource.current;

    pendingSource.current = null;
    // Base UI queues the dialog unmount before invoking this callback.
    requestAnimationFrame(() => followHomeAnchor(href, true));
  }

  return (
    <div className="assistant-root">
      <Dialog.Root
        open={isOpen}
        onOpenChange={setIsOpen}
        onOpenChangeComplete={finishClose}
        modal={isMobile}
      >
        <Dialog.Trigger
          className="assistant-launcher"
          aria-label="Open portfolio chat"
          ref={launcherRef}
          onClick={openChat}
          hidden={isOpen}
        >
          <Bot size={22} aria-hidden="true" />
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Popup
            className="portfolio-chat-surface"
            initialFocus={closeRef}
            finalFocus={() => {
              const origin = returnFocusRef.current;

              if (!origin) {
                return false;
              }

              return origin.isConnected ? origin : launcherRef.current;
            }}
          >
            <header className="assistant-header">
              <div>
                <Dialog.Title>Freeman’s assistant</Dialog.Title>
                <p>AI assistant</p>
              </div>
              <Dialog.Close
                className="assistant-control"
                aria-label="Close assistant"
                ref={closeRef}
              >
                <X size={19} aria-hidden="true" />
              </Dialog.Close>
            </header>

            {workflow && !workflow.run && (
              <AssistantWorkflowProgress
                key={workflow.id}
                instance={workflow}
                onDiscard={
                  workflow.status === "active" && !chat.discardConfirmation
                    ? chat.requestDiscard
                    : undefined
                }
                discardDisabled={chat.isDiscarding || chat.isApproving || chat.isLoading}
              />
            )}

            {workflowRestoreFailed && (
              <p role="status" className="px-4 py-2 text-sm sm:px-6">
                Could not restore workflow progress.
              </p>
            )}

            <AssistantMessages
              activityLabel={chat.activityLabel}
              showStarters={!workflow || !!workflow.run}
              isLoading={chat.isLoading || chat.isApproving}
              messages={chat.messages}
              messagesEndRef={messagesEndRef}
              shouldReduceMotion={shouldReduceMotion}
              onStarterAction={(message) => void chat.submitMessage(message)}
              onInternalSource={closeForSource}
            />

            {showReplyOptions && (
              <div className="assistant-reply-options" role="group" aria-label="Suggested replies">
                <p className="basis-full text-sm">Choose a reply or type your own.</p>
                {chat.replyOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      textareaRef.current?.focus({ preventScroll: true });
                      void chat.submitMessage(option);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {workflow && chat.discardConfirmation && (
              <AssistantWorkflowConfirmation
                title={`Discard the draft for “${workflow.title}”?`}
                confirmLabel={chat.isDiscarding ? "Discarding…" : "Confirm discard"}
                declineLabel="Keep draft"
                destructive
                disabled={chat.isDiscarding || chat.isLoading}
                error={chat.discardError}
                onDecline={chat.keepDraft}
                onConfirm={() => void chat.confirmDiscard()}
              />
            )}

            {chat.discardError && !chat.discardConfirmation && (
              <p role="status" className="px-4 py-2 text-sm sm:px-6">
                {chat.discardError}
              </p>
            )}

            {workflow?.review && !chat.discardConfirmation && (
              <AssistantWorkflowConfirmation
                key={workflow.review.id}
                title="Review request"
                rows={workflow.review.rows}
                confirmLabel={workflow.review.label}
                declineLabel="Request changes"
                disabled={chat.isApproving || chat.isLoading}
                onConfirm={() => void chat.confirmReview()}
                onDecline={() => textareaRef.current?.focus()}
              />
            )}

            <AssistantComposer
              canSubmit={chat.canSubmit}
              input={chat.draft.text}
              subject={chat.draft.subject}
              onInputChange={chat.setInput}
              onSubmit={chat.submitDraft}
              textareaRef={textareaRef}
              maxLength={chat.maxLength}
            />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
