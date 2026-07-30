"use client";

import { motion } from "framer-motion";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChatComposer } from "./ChatComposer";
import { ChatConversation } from "./ChatConversation";
import { ChatLauncher } from "./ChatLauncher";
import { useFloatingPortfolioChat } from "../hooks/useAssistant";

export function FloatingPortfolioChat() {
  const {
    canSubmit,
    closeChat,
    errorMessage,
    handleInputChange,
    handleKeyDown,
    handleSubmit,
    input,
    isConversation,
    isLoading,
    isOpen,
    messages,
    messagesEndRef,
    openChat,
    shellRef,
    shouldReduceMotion,
    stage,
    surfaceTransition,
    textareaRef,
  } = useFloatingPortfolioChat();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-4 sm:pb-[max(env(safe-area-inset-bottom),1.25rem)]">
      <div ref={shellRef} className="mx-auto flex w-full max-w-[40rem] justify-center">
        <motion.div
          layout
          initial={false}
          animate={{
            maxWidth: isOpen ? 640 : 320,
            backgroundColor: isOpen ? "#ffffff" : "#000000",
            borderColor: isOpen
              ? "rgba(0,0,0,0.12)"
              : "rgba(255,255,255,0.1)",
            boxShadow: isOpen
              ? "0 28px 80px -38px rgba(0,0,0,0.36)"
              : "0 26px 80px -34px rgba(0,0,0,0.72)",
          }}
          transition={surfaceTransition}
          style={{ transformOrigin: "50% 100%" }}
          className={cn(
            "pointer-events-auto flex w-full flex-col overflow-hidden rounded-[2rem] border",
            isConversation
              ? "h-[min(72vh,38rem)] sm:h-[min(52vh,38rem)]"
              : "h-16",
          )}
        >
          {stage === "launcher" ? (
            <ChatLauncher onOpen={openChat} />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              {isConversation ? (
                <ChatConversation
                  isLoading={isLoading}
                  messages={messages}
                  messagesEndRef={messagesEndRef}
                  shouldReduceMotion={shouldReduceMotion}
                />
              ) : null}

              <CardContent className="shrink-0 p-0">
                <ChatComposer
                  canSubmit={canSubmit}
                  errorMessage={errorMessage}
                  input={input}
                  isLoading={isLoading}
                  onClose={closeChat}
                  onInputChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onSubmit={handleSubmit}
                  textareaRef={textareaRef}
                />
              </CardContent>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
