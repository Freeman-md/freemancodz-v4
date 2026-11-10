"use client";

import type {
  AssistantWorkflowAction,
  WorkflowPublicInstance,
} from "@/contracts/assistant.contract";
import { Button } from "@/app/_components/ui/Button";
import { formatFieldValue } from "./AssistantWorkflowProgress";

export function AssistantWorkflowConfirmation({
  instance,
  isLoading,
  onSubmit,
  onRequestChanges,
}: {
  instance: WorkflowPublicInstance;
  isLoading: boolean;
  onSubmit: (action: AssistantWorkflowAction) => Promise<void>;
  onRequestChanges?: () => void;
}) {
  const review = instance.review;

  if (instance.status !== "active") {
    return null;
  }

  if (!review) {
    if (instance.confirmationAction === "blocked") {
      return (
        <p role="status" className="px-4 py-2 text-sm text-muted">
          This booking needs review. Please contact Freeman to check its status.
        </p>
      );
    }

    if (!instance.outcome?.retryAt && instance.confirmationAction !== "retry") {
      return null;
    }

    return (
      <Button
        disabled={isLoading}
        className="min-h-12 text-[#020c1b]"
        onClick={() => void onSubmit({ action: "retry_workflow", workflowInstanceId: instance.id })}
      >
        Check retry
      </Button>
    );
  }

  return (
    <section
      aria-label={review.title}
      className="assistant-workflow-review shrink-0 border-t border-black/10 bg-white px-4 py-3 sm:px-6"
    >
      <h3 className="text-sm font-medium text-ink">{review.title}</h3>
      <dl className="my-2 text-sm">
        {review.fields.map(
          (field) =>
            field.value !== null && (
              <div
                key={field.key}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2 py-1"
              >
                <dt className="break-words text-muted">{field.label}</dt>
                <dd className="break-words text-ink">{formatFieldValue(field.value)}</dd>
              </div>
            ),
        )}
      </dl>
      <Button
        disabled={isLoading}
        className="min-h-12 w-full text-[#020c1b]"
        onClick={() =>
          void onSubmit({
            action: "confirm_workflow",
            workflowInstanceId: instance.id,
            actionKey: review.actionKey,
            expectedRevision: instance.revision,
          })
        }
      >
        {isLoading ? "Checking request…" : "Confirm"}
      </Button>
      {onRequestChanges && (
        <button
          type="button"
          disabled={isLoading}
          onClick={onRequestChanges}
          className="min-h-11 w-full text-sm text-ink underline"
        >
          Request changes
        </button>
      )}
    </section>
  );
}
