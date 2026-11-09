import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { z } from "zod";
import { PrismaClient } from "@/generated/prisma/client";
import {
  CalendarEventError,
  type CalendarClient,
  type CreatedCalendarEvent,
} from "@/infrastructure/google-calendar/types";
import { MeetingService } from "@/modules/meeting/service";
import { MeetingBookingError } from "@/modules/meeting/types";
import { MeetingRepository } from "@/modules/meeting/repository";
import type { MeetingServiceClient } from "@/modules/meeting/types";
import { WorkflowInstanceStoreError } from "@/modules/workflow/errors";
import type {
  IWorkflowDefinition,
  IWorkflowInstanceRepository,
} from "@/modules/workflow/interfaces";
import { MeetingBookingWorkflowDefinition } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.definition";
import { MeetingBookingWorkflowProgressProjector } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.progress";
import { meetingBookingStateSchema } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.schema";
import { WorkflowDefinitionRegistry } from "@/modules/workflow/registry";
import { WorkflowInstanceRepository } from "@/modules/workflow/repository";
import { WorkflowService } from "@/modules/workflow/service";
import { ContactService } from "@/modules/contact/service";
import { ContactRequestRepository } from "@/modules/contact/repository";
import { ContactWorkflowDefinition } from "@/modules/workflow/definitions/contact/contact.definition";
import { ContactWorkflowProgressProjector } from "@/modules/workflow/definitions/contact/contact.progress";

const adminConnectionUrl = process.env.PORTFOLIO_TEST_DATABASE_URL;

const slot = {
  start: "2099-09-15T11:00:00.000Z",
  end: "2099-09-15T11:30:00.000Z",
  timezone: "Europe/London",
};

function deferred() {
  let release = () => {};

  const promise = new Promise<void>((resolvePromise) => {
    release = resolvePromise;
  });

  return { promise, release };
}

function createService(
  repository: IWorkflowInstanceRepository,
  overrides: Partial<MeetingServiceClient> = {},
  configuredMeeting?: MeetingServiceClient,
) {
  const operations = new Set<string>();

  const logs: Array<{ event: string; context: unknown }> = [];

  const meeting: MeetingServiceClient = {
    findAvailableSlots: async () => [slot],
    isSlotAvailable: async () => true,
    bookMeeting: async ({ bookingOperationId }) => {
      operations.add(bookingOperationId);

      return { googleEventId: bookingOperationId, googleEventUrl: null };
    },
    reconcileMeeting: async ({ pendingEvent }) => ({
      googleEventId: pendingEvent.googleEventId,
      googleEventUrl: null,
    }),
    ...overrides,
  };

  const replacement: IWorkflowDefinition<Record<string, never>> = {
    id: "replacement",
    version: 1,
    description: "Another request.",
    stateSchema: z.object({}).strict(),
    createInitialState: () => ({}),
    getProgress: (_state, status) => ({
      phase: status === "active" ? "collecting" : status,
      fields: [],
      missingRequiredFields: [],
    }),
    getInstructions: () => "",
    getTools: () => [],
    executeTool: async (_name, _arguments, state) => ({ state, status: "active", output: {} }),
  };

  const service = new WorkflowService(
    new WorkflowDefinitionRegistry([
      new MeetingBookingWorkflowDefinition(
        configuredMeeting ?? meeting,
        new MeetingBookingWorkflowProgressProjector(),
      ),
      replacement,
    ]),
    repository,
    [],
    {
      info: (event, context) => {
        logs.push({ event, context });
      },
      error: (event, context) => {
        logs.push({ event, context });
      },
    },
  );

  return { service, operations, logs };
}

async function prepare(service: WorkflowService) {
  const started = await service.start("meeting-booking", {
    originChannel: "test",
    originPage: null,
    originEntry: null,
  });

  const interactionId = randomUUID();

  await service.executeTool(started.id, {
    name: "find_meeting_slots",
    rawArguments: '{"startDate":"2099-09-15","endDate":"2099-09-15"}',
    interactionId,
  });

  return (
    await service.executeTool(started.id, {
      name: "prepare_meeting",
      rawArguments: JSON.stringify({
        name: "Visitor",
        email: "visitor@example.test",
        reason: "Discuss a project",
        selectedSlot: { start: slot.start, end: slot.end },
      }),
      interactionId,
    })
  ).instance;
}

test(
  "booking confirmation and recovery use real PostgreSQL compare-and-swap transitions",
  {
    skip: !adminConnectionUrl,
    timeout: 60_000,
  },
  async (context) => {
    const databaseName = `booking_confirmation_${randomUUID().replaceAll("-", "")}`;

    const databaseUrl = new URL(adminConnectionUrl!);

    databaseUrl.pathname = `/${databaseName}`;
    const admin = new Client({ connectionString: adminConnectionUrl });

    let database: Client | undefined;

    let prisma: PrismaClient | undefined;

    await admin.connect();
    await admin.query(`CREATE DATABASE "${databaseName}"`);

    try {
      database = new Client({ connectionString: databaseUrl.toString() });
      await database.connect();
      await database.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
    END $$`);

      for (const migration of [
        "20260803090000_add_meetings",
        "20260820120000_add_workflow_instances",
        "20260923200500_add_contact_requests",
        "20261002090000_add_workflow_interactions",
        "20261008120000_remove_workflow_pending_interaction",
      ]) {
        await database.query(
          await readFile(
            resolve(process.cwd(), "prisma/migrations", migration, "migration.sql"),
            "utf8",
          ),
        );
      }

      prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: databaseUrl.toString() }),
      });
      const repository = new WorkflowInstanceRepository(prisma);

      context.beforeEach(async () => {
        await prisma!.$transaction([
          prisma!.contactRequest.deleteMany(),
          prisma!.meeting.deleteMany(),
          prisma!.workflowInstance.deleteMany(),
        ]);
      });

      const claimInput = async (id: string, selectedSlot = slot) => {
        const current = (await repository.findById(id))!;

        const state = meetingBookingStateSchema.parse(current.state);

        return {
          id,
          expectedRevision: current.revision,
          status: "active" as const,
          completedAt: null,
          state: {
            ...state,
            step: "confirmed" as const,
            selectedSlot,
            bookingOperation: { id: randomUUID(), preparedRevision: current.revision },
          },
        };
      };

      await context.test(
        "different workflows racing one slot admit one Calendar event and Meeting row",
        async () => {
          const otherDatabase = new PrismaClient({
            adapter: new PrismaPg({ connectionString: databaseUrl.toString() }),
          });

          const otherRepository = new WorkflowInstanceRepository(otherDatabase);

          const bothAvailable = deferred(),
            insertStarted = deferred(),
            finishInsert = deferred();

          const events = new Map<string, CreatedCalendarEvent>();

          let preflights = 0,
            insertCalls = 0;

          const calendar: CalendarClient = {
            getBusyPeriods: async () => [],
            findEvent: async (id) => events.get(id) ?? null,
            createEvent: async (input) => {
              insertCalls++;
              const event = {
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

              events.set(input.eventId, event);
              insertStarted.release();
              await finishInsert.promise;

              return event;
            },
          };

          const meeting = new MeetingService(
            calendar,
            new MeetingRepository(prisma!),
            { info() {}, error() {} },
            { notifyMeetingBooked: async () => {} },
          );

          const provider: MeetingServiceClient = {
            findAvailableSlots: async () => [slot],
            isSlotAvailable: async () => {
              preflights++;
              if (preflights === 2) {
                bothAvailable.release();
              }

              await bothAvailable.promise;

              return true;
            },
            bookMeeting: (input) => meeting.bookMeeting(input),
            reconcileMeeting: (input) => meeting.reconcileMeeting(input),
          };

          const left = createService(repository, {}, provider),
            right = createService(otherRepository, {}, provider);

          const a = await prepare(left.service),
            b = await prepare(right.service);

          const first = left.service.confirmMeetingBooking(a.id, a.revision),
            second = right.service.confirmMeetingBooking(b.id, b.revision);

          try {
            await insertStarted.promise;
            const aState = meetingBookingStateSchema.parse(
              (await repository.findById(a.id))!.state,
            );

            const losing = await (aState.bookingOperation ? second : first);

            assert.equal(losing.output.error, "slot_unavailable");
            const savedLoser = meetingBookingStateSchema.parse(
              (await repository.findById(losing.instance.id))!.state,
            );

            assert.equal(savedLoser.selectedSlot, null);
            assert.equal(savedLoser.preparedInteractionId, null);
            assert.equal(savedLoser.bookingOperation, null);
            assert.deepEqual(savedLoser.availableSlots, []);
            assert.equal(savedLoser.name, "Visitor");
            assert.equal(savedLoser.email, "visitor@example.test");
            assert.equal(savedLoser.reason, "Discuss a project");
            assert.equal(insertCalls, 1);
            // The loser finishes while the winner is still waiting on Calendar.
            finishInsert.release();
            const results = await Promise.all([first, second]);

            assert.equal(
              results.filter((result) => result.instance.status === "completed").length,
              1,
            );
            assert.equal(events.size, 1);
            assert.equal(await prisma!.meeting.count(), 1);
            const logs = [...left.logs, ...right.logs];

            assert.ok(logs.some((log) => log.event === "workflow.booking_slot_conflict"));
            assert.doesNotMatch(JSON.stringify(logs), /visitor@example|Discuss a project|Visitor/);
          } finally {
            finishInsert.release();
            await Promise.allSettled([first, second]);
            await otherDatabase.$disconnect();
          }
        },
      );

      await context.test(
        "overlapping claims conflict, adjacent intervals and own-instance saves do not",
        async () => {
          const { service } = createService(repository);

          const a = await prepare(service),
            b = await prepare(service),
            c = await prepare(service);

          const input = await claimInput(a.id);

          const accepted = await repository.claimMeetingBooking(input);

          await repository.claimMeetingBooking({ ...input, expectedRevision: accepted.revision });
          await assert.rejects(
            repository.claimMeetingBooking(
              await claimInput(b.id, {
                ...slot,
                start: "2099-09-15T11:15:00.000Z",
                end: "2099-09-15T11:45:00.000Z",
              }),
            ),
            { code: "slot_unavailable" },
          );
          await repository.claimMeetingBooking(
            await claimInput(c.id, { ...slot, start: slot.end, end: "2099-09-15T12:00:00.000Z" }),
          );
          assert.equal(
            meetingBookingStateSchema.parse((await repository.findById(b.id))!.state).step,
            "awaiting_confirmation",
          );
        },
      );

      for (const legacy of ["confirmed", "pending", "completed", "malformed"] as const) {
        await context.test(`${legacy} accepted states block overlapping claims`, async () => {
          const { service } = createService(repository);

          const a = await prepare(service),
            b = await prepare(service);

          const input = await claimInput(a.id);

          const state = { ...input.state, bookingOperation: null };

          if (legacy === "pending") {
            state.pendingBooking = {
              googleEventId: "legacy-event",
              googleEventUrl: null,
              rawProviderPayload: {},
              name: "Visitor",
              email: "visitor@example.test",
              reason: "Discuss a project",
              selectedSlot: slot,
            };
          }

          await prisma!.workflowInstance.update({
            where: { id: a.id },
            data: {
              state: legacy === "malformed" ? { step: "confirmed", selectedSlot: null } : state,
              status: legacy === "completed" ? "completed" : "active",
              completedAt: legacy === "completed" ? new Date() : null,
            },
          });
          await assert.rejects(repository.claimMeetingBooking(await claimInput(b.id)), {
            code: legacy === "malformed" ? "unavailable" : "slot_unavailable",
          });
        });
      }

      await context.test("failed claim rolls back and releases its lock", async () => {
        const { service, operations } = createService(repository);

        const a = await prepare(service),
          b = await prepare(service);

        await assert.rejects(
          repository.claimMeetingBooking({ ...(await claimInput(a.id)), expectedRevision: 0 }),
          { code: "stale" },
        );
        assert.equal(
          meetingBookingStateSchema.parse((await repository.findById(a.id))!.state)
            .bookingOperation,
          null,
        );
        await repository.claimMeetingBooking(await claimInput(b.id));
        assert.equal(operations.size, 0);
      });

      await context.test("a correction winning conflict cleanup is not overwritten", async () => {
        const base = createService(repository);

        const a = await prepare(base.service),
          b = await prepare(base.service);

        await repository.claimMeetingBooking(await claimInput(a.id));
        let corrected = false;

        const store: IWorkflowInstanceRepository = {
          create: (input) => repository.create(input),
          findById: (id) => repository.findById(id),
          claimMeetingBooking: (input) => repository.claimMeetingBooking(input),
          save: async (input) => {
            if (input.id === b.id && !corrected) {
              corrected = true;
              await base.service.executeTool(b.id, {
                name: "update_meeting_context",
                rawArguments: JSON.stringify({
                  updates: [{ field: "name", value: "Corrected visitor" }],
                }),
                interactionId: randomUUID(),
              });
            }

            return repository.save(input);
          },
        };

        const { service, operations } = createService(store);

        const result = await service.confirmMeetingBooking(b.id, b.revision);

        const state = meetingBookingStateSchema.parse((await repository.findById(b.id))!.state);

        assert.equal(result.output.error, "booking_changed");
        assert.equal(state.name, "Corrected visitor");
        assert.deepEqual(state.selectedSlot, slot);
        assert.equal(operations.size, 0);
      });

      await context.test(
        "lock timeout leaves no acceptance and permits a later claim",
        async () => {
          const blocker = new Client({ connectionString: databaseUrl.toString() });

          await blocker.connect();
          const { service, operations } = createService(repository);

          const a = await prepare(service),
            b = await prepare(service);

          try {
            await blocker.query("BEGIN");
            await blocker.query(
              "SELECT pg_advisory_xact_lock(hashtext('freemancodz:meeting-booking'))",
            );
            await assert.rejects(repository.claimMeetingBooking(await claimInput(a.id)), {
              code: "unavailable",
            });
            const result = await service.confirmMeetingBooking(a.id, a.revision);

            assert.equal(result.instance.progress.phase, "awaiting_confirmation");
            assert.equal(result.output.error, "booking_changed");
            assert.equal(
              meetingBookingStateSchema.parse((await repository.findById(a.id))!.state)
                .bookingOperation,
              null,
            );
            assert.equal(operations.size, 0);
          } finally {
            await blocker.query("ROLLBACK");
            await blocker.end();
          }

          await repository.claimMeetingBooking(await claimInput(b.id));
        },
      );

      for (const failure of ["provider_response", "completion_save"] as const) {
        await context.test(`${failure} retains the claim through recovery`, async () => {
          let fail = true;

          const store: IWorkflowInstanceRepository = {
            create: (input) => repository.create(input),
            findById: (id) => repository.findById(id),
            claimMeetingBooking: (input) => repository.claimMeetingBooking(input),
            save: async (input) => {
              if (failure === "completion_save" && input.status === "completed" && fail) {
                fail = false;
                throw new WorkflowInstanceStoreError("unavailable", "Injected completion failure");
              }

              return repository.save(input);
            },
          };

          const operationIds = new Set<string>();

          const { service } = createService(store, {
            bookMeeting: async (input) => {
              operationIds.add(input.bookingOperationId);
              if (failure === "provider_response" && fail) {
                fail = false;
                throw new MeetingBookingError("uncertain");
              }

              return { googleEventId: input.bookingOperationId, googleEventUrl: null };
            },
          });

          const a = await prepare(service),
            b = await prepare(service);

          const pending = await service.confirmMeetingBooking(a.id, a.revision);

          assert.equal(pending.instance.confirmationAction, "retry");
          const loser = await service.confirmMeetingBooking(b.id, b.revision);

          assert.equal(loser.output.error, "slot_unavailable");
          const recovered = await service.retryMeetingBooking(a.id);

          assert.equal(recovered.instance.status, "completed");
          assert.equal(operationIds.size, 1);
        });
      }

      await context.test(
        "concurrent confirmations admit one operation and freeze controls",
        async () => {
          const bothPreflights = deferred();

          const preflightRelease = deferred();

          const bookingStarted = deferred();

          const bookingRelease = deferred();

          let preflights = 0;

          const operationIds: string[] = [];

          const { service } = createService(repository, {
            isSlotAvailable: async () => {
              preflights += 1;
              if (preflights === 2) {
                bothPreflights.release();
              }

              await preflightRelease.promise;

              return true;
            },
            bookMeeting: async ({ bookingOperationId }) => {
              operationIds.push(bookingOperationId);
              bookingStarted.release();
              await bookingRelease.promise;

              return { googleEventId: bookingOperationId, googleEventUrl: null };
            },
          });

          const prepared = await prepare(service);

          assert.equal(prepared.confirmationAction, "confirm");
          for (const name of ["confirm_meeting", "book_meeting"]) {
            await assert.rejects(
              service.executeTool(prepared.id, {
                name,
                rawArguments: "{}",
                interactionId: randomUUID(),
              }),
              { code: "unavailable_tool" },
            );
          }

          const first = service.confirmMeetingBooking(prepared.id, prepared.revision);

          const second = service.confirmMeetingBooking(prepared.id, prepared.revision);

          await bothPreflights.promise;
          preflightRelease.release();
          await bookingStarted.promise;
          const accepted = await service.getAssistantContext(prepared.id);

          assert.equal(accepted.instance?.confirmationAction, "retry");
          assert.deepEqual(accepted.tools, []);
          await assert.rejects(service.cancel(prepared.id), { code: "invalid_transition" });
          for (const name of ["cancel_workflow", "switch_workflow", "prepare_meeting"]) {
            await assert.rejects(
              service.executeTool(prepared.id, {
                name,
                rawArguments: '{"workflowId":"replacement"}',
                interactionId: randomUUID(),
                startContext: { originChannel: "test", originPage: null, originEntry: null },
              }),
              { code: "invalid_transition" },
            );
          }

          bookingRelease.release();
          await Promise.all([first, second]);
          const saved = (await repository.findById(prepared.id))!;

          assert.equal(saved.status, "completed");
          assert.equal(operationIds.length, 1);
          assert.equal(
            meetingBookingStateSchema.parse(saved.state).bookingOperation?.id,
            operationIds[0],
          );
          assert.equal(
            (await service.confirmMeetingBooking(prepared.id, prepared.revision)).instance.status,
            "completed",
          );
          assert.equal(
            (await service.retryMeetingBooking(prepared.id)).instance.status,
            "completed",
          );
          assert.equal(operationIds.length, 1);
        },
      );

      for (const control of ["cancel", "switch"] as const) {
        await context.test(
          `${control} winning before acceptance prevents Calendar creation`,
          async () => {
            const preflightStarted = deferred();

            const preflightRelease = deferred();

            const { service, operations } = createService(repository, {
              isSlotAvailable: async () => {
                preflightStarted.release();
                await preflightRelease.promise;

                return true;
              },
            });

            const prepared = await prepare(service);

            const confirmation = service.confirmMeetingBooking(prepared.id, prepared.revision);

            await preflightStarted.promise;
            if (control === "cancel") {
              await service.cancel(prepared.id);
            } else {
              await service.executeTool(prepared.id, {
                name: "switch_workflow",
                rawArguments: '{"workflowId":"replacement"}',
                interactionId: randomUUID(),
                startContext: { originChannel: "test", originPage: null, originEntry: null },
              });
            }

            preflightRelease.release();
            const result = await confirmation;

            assert.equal(result.instance.status, "cancelled");
            assert.equal(operations.size, 0);
          },
        );
      }

      await context.test(
        "a correction winning during preflight cannot confirm the old summary",
        async () => {
          const preflightStarted = deferred();

          const preflightRelease = deferred();

          const { service, operations } = createService(repository, {
            isSlotAvailable: async () => {
              preflightStarted.release();
              await preflightRelease.promise;

              return true;
            },
          });

          const prepared = await prepare(service);

          const confirmation = service.confirmMeetingBooking(prepared.id, prepared.revision);

          await preflightStarted.promise;

          const corrected = await service.executeTool(prepared.id, {
            name: "update_meeting_context",
            interactionId: randomUUID(),
            rawArguments: JSON.stringify({
              updates: [{ field: "name", value: "Corrected" }],
            }),
          });

          preflightRelease.release();
          const raced = await confirmation;

          assert.equal(raced.output.error, "booking_changed");
          assert.equal(raced.instance.revision, corrected.instance.revision);
          assert.equal(operations.size, 0);
          const stale = await service.confirmMeetingBooking(prepared.id, prepared.revision);

          assert.equal(stale.output.error, "stale_booking_summary");
          assert.equal(stale.instance.revision, corrected.instance.revision);
          assert.equal(operations.size, 0);
          const reviewed = await service.executeTool(prepared.id, {
            name: "prepare_meeting",
            interactionId: randomUUID(),
            rawArguments: JSON.stringify({
              name: "Corrected",
              email: "visitor@example.test",
              reason: "Discuss a project",
              selectedSlot: { start: slot.start, end: slot.end },
            }),
          });

          const confirmed = await service.confirmMeetingBooking(
            prepared.id,
            reviewed.instance.revision,
          );

          assert.equal(confirmed.instance.status, "completed");
          assert.equal(operations.size, 1);
        },
      );

      for (const committed of [false, true]) {
        await context.test(
          `completion-save failure ${committed ? "after" : "before"} commit preserves operation`,
          async () => {
            let failCompletion = true;

            const failingRepository: IWorkflowInstanceRepository = {
              create: (input) => repository.create(input),
              findById: (id) => repository.findById(id),
              claimMeetingBooking: (input) => repository.claimMeetingBooking(input),
              save: async (input) => {
                if (input.status === "completed" && failCompletion) {
                  failCompletion = false;
                  if (committed) {
                    await repository.save(input);
                  }

                  throw new WorkflowInstanceStoreError(
                    "unavailable",
                    "simulated completion failure",
                  );
                }

                return repository.save(input);
              },
            };

            const { service, operations, logs } = createService(failingRepository);

            const prepared = await prepare(service);

            const first = await service.confirmMeetingBooking(prepared.id, prepared.revision);

            assert.equal(operations.size, 1);
            assert.equal(first.instance.status, committed ? "completed" : "active");
            assert.ok(logs.some((log) => log.event === "workflow.booking_accepted"));
            assert.ok(logs.some((log) => log.event === "workflow.booking_completion_save_failed"));
            assert.doesNotMatch(JSON.stringify(logs), /visitor@example|Discuss a project|Visitor/);
            if (!committed) {
              assert.equal(first.instance.confirmationAction, "retry");
            }

            const [left, right] = await Promise.all([
              service.retryMeetingBooking(prepared.id),
              service.retryMeetingBooking(prepared.id),
            ]);

            assert.equal(left.instance.status, "completed");
            assert.equal(right.instance.status, "completed");
            assert.equal(operations.size, 1);
          },
        );
      }

      for (const pending of [false, true]) {
        await context.test(
          `concurrent ${pending ? "pending reconciliation" : "Calendar insertion"} converges on one actual Meeting row`,
          async () => {
            const bookingOperationId = randomUUID();

            const eventId = `b${bookingOperationId.replaceAll("-", "")}`;

            const events = new Map<string, CreatedCalendarEvent>();

            const bothInserts = deferred();

            let insertAttempts = 0;

            const bothMeetingCreates = deferred();

            let meetingCreateAttempts = 0;

            let uniqueConflicts = 0;

            const event: CreatedCalendarEvent = {
              id: eventId,
              htmlLink: null,
              payload: {
                id: eventId,
                status: "confirmed",
                summary: "Meeting with Visitor",
                description: "Discuss a project",
                attendees: [{ email: "visitor@example.test" }],
                start: { dateTime: slot.start, timeZone: slot.timezone },
                end: { dateTime: slot.end, timeZone: slot.timezone },
                extendedProperties: { private: { bookingOperationId } },
              },
            };

            const calendar: CalendarClient = {
              getBusyPeriods: async () => [],
              findEvent: async (id) => events.get(id) ?? null,
              createEvent: async (input) => {
                assert.equal(input.eventId, eventId);
                insertAttempts += 1;
                if (insertAttempts === 2) {
                  bothInserts.release();
                }

                await bothInserts.promise;
                if (events.has(input.eventId)) {
                  throw new CalendarEventError();
                }

                events.set(input.eventId, event);

                return event;
              },
            };

            const meetingRepository = new MeetingRepository(prisma!);

            const meetingService = new MeetingService(
              calendar,
              {
                findMeetingByGoogleEventId: (id) =>
                  meetingRepository.findMeetingByGoogleEventId(id),
                updateMeeting: (input) => meetingRepository.updateMeeting(input),
                createMeeting: async (input) => {
                  meetingCreateAttempts += 1;
                  if (meetingCreateAttempts === 2) {
                    bothMeetingCreates.release();
                  }

                  await bothMeetingCreates.promise;

                  try {
                    return await meetingRepository.createMeeting(input);
                  } catch (error) {
                    if (error instanceof Error && "code" in error && error.code === "P2002") {
                      uniqueConflicts += 1;
                    }

                    throw error;
                  }
                },
              },
              { info: () => undefined, error: () => undefined },
              { notifyMeetingBooked: async () => undefined },
            );

            const { service } = createService(repository, {}, meetingService);

            const prepared = await prepare(service);

            const stored = (await repository.findById(prepared.id))!;

            const state = meetingBookingStateSchema.parse(stored.state);

            if (pending) {
              events.set(eventId, event);
            }

            await repository.save({
              id: stored.id,
              expectedRevision: stored.revision,
              status: "active",
              completedAt: null,
              state: {
                ...state,
                step: "confirmed",
                bookingOperation: { id: bookingOperationId, preparedRevision: stored.revision },
                pendingBooking: pending
                  ? {
                      googleEventId: eventId,
                      googleEventUrl: null,
                      rawProviderPayload: event.payload,
                      name: state.name!,
                      email: state.email!,
                      reason: state.reason!,
                      selectedSlot: slot,
                    }
                  : null,
              },
            });
            const [left, right] = await Promise.all([
              service.retryMeetingBooking(prepared.id),
              service.retryMeetingBooking(prepared.id),
            ]);

            assert.equal(left.instance.status, "completed");
            assert.equal(right.instance.status, "completed");
            assert.equal(events.size, 1);
            assert.equal(insertAttempts, pending ? 0 : 2);
            assert.equal(meetingCreateAttempts, 2);
            assert.equal(uniqueConflicts, 1);
            assert.equal(await prisma!.meeting.count({ where: { googleEventId: eventId } }), 1);
            const saved = await prisma!.meeting.findUniqueOrThrow({
              where: { googleEventId: eventId },
            });

            assert.equal(saved.email, "visitor@example.test");
            assert.equal(saved.status, "confirmed");
          },
        );
      }

      for (const kind of ["contact"] as const) {
        const definitions = [
          new MeetingBookingWorkflowDefinition(
            {
              findAvailableSlots: async () => [],
              isSlotAvailable: async () => false,
              bookMeeting: async () => {
                throw new Error("Unexpected booking");
              },
              reconcileMeeting: async () => {
                throw new Error("Unexpected reconciliation");
              },
            },
            new MeetingBookingWorkflowProgressProjector(),
          ),
          new ContactWorkflowDefinition(
            new ContactService(new ContactRequestRepository(prisma!), {
              notifyContactSubmitted: async () => {},
            }),
            new ContactWorkflowProgressProjector(),
          ),
        ];

        const createSubmission = (store: IWorkflowInstanceRepository = repository) =>
          new WorkflowService(new WorkflowDefinitionRegistry(definitions), store, [], {
            info() {},
            error() {},
          });

        const confirm = (service: WorkflowService, id: string, revision: number) =>
          service.confirmContactMessage(id, revision);

        const retry = (service: WorkflowService, id: string) => service.retryContactMessage(id);

        const prepareSubmission = async (service: WorkflowService) => {
          const instance = await service.start(kind, {
            originChannel: "test",
            originPage: null,
            originEntry: null,
          });

          const fields = {
            name: "Visitor",
            email: "visitor@example.test",
            message: "Discuss a project",
          };

          await service.executeTool(instance.id, {
            name: `update_${kind}_context`,
            rawArguments: JSON.stringify({
              updates: Object.entries(fields).map(([field, value]) => ({ field, value })),
            }),
            interactionId: randomUUID(),
          });

          return (
            await service.executeTool(instance.id, {
              name: `prepare_${kind}_submission`,
              rawArguments: "{}",
              interactionId: randomUUID(),
            })
          ).instance;
        };

        const count = (id: string) =>
          prisma!.contactRequest.count({ where: { workflowInstanceId: id } });

        await context.test(
          `${kind}: concurrent confirmation and retries create one matching request`,
          async () => {
            const service = createSubmission();

            const prepared = await prepareSubmission(service);

            await assert.rejects(
              service.executeTool(prepared.id, {
                name: `submit_${kind}`,
                rawArguments: "{}",
                interactionId: randomUUID(),
                allowConfirmation: true,
              }),
              { code: "unavailable_tool" },
            );
            const stale = await confirm(service, prepared.id, prepared.revision - 1);

            assert.equal(stale.instance.progress.phase, "awaiting_confirmation");
            assert.equal(await count(prepared.id), 0);
            await Promise.all([
              confirm(service, prepared.id, prepared.revision),
              confirm(service, prepared.id, prepared.revision),
            ]);
            const result = await retry(service, prepared.id);

            assert.equal(result.instance.status, "completed");
            assert.equal(await count(prepared.id), 1);
            assert.equal(
              result.instance.progress.fields.find((field) => field.key === "email")?.value,
              "visitor@example.test",
            );
          },
        );

        await context.test(
          `${kind}: completion committed before a lost save response reconciles`,
          async () => {
            let fail = true;

            const service = createSubmission({
              create: (input) => repository.create(input),
              findById: (id) => repository.findById(id),
              claimMeetingBooking: (input) => repository.claimMeetingBooking(input),
              save: async (input) => {
                const saved = await repository.save(input);

                if (input.status === "completed" && fail) {
                  fail = false;
                  throw new Error("Lost committed response");
                }

                return saved;
              },
            });

            const prepared = await prepareSubmission(service);

            const result = await confirm(service, prepared.id, prepared.revision);

            assert.equal(result.instance.status, "completed");
            assert.equal(await count(prepared.id), 1);
          },
        );

        for (const mutation of ["correction", "cancel", "switch"] as const) {
          await context.test(
            `${kind}: ${mutation} winning acceptance race prevents submission`,
            async () => {
              const waiting = deferred(),
                release = deferred();

              const service = createSubmission({
                create: (input) => repository.create(input),
                findById: (id) => repository.findById(id),
                claimMeetingBooking: (input) => repository.claimMeetingBooking(input),
                save: async (input) => {
                  if (input.state.confirmedRevision != null) {
                    waiting.release();
                    await release.promise;
                  }

                  return repository.save(input);
                },
              });

              const prepared = await prepareSubmission(service);

              const confirmation = confirm(service, prepared.id, prepared.revision);

              await waiting.promise;
              const other = createSubmission();

              if (mutation === "cancel") {
                await other.cancel(prepared.id);
              } else {
                await other.executeTool(prepared.id, {
                  name: mutation === "correction" ? `update_${kind}_context` : "switch_workflow",
                  rawArguments: JSON.stringify(
                    mutation === "correction"
                      ? { updates: [{ field: "name", value: "Corrected visitor" }] }
                      : { workflowId: "meeting-booking" },
                  ),
                  interactionId: randomUUID(),
                  startContext: { originChannel: "test", originPage: null, originEntry: null },
                });
              }

              release.release();
              await confirmation;
              assert.equal(await count(prepared.id), 0);
            },
          );
        }

        await context.test(
          `${kind}: completion failure freezes details and concurrent recovery reuses request`,
          async () => {
            let fail = true;

            const service = createSubmission({
              create: (input) => repository.create(input),
              findById: (id) => repository.findById(id),
              claimMeetingBooking: (input) => repository.claimMeetingBooking(input),
              save: async (input) => {
                if (input.status === "completed" && fail) {
                  fail = false;
                  throw new Error("Injected completion failure");
                }

                return repository.save(input);
              },
            });

            const prepared = await prepareSubmission(service);

            const pending = await confirm(service, prepared.id, prepared.revision);

            assert.equal(pending.instance.progress.phase, "processing");
            assert.equal(await count(prepared.id), 1);
            await assert.rejects(service.cancel(prepared.id), { code: "invalid_transition" });
            await assert.rejects(
              service.executeTool(prepared.id, {
                name: `update_${kind}_context`,
                rawArguments: JSON.stringify({ updates: [{ field: "name", value: "Changed" }] }),
                interactionId: randomUUID(),
              }),
              { code: "invalid_transition" },
            );
            const results = await Promise.all([
              retry(service, prepared.id),
              retry(service, prepared.id),
            ]);

            assert.ok(results.every((result) => result.instance.status === "completed"));
            assert.equal(await count(prepared.id), 1);
          },
        );
      }

      await context.test("legacy confirmed state without an operation fails closed", async () => {
        const { service, operations } = createService(repository);

        const prepared = await prepare(service);

        const stored = (await repository.findById(prepared.id))!;

        const state = meetingBookingStateSchema.parse(stored.state);

        await repository.save({
          id: stored.id,
          expectedRevision: stored.revision,
          status: "active",
          completedAt: null,
          state: { ...state, step: "confirmed", bookingOperation: null },
        });
        const result = await service.retryMeetingBooking(prepared.id);

        assert.equal(result.instance.confirmationAction, "blocked");
        assert.equal(result.output.error, "booking_recovery_blocked");
        assert.equal(operations.size, 0);
      });
    } finally {
      await prisma?.$disconnect();
      await database?.end();
      await admin.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`,
        [databaseName],
      );
      await admin.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await admin.end();
    }
  },
);
