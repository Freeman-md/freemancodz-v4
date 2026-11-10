import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import type { CalendarClient, CreatedCalendarEvent } from "@/infrastructure/google-calendar/types";
import { MeetingRepository } from "@/modules/meeting/repository";
import { MeetingService } from "@/modules/meeting/service";
import { NotificationService, type PreparedOwnerNotice } from "@/modules/notification/service";
import { WorkflowExecutionRepository } from "@/modules/workflow/execution.repository";
import { WorkflowExecutionService } from "@/modules/workflow/execution.service";

type Fixture = {
  events: Record<string, CreatedCalendarEvent>;
  notices: Record<string, PreparedOwnerNotice>;
  noticeAttempts?: number;
  busy?: boolean;
};

const [, , filename, executionId, mode, timestamp] = process.argv;

const url = process.env.M27_DISPOSABLE_DATABASE;

if (!url || !new URL(url).pathname.startsWith("/m27_")) {
  throw new Error("Expected the M27 disposable database.");
}

function load(): Fixture {
  return existsSync(filename)
    ? JSON.parse(readFileSync(filename, "utf8"))
    : { events: {}, notices: {} };
}

function save(fixture: Fixture) {
  writeFileSync(filename, JSON.stringify(fixture));
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const logger = { info() {}, error() {} };

class TestExecutionRepository extends WorkflowExecutionRepository {
  override async settle(...args: Parameters<WorkflowExecutionRepository["settle"]>) {
    const persisted = await super.settle(...args);

    if (persisted && mode === "after-booking" && args[2].step === "owner_notice") {
      process.kill(process.pid, "SIGKILL");
    }

    return persisted;
  }
}

const calendar: CalendarClient = {
  getBusyPeriods: async ({ start, end }) => (load().busy ? [{ start, end }] : []),
  findEvent: async (id) => load().events[id] ?? null,
  createEvent: async (input) => {
    const fixture = load();

    if (fixture.events[input.eventId]) {
      throw new Error("Fake Calendar rejected a duplicate event insert.");
    }

    const event: CreatedCalendarEvent = {
      id: input.eventId,
      htmlLink: null,
      payload: {
        id: input.eventId,
        status: "confirmed",
        summary: input.summary,
        description: input.description,
        attendees: [{ email: input.attendeeEmail }],
        start: { dateTime: input.start.toISOString(), timeZone: input.timezone },
        end: { dateTime: input.end.toISOString(), timeZone: input.timezone },
        extendedProperties: { private: { bookingOperationId: input.bookingOperationId } },
      },
    };

    fixture.events[event.id] = event;
    save(fixture);
    if (mode === "after-calendar") {
      process.kill(process.pid, "SIGKILL");
    }

    return event;
  },
};

const notifications = new NotificationService(
  {
    send: async (notice) => {
      const fixture = load();

      const previous = fixture.notices[notice.idempotencyKey];

      if (previous && JSON.stringify(previous) !== JSON.stringify(notice)) {
        throw new Error("Fake email rejected a changed idempotent payload.");
      }

      fixture.notices[notice.idempotencyKey] = notice;
      fixture.noticeAttempts = (fixture.noticeAttempts ?? 0) + 1;
      save(fixture);
      if (mode === "uncertain-notice") {
        throw new Error("Fake email accepted the message and lost its response.");
      }
    },
  },
  () => ({ adminEmail: "owner@example.test", fromEmail: "sender@example.test" }),
  logger,
);

const meeting = new MeetingService(calendar, new MeetingRepository(db), logger, notifications);

const runner = new WorkflowExecutionService(
  new TestExecutionRepository(db),
  meeting,
  notifications,
  logger,
  () => new Date(timestamp),
);

runner
  .runDue(executionId)
  .finally(() => db.$disconnect())
  .catch(() => {
    process.exitCode = 1;
  });
