"use client";

import type {
  AssistantWorkflowAction,
  WorkflowPublicInstance,
} from "@/contracts/assistant.contract";
import { Button } from "@/app/_components/ui/Button";
import { formatFieldLabel, formatFieldValue } from "./AssistantWorkflowProgress";

export function AssistantWorkflowConfirmation({
  instance,
  isLoading,
  onSubmit,
}: {
  instance: WorkflowPublicInstance;
  isLoading: boolean;
  onSubmit: (action: AssistantWorkflowAction) => Promise<void>;
}) {
  if (!instance.confirmationAction || instance.status !== "active") {
    return null;
  }

  const kind = instance.workflowId === "meeting-booking" ? "booking" : instance.workflowId;

  if (kind !== "audit" && kind !== "contact" && kind !== "booking") {
    return null;
  }

  const confirmLabels = {
    audit: "Submit audit request",
    contact: "Send message",
    booking: "Confirm booking",
  };

  const retryLabels = {
    audit: "Retry audit request",
    contact: "Retry message",
    booking: "Retry booking",
  };

  let buttonLabel =
    instance.confirmationAction === "confirm" ? confirmLabels[kind] : retryLabels[kind];

  if (isLoading) {
    buttonLabel = "Checking request…";
  }

  return (
    <section
      aria-label={kind === "booking" ? "Review meeting booking" : "Review your request"}
      className="assistant-workflow-review shrink-0 border-t border-black/10 bg-white px-4 py-3 sm:px-6"
    >
      <h3 className="text-sm font-medium text-ink">
        {kind === "booking" ? "Review your meeting" : "Review your request"}
      </h3>
      <dl className="my-2 text-sm">
        {instance.progress.fields.map(
          (field) =>
            field.value !== null && (
              <div
                key={field.key}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2 py-1"
              >
                <dt className="break-words text-muted">{formatFieldLabel(field.key)}</dt>
                <dd className="break-words text-ink">{formatFieldValue(field.value)}</dd>
              </div>
            ),
        )}
      </dl>
      {instance.confirmationAction === "blocked" ? (
        <p role="status" className="text-sm text-muted">
          This booking needs reconciliation. Please contact Freeman before making another booking.
        </p>
      ) : (
        <Button
          disabled={isLoading}
          className="min-h-12 w-full text-[#020c1b]"
          onClick={() =>
            void onSubmit(
              instance.confirmationAction === "confirm"
                ? {
                    action:
                      kind === "audit"
                        ? "confirm_audit"
                        : kind === "contact"
                          ? "confirm_contact"
                          : "confirm_booking",
                    workflowInstanceId: instance.id,
                    expectedRevision: instance.revision,
                  }
                : {
                    action:
                      kind === "audit"
                        ? "retry_audit"
                        : kind === "contact"
                          ? "retry_contact"
                          : "retry_booking",
                    workflowInstanceId: instance.id,
                  },
            )
          }
        >
          {buttonLabel}
        </Button>
      )}
    </section>
  );
}
