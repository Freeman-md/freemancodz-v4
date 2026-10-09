import { searchWebsite, searchWebsiteSchema } from "./implementations/search-website";
import type { OpenAITransport } from "@/infrastructure/openai/types";
import type { SiteSearch } from "@/modules/search-index/types";
import { assistantChoiceSchema, type AssistantChoice } from "@/contracts/assistant-choice.contract";
import { askUserChoice } from "./implementations/ask-user-choice";

type AssistantToolDependencies = {
  openai: OpenAITransport;
  siteSearch: SiteSearch;
};
export type AssistantToolResult = {
  output: Record<string, unknown>;
  sources: Array<{ id: string; title: string; url: string }>;
  choice?: AssistantChoice;
};

export async function executeGlobalAssistantTool(
  name: string,
  rawArguments: string,
  dependencies: AssistantToolDependencies,
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

  if (name === "ask_user_choice") {
    const parsed = assistantChoiceSchema.safeParse(args);

    if (!parsed.success) {
      return invalidArguments();
    }

    return askUserChoice(parsed.data);
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
