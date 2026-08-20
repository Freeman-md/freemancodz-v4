import { searchWebsiteSchema } from "../schemas/tools/search-website.schema";
import { searchWebsite } from "./search-website.tool";
import type { IOpenAIProvider } from "@/server/infrastructure/openai/interfaces/openai.provider.interface";
import type { ISiteSearchService } from "@/server/modules/search-index/public";

type AssistantToolDependencies = {
  openai: IOpenAIProvider;
  siteSearch: ISiteSearchService;
};
export type AssistantToolResult = {
  output: Record<string, unknown>;
  sources: Array<{ id: string; title: string; url: string }>;
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
