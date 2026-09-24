"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Dialog } from "@base-ui/react/dialog";
import { Maximize2Icon, MessageSquareIcon, Minimize2Icon, XIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { CardContent } from "@/shared/components/ui/Card";
import { cn } from "@/shared/utils/class-names";
import { AssistantComposer } from "./AssistantComposer";
import { AssistantMessages, type StarterAction } from "./AssistantMessages";
import { useAssistant } from "../hooks/useAssistant";
import { useAssistantSurface } from "../hooks/useAssistantSurface";

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
    shouldReduceMotion,
    submitMessage,
  } = useAssistant();

  const {
    closeChat,
    handleLauncherFocus,
    isExpanded,
    isMobile,
    isOpen,
    launcherRef,
    messagesEndRef,
    openChat,
    shellRef,
    surfaceTransition,
    textareaRef,
    toggleExpanded,
  } = useAssistantSurface({
    clearError,
    isLoading,
    messages,
    shouldReduceMotion,
    submitMessage,
  });

  const isMobileSheet = isMobile && isOpen;

  const launcherWidth = isMobile ? 52 : 154;

  async function handleSubmit() {
    if (canSubmit) {
      await submitInput();
    }
  }

  async function handleStarterAction(action: StarterAction) {
    if (!isLoading && messages.length === 0) {
      await submitMessage(action.message, action.workflowStart);
    }
  }

  const surface = (
    <motion.div
      layout={!isMobile}
      initial={false}
      animate={{
        maxWidth: isOpen ? 640 : launcherWidth,
        backgroundColor: isOpen ? "#ffffff" : "var(--brand-primary)",
        borderColor:
          isMobileSheet && isExpanded
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
        "portfolio-chat-surface pointer-events-auto flex w-full flex-col overflow-hidden border",
        isMobileSheet
          ? isExpanded
            ? "h-dvh max-w-none rounded-none bg-white"
            : "h-[75dvh] max-w-none rounded-t-[2rem] rounded-b-none bg-white"
          : "rounded-[2rem]",
        !isMobileSheet && (isOpen ? "h-[min(72vh,38rem)] sm:h-[min(52vh,38rem)]" : "h-12"),
      )}
    >
      {isOpen ? (
        <motion.div
          initial={isMobileSheet && !shouldReduceMotion ? { opacity: 0, y: 24 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: isMobileSheet ? 0.2 : 0 }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <AssistantMessages
            headerActions={
              <>
                <Button
                  type="button"
                  aria-label={
                    isExpanded
                      ? "Return portfolio chat to default height"
                      : "Expand portfolio chat to full screen"
                  }
                  aria-expanded={isExpanded}
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  onClick={toggleExpanded}
                >
                  {isExpanded ? (
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
            onStarterAction={(action) => void handleStarterAction(action)}
          />

          <CardContent className="shrink-0 p-0">
            <AssistantComposer
              canSubmit={canSubmit}
              errorMessage={errorMessage}
              input={input}
              onClose={closeChat}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              textareaRef={textareaRef}
            />
          </CardContent>
        </motion.div>
      ) : (
        <Button
          ref={launcherRef}
          type="button"
          aria-label="Open portfolio chat"
          onClick={openChat}
          onFocus={handleLauncherFocus}
          variant="ghost"
          className="h-12 w-full justify-center gap-2 rounded-none px-4 text-left text-ink hover:bg-black/5 hover:text-ink"
        >
          <MessageSquareIcon aria-hidden="true" className="size-4" />
          <span className="hidden text-[13px] font-medium sm:inline">Ask assistant</span>
        </Button>
      )}
    </motion.div>
  );

  const panel = (
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
          "relative z-10 ml-auto flex w-full max-w-[40rem] justify-end",
          isMobileSheet ? "h-full max-w-none items-end" : null,
        )}
      >
        {isMobileSheet ? (
          <Dialog.Popup render={surface} aria-labelledby="portfolio-chat-title" finalFocus={launcherRef} />
        ) : (
          surface
        )}
      </div>
    </div>
  );

  return (
    <Dialog.Root
      open={isMobileSheet}
      onOpenChange={(open) => {
        if (!open) {
          closeChat();
        }
      }}
    >
      {isMobileSheet ? <Dialog.Portal>{panel}</Dialog.Portal> : panel}
    </Dialog.Root>
  );
}
