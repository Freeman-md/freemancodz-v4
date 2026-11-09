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

    const identity = JSON.stringify([source.title, url]);

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
    <section aria-label="Sources" className="assistant-sources mt-5 border-t border-black/8 pt-4">
      <p className="font-sans text-sm/5 font-medium text-muted">
        Sources · {visibleSources.length}
      </p>
      <ul role="list" className="mt-3 flex flex-col gap-1">
        {visibleSources.map((source) => {
          const external = isExternalUrl(source.url);

          return (
            <li key={source.id}>
              <a
                href={source.url}
                onClick={(event) => {
                  if (
                    external ||
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
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                aria-label={external ? `${source.title} (opens in a new tab)` : undefined}
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
          {formatSourcePath(source.url)}
        </span>
      </span>
    </>
  );
}

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function formatSourcePath(url: string) {
  if (!isExternalUrl(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);

    return `${parsed.hostname}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  } catch {
    return url;
  }
}
