"use client";

import { useRef, useState } from "react";
import { MAX_MESSAGE_LENGTH } from "@/contracts/assistant.contract";
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

    try {
      for await (const event of streamAssistant({
        message,
        previousResponseId: previousResponseId.current,
      })) {
        switch (event.type) {
          case "delta":
            updateReply((reply) => ({ ...reply, content: reply.content + event.delta }));
            break;

          case "options":
            options = event.options;
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
    submitDraft,
    submitMessage,
  };
}
