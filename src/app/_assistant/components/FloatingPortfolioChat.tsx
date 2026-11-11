"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Bot, X } from "lucide-react";
import { useRef } from "react";
import { followHomeAnchor } from "../../_components/layout/follow-home-anchor";
import { useAssistant } from "../hooks/useAssistant";
import { useAssistantSurface } from "../hooks/useAssistantSurface";
import { AssistantComposer } from "./AssistantComposer";
import { AssistantMessages } from "./AssistantMessages";

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
    isLoading: chat.isLoading,
  });

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

            <AssistantMessages
              isLoading={chat.isLoading}
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
