import { z } from "zod";
import type { OpenAIResponseTool } from "@/infrastructure/openai/types";

export const START_WORKFLOW_TOOL_NAME = "start_workflow";

export const startWorkflowArgumentsSchema = z.strictObject({
  workflowId: z.string().min(1),
});

export function createStartWorkflowTool(
  workflows: readonly { id: string; description: string }[],
): OpenAIResponseTool {
  return {
    type: "function",
    name: START_WORKFLOW_TOOL_NAME,
    description: [
      "Open or resume a workflow only when the visitor clearly asks for its outcome or to continue it.",
      "An active workflow is ready to continue. Its final action has not been performed.",
      ...workflows.map(({ id, description }) => `${id}: ${description}`),
    ].join("\n"),
    strict: true,
    parameters: {
      type: "object",
      properties: {
        workflowId: { type: "string", enum: workflows.map(({ id }) => id) },
      },
      required: ["workflowId"],
      additionalProperties: false,
    },
  };
}
