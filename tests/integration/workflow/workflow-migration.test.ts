import { assertDisposableTarget } from "../disposable-target";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir } from "node:fs/promises";
import test from "node:test";
import { Client } from "pg";
import { applyPrismaMigration } from "../apply-prisma-migration";

const adminUrl = process.env.PORTFOLIO_TEST_DATABASE_URL;

const approvalMigration = "20261111130000_add_workflow_approval_and_runs";

test(
  "the approval migration preserves existing drafts, bookings, Contact and portfolio content",
  {
    skip: !adminUrl && "Set PORTFOLIO_TEST_DATABASE_URL to disposable PostgreSQL",
  },
  async () => {
    await assertDisposableTarget(adminUrl);
    assert.ok(adminUrl);
    const url = new URL(adminUrl);

    assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
    const databaseName = `m28_migration_${randomUUID().replaceAll("-", "")}`;

    const admin = new Client({ connectionString: adminUrl });

    await admin.connect();
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    url.pathname = databaseName;
    const db = new Client({ connectionString: url.href });

    try {
      await db.connect();
      const migrations = (await readdir("prisma/migrations"))
        .filter((name) => /^\d+_/.test(name))
        .sort();

      assert.ok(migrations.includes(approvalMigration));
      for (const migration of migrations) {
        if (migration === approvalMigration) {
          break;
        }

        await applyPrismaMigration(db, migration, url.href);
      }

      const draftId = randomUUID();

      const contactWorkflowId = randomUUID();

      const draft = { reason: "Existing Meeting draft" };

      await db.query(
        `
      INSERT INTO workflow_instances (id, workflow_id, workflow_version, state, origin_channel)
      VALUES ($1, 'meeting-booking', 1, $2, 'test'), ($3, 'contact', 1, '{}', 'test')
    `,
        [draftId, draft, contactWorkflowId],
      );
      await db.query(`
      INSERT INTO meetings (google_event_id, name, email, timezone, reason, starts_at, ends_at, status, raw_provider_payload)
      VALUES ('legacy-booking', 'Existing visitor', 'visitor@example.test', 'Europe/London', 'Existing booking',
        '2099-06-15T11:00:00Z', '2099-06-15T11:30:00Z', 'confirmed', '{}')
    `);
      await db.query(
        `
      INSERT INTO contact_requests (workflow_instance_id, name, email, message)
      VALUES ($1, 'Contact visitor', 'contact@example.test', 'Existing Contact request')
    `,
        [contactWorkflowId],
      );

      const before = await db.query("SELECT * FROM portfolio_profiles");

      assert.ok(before.rowCount);
      await applyPrismaMigration(db, approvalMigration);
      assert.deepEqual((await db.query("SELECT * FROM portfolio_profiles")).rows, before.rows);
      assert.deepEqual(
        (await db.query("SELECT state FROM workflow_instances WHERE id = $1", [draftId])).rows,
        [{ state: draft }],
      );
      assert.deepEqual(
        (await db.query("SELECT status FROM meetings WHERE google_event_id = 'legacy-booking'"))
          .rows,
        [{ status: "confirmed" }],
      );
      assert.deepEqual(
        (
          await db.query("SELECT message FROM contact_requests WHERE workflow_instance_id = $1", [
            contactWorkflowId,
          ])
        ).rows,
        [{ message: "Existing Contact request" }],
      );
      for (const table of ["workflow_reviews", "workflow_runs", "workflow_steps", "meetings"]) {
        const { rows } = await db.query(
          "SELECT has_table_privilege('anon', $1, 'SELECT') AS public_access, has_table_privilege('authenticated', $1, 'SELECT') AS visitor_access",
          [`public.${table}`],
        );

        assert.deepEqual(rows, [{ public_access: false, visitor_access: false }]);
      }
    } finally {
      await db.end();
      await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
      await admin.end();
    }
  },
);
