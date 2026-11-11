"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { CheckIcon, ChevronDownIcon, MinusIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/Button";
import { cn } from "@/app/_utils/class-names";
import type { ActiveWorkflow } from "@/contracts/assistant.contract";

const PHASE_LABELS: Record<ActiveWorkflow["phase"], string> = {
  collecting: "Collecting",
  awaiting_confirmation: "Awaiting confirmation",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

const RUN_LABELS = {
  queued: "Queued",
  running: "Running",
  retry: "Retry pending",
  finished: "Finished",
  attention: "Needs attention",
} as const;

const STEP_LABELS = {
  queued: "Queued",
  running: "Running",
  retry: "Retry pending",
  reconciling: "Checking outcome",
  succeeded: "Finished",
  attention: "Needs attention",
} as const;

export function AssistantWorkflowProgress({
  instance,
  onDiscard,
  discardDisabled,
}: {
  instance: ActiveWorkflow;
  onDiscard?: () => void;
  discardDisabled?: boolean;
}) {
  const collected = instance.details.filter(({ value }) => value !== null).length;

  return (
    <Collapsible.Root className="assistant-progress shrink-0 border-b border-emerald-950/8 bg-emerald-50/70">
      <div className="relative">
        <Collapsible.Trigger
          className={cn(
            "group flex min-h-[3.75rem] w-full items-center justify-between gap-3 px-4 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700/30 sm:min-h-[4.5rem] sm:px-6 sm:py-3",
            onDiscard && "pr-36 sm:pr-40",
          )}
        >
          <span className="min-w-0">
            <span className="block font-sans text-base/6 font-medium text-ink">
              {instance.title}
            </span>
            <span aria-live="polite" className="block font-sans text-sm/5 text-muted">
              {instance.run ? RUN_LABELS[instance.run.status] : PHASE_LABELS[instance.phase]} ·{" "}
              <span className="tabular-nums">
                {collected} of {instance.details.length} details
              </span>
            </span>
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="absolute right-4 size-4 shrink-0 stroke-muted group-data-[panel-open]:rotate-180 motion-safe:transition-transform sm:right-6"
          />
        </Collapsible.Trigger>
        {onDiscard && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-1/2 right-10 h-8 -translate-y-1/2 rounded-full border-[var(--assistant-line)] px-2.5 text-xs font-medium hover:bg-[var(--home-chip)] sm:right-12"
            onClick={onDiscard}
            disabled={discardDisabled}
          >
            Discard draft
          </Button>
        )}
      </div>

      {instance.run?.businessStatus && (
        <p role="status" className="px-4 pb-2 text-sm sm:px-6">
          {instance.run.businessStatus}
        </p>
      )}

      <Collapsible.Panel className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none [&[hidden]:not([hidden='until-found'])]:hidden">
        {instance.run && (
          <ol className="px-4 py-2 text-sm sm:px-6" aria-label="Execution steps">
            {instance.run.steps.map(({ key, label, status }) => (
              <li key={key} className="flex justify-between gap-3 py-1">
                <span>{label}</span>
                <span>{STEP_LABELS[status]}</span>
              </li>
            ))}
          </ol>
        )}
        <ul role="list" className="max-h-[min(35dvh,20rem)] overflow-y-auto px-4 sm:px-6">
          {instance.details.map(({ key, label, value }) => (
            <li
              key={key}
              className="assistant-progress-row grid min-h-12 grid-cols-[7.5rem_minmax(0,1fr)_1rem] items-center gap-3 border-b border-emerald-950/8 py-2 first:border-t last:border-b-0 sm:grid-cols-[9rem_minmax(0,1fr)_1rem]"
            >
              <span className="block font-sans text-sm/5 font-medium text-ink">{label}</span>
              <span
                className={cn(
                  "block min-w-0 break-words font-sans text-sm/5",
                  value === null ? "font-normal text-muted" : "font-medium text-ink",
                )}
              >
                {value ?? "Not provided"}
              </span>
              {value === null ? (
                <MinusIcon aria-hidden="true" className="size-4 shrink-0 stroke-muted" />
              ) : (
                <CheckIcon aria-hidden="true" className="size-4 shrink-0 stroke-signal-700" />
              )}
            </li>
          ))}
        </ul>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
