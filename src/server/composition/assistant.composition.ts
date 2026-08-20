import "server-only";

import type { IAssistantService } from "../modules/assistant/interfaces/assistant.service.interface";
import { AssistantService } from "../modules/assistant/services/assistant.service";
import { logger } from "./logging.composition";
import { openAIProvider } from "./openai.composition";
import { siteSearchService } from "./search-index.composition";
import { workflowService } from "./workflow.composition";

export const assistantService: IAssistantService = new AssistantService(
  openAIProvider,
  siteSearchService,
  logger,
  workflowService,
);
