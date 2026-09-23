import type { CalendarBusyPeriod, CreatedCalendarEvent } from "../google-calendar.types";

export interface IGoogleCalendarProvider {
  getBusyPeriods(input: { start: Date; end: Date }): Promise<CalendarBusyPeriod[]>;
  createEvent(input: {
    summary: string;
    description: string;
    attendeeEmail: string;
    start: Date;
    end: Date;
    timezone: string;
  }): Promise<CreatedCalendarEvent>;
}
