"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Dialog } from "@base-ui/react/dialog";
import { Maximize2Icon, MessageSquareIcon, Minimize2Icon, XIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/Button";
import { cn } from "@/app/_utils/class-names";
import { AssistantComposer } from "./AssistantComposer";
import { AssistantMessages, type StarterAction } from "./AssistantMessages";
import { AssistantWorkflowProgress } from "./AssistantWorkflowProgress";
import { useAssistant } from "../hooks/useAssistant";
import { useAssistantSurface } from "../hooks/useAssistantSurface";

export function FloatingPortfolioChat() {
  const { canSubmit, input, isLoading, messages, setInput, submitMessage, workflowInstance } =
    useAssistant();

  const shouldReduceMotion = useReducedMotion();

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
    isLoading,
    messages,
    shouldReduceMotion,
    submitMessage,
  });

  const isMobileSheet = isMobile && isOpen;

  const launcherWidth = isMobile ? 52 : 154;

  async function handleSubmit() {
    if (canSubmit) {
      await submitMessage(input);
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
        maxWidth: isOpen ? 560 : launcherWidth,
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
      role="dialog"
      aria-modal={isMobileSheet || undefined}
      aria-labelledby="portfolio-chat-title"
      className={cn(
        "portfolio-chat-surface pointer-events-auto flex w-full flex-col overflow-hidden border",
        isMobileSheet
          ? isExpanded
            ? "h-dvh max-w-none rounded-none bg-white"
            : "h-[75dvh] max-w-none rounded-t-3xl rounded-b-none bg-white"
          : "rounded-3xl",
        !isMobileSheet && (isOpen ? "h-[min(45rem,calc(100dvh-2.5rem))]" : "h-12"),
      )}
    >
      {isOpen ? (
        <motion.div
          initial={isMobileSheet && !shouldReduceMotion ? { opacity: 0, y: 24 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: isMobileSheet ? 0.2 : 0 }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <header className="flex h-[4.5rem] shrink-0 items-center justify-between gap-3 border-b border-black/8 bg-white px-4 py-3 sm:h-[5.5rem] sm:px-6 sm:py-4">
            <div className="min-w-0">
              <h1 id="portfolio-chat-title" className="font-sans text-lg/6 font-semibold text-ink">
                Freeman’s assistant
              </h1>
              <p className="font-sans text-xs/4 text-muted">AI · Portfolio &amp; enquiries</p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {isMobile ? (
                <Button
                  type="button"
                  aria-label={isExpanded ? "Minimise assistant" : "Expand assistant"}
                  aria-expanded={isExpanded}
                  variant="ghost"
                  size="icon-sm"
                  className="relative rounded-full"
                  onClick={toggleExpanded}
                >
                  {isExpanded ? (
                    <Minimize2Icon aria-hidden="true" className="size-4" />
                  ) : (
                    <Maximize2Icon aria-hidden="true" className="size-4" />
                  )}
                  <span
                    aria-hidden="true"
                    className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
                  />
                </Button>
              ) : null}
              <Button
                type="button"
                aria-label="Close assistant"
                variant="ghost"
                size="icon-sm"
                className="relative rounded-full"
                onClick={closeChat}
              >
                <XIcon aria-hidden="true" className="size-4" />
                <span
                  aria-hidden="true"
                  className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
                />
              </Button>
            </div>
          </header>

          {workflowInstance ? (
            <AssistantWorkflowProgress key={workflowInstance.id} instance={workflowInstance} />
          ) : null}

          <AssistantMessages
            isLoading={isLoading}
            messages={messages}
            messagesEndRef={messagesEndRef}
            shouldReduceMotion={shouldReduceMotion}
            onStarterAction={(action) => void handleStarterAction(action)}
          />

          <AssistantComposer
            canSubmit={canSubmit}
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            textareaRef={textareaRef}
          />
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
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-5 sm:pb-[max(env(safe-area-inset-bottom),1.25rem)]",
        isMobileSheet ? "h-dvh px-0 pb-0" : null,
      )}
    >
      <AnimatePresence>
        {isMobileSheet ? (
          <motion.button
            type="button"
            aria-label="Close assistant"
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
          "relative z-10 ml-auto flex w-full max-w-[35rem] justify-end",
          isMobileSheet ? "h-full max-w-none items-end" : null,
        )}
      >
        {isMobileSheet ? (
          <Dialog.Popup
            render={surface}
            aria-labelledby="portfolio-chat-title"
            finalFocus={launcherRef}
          />
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
