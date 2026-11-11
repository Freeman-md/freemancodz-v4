# Workflows

The assistant can collect details and prepare a review through definition-owned tools. It offers those tools after resolving the browser's saved instance and revision. A definition validates state and supplies the review, ordered steps, and visitor-facing status. Register definitions and their providers in the composition root.

The browser confirms a review by sending its ID and revision to the same-origin approval route. The approval transaction checks the browser owner, consumes the review, and creates one run with stable step IDs. The route runs a bounded pass for that review. Browser clients request NDJSON step activity and the final saved snapshot. JSON clients receive the saved snapshot after the pass. The same executor lets the scheduled worker recover due work after the request ends. While the approval stream is open, step events update the pending assistant reply. A claimed reconciliation displays **Checking outcome**. A delayed retry displays **Waiting to retry** until the assistant reports the saved pending outcome. The assistant polls the saved snapshot while a run remains pending. An executor can save a step result only while it owns the claim. A reconciliation probe checks what happened after a timeout or expired claim.

The run reports success, definite failure, pending work, or an uncertain outcome. Older unresolved steps without recorded certainty are treated as uncertain. If the approval response is lost, the browser reloads the saved workflow before it can offer another confirmation.

Before approval, the visitor can use **Discard draft** in the workflow header or ask to discard it in chat. Confirmation targets the saved instance and revision. Discard invalidates any pending review and prevents that draft from being restored or approved.

Known conversation limitation: after **Keep draft** dismisses a discard prompt, an ambiguous reply such as “Yes” can still prompt the assistant to refer to the dismissed control. This is a display mismatch. Approval and discard still require their own explicit, revision-checked browser requests.

Meeting reserves the slot in Postgres, then creates an event with a stable Calendar ID and operation marker. The next step verifies or saves the booking by that ID. The saved outcome marks the booking confirmed as soon as the save succeeds. The final step freezes the owner notification and submits it to Resend with a stable idempotency key. A notification failure leaves the appointment confirmed.

## Release and scheduling

Apply the additive migrations to the verified shared database from the reviewed revision with `npm run prisma:migrate:production`. This command checks the configured production target. The migration adds private review, run, and step tables and restricts API-role access to Meeting data. Verify pending migrations and take the usual recoverable backup before applying them. Preview smoke checks that access workflow state require the shared schema. Keep provider fault tests and competing writes on disposable data.

After deployment, drain older booking writers before enabling scheduled work. Configure the server-only `WORKFLOW_RUNNER_SECRET` with at least 32 characters. In Supabase Vault, store the same secret as `workflow_runner_secret` and the intended endpoint URL as `workflow_runner_url`. Enable Cron, Vault, and `pg_net`. An authorized operator installs one job for the shared database.

```sql
select cron.schedule(
  'workflow-runner',
  '* * * * *',
  $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'workflow_runner_url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret from vault.decrypted_secrets where name = 'workflow_runner_secret'
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
  $job$
);
```

Verify that an unauthenticated request returns 401. Check the authorized job and HTTP invocation results, then inspect the safe step status, attempt counters, and reason codes. Keep secret values and frozen payloads out of logs. [Supabase Cron](https://supabase.com/docs/guides/cron) · [Scheduled HTTP and Vault](https://supabase.com/docs/guides/functions/schedule-functions)

## Resolve a run that needs attention

Use the run ID, step key, and safe reason to identify the unresolved effect. Match Calendar events by ID, operation marker, attendee, and reviewed details. For a missing or mismatched event after an uncertain insert, keep the reservation until the external result is established. For a booking save problem, look up the existing Calendar ID in Meeting before any correction. For an uncertain owner notice, use its saved message and idempotency key within the provider's 24-hour window. Once that window ends, verify provider history before any manual resend. Preserve confirmed appointments when only owner notification needs attention.

Before removing a definition in production, stop new approvals for it and drain or resolve every approved run. Keep the version registered while any of its runs still need automated processing.

## Controlled verification

If the local shell exports Google credentials for another integration, start Next.js without those inherited values so it loads the portfolio project's Calendar configuration.

```sh
env -u GOOGLE_CLIENT_ID -u GOOGLE_CLIENT_SECRET -u GOOGLE_REFRESH_TOKEN -u GOOGLE_CALENDAR_ID npm run dev
```

Run the database suites with `WORKFLOW_TEST_DATABASE_URL` and `PORTFOLIO_TEST_DATABASE_URL` pointing to disposable PostgreSQL with pgvector. The approval suite drives the authorized endpoint and exercises edit and approval races, expired claims, and injected provider failures. It advances the worker clock to check the saved retry and probe delays.

Use `node tests/e2e/stage-workflow-variant.mjs /tmp/m28-meeting meeting` to build a disposable copy with controlled provider wiring. Generate Prisma and run the production build with the disposable database configured. Set `WORKFLOW_E2E_URL` and run `node --import tsx --test tests/e2e/workflow.test.ts` to verify that one confirmation finishes the booking with scheduling disabled and that the saved outcome survives reload.

Stage the `empty` and `services` variants in separate disposable directories with the same script. Both remove the Meeting definition, Meeting module, and Calendar adapter from the production source. The services variant registers the test-only Request Services definition. Build and start them separately, set `WORKFLOW_EMPTY_URL` and `WORKFLOW_SERVICES_URL`, and run `NODE_ENV=production node --conditions=react-server --import tsx --test tests/e2e/workflow-plugins.test.ts`. The test verifies the shared browser and runner paths, including recovery from a lost fixture acknowledgement.
