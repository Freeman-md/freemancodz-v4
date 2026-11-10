"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Bot, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { AssistantChoice } from "./AssistantChoice";
import { AssistantWorkflowConfirmation } from "./AssistantWorkflowConfirmation";
import { AssistantComposer } from "./AssistantComposer";
import { AssistantMessages, type StarterAction } from "./AssistantMessages";
import { AssistantWorkflowProgress } from "./AssistantWorkflowProgress";
import { useAssistant } from "../hooks/useAssistant";
import { useAssistantSurface } from "../hooks/useAssistantSurface";
import { MAX_MESSAGE_LENGTH } from "@/contracts/assistant.contract";
import { followHomeAnchor } from "../../_components/layout/follow-home-anchor";

export function FloatingPortfolioChat() {
  const {
    canSubmit,
    input,
    isLoading,
    messages,
    setInput,
    submitMessage,
    choice,
    dismissChoice,
    workflowInstance,
    submitWorkflowAction,
    refreshWorkflowStatus,
    workflowStatusError,
  } = useAssistant();

  const {
    isOpen,
    setIsOpen,
    subject,
    setSubject,
    isMobile,
    shouldReduceMotion,
    launcherRef,
    closeRef,
    returnFocus,
    textareaRef,
    messagesEndRef,
    openChat,
    closeWithoutFocusReturn,
  } = useAssistantSurface({ messages, isLoading, setInput });

  const previousChoice = useRef(choice);

  const pendingSource = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      void refreshWorkflowStatus();
    }
  }, [isOpen, refreshWorkflowStatus]);

  const pendingBooking =
    workflowInstance?.outcome?.booking === "pending" ||
    workflowInstance?.outcome?.ownerNotice === "pending";

  useEffect(() => {
    if (!isOpen || !pendingBooking) {
      return;
    }

    const interval = window.setInterval(() => void refreshWorkflowStatus(), 5000);

    return () => window.clearInterval(interval);
  }, [isOpen, pendingBooking, refreshWorkflowStatus]);

  useEffect(() => {
    if (isOpen && previousChoice.current && !choice) {
      textareaRef.current?.focus({ preventScroll: true });
    }

    previousChoice.current = choice;
  }, [choice, isOpen, textareaRef]);

  const context = subject ? `Context: ${subject}\n\n` : "";

  const maxLength = MAX_MESSAGE_LENGTH - context.length;

  async function handleSubmit() {
    if (!canSubmit || input.trim().length > maxLength) {
      return;
    }

    setSubject(null);
    await submitMessage(context + input.trim());
  }

  async function handleStarterAction(action: StarterAction) {
    if (!isLoading && messages.length === 0) {
      setSubject(null);
      await submitMessage(action);
    }
  }

  function closeForSource(href: string) {
    pendingSource.current = href;
    closeWithoutFocusReturn();
  }

  function finishClose(open: boolean) {
    if (open || !pendingSource.current) {
      return;
    }

    const href = pendingSource.current;

    pendingSource.current = null;
    followHomeAnchor(href, true);
  }

  const panel = (
    <Dialog.Popup
      className="portfolio-chat-surface"
      initialFocus={closeRef}
      finalFocus={() => {
        if (!returnFocus.current) {
          return false;
        }

        return returnFocus.current.isConnected ? returnFocus.current : launcherRef.current;
      }}
    >
      <header className="assistant-header">
        <div>
          <Dialog.Title>Freeman’s assistant</Dialog.Title>
          <p>AI assistant</p>
        </div>
        <Dialog.Close className="assistant-control" aria-label="Close assistant" ref={closeRef}>
          <X size={19} aria-hidden="true" />
        </Dialog.Close>
      </header>
      {workflowStatusError && (
        <p role="status" className="px-4 py-2 text-sm text-muted">
          {workflowStatusError}
        </p>
      )}
      {workflowInstance && (
        <AssistantWorkflowProgress key={workflowInstance.id} instance={workflowInstance} />
      )}
      <AssistantMessages
        isLoading={isLoading}
        messages={messages}
        messagesEndRef={messagesEndRef}
        shouldReduceMotion={shouldReduceMotion}
        onStarterAction={(action) => void handleStarterAction(action)}
        onInternalSource={closeForSource}
      >
        {workflowInstance && (
          <AssistantWorkflowConfirmation
            instance={workflowInstance}
            isLoading={isLoading}
            onSubmit={submitWorkflowAction}
            onRequestChanges={() => {
              dismissChoice();
              textareaRef.current?.focus({ preventScroll: true });
            }}
          />
        )}
      </AssistantMessages>
      {choice && !subject ? (
        <AssistantChoice
          key={messages.at(-1)?.id}
          choice={choice}
          isLoading={isLoading}
          onSend={submitMessage}
          onWriteReply={dismissChoice}
        />
      ) : (
        <AssistantComposer
          canSubmit={canSubmit && input.trim().length <= maxLength}
          input={input}
          subject={subject}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          textareaRef={textareaRef}
          maxLength={maxLength}
        />
      )}
    </Dialog.Popup>
  );

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
        <Dialog.Portal>{panel}</Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
