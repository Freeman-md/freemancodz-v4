"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { CheckIcon, ChevronDownIcon, MinusIcon } from "lucide-react";
import { cn } from "@/app/_utils/class-names";
import type { ActiveWorkflow } from "@/contracts/assistant.contract";

const PHASE_LABELS: Record<ActiveWorkflow["phase"], string> = {
  collecting: "Collecting",
  awaiting_confirmation: "Awaiting confirmation",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function AssistantWorkflowProgress({ instance }: { instance: ActiveWorkflow }) {
  const collected = instance.details.filter(({ value }) => value !== null).length;

  return (
    <Collapsible.Root className="assistant-progress shrink-0 border-b border-emerald-950/8 bg-emerald-50/70">
      <Collapsible.Trigger className="group flex min-h-[3.75rem] w-full items-center justify-between gap-3 px-4 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700/30 sm:min-h-[4.5rem] sm:px-6 sm:py-3">
        <span className="min-w-0">
          <span className="block font-sans text-base/6 font-medium text-ink">{instance.title}</span>
          <span aria-live="polite" className="block font-sans text-sm/5 text-muted">
            {PHASE_LABELS[instance.phase]} ·{" "}
            <span className="tabular-nums">
              {collected} of {instance.details.length} details
            </span>
          </span>
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 stroke-muted group-data-[panel-open]:rotate-180 motion-safe:transition-transform"
        />
      </Collapsible.Trigger>

      <Collapsible.Panel className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none [&[hidden]:not([hidden='until-found'])]:hidden">
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
