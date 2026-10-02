import { randomUUID } from "node:crypto";
import { z } from "zod";
import type {
  AssistantInteraction,
  AssistantInteractionReply,
  AssistantInteractionResult,
  AssistantPresentation,
} from "@/contracts/assistant-ui.contract";

type Control = AssistantInteraction["controls"][number];

// These constraints describe ordinary visitor input, never workflow permissions.
const conversationalControls = {
  InputField: {
    maxLength: 320,
    accepts: (control: Control) => control.inputType !== null && control.options === null,
  },
  TextArea: {
    maxLength: 4000,
    accepts: (control: Control) => control.inputType === null && control.options === null,
  },
  OptionSelector: {
    maxLength: 100,
    accepts: (control: Control) =>
      control.inputType === null &&
      control.options !== null &&
      new Set(control.options.map(({ value }) => value)).size === control.options.length,
  },
} satisfies Record<
  Control["component"],
  { maxLength: number; accepts: (control: Control) => boolean }
>;

export function prepareConversationalInteraction(
  presentation: AssistantPresentation,
): AssistantInteraction | null {
  if (presentation.operation !== "conversation" || presentation.targetWorkflowId !== null) {
    return null;
  }

  const interaction: AssistantInteraction = {
    id: randomUUID(),
    workflowInstanceId: null,
    revision: 0,
    heading: presentation.heading,
    controls: presentation.controls.map((control) => ({
      ...control,
      required: true,
      maxLength: conversationalControls[control.component].maxLength,
      value: "",
    })),
  };

  return validConversationalControls(interaction) ? interaction : null;
}

export function submitConversationalInteraction(
  reply: AssistantInteractionReply,
): AssistantInteractionResult {
  const interaction = reply.interaction;

  const stale = { interactionId: reply.interactionId, status: "stale" as const };

  if (
    !interaction ||
    interaction.workflowInstanceId !== null ||
    interaction.id !== reply.interactionId ||
    interaction.revision !== 0 ||
    reply.revision !== 0 ||
    !validConversationalControls(interaction)
  ) {
    return stale;
  }

  const fields = new Set(interaction.controls.map(({ field }) => field));

  if (
    Object.keys(reply.values).length !== fields.size ||
    Object.keys(reply.values).some((field) => !fields.has(field))
  ) {
    return stale;
  }

  const fieldErrors: Record<string, string> = {};

  for (const control of interaction.controls) {
    const value = reply.values[control.field];

    if (!value.trim()) {
      fieldErrors[control.field] = "This field is required.";
    } else if (value.length > conversationalControls[control.component].maxLength) {
      fieldErrors[control.field] =
        `Use at most ${conversationalControls[control.component].maxLength} characters.`;
    } else if (control.inputType === "email" && !z.email().safeParse(value.trim()).success) {
      fieldErrors[control.field] = "Enter a valid email address.";
    } else if (control.options && !control.options.some((option) => option.value === value)) {
      fieldErrors[control.field] = "Choose one of the available options.";
    }
  }

  if (Object.keys(fieldErrors).length) {
    return { interactionId: reply.interactionId, status: "invalid", fieldErrors };
  }

  return {
    interactionId: reply.interactionId,
    status: "accepted",
    summary: interaction.controls
      .map((control) => {
        const value = reply.values[control.field];

        return `${control.label}: ${control.options?.find((option) => option.value === value)?.label ?? value}`;
      })
      .join("\n"),
  };
}

function validConversationalControls(interaction: AssistantInteraction) {
  return (
    new Set(interaction.controls.map(({ field }) => field)).size === interaction.controls.length &&
    interaction.controls.every((control) => {
      const supported = conversationalControls[control.component];

      return (
        supported.accepts(control) && control.required && control.maxLength === supported.maxLength
      );
    })
  );
}
