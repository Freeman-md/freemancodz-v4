import { searchWebsite, searchWebsiteSchema } from "./implementations/search-website";
import type { OpenAITransport } from "@/infrastructure/openai/types";
import type { SiteSearch } from "@/modules/search-index/types";
import type { IWorkflowService } from "@/modules/workflow/interfaces";
import {
  assistantPresentationSchema,
  type AssistantInteraction,
} from "@/contracts/assistant-ui.contract";
import { presentUI } from "./implementations/present-ui";

type AssistantToolDependencies = {
  openai: OpenAITransport;
  siteSearch: SiteSearch;
  workflow: Pick<IWorkflowService, "prepareInteraction">;
};
export type AssistantToolResult = {
  output: Record<string, unknown>;
  sources: Array<{ id: string; title: string; url: string }>;
  interaction?: AssistantInteraction;
  introduction?: string;
};

export async function executeGlobalAssistantTool(
  name: string,
  rawArguments: string,
  dependencies: AssistantToolDependencies,
  context: {
    workflowInstanceId: string | null;
    requestedWorkflowId?: string;
    conversationOnly?: boolean;
    workflowFields?: readonly string[];
  },
): Promise<AssistantToolResult> {
  let args: unknown;

  try {
    args = JSON.parse(rawArguments);
  } catch {
    return {
      output: { error: "invalid_json", message: "Tool arguments must be valid JSON." },
      sources: [],
    };
  }

  if (name === "present_ui") {
    const parsed = assistantPresentationSchema.safeParse(args);

    if (!parsed.success) {
      return invalidArguments();
    }

    return presentUI(parsed.data, dependencies.workflow, context);
  }

  if (name === "search_website") {
    const parsed = searchWebsiteSchema.safeParse(args);

    if (!parsed.success) {
      return invalidArguments();
    }

    const result = await searchWebsite(parsed.data, dependencies);

    return { output: result, sources: result.sources };
  }

  return {
    output: { error: "unknown_tool", message: "The requested tool is not available." },
    sources: [],
  };
}

function invalidArguments(): AssistantToolResult {
  return {
    output: {
      error: "invalid_arguments",
      message: "Tool arguments did not match the required schema.",
    },
    sources: [],
  };
}
