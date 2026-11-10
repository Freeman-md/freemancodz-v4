import "server-only";

import {
  getNotificationOwnerEmail,
  getGoogleCalendarConfig,
  getRateLimitHmacSecret,
  getResendConfig,
} from "@/infrastructure/config/env";
import { createPrismaClient, prisma } from "@/infrastructure/database/prisma";
import { GoogleCalendarClient } from "@/infrastructure/google-calendar/client";
import { logger } from "@/infrastructure/logging/logger";
import { ResendClient } from "@/infrastructure/resend/client";
import { OpenAIClient, createOpenAIClient, getResponseModel } from "@/infrastructure/openai/client";
import { OpenAIEmbeddings } from "@/infrastructure/openai/embeddings";
import { AssistantService } from "./assistant/service";
import { GLOBAL_ASSISTANT_TOOLS, TURN_PURPOSE_TOOL } from "./assistant/tools/definitions";
import { ContactRequestRepository } from "./contact/repository";
import { ContactService } from "./contact/service";
import { MeetingService } from "./meeting/service";
import { NotificationService } from "./notification/service";
import { PrismaPublicPortfolioRepository } from "./portfolio/repositories/public-portfolio.repository";
import { PrismaPortfolioSearchRepository } from "./portfolio/repositories/portfolio-search.repository";
import {
  PortfolioIndexService,
  PortfolioSearchService,
} from "./portfolio/services/portfolio-search.service";
import { PublicPortfolioService } from "./portfolio/services/public-portfolio.service";
import { PrismaPortfolioSeedRepository } from "./portfolio/repositories/portfolio-seed.repository";
import { PortfolioSeedService } from "./portfolio/seed.service";
import { RateLimitRepository } from "./rate-limit/repository";
import { RateLimitService } from "./rate-limit/service";
import { MeetingBookingWorkflowDefinition } from "./workflow/definitions/meeting-booking/meeting-booking.definition";
import { MeetingBookingWorkflowProgressProjector } from "./workflow/definitions/meeting-booking/meeting-booking.progress";
import { WorkflowInstanceRepository } from "./workflow/repository";
import { WorkflowService } from "./workflow/service";
import { WorkflowDefinitionRegistry } from "./workflow/registry";

import { WorkflowExecutionRepository } from "./workflow/execution.repository";
import { WorkflowExecutionService } from "./workflow/execution.service";

// Shared infrastructure
const openAIProvider = new OpenAIClient(createOpenAIClient, getResponseModel);

const embeddings = new OpenAIEmbeddings(createOpenAIClient);

export { logger };

// Notifications
const resendClient = new ResendClient(getResendConfig);

const notificationService = new NotificationService(
  resendClient,
  () => ({ adminEmail: getNotificationOwnerEmail(), fromEmail: getResendConfig().fromEmail }),
  logger,
);

// Contact and meetings
export const contactService = new ContactService(
  new ContactRequestRepository(prisma),
  notificationService,
);
const meetingService = new MeetingService(
  new GoogleCalendarClient(getGoogleCalendarConfig),
  logger,
);

// Portfolio
export const publicPortfolioService = new PublicPortfolioService(
  new PrismaPublicPortfolioRepository(prisma),
);

export function createPortfolioSeedSession(connection: string) {
  const client = createPrismaClient(connection);

  return {
    service: new PortfolioSeedService(new PrismaPortfolioSeedRepository(client)),
    disconnect: () => client.$disconnect(),
  };
}

export function createPortfolioIndexSession(connection: string) {
  const client = createPrismaClient(connection);

  return {
    service: new PortfolioIndexService(
      new PrismaPublicPortfolioRepository(client),
      new PrismaPortfolioSearchRepository(client),
      embeddings,
    ),
    disconnect: () => client.$disconnect(),
  };
}

// Workflows

const meetingBookingWorkflowProgress = new MeetingBookingWorkflowProgressProjector();

const workflowRegistry = new WorkflowDefinitionRegistry([
  new MeetingBookingWorkflowDefinition(meetingService, meetingBookingWorkflowProgress),
  new MeetingBookingWorkflowDefinition(meetingService, meetingBookingWorkflowProgress, 2),
]);

const workflowExecutionRepository = new WorkflowExecutionRepository(prisma);

export const workflowService = new WorkflowService(
  workflowRegistry,
  new WorkflowInstanceRepository(prisma),
  [...GLOBAL_ASSISTANT_TOOLS, TURN_PURPOSE_TOOL].map(({ name }) => name),
  logger,
  () => new Date(),
  workflowExecutionRepository,
);

export const workflowExecutionService = new WorkflowExecutionService(
  workflowExecutionRepository,
  meetingService,
  notificationService,
  logger,
);

// Rate limiting
export const rateLimitService = new RateLimitService(
  new RateLimitRepository(prisma),
  getRateLimitHmacSecret,
);

// Assistant
export const assistantService = new AssistantService(
  openAIProvider,
  logger,
  workflowService,
  new PortfolioSearchService(new PrismaPortfolioSearchRepository(prisma), embeddings),
);
