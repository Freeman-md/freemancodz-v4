import { z } from "zod";
import type { IWorkflowDefinition, WorkflowAction } from "@/modules/workflow/types";

const schema = z.strictObject({ brief: z.string().trim().min(1).max(200) });

const stateSchema = z.strictObject({ brief: schema.shape.brief.nullable() });

export class RequestServicesDefinition implements IWorkflowDefinition {
  readonly id = "request-services";

  readonly version = 1;

  readonly title = "Request services";

  readonly description = "Send a brief about a potential project.";

  readonly stateSchema = stateSchema;

  private readonly accepted = new Map<string, string>();

  createInitialState() {
    return { brief: null };
  }

  getProgress(saved: unknown) {
    const { brief } = stateSchema.parse(saved);

    return {
      phase: "collecting" as const,
      details: [{ key: "brief", label: "Brief", value: brief }],
    };
  }

  getGuidance() {
    return "Ask for a short project brief.";
  }

  getTools() {
    return [
      {
        tool: {
          type: "function" as const,
          name: "save_service_brief",
          description: "Save the supplied brief.",
          strict: true as const,
          parameters: {
            type: "object",
            properties: { brief: { type: "string" } },
            required: ["brief"],
            additionalProperties: false,
          },
        },
        apply: (_saved: unknown, args: unknown) => ({
          state: schema.parse(args),
          output: { status: "saved" },
        }),
      },
    ];
  }

  getReview(saved: unknown) {
    const { brief } = stateSchema.parse(saved);

    return brief
      ? {
          actionKey: "send-brief",
          label: "Submit brief",
          rows: [{ key: "brief", label: "Brief", value: brief }],
          payload: { brief },
        }
      : null;
  }

  getAction(key: string): WorkflowAction | undefined {
    if (key !== "send-brief") {return undefined;}

    return {
      payloadSchema: schema,
      getStatus: (succeeded) => (succeeded.has("submit") ? "Brief received" : undefined),
      steps: [
        {
          key: "submit",
          label: "Submit brief",
          execute: async ({ id, payload }) => {
            const { brief } = schema.parse(payload);

            const previous = this.accepted.get(id);

            if (previous) {return { kind: "terminal", reason: "duplicate_submission" };}

            this.accepted.set(id, brief);

            return { kind: "uncertain", reason: "fixture_lost_acknowledgement" };
          },
          reconcile: async ({ id, payload }) =>
            this.accepted.get(id) === schema.parse(payload).brief
              ? { kind: "success", outcome: { receipt: id, accepted: Number(this.accepted.has(id)) } }
              : { kind: "uncertain", reason: "fixture_receipt_missing" },
        },
      ],
    };
  }
}
