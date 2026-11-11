"use client";

import type { ActiveWorkflow } from "@/contracts/assistant.contract";

export function AssistantWorkflowConfirmation({
  review,
  pending,
  error,
  onConfirm,
  onChange,
}: {
  review: NonNullable<ActiveWorkflow["review"]>;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onChange: () => void;
}) {
  return (
    <section
      aria-label="Review request"
      className="shrink-0 border-b border-emerald-950/10 px-4 py-3 text-sm sm:px-6"
    >
      <h2 className="font-medium">Review request</h2>
      <dl className="mt-2 grid max-h-[22dvh] grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 overflow-y-auto">
        {review.rows.map(({ key, label, value }) => (
          <div key={key} className="contents">
            <dt className="font-medium">{label}</dt>
            <dd className="break-words">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          className="assistant-control min-h-11 px-3"
          type="button"
          onClick={onConfirm}
          disabled={pending}
        >
          {pending ? "Confirming…" : review.label}
        </button>
        <button
          className="assistant-control min-h-11 px-3"
          type="button"
          onClick={onChange}
          disabled={pending}
        >
          Request changes
        </button>
      </div>
      {error && (
        <p className="mt-2" role="status">
          {error}
        </p>
      )}
    </section>
  );
}
