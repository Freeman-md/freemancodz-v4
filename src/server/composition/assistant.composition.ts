import "server-only";

import { getWorkflowSecret } from "../infrastructure/config/env";
import type { IAssistantService } from "../modules/assistant/interfaces/assistant.service.interface";
import type { IWorkflowService } from "../modules/assistant/interfaces/workflow.service.interface";
import { AssistantService } from "../modules/assistant/services/assistant.service";
import { WorkflowService } from "../modules/assistant/services/workflow.service";
import { logger } from "./logging.composition";
import { meetingService } from "./meeting.composition";
import { openAIProvider } from "./openai.composition";
import { siteSearchService } from "./search-index.composition";

const workflowService: IWorkflowService = new WorkflowService(getWorkflowSecret);

export const assistantService: IAssistantService = new AssistantService(
  openAIProvider,
  siteSearchService,
  logger,
  meetingService,
  workflowService,
);
