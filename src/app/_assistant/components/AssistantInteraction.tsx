"use client";

import { useId, useRef, useState, type ComponentType } from "react";
import type {
  AssistantInteraction as Interaction,
  AssistantInteractionReply,
  AssistantInteractionResult,
} from "@/contracts/assistant-ui.contract";
import { Button } from "@/app/_components/ui/Button";

type ControlProps = {
  control: Interaction["controls"][number];
  id: string;
  value: string;
  disabled: boolean;
  error?: string;
  onChange: (value: string) => void;
};

const inputClassName =
  "assistant-interaction-input min-h-11 w-full rounded-md border bg-white px-3 py-2 text-base text-ink outline-none";

export function InputField({ control, id, value, disabled, error, onChange }: ControlProps) {
  return (
    <input
      id={id}
      name={control.field}
      type={control.inputType ?? "text"}
      value={value}
      required={control.required}
      maxLength={control.maxLength}
      disabled={disabled}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      className={inputClassName}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function TextArea({ control, id, value, disabled, error, onChange }: ControlProps) {
  return (
    <textarea
      id={id}
      name={control.field}
      rows={4}
      value={value}
      required={control.required}
      maxLength={control.maxLength}
      disabled={disabled}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      className={inputClassName}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function OptionSelector({ control, id, value, disabled, error, onChange }: ControlProps) {
  return (
    <select
      id={id}
      name={control.field}
      value={value}
      required={control.required}
      disabled={disabled}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      className={inputClassName}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="" disabled>
        Choose an option
      </option>
      {control.options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

const controls: Record<
  Interaction["controls"][number]["component"],
  ComponentType<ControlProps>
> = { InputField, TextArea, OptionSelector };

export function AssistantInteraction({
  interaction,
  values,
  result,
  uncertain,
  isLoading,
  onSubmit,
  onValueChange,
}: {
  interaction: Interaction;
  values: AssistantInteractionReply["values"];
  result?: AssistantInteractionResult;
  uncertain?: boolean;
  isLoading: boolean;
  onSubmit: (reply: AssistantInteractionReply) => Promise<void>;
  onValueChange: (interactionId: string, field: string, value: string) => void;
}) {
  const id = useId();

  const submitting = useRef(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const disabled =
    isLoading ||
    isSubmitting ||
    uncertain ||
    result?.status === "accepted" ||
    result?.status === "stale";

  const errors = result?.status === "invalid" ? result.fieldErrors : {};

  let statusMessage: string | null = null;

  if (result?.status === "accepted") {
    statusMessage = "Answer submitted.";
  } else if (result?.status === "stale") {
    statusMessage = "These inputs are no longer active. Send a message to continue.";
  } else if (uncertain) {
    statusMessage =
      "Could not confirm whether this answer was submitted. Send a message to continue; this form will not retry.";
  }

  return (
    <form
      aria-labelledby={`${id}-heading`}
      className="assistant-interaction flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (disabled || submitting.current) {
          return;
        }

        submitting.current = true;
        setIsSubmitting(true);
        try {
          await onSubmit({ interactionId: interaction.id, revision: interaction.revision, values });
        } finally {
          submitting.current = false;
          setIsSubmitting(false);
        }
      }}
    >
      <h3 id={`${id}-heading`} className="font-semibold text-ink">
        {interaction.heading}
      </h3>
      {interaction.controls.map((control) => {
        const Control = controls[control.component];

        const controlId = `${id}-${control.field}`;

        const value = Object.hasOwn(values, control.field) ? values[control.field] : control.value;

        const error = Object.hasOwn(errors, control.field) ? errors[control.field] : undefined;

        return (
          <div key={control.field} className="flex flex-col gap-2">
            <label htmlFor={controlId} className="text-sm font-medium text-ink">
              {control.label}
              {control.required ? " *" : null}
              {!control.required && !/\(optional\)\s*$/i.test(control.label) ? " (optional)" : null}
            </label>
            <Control
              control={control}
              id={controlId}
              value={value}
              disabled={Boolean(disabled)}
              error={error}
              onChange={(value) => onValueChange(interaction.id, control.field, value)}
            />
            {error ? (
              <p
                id={`${controlId}-error`}
                role="alert"
                className="assistant-interaction-error text-sm text-red-800"
              >
                {error}
              </p>
            ) : null}
          </div>
        );
      })}
      <div role="status" className="text-sm text-muted">
        {statusMessage}
      </div>
      <Button
        type="submit"
        disabled={Boolean(disabled)}
        className="assistant-interaction-submit min-h-11 shadow-none"
      >
        {isSubmitting ? "Submitting…" : "Submit answer"}
      </Button>
    </form>
  );
}
