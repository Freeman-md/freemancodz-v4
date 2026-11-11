import "server-only";

import {
  getGoogleCalendarConfig,
  getNotificationOwnerEmail,
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
import { ContactRequestRepository } from "./contact/repository";
import { ContactService } from "./contact/service";
import { MeetingOwnerNotice } from "./meeting/owner-notice";
import { MeetingRepository } from "./meeting/repository";
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
import { createMeetingBookingAction } from "./workflow/definitions/meeting-booking/actions";
import { WorkflowRunner } from "./workflow/runner";
import { WorkflowRunRepository } from "./workflow/run-repository";
import { MeetingBookingWorkflowDefinition } from "./workflow/definitions/meeting-booking/definition";
import { WorkflowRegistry } from "./workflow/registry";
import { WorkflowRepository } from "./workflow/repository";
import { WorkflowService } from "./workflow/service";

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

// Contact
export const contactService = new ContactService(
  new ContactRequestRepository(prisma),
  notificationService,
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

// Rate limiting
export const rateLimitService = new RateLimitService(
  new RateLimitRepository(prisma),
  getRateLimitHmacSecret,
);

// Workflow
const calendar = new GoogleCalendarClient(getGoogleCalendarConfig);

const meetingStore = new MeetingRepository(prisma);

const meetingService = new MeetingService(calendar, logger);

const workflowRegistry = new WorkflowRegistry([
  new MeetingBookingWorkflowDefinition(
    meetingService,
    createMeetingBookingAction(
      meetingService,
      calendar,
      meetingStore,
      new MeetingOwnerNotice(resendClient, () => ({
        adminEmail: getNotificationOwnerEmail(),
        fromEmail: getResendConfig().fromEmail,
      })),
    ),
  ),
]);

export const workflowService = new WorkflowService(
  workflowRegistry,
  new WorkflowRepository(prisma),
);

export const workflowRunner = new WorkflowRunner(
  workflowRegistry,
  new WorkflowRunRepository(prisma),
  logger,
);

// Assistant
export const assistantService = new AssistantService(
  openAIProvider,
  logger,
  new PortfolioSearchService(new PrismaPortfolioSearchRepository(prisma), embeddings),
  workflowService,
);
