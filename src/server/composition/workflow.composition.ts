import "server-only";

import { prisma } from "../infrastructure/database/prisma";
import { GLOBAL_ASSISTANT_TOOLS } from "../modules/assistant/tools/assistant-tools";
import { MeetingBookingWorkflowDefinition } from "../modules/workflow/definitions/meeting-booking/meeting-booking.definition";
import type { IWorkflowService } from "../modules/workflow/interfaces/workflow.service.interface";
import { WorkflowDefinitionRegistry } from "../modules/workflow/workflow-definition.registry";
import { WorkflowInstanceRepository } from "../modules/workflow/repositories/workflow-instance.repository";
import { WorkflowService } from "../modules/workflow/services/workflow.service";
import { meetingService } from "./meeting.composition";

const workflowRegistry = new WorkflowDefinitionRegistry([
  new MeetingBookingWorkflowDefinition(meetingService),
]);

const workflowInstanceRepository = new WorkflowInstanceRepository(prisma);

export const workflowService: IWorkflowService = new WorkflowService(
  workflowRegistry,
  workflowInstanceRepository,
  GLOBAL_ASSISTANT_TOOLS.map(({ name }) => name),
);
