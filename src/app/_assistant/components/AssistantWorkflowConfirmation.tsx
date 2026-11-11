"use client";

import type { ActiveWorkflow } from "@/contracts/assistant.contract";
import { Button } from "@/app/_components/ui/Button";

export function AssistantWorkflowConfirmation({
  title,
  rows,
  confirmLabel,
  declineLabel,
  destructive,
  disabled,
  error,
  onConfirm,
  onDecline,
}: {
  title: string;
  rows?: NonNullable<ActiveWorkflow["review"]>["rows"];
  confirmLabel: string;
  declineLabel: string;
  destructive?: boolean;
  disabled: boolean;
  error: string | null;
  onConfirm: () => void;
  onDecline: () => void;
}) {
  return (
    <section
      aria-label={title}
      className="shrink-0 border-t border-[var(--assistant-line)] px-4 py-3 text-sm sm:px-6"
    >
      <h2 className="font-medium">{title}</h2>
      {rows && (
        <dl className="mt-2 grid max-h-[22dvh] grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 overflow-y-auto">
          {rows.map(({ key, label, value }) => (
            <div key={key} className="contents">
              <dt className="font-medium">{label}</dt>
              <dd className="break-words">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant={destructive ? "destructive" : "primary"}
          size="md"
          className={destructive ? undefined : "text-slate-950"}
          type="button"
          onClick={onConfirm}
          disabled={disabled}
        >
          {confirmLabel}
        </Button>
        <Button
          variant="ghost"
          size="md"
          type="button"
          autoFocus={destructive}
          onClick={onDecline}
          disabled={disabled}
        >
          {declineLabel}
        </Button>
      </div>
      {error && (
        <p className="mt-2" role="status">
          {error}
        </p>
      )}
    </section>
  );
}
