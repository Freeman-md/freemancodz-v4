import type { AssistantStreamEvent, WorkflowObservation } from "@/contracts/assistant.contract";
import type { PortfolioSearchService } from "../../portfolio/services/portfolio-search.service";
import type { ActiveWorkflowTool, WorkflowService } from "../../workflow/service";
import { ASSISTANT_ERRORS, AssistantError } from "../errors";
import { ASK_USER_CHOICE_TOOL } from "./ask-user-choice/definition";
import { askUserChoice } from "./ask-user-choice/implementation";
import {
  REQUEST_DRAFT_DISCARD_TOOL,
  requestDraftDiscardArgumentsSchema,
} from "./request-draft-discard/definition";
import { SEARCH_PORTFOLIO_TOOL } from "./search-portfolio/definition";
import { searchPortfolio } from "./search-portfolio/implementation";
import {
  START_WORKFLOW_TOOL_NAME,
  startWorkflowArgumentsSchema,
} from "./start-workflow/definition";

export type ToolReplyEvent = Extract<
  AssistantStreamEvent,
  { type: "options" | "sources" | "workflow_instance" | "confirm_workflow_discard" }
>;

type ToolResult = { output: string; event?: ToolReplyEvent; replyOptions?: readonly string[] };

export async function executeTool(
  name: string,
  rawArguments: string,
  search: Pick<PortfolioSearchService, "search">,
  signal: AbortSignal,
  workflow: {
    service: Pick<WorkflowService, "start">;
    visitorKey: string;
    tools: readonly ActiveWorkflowTool[];
    draft?: WorkflowObservation;
  },
): Promise<ToolResult> {
  switch (name) {
    case REQUEST_DRAFT_DISCARD_TOOL.name: {
      requestDraftDiscardArgumentsSchema.parse(JSON.parse(rawArguments));
      if (!workflow.draft) {
        throw new Error("No current draft to discard.");
      }

      return {
        output: JSON.stringify({ status: "confirmation_required" }),
        event: { type: "confirm_workflow_discard", draft: workflow.draft },
      };
    }

    case ASK_USER_CHOICE_TOOL.name: {
      const result = askUserChoice(rawArguments);

      return {
        output: JSON.stringify(result),
        event: { type: "options", options: result.options },
      };
    }

    case SEARCH_PORTFOLIO_TOOL.name: {
      const result = await searchPortfolio(rawArguments, search, signal);

      return {
        output: JSON.stringify({ excerpts: result.matches }),
        event: result.sources.length ? { type: "sources", sources: result.sources } : undefined,
      };
    }

    case START_WORKFLOW_TOOL_NAME: {
      const { workflowId } = startWorkflowArgumentsSchema.parse(JSON.parse(rawArguments));

      const instance = await workflow.service.start({
        workflowId,
        visitorKey: workflow.visitorKey,
        originChannel: "web",
        signal,
      });

      return {
        output: JSON.stringify({ status: "active" }),
        event: { type: "workflow_instance", instance },
      };
    }

    default: {
      const workflowTool = workflow.tools.find(({ tool }) => tool.name === name);

      if (!workflowTool) {
        throw new Error("Unsupported assistant tool.");
      }

      const result = await workflowTool.run(rawArguments, signal);

      if (!result) {
        throw new AssistantError(ASSISTANT_ERRORS.WORKFLOW_CHANGED);
      }

      return {
        output: JSON.stringify(result.output),
        replyOptions: result.replyOptions,
        event: result.instance
          ? { type: "workflow_instance", instance: result.instance }
          : undefined,
      };
    }
  }
}
