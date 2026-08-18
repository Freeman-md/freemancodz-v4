import "server-only";

import { getGoogleCalendarConfig } from "../infrastructure/config/env";
import { prisma } from "../infrastructure/database/prisma";
import { GoogleCalendarProvider } from "../infrastructure/google-calendar/google-calendar.provider";
import type { IMeetingService } from "../modules/meeting/interfaces/meeting.service.interface";
import { MeetingRepository } from "../modules/meeting/repositories/meeting.repository";
import { MeetingService } from "../modules/meeting/services/meeting.service";
import { logger } from "./logging.composition";

const googleCalendarProvider = new GoogleCalendarProvider(getGoogleCalendarConfig);

const meetingRepository = new MeetingRepository(prisma);

export const meetingService: IMeetingService = new MeetingService(
  googleCalendarProvider,
  meetingRepository,
  logger,
);
