import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { z } from "zod";
import { createWorkflowRecoveryPost } from "@/app/api/internal/workflow-recovery/route";
import { WorkflowExecutionRepository } from "@/modules/workflow/execution.repository";
import { MeetingBookingWorkflowDefinition } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.definition";
import { MeetingBookingWorkflowProgressProjector } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.progress";
import { WorkflowDefinitionRegistry } from "@/modules/workflow/registry";
import { WorkflowInstanceRepository } from "@/modules/workflow/repository";
import { WorkflowService } from "@/modules/workflow/service";
import { applyPrismaMigration } from "../apply-prisma-migration";

const configured = process.env.PORTFOLIO_TEST_DATABASE_URL;

const runWorker = promisify(execFile);

test("workflow recovery rejects unauthorized requests before executing work", async () => {
  let calls = 0;

  const secret = "fixture-test-recovery-secret-32-characters";

  const post = createWorkflowRecoveryPost(
    () => ({ secret, adoptLegacy: false }),
    async () => {
      calls += 1;

      return { handled: 0 };
    },
  );

  for (const authorization of ["", "Bearer incorrect", "Basic " + secret]) {
    assert.equal(
      (
        await post(
          new Request("http://localhost/api/internal/workflow-recovery", {
            headers: { authorization },
          }),
        )
      ).status,
      401,
    );
  }

  assert.equal(calls, 0);
  const response = await post(
    new Request("http://localhost/api/internal/workflow-recovery", {
      headers: { authorization: "Bearer " + secret },
    }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { handled: 0 });
  assert.equal(calls, 1);
});

test(
  "approved booking recovers in fresh workers with one event, meeting and owner email",
  {
    skip: !configured,
    timeout: 120_000,
  },
  async (t) => {
    const admin = new Client({ connectionString: configured });

    const databaseName = "m27_" + randomUUID().replaceAll("-", "");

    const url = new URL(configured!);

    url.pathname = "/" + databaseName;
    const dir = await mkdtemp(join(tmpdir(), "m27-execution-"));

    const provider = join(dir, "provider.json");

    await admin.connect();
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    const sql = new Client({ connectionString: url.href });

    const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.href }) });

    try {
      await sql.connect();
      const migrations = (await readdir("prisma/migrations"))
        .filter((name) => /^\d/.test(name))
        .sort();

      for (const migration of migrations.slice(0, -1)) {
        await applyPrismaMigration(sql, migration);
      }

      const progress = new MeetingBookingWorkflowProgressProjector();

      const providerOnlyInChild = {
        findAvailableSlots: async () => [],
        isSlotAvailable: async () => {
          throw new Error("Approval must not call Calendar.");
        },
        bookMeeting: async () => {
          throw new Error("Approval must not book inline.");
        },
        reconcileMeeting: async () => {
          throw new Error("Approval must not reconcile inline.");
        },
      };

      const v1 = new MeetingBookingWorkflowDefinition(providerOnlyInChild, progress);

      const v2 = new MeetingBookingWorkflowDefinition(providerOnlyInChild, progress, 2);

      const testDefinition = {
        id: "test-review",
        version: 1,
        description: "A controlled test-only workflow.",
        stateSchema: z.object({ value: z.string() }),
        createInitialState: () => ({ value: "Approve this review" }),
        getProgress: (state: { value: string }, status: "active" | "completed" | "cancelled") => ({
          phase: status === "active" ? ("awaiting_confirmation" as const) : status,
          fields: [{ key: "value", required: true, value: state.value }],
          missingRequiredFields: [],
        }),
        getInstructions: () => "",
        getTools: () => [],
        executeTool: async () => {
          throw new Error("This definition has no model tools.");
        },
        getReview: (state: { value: string }) => ({
          title: "Review the test request",
          actionKey: "test-approval",
          fields: [{ key: "value", label: "Test detail", required: true, value: state.value }],
        }),
        prepareApproval: (state: { value: string }) => ({
          actionKey: "test-approval",
          approvedInput: state,
          acceptedState: state,
          checkpoint: {},
        }),
      };

      const logger = { info() {}, error() {} };

      const executionRepository = new WorkflowExecutionRepository(db);

      const workflow = new WorkflowService(
        new WorkflowDefinitionRegistry([v1, v2, testDefinition]),
        new WorkflowInstanceRepository(db),
        [],
        logger,
        () => new Date(),
        executionRepository,
      );

      const base = v1.createInitialState({
        originChannel: "test",
        originPage: null,
        originEntry: null,
      });

      function reviewed(day: number) {
        const date = `2099-09-${String(day).padStart(2, "0")}`;

        const slot = {
          start: date + "T11:00:00.000Z",
          end: date + "T11:30:00.000Z",
          timezone: "Europe/London",
        };

        return {
          ...base,
          step: "awaiting_confirmation" as const,
          name: "Visitor",
          email: "visitor@example.test",
          reason: "Test meeting",
          selectedSlot: slot,
          availableSlots: [slot],
          preparedInteractionId: randomUUID(),
        };
      }

      const add = (day: number, version = 2) =>
        db.workflowInstance.create({
          data: {
            workflowId: "meeting-booking",
            workflowVersion: version,
            revision: 7,
            state: reviewed(day),
            originChannel: "test",
          },
        });

      // This persisted review predates the new execution table.
      const beforeMigration = await add(15, 1);

      await applyPrismaMigration(sql, migrations.at(-1)!);
      const privileges = await sql.query(
        "SELECT has_table_privilege('anon', 'public.workflow_executions', 'SELECT') AS execution, has_table_privilege('authenticated', 'public.meetings', 'SELECT') AS meeting",
      );

      assert.deepEqual(privileges.rows, [{ execution: false, meeting: false }]);
      const now = Date.now() + 1000;

      async function worker(id: string, mode: string, offset: number) {
        return runWorker(
          process.execPath,
          [
            "--conditions=react-server",
            "--import",
            "tsx",
            "tests/integration/workflow/fixtures/execution-worker.ts",
            provider,
            id,
            mode,
            new Date(now + offset).toISOString(),
          ],
          { env: { ...process.env, M27_DISPOSABLE_DATABASE: url.href }, timeout: 12_000 },
        );
      }

      async function effects() {
        return JSON.parse(await readFile(provider, "utf8")) as {
          events: Record<string, unknown>;
          notices: Record<string, unknown>;
          noticeAttempts: number;
        };
      }

      async function accept(day: number) {
        const instance = await add(day);

        const result = await workflow.confirmWorkflow(
          instance.id,
          "book-meeting",
          instance.revision,
        );

        assert.ok(result.executionId);

        return { instance, id: result.executionId };
      }

      await t.test(
        "races both the reviewed revision and an overlapping workflow before Calendar",
        async () => {
          assert.equal(
            (await workflow.getAssistantContext(beforeMigration.id)).instance?.review?.actionKey,
            "book-meeting",
          );

          const overlap = await add(15);

          const wrongKey = await workflow.confirmWorkflow(
            beforeMigration.id,
            "different-action",
            7,
          );

          assert.equal(wrongKey.executionId, undefined);
          const approved = await Promise.all([
            workflow.confirmWorkflow(beforeMigration.id, "book-meeting", 7),
            workflow.confirmWorkflow(beforeMigration.id, "book-meeting", 7),
            workflow.confirmWorkflow(overlap.id, "book-meeting", 7),
          ]);

          const [winner] = approved.filter((result) => result.executionId);

          assert.equal(approved.filter((result) => result.executionId).length, 1);
          assert.equal(await db.meeting.count({ where: { status: "pending" } }), 1);
          assert.ok(winner.executionId);
          await assert.rejects(worker(winner.executionId, "after-calendar", 0), {
            signal: "SIGKILL",
          });
          assert.equal(Object.keys((await effects()).events).length, 1);
          assert.equal(await db.meeting.count({ where: { status: "confirmed" } }), 0);
          await worker(winner.executionId, "normal", 1_000);
          assert.equal(await db.meeting.count({ where: { status: "confirmed" } }), 0);
          await worker(winner.executionId, "normal", 46_000);
          const recovered = await effects();

          assert.equal(Object.keys(recovered.events).length, 1);
          assert.equal(Object.keys(recovered.notices).length, 1);
          assert.equal(await db.meeting.count({ where: { status: "confirmed" } }), 1);
          assert.equal(
            (await workflow.getAssistantContext(winner.instance.id)).instance?.outcome?.ownerNotice,
            "accepted",
          );
        },
      );

      await t.test(
        "a saved booking is visible even if the worker dies before the owner notice",
        async () => {
          const { instance, id } = await accept(16);

          await assert.rejects(worker(id, "after-booking", 47_000), { signal: "SIGKILL" });
          assert.deepEqual((await workflow.getAssistantContext(instance.id)).instance?.outcome, {
            booking: "confirmed",
            ownerNotice: "pending",
            retryAt: undefined,
          });
          await worker(id, "normal", 48_000);
          assert.equal(Object.keys((await effects()).events).length, 2);
          assert.equal(Object.keys((await effects()).notices).length, 2);
          assert.equal(await db.meeting.count({ where: { status: "confirmed" } }), 2);
        },
      );

      await t.test(
        "owner notice retry keeps the frozen payload and never rolls back a booked meeting",
        async () => {
          const { instance, id } = await accept(17);

          for (const offset of [49_000, 52_000, 58_000]) {
            await worker(id, "uncertain-notice", offset);
          }

          const outcome = (await workflow.getAssistantContext(instance.id)).instance?.outcome;

          assert.equal(outcome?.booking, "confirmed");
          assert.equal(outcome?.ownerNotice, "needs_review");
          assert.equal(Object.keys((await effects()).notices).length, 3);
          assert.equal((await effects()).noticeAttempts, 5);
          assert.equal((await workflow.retryWorkflow(instance.id)).executionId, undefined);
        },
      );

      await t.test(
        "a verified no-effect Calendar conflict releases the hold and requires a new review",
        async () => {
          const { instance, id } = await accept(18);

          await writeFile(provider, JSON.stringify({ ...(await effects()), busy: true }));
          await worker(id, "normal", 59_000);
          const status = (await workflow.getAssistantContext(instance.id)).instance;

          assert.equal(status?.outcome?.booking, "not_booked");
          assert.equal(status?.progress.phase, "collecting");
          assert.equal(status?.review, undefined);
          assert.equal(await db.meeting.count({ where: { status: "pending" } }), 0);
          assert.equal(Object.keys((await effects()).events).length, 3);
        },
      );
      await t.test(
        "a second definition uses the same review, action key and revision guard",
        async () => {
          const instance = await workflow.start("test-review", {
            originChannel: "test",
            originPage: null,
            originEntry: null,
          });

          const review = (await workflow.getAssistantContext(instance.id)).instance?.review;

          assert.equal(review?.fields[0].label, "Test detail");
          assert.equal(
            (await workflow.confirmWorkflow(instance.id, "book-meeting", instance.revision))
              .executionId,
            undefined,
          );
          assert.equal(
            (await workflow.confirmWorkflow(instance.id, "test-approval", instance.revision + 1))
              .executionId,
            undefined,
          );
          const accepted = await workflow.confirmWorkflow(
            instance.id,
            "test-approval",
            instance.revision,
          );

          assert.ok(accepted.executionId);
          assert.equal((await executionRepository.latest(instance.id))?.actionKey, "test-approval");
          assert.equal(
            (await workflow.confirmWorkflow(instance.id, "test-approval", instance.revision))
              .executionId,
            undefined,
          );
        },
      );

      await t.test(
        "legacy pickup preserves a verified Calendar ID and quarantines ambiguous approval",
        async () => {
          const state = reviewed(19);

          const eventId = "legacy_event_preserved";

          const event = {
            id: eventId,
            htmlLink: null,
            payload: {
              id: eventId,
              status: "confirmed",
              summary: "Meeting with Visitor",
              description: state.reason,
              attendees: [{ email: state.email }],
              start: { dateTime: state.selectedSlot.start, timeZone: state.selectedSlot.timezone },
              end: { dateTime: state.selectedSlot.end, timeZone: state.selectedSlot.timezone },
            },
          };

          const fixture = await effects();

          fixture.events[eventId] = event;
          await writeFile(provider, JSON.stringify({ ...fixture, busy: false }));
          const approved = await db.workflowInstance.create({
            data: {
              workflowId: "meeting-booking",
              workflowVersion: 1,
              revision: 8,
              originChannel: "test",
              state: {
                ...state,
                step: "confirmed",
                pendingBooking: {
                  googleEventId: eventId,
                  googleEventUrl: null,
                  rawProviderPayload: event.payload,
                  name: state.name,
                  email: state.email,
                  reason: state.reason,
                  selectedSlot: state.selectedSlot,
                },
              },
            },
          });

          const ambiguous = await db.workflowInstance.create({
            data: {
              workflowId: "meeting-booking",
              workflowVersion: 1,
              revision: 8,
              originChannel: "test",
              state: { ...reviewed(20), step: "confirmed" },
            },
          });

          await workflow.adoptLegacyApprovals();
          const accepted = await executionRepository.latest(approved.id);

          assert.ok(accepted);
          assert.equal((await executionRepository.latest(ambiguous.id))?.step, "needs_review");
          await worker(accepted.id, "normal", 60_000);
          assert.equal(
            (await db.meeting.findUnique({ where: { googleEventId: eventId } }))?.status,
            "confirmed",
          );
          assert.equal(Object.keys((await effects()).events).length, 4);
          assert.equal(Object.keys((await effects()).notices).length, 4);
        },
      );
    } finally {
      await db.$disconnect();
      await sql.end();
      await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
      await admin.end();
      await rm(dir, { recursive: true, force: true });
    }
  },
);
