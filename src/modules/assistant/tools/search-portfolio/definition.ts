import { z } from "zod";

import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import { searchPortfolioArgumentsSchema } from "./schema";

const { $schema: _schema, ...parameters } = z.toJSONSchema(searchPortfolioArgumentsSchema);

export const SEARCH_PORTFOLIO_TOOL = {
  type: "function",
  name: "search_portfolio",
  description:
    "Find facts about Freeman’s projects, experience, or services. " +
    "Use a short standalone query and resolve references using the conversation.",
  strict: true,
  parameters,
} satisfies OpenAIResponseTool;
