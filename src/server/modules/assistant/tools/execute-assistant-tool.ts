import { bookMeetingSchema } from "../schemas/tools/book-meeting.schema";
import { findMeetingSlotsSchema } from "../schemas/tools/find-meeting-slots.schema";
import { prepareMeetingSchema } from "../schemas/tools/prepare-meeting.schema";
import { searchWebsiteSchema } from "../schemas/tools/search-website.schema";
import { bookMeeting } from "./book-meeting.tool";
import { findMeetingSlots } from "./find-meeting-slots.tool";
import { prepareMeeting } from "./prepare-meeting.tool";
import { searchWebsite } from "./search-website.tool";
import type { IOpenAIProvider } from "@/server/infrastructure/openai/interfaces/openai.provider.interface";
import type { ISiteSearchService } from "@/server/modules/search-index/public";

type AssistantToolDependencies = { openai: IOpenAIProvider; siteSearch: ISiteSearchService };
export type AssistantToolResult = { output: Record<string, unknown>; sources: Array<{ id: string; title: string; url: string }> };

export async function executeAssistantTool(
  name: string,
  rawArguments: string,
  dependencies: AssistantToolDependencies,
): Promise<AssistantToolResult> {
  let args: unknown;

  try {
    args = JSON.parse(rawArguments);
  } catch {
    return { output: { error: "invalid_json", message: "Tool arguments must be valid JSON." }, sources: [] };
  }

  if (name === "search_website") {
    const parsed = searchWebsiteSchema.safeParse(args);

    if (!parsed.success) {return invalidArguments();}

    const result = await searchWebsite(parsed.data, dependencies);

    return { output: result, sources: result.sources };
  }

  if (name === "find_meeting_slots") {
    const parsed = findMeetingSlotsSchema.safeParse(args);

    return parsed.success ? { output: findMeetingSlots(parsed.data), sources: [] } : invalidArguments();
  }

  if (name === "prepare_meeting") {
    const parsed = prepareMeetingSchema.safeParse(args);

    return parsed.success ? { output: prepareMeeting(parsed.data), sources: [] } : invalidArguments();
  }

  if (name === "book_meeting") {
    const parsed = bookMeetingSchema.safeParse(args);

    return parsed.success ? { output: bookMeeting(parsed.data), sources: [] } : invalidArguments();
  }

  return { output: { error: "unknown_tool", message: "The requested tool is not available." }, sources: [] };
}

function invalidArguments(): AssistantToolResult {
  return { output: { error: "invalid_arguments", message: "Tool arguments did not match the required schema." }, sources: [] };
}
