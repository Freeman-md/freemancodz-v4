export type CalendarBusyPeriod = { start: Date; end: Date };
import type { Prisma } from "@/generated/prisma/client";
export type CreatedCalendarEvent = {
  id: string;
  htmlLink: string | null;
  payload: Prisma.InputJsonObject;
};
