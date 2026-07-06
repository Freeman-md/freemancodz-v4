"use client";

import { motion } from "framer-motion";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChatComposer } from "./ChatComposer";
import { ChatConversation } from "./ChatConversation";
import { ChatLauncher } from "./ChatLauncher";
import { useFloatingPortfolioChat } from "../hooks/useFloatingPortfolioChat";

export function FloatingPortfolioChat() {
  const chat = useFloatingPortfolioChat();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-4 sm:pb-[max(env(safe-area-inset-bottom),1.25rem)]">
      <div ref={chat.shellRef} className="mx-auto flex w-full max-w-[40rem] justify-center">
        <motion.div
          layout
          animate={{
            maxWidth: chat.isOpen ? 640 : 320,
            backgroundColor: chat.isOpen ? "#ffffff" : "#000000",
            borderColor: chat.isOpen
              ? "rgba(0,0,0,0.12)"
              : "rgba(255,255,255,0.1)",
            boxShadow: chat.isOpen
              ? "0 28px 80px -38px rgba(0,0,0,0.36)"
              : "0 26px 80px -34px rgba(0,0,0,0.72)",
          }}
          transition={chat.surfaceTransition}
          style={{ transformOrigin: "50% 100%" }}
          className={cn(
            "pointer-events-auto flex w-full flex-col overflow-hidden rounded-[2rem] border",
            chat.isConversation
              ? "h-[min(72vh,38rem)] sm:h-[min(52vh,38rem)]"
              : "h-16",
          )}
        >
          {chat.stage === "launcher" ? (
            <ChatLauncher onOpen={chat.openChat} />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              {chat.isConversation ? (
                <ChatConversation
                  isLoading={chat.isLoading}
                  messages={chat.messages}
                  messagesEndRef={chat.messagesEndRef}
                  shouldReduceMotion={chat.shouldReduceMotion}
                />
              ) : null}

              <CardContent className="shrink-0 p-0">
                <ChatComposer
                  canSubmit={chat.canSubmit}
                  errorMessage={chat.errorMessage}
                  input={chat.input}
                  isLoading={chat.isLoading}
                  onClose={chat.closeChat}
                  onInputChange={chat.handleInputChange}
                  onKeyDown={chat.handleKeyDown}
                  onSubmit={chat.handleSubmit}
                  textareaRef={chat.textareaRef}
                />
              </CardContent>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
