"use client";

import type {
  AssistantBookingAction,
  WorkflowPublicInstance,
} from "@/contracts/assistant.contract";
import { Button } from "@/app/_components/ui/Button";
import { formatFieldValue } from "./AssistantWorkflowProgress";

export function AssistantBookingConfirmation({
  instance,
  isLoading,
  onSubmit,
}: {
  instance: WorkflowPublicInstance;
  isLoading: boolean;
  onSubmit: (action: AssistantBookingAction) => Promise<void>;
}) {
  if (!instance.bookingAction || instance.status !== "active") {
    return null;
  }

  const labels: Record<string, string> = {
    name: "Name",
    email: "Email",
    reason: "Topic",
    selectedSlot: "Time",
  };

  let buttonLabel = instance.bookingAction === "confirm" ? "Confirm booking" : "Retry booking";

  if (isLoading) {
    buttonLabel = "Checking booking…";
  }

  return (
    <section
      aria-label="Review meeting booking"
      className="assistant-booking-review shrink-0 border-t border-black/10 bg-white px-4 py-3 sm:px-6"
    >
      <h3 className="text-sm font-medium text-ink">Review your meeting</h3>
      <dl className="my-2 text-sm">
        {instance.progress.fields.map(
          (field) =>
            field.value !== null && (
              <div key={field.key} className="grid grid-cols-[4rem_minmax(0,1fr)] gap-2 py-1">
                <dt className="text-muted">{labels[field.key] ?? field.key}</dt>
                <dd className="break-words text-ink">{formatFieldValue(field.value)}</dd>
              </div>
            ),
        )}
      </dl>
      {instance.bookingAction === "blocked" ? (
        <p role="status" className="text-sm text-muted">
          This booking needs reconciliation. Please contact Freeman before making another booking.
        </p>
      ) : (
        <Button
          disabled={isLoading}
          className="min-h-12 w-full text-[#020c1b]"
          onClick={() =>
            void onSubmit(
              instance.bookingAction === "confirm"
                ? {
                    action: "confirm_booking",
                    workflowInstanceId: instance.id,
                    expectedRevision: instance.revision,
                  }
                : { action: "retry_booking", workflowInstanceId: instance.id },
            )
          }
        >
          {buttonLabel}
        </Button>
      )}
    </section>
  );
}
