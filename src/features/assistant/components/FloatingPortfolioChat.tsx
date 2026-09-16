"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Maximize2Icon, Minimize2Icon, XIcon } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Button } from "@/shared/components/ui/Button";
import { CardContent } from "@/shared/components/ui/Card";
import { cn } from "@/shared/utils/class-names";
import { ChatComposer } from "./ChatComposer";
import { ChatConversation } from "./ChatConversation";
import { ChatLauncher } from "./ChatLauncher";
import { useAssistant } from "../hooks/useAssistant";
import { useFloatingPanel } from "../hooks/useFloatingPanel";

export function FloatingPortfolioChat() {
  const {
    canSubmit,
    clearError,
    errorMessage,
    handleInputChange,
    handleSubmit: submitInput,
    input,
    isLoading,
    messages,
    submitMessage,
  } = useAssistant();

  const {
    closeChat,
    handleLauncherFocus,
    isMobile,
    isConversation,
    isOpen,
    isSheetExpanded,
    launcherRef,
    messagesEndRef,
    openChat,
    shellRef,
    showConversation,
    shouldReduceMotion,
    stage,
    surfaceTransition,
    textareaRef,
    toggleSheetExpanded,
  } = useFloatingPanel({ clearError, isLoading, messages, submitMessage });

  const isMobileSheet = isMobile && isOpen;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    showConversation();
    await submitInput();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-4 sm:pb-[max(env(safe-area-inset-bottom),1.25rem)]",
        isMobileSheet ? "h-dvh px-0 pb-0" : null,
      )}
    >
      <AnimatePresence>
        {isMobileSheet ? (
          <motion.button
            type="button"
            aria-label="Close portfolio chat"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
            className="pointer-events-auto fixed inset-0 z-0 bg-black/35"
            onClick={closeChat}
          />
        ) : null}
      </AnimatePresence>
      <div
        ref={shellRef}
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-[40rem] justify-center",
          isMobileSheet ? "h-full max-w-none items-end" : null,
        )}
      >
        <motion.div
          layout={!isMobile}
          initial={false}
          animate={{
            maxWidth: isOpen ? 640 : 320,
            backgroundColor: isOpen ? "#ffffff" : "#000000",
            borderColor:
              isMobileSheet && isSheetExpanded
                ? "rgba(0,0,0,0)"
                : isOpen
                  ? "rgba(0,0,0,0.12)"
                  : "rgba(255,255,255,0.1)",
            boxShadow: isMobileSheet
              ? "0 -28px 80px -48px rgba(0,0,0,0.42)"
              : isOpen
                ? "0 28px 80px -38px rgba(0,0,0,0.36)"
                : "0 26px 80px -34px rgba(0,0,0,0.72)",
          }}
          transition={surfaceTransition}
          style={{ transformOrigin: "50% 100%" }}
          role={isMobileSheet ? "dialog" : undefined}
          aria-modal={isMobileSheet || undefined}
          aria-labelledby={isMobileSheet ? "portfolio-chat-title" : undefined}
          className={cn(
            "pointer-events-auto flex w-full flex-col overflow-hidden border",
            isMobileSheet
              ? isSheetExpanded
                ? "h-dvh max-w-none rounded-none bg-white"
                : "h-[75dvh] max-w-none rounded-t-[2rem] rounded-b-none bg-white"
              : "rounded-[2rem]",
            !isMobileSheet &&
              (isConversation ? "h-[min(72vh,38rem)] sm:h-[min(52vh,38rem)]" : "h-16"),
          )}
        >
          {stage === "launcher" ? (
            <ChatLauncher
              buttonRef={launcherRef}
              onFocus={handleLauncherFocus}
              onOpen={openChat}
            />
          ) : (
            <motion.div
              initial={isMobileSheet && !shouldReduceMotion ? { opacity: 0, y: 24 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion ? { duration: 0 } : { duration: isMobileSheet ? 0.2 : 0 }
              }
              className="flex min-h-0 flex-1 flex-col"
            >
              <ChatConversation
                className={isConversation ? undefined : "sm:hidden"}
                headerActions={
                  <>
                    <Button
                      type="button"
                      aria-label={
                        isSheetExpanded
                          ? "Return portfolio chat to default height"
                          : "Expand portfolio chat to full screen"
                      }
                      aria-expanded={isSheetExpanded}
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-full"
                      onClick={toggleSheetExpanded}
                    >
                      {isSheetExpanded ? (
                        <Minimize2Icon aria-hidden="true" />
                      ) : (
                        <Maximize2Icon aria-hidden="true" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      aria-label="Close portfolio chat"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-full"
                      onClick={closeChat}
                    >
                      <XIcon aria-hidden="true" />
                    </Button>
                  </>
                }
                isLoading={isLoading}
                messages={messages}
                messagesEndRef={messagesEndRef}
                shouldReduceMotion={shouldReduceMotion}
              />

              <CardContent className="shrink-0 p-0">
                <ChatComposer
                  canSubmit={canSubmit}
                  errorMessage={errorMessage}
                  input={input}
                  onClose={closeChat}
                  onInputChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onSubmit={handleSubmit}
                  textareaRef={textareaRef}
                />
              </CardContent>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
