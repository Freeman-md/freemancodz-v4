"use client";

import Link from "next/link";
import { FileTextIcon } from "lucide-react";
import type { AssistantSource } from "@/contracts/assistant.contract";

type AssistantSourcesProps = {
  sources: AssistantSource[];
};

export function AssistantSources({ sources }: AssistantSourcesProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <section aria-label="Sources" className="mt-5 border-t border-black/8 pt-4">
      <p className="font-sans text-sm/5 font-medium text-muted">Sources · {sources.length}</p>
      <ul role="list" className="mt-3 flex flex-col gap-1">
        {sources.map((source) => (
          <li key={source.id}>
            {isExternalUrl(source.url) ? (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`${source.title} (opens in a new tab)`}
                className="flex min-h-12 items-start gap-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-signal-400/40"
              >
                <SourceContent source={source} />
              </a>
            ) : (
              <Link
                href={source.url}
                className="flex min-h-12 items-start gap-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-signal-400/40"
              >
                <SourceContent source={source} />
              </Link>
            )}
          </li>
        ))}
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
