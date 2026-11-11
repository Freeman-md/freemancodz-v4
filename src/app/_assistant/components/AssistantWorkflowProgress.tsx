"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDownIcon } from "lucide-react";
import type { ActiveWorkflow } from "@/contracts/assistant.contract";

export function AssistantWorkflowProgress({ instance }: { instance: ActiveWorkflow }) {
  return (
    <Collapsible.Root className="shrink-0 border-b border-(--assistant-line) bg-(--assistant-surface)">
      <Collapsible.Trigger className="group flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2.5 text-left focus-visible:ring-2 focus-visible:ring-inset sm:px-6">
        <span>
          <span className="block font-medium">{instance.title}</span>
          <span className="block text-sm text-(--assistant-muted)">In progress</span>
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 group-data-[panel-open]:rotate-180 motion-safe:transition-transform"
        />
      </Collapsible.Trigger>

      {instance.nextStep && <p className="px-4 pb-3 text-sm sm:px-6">{instance.nextStep}</p>}

      <Collapsible.Panel>
        <dl className="max-h-[35dvh] overflow-y-auto px-4 sm:px-6">
          {instance.details.map(({ key, label, value }) => (
            <div
              key={key}
              className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 border-t border-(--assistant-line) py-2 text-sm"
            >
              <dt className="font-medium">{label}</dt>
              <dd className="wrap-anywhere text-(--assistant-muted)">{value ?? "Not provided"}</dd>
            </div>
          ))}
        </dl>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
