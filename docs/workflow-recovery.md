# Workflow recovery operations

Use an isolated Preview database with pgvector, Cron, Vault and `pg_net`, a test Calendar, and test attendee and owner inboxes for the rehearsal. Verify the deployment's database and provider targets in their settings before enabling chat on Preview. Configure a dedicated server-only `WORKFLOW_RECOVERY_SECRET` of at least 32 characters for the intended deployment. Use the same secret in that database's Vault. Scope Calendar and email credentials to the test resources for Preview.

## Enable recovery

1. Apply the additive Prisma migration `20261110140000_add_workflow_executions`. The migration restricts API access to both execution and Meeting records.
2. Deploy the new application and drain all earlier booking writers. Leave `WORKFLOW_LEGACY_PICKUP=0` during the transition. When no earlier writer remains, set it to `1` and deploy that setting.
3. In the database for this environment, use Vault to store `workflow_recovery_url` with the protected deployment's full internal recovery endpoint URL and `workflow_recovery_secret` with the dedicated bearer secret. Keep Preview deployment protection enabled and use the hosting team's approved machine access for the scheduled request. Verify the endpoint is reachable with the intended machine access before scheduling.
4. Install or update the single Cron job in this database. Confirm an authenticated invocation returns a bounded count, and that the unauthenticated route rejects the request.

```sql
select cron.schedule(
  'workflow-recovery',
  '* * * * *',
  $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'workflow_recovery_url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'workflow_recovery_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
  $job$
);
```

If hosting requires a separate machine access header, store its value separately in Vault and add that header to the scheduled invocation. Keep the destination URL free of credentials. Only enable production after the approved deployment and rehearsal.

## Verify and reconcile

A completed booking means the Calendar event and Meeting row agree. The event requests the attendee invitation. The execution records the owner email separately. Provider acceptance does not prove inbox delivery, so check both controlled inboxes during the rehearsal.

Inspect execution ID, step, attempt, next attempt time, lease expiration and safe category in server logs and the execution table. Inspect Cron job status without selecting decrypted Vault values or exposing approval snapshots. A pending Calendar reservation prevents overlapping bookings while external effects may still exist.

For **Needs review**, compare the exact stored Calendar event ID, attendee, time, approved details and Meeting row. If an owner email outcome is uncertain, check the provider using the saved idempotency key. Resend retry uses the original payload for 24 hours. After that window, reconcile with the provider before any manual resend. An owner email failure does not cancel the booked meeting.

To clean up a rehearsal, confirm the exact test event, cancel it in the controlled Calendar and verify the provider outcome before removing test data. Never release an uncertain hold or report cancellation based only on a timeout. To pause scheduled recovery, unschedule `workflow-recovery` in that environment and disable legacy pickup.
