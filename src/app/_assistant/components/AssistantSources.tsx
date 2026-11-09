"use client";

import { FileTextIcon } from "lucide-react";
import { assistantSourceDestination } from "../source-destination";
import type { AssistantSource } from "@/contracts/assistant.contract";

type AssistantSourcesProps = {
  sources: AssistantSource[];
  onInternalSource?: (href: string) => void;
};

export function AssistantSources({ sources, onInternalSource }: AssistantSourcesProps) {
  const identities = new Set<string>();

  const visibleSources = sources.flatMap((source) => {
    const url = assistantSourceDestination(source.url);

    if (!url) {
      return [];
    }

    const identity = url;

    if (identities.has(identity)) {
      return [];
    }

    identities.add(identity);

    return [{ ...source, url }];
  });

  if (!visibleSources.length) {
    return null;
  }

  return (
    <section
      aria-label="Related portfolio sources"
      className="assistant-sources mt-5 border-t border-black/8 pt-4"
    >
      <p className="font-sans text-sm/5 font-medium text-muted">
        Related portfolio sources · {visibleSources.length}
      </p>
      <ul role="list" className="mt-3 flex flex-col gap-1">
        {visibleSources.map((source) => {
          return (
            <li key={source.id}>
              <a
                href={source.url}
                onClick={(event) => {
                  if (
                    event.button !== 0 ||
                    !onInternalSource ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  ) {
                    return;
                  }

                  event.preventDefault();
                  onInternalSource(source.url);
                }}
                className="flex min-h-12 items-start gap-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-signal-400/40"
              >
                <SourceContent source={source} />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SourceContent({ source }: { source: AssistantSource }) {
  return (
    <>
      <FileTextIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 stroke-muted" />
      <span className="min-w-0 flex-1">
        <span className="block font-sans text-sm/5 font-medium text-signal-700">
          {source.title}
        </span>
        <span className="block break-words font-sans text-sm/5 text-muted [overflow-wrap:anywhere]">
          {source.url}
        </span>
      </span>
    </>
  );
}
