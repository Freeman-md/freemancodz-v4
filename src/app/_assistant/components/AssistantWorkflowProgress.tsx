"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { CheckIcon, ChevronDownIcon, MinusIcon } from "lucide-react";
import { cn } from "@/app/_utils/class-names";
import type { WorkflowPublicInstance } from "@/contracts/assistant.contract";
import type { WorkflowProgress } from "@/contracts/workflow-progress.contract";

type AssistantWorkflowProgressProps = {
  instance: WorkflowPublicInstance;
};

const WORKFLOW_TITLES: Record<string, string> = {
  "meeting-booking": "Book a meeting",
};

const PHASE_LABELS: Record<WorkflowProgress["phase"], string> = {
  collecting: "Collecting",
  awaiting_confirmation: "Awaiting confirmation",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  name: "Name",
  reason: "Topic",
  selectedSlot: "Time",
};

export function AssistantWorkflowProgress({ instance }: AssistantWorkflowProgressProps) {
  const requiredFields = instance.progress.fields.filter((field) => field.required);

  const collectedRequiredFields = requiredFields.filter((field) => hasValue(field.value)).length;

  const outcome = instance.outcome;

  const phase =
    outcome?.booking === "confirmed"
      ? "Booked"
      : outcome?.booking === "needs_review"
        ? "Needs review"
        : outcome?.booking === "not_booked"
          ? "Booking unsuccessful"
          : outcome?.booking === "pending"
            ? "Checking Calendar"
            : PHASE_LABELS[instance.progress.phase];

  return (
    <Collapsible.Root className="assistant-progress shrink-0 border-b border-emerald-950/8 bg-emerald-50/70">
      <Collapsible.Trigger className="group flex min-h-[3.75rem] w-full items-center justify-between gap-3 px-4 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700/30 sm:min-h-[4.5rem] sm:px-6 sm:py-3">
        <span className="min-w-0">
          <span className="block font-sans text-base/6 font-medium text-ink">
            {WORKFLOW_TITLES[instance.workflowId] ?? formatFieldLabel(instance.workflowId)}
          </span>
          <span aria-live="polite" className="block font-sans text-sm/5 text-muted">
            {phase} ·{" "}
            <span className="tabular-nums">
              {collectedRequiredFields} of {requiredFields.length} details
            </span>
          </span>
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 stroke-muted group-data-[panel-open]:rotate-180 motion-safe:transition-transform"
        />
      </Collapsible.Trigger>

      {outcome?.booking === "confirmed" && (
        <p role="status" className="px-4 pb-2 text-sm text-muted">
          Calendar and booking record verified. Attendee invitation requested.
          {outcome.ownerNotice === "accepted" && " Owner email accepted."}
          {outcome.ownerNotice === "pending" && " Owner email pending."}
          {outcome.ownerNotice === "needs_review" && " Owner email needs review."}
        </p>
      )}
      {outcome?.retryAt && (
        <p role="status" className="px-4 pb-2 text-sm text-muted">
          Retry eligible from {new Date(outcome.retryAt).toLocaleTimeString()}.
        </p>
      )}
      <Collapsible.Panel className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none [&[hidden]:not([hidden='until-found'])]:hidden">
        <ul role="list" className="max-h-[min(35dvh,20rem)] overflow-y-auto px-4 sm:px-6">
          {instance.progress.fields.map((field) => {
            const collected = hasValue(field.value);

            return (
              <li
                key={field.key}
                className="assistant-progress-row grid min-h-12 grid-cols-[7.5rem_minmax(0,1fr)_1rem] items-center gap-3 border-b border-emerald-950/8 py-2 first:border-t last:border-b-0 sm:grid-cols-[9rem_minmax(0,1fr)_1rem]"
              >
                <span className="block font-sans text-sm/5 font-medium text-ink">
                  {field.required ? (
                    <span className="whitespace-nowrap">
                      {FIELD_LABELS[field.key] ?? formatFieldLabel(field.key)}
                      <span aria-hidden="true" className="text-signal-700">
                        {" "}
                        *
                      </span>
                      <span className="sr-only"> required</span>
                    </span>
                  ) : (
                    <>
                      {FIELD_LABELS[field.key] ?? formatFieldLabel(field.key)}
                      <span className="font-normal text-muted"> (optional)</span>
                    </>
                  )}
                </span>
                <span
                  className={cn(
                    "block min-w-0 break-words font-sans text-sm/5",
                    collected ? "font-medium text-ink" : "font-normal text-muted",
                  )}
                >
                  {hasValue(field.value)
                    ? formatFieldValue(field.value)
                    : missingValueCopy(field.key)}
                </span>
                {collected ? (
                  <CheckIcon aria-hidden="true" className="size-4 shrink-0 stroke-signal-700" />
                ) : (
                  <MinusIcon aria-hidden="true" className="size-4 shrink-0 stroke-muted" />
                )}
              </li>
            );
          })}
        </ul>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

type WorkflowFieldValue = WorkflowProgress["fields"][number]["value"];

function hasValue(value: WorkflowFieldValue): value is NonNullable<WorkflowFieldValue> {
  return typeof value === "string" ? value.trim().length > 0 : value !== null;
}

export function formatFieldValue(value: NonNullable<WorkflowProgress["fields"][number]["value"]>) {
  if (typeof value === "string") {
    return value;
  }

  const start = new Date(value.start);

  const end = new Date(value.end);

  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(start);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${date} · ${time.format(start)}–${time.format(end)} · London time`;
}

function missingValueCopy(fieldKey: string) {
  return fieldKey === "selectedSlot" ? "Not chosen" : "Not provided";
}

export function formatFieldLabel(key: string) {
  const label = key
    .replace(/[-_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();

  return label ? `${label.charAt(0).toUpperCase()}${label.slice(1)}` : key;
}
