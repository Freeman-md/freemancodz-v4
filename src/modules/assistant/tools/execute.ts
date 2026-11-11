import type { AssistantStreamEvent } from "@/contracts/assistant.contract";
import type { PortfolioSearchService } from "../../portfolio/services/portfolio-search.service";
import type { ActiveWorkflowTool, WorkflowService } from "../../workflow/service";
import { ASSISTANT_ERRORS, AssistantError } from "../errors";
import { ASK_USER_CHOICE_TOOL } from "./ask-user-choice/definition";
import { askUserChoice } from "./ask-user-choice/implementation";
import { SEARCH_PORTFOLIO_TOOL } from "./search-portfolio/definition";
import { searchPortfolio } from "./search-portfolio/implementation";
import {
  START_WORKFLOW_TOOL_NAME,
  startWorkflowArgumentsSchema,
} from "./start-workflow/definition";

export type ToolReplyEvent = Extract<
  AssistantStreamEvent,
  { type: "options" | "sources" | "workflow_instance" }
>;

type ToolResult = { output: string; event?: ToolReplyEvent };

export async function executeTool(
  name: string,
  rawArguments: string,
  search: Pick<PortfolioSearchService, "search">,
  signal: AbortSignal,
  workflow: {
    service: Pick<WorkflowService, "start">;
    visitorKey: string;
    tools: readonly ActiveWorkflowTool[];
  },
): Promise<ToolResult> {
  switch (name) {
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

      const instance = await workflowTool.run(rawArguments, signal);

      if (!instance) {
        throw new AssistantError(ASSISTANT_ERRORS.WORKFLOW_CHANGED);
      }

      return {
        output: JSON.stringify({ status: "saved" }),
        event: { type: "workflow_instance", instance },
      };
    }
  }
}
