# Workflow foundation

The portfolio assistant runs executable workflows from versioned TypeScript definitions while keeping each visitor's workflow state private in PostgreSQL. The first definition is `meeting-booking` version 1. There is deliberately no database-authored definition table, workflow DSL, visual builder, or generic graph engine.

## Definitions and instances

A workflow definition owns its Zod state schema, initial state, model instructions, currently available tools, and tool execution. Its `(id, version)` pair is immutable. The definition registry resolves an exact version for an existing instance and the latest registered version for a new start. Publishing a newer version never upgrades stored instances automatically, so older versions must remain registered while active instances can still reference them.

The registry contains executable application code; it does not persist anything. `WorkflowInstanceRepository` has the opposite responsibility: it persists an instance's workflow ID, exact version, lifecycle, JSON state, origin, and timestamps without selecting definitions or executing tools.

`WorkflowService` coordinates those two boundaries:

1. load an optional instance and resolve its exact definition;
2. validate loaded JSON with that definition's schema;
3. expose current instructions and tools;
4. reject unavailable or stale tool calls;
5. execute the definition and validate its next state and semantic output; and
6. persist an active, completed, or cancelled lifecycle result.

Instances begin as `active`. Completion and cancellation are terminal and their durable records remain available to trusted server code. State is treated as untrusted on every database load and before every write.

## Assistant and browser boundary

Every normal OpenAI iteration combines the portfolio assistant's global instructions and the `ask_user_choice` tool with the current workflow context. With no active instance, that context can expose `start_workflow`. With an active instance, it exposes `cancel_workflow`, `switch_workflow` and only the definition tools available at the current state. A start tool result is therefore followed immediately by another model iteration using the selected workflow's surface.

An ordinary browser request carries:

```json
{
  "message": "...",
  "previousResponseId": "resp_... or null",
  "workflowInstanceId": "UUID or null"
}
```

The stream returns safe instance metadata (including its saved revision) and read-only progress: collected public values, missing required fields, and phase. Private workflow state stays on the server. Only the active opaque ID persists in sessionStorage; after refresh, the next assistant request reloads the saved workflow. Completion or cancellation clears that ID. There is no public workflow-instance read or write endpoint.

Meeting confirmation uses the same rate-limited `/api/chat` route with `{ action: "confirm_booking", workflowInstanceId, expectedRevision }`; recovery uses `{ action: "retry_booking", workflowInstanceId }`. These strict alternatives cannot include a message or editable booking details. Action responses use the same stream without a model call. The next ordinary message reloads workflow state without the previous model checkpoint.

### Conversational choices

The global `ask_user_choice` tool accepts a model-written question and two to six distinct reply strings. It has no workflow dependency. Once requested, remaining tool calls receive skipped acknowledgements. A single tools-disabled model continuation completes before the browser receives the choice and its response checkpoint.

The picker temporarily replaces the composer. Selecting and sending an option submits its exact text through the ordinary chat request; “Write my own reply” restores text entry without sending anything. Choices are memory-only, never stored on a workflow, and disappear on refresh. The normal workflow tools still validate details and switch atomically. Neither a choice nor typed confirmation can authorise meeting booking; the saved summary's Confirm booking button is required. Read-only progress is unchanged.

## Contact confirmation

Contact uses an explicit confirmation boundary: `confirm_contact` submits only the saved workflow ID and displayed revision. `retry_contact` recovers that same accepted request. Typed approval and model tools cannot submit the request. The application displays the saved progress fields in a read-only confirmation summary.

Before submission, the workflow saves `confirmedRevision` in its existing JSON state through a revision-checked write. Accepted fields are frozen against corrections, cancellation and switching. Existing states without this optional marker remain readable. Recovery uses the existing unique workflow-instance key, checks that the saved request matches the accepted fields before notification, and reconciles completion-save failures without overwriting newer state. Notifications retain their current best-effort handling and stable idempotency keys; completion does not guarantee email delivery.

Submission diagnostics reuse the logger: `workflow.submission_accepted`, `workflow.submission_completed` and `workflow.submission_recovery_required`. Recovery records the submission/completion-save stage, workflow ID, revision and safe category, never submitted personal fields or raw exceptions. No tables or migrations are added.

## Meeting booking version 1

`update_meeting_context` saves name, email, reason and a selection from returned availability incrementally. Validated batches are atomic and use the existing revision check. Corrections invalidate preparation without discarding other details; availability refreshes discard the slot, not personal details. The next post-refresh interaction reloads these saved values through the existing ID-only restoration.

Booking diagnostics reuse the existing logger: `workflow.booking_accepted`, `meeting.calendar_event_resolved` (created/existing/recovered), `meeting.booking_recovery_required`, `workflow.booking_completed`, and `workflow.booking_completion_save_failed`. Server logs correlate operation/workflow identifiers and revisions with typed categories and failure stages. They exclude personal fields, provider payloads and raw exceptions. Retry semantics and public error messages are unchanged.

The meeting definition uses the Meeting module's public service interface for London-time availability, final slot rechecking, Calendar creation, Meeting persistence, and partial-failure reconciliation. It owns all attendee fields, booking state, meeting prompts, and meeting tools.

Preparation exposes a saved summary and explicit Confirm booking button, not model-accessible confirmation or booking tools. The server checks that exact revision and current availability, then saves a UUID booking operation through a revision-checked write before any Calendar insertion. The saved details are frozen: correction, cancellation and switching cannot change an accepted booking. A preflight race lost to any of those mutations creates no event.

The operation UUID determines a single Calendar event ID. Recovery looks up that ID before checking availability, validates its active status, attendee, times and operation metadata, then finds or creates the matching Meeting row. An uncertain insert rechecks the same event ID; it never generates a replacement. Calendar calls have a 10-second timeout and no automatic retries. A matching Meeting row cannot conceal a missing, cancelled or conflicting provider event. Notifications retain their existing stable Meeting-based idempotency key.

Initial acceptance also claims the interval through `WorkflowInstanceRepository.claimMeetingBooking`. A short READ COMMITTED transaction takes the single-calendar advisory lock `hashtext('freemancodz:meeting-booking')`, then separately reads accepted meeting states and performs the existing revision-checked write. The separate read sees claims committed by the previous lock holder. Lock waiting is bounded to two seconds; the lock is released on commit or rollback, before any Calendar call.

Active and completed meeting instances with `step: "confirmed"` reserve their saved interval, including legacy confirmed/pending states. The current instance is excluded; overlapping intervals conflict while adjacent intervals do not. Malformed accepted state fails closed. A losing confirmation clears its slot, availability and preparation through a revision-checked update, preserving personal details and any newer concurrent correction. Conflicts log `workflow.booking_slot_conflict` with only workflow ID, revision and safe category.

The saved operation is the durable claim, not the transient lock. Claims never expire automatically: uncertain provider or persistence outcomes retain their interval through explicit recovery. This coordinates application bookings only; it cannot atomically prevent manual Google Calendar changes. Before eventual rollout, retire older confirmation handlers that do not participate in this protocol. No new table, migration or background worker is involved.

If saving completion fails, the service reloads and accepts an already-completed result only for the same operation. Otherwise the operation remains available for explicit Retry booking; no automatic browser retry occurs. Losing the response stream does not cancel accepted work. A process termination may still require that explicit retry.

Existing prepared instances remain usable. Legacy pending events retain their original event ID and must match the saved summary and current Calendar event before reconciliation. Legacy confirmed instances without an operation or event reference stop for manual reconciliation rather than risking a duplicate. Provider payloads, operation and event identifiers, and Calendar URLs remain server-only. This change adds no table or migration.

## Adding a real future workflow

Add a definition only after its workflow is proven and required:

1. define a strict Zod state schema and infer its state type;
2. implement one positive integer version with its own instructions, tools, and semantic execution;
3. inject only the capability behaviour that execution needs;
4. register the new definition in `src/modules/composition.ts`, retaining executable older versions; and
5. add focused registry, lifecycle, definition, adapter, and database regression coverage.

A new workflow does not require a definition table, generic lead model, condition language, or a second workflow service.

## Database and operations

Prisma migrations are the only migration source of truth. `workflow_instances` uses UUID identifiers and constrained JSON-object state. Row Level Security is enabled, table privileges are revoked from `PUBLIC`, `anon`, and `authenticated`, and there are no public policies. Only the trusted server database connection can access this internal state.

Run the focused suite against a disposable non-production PostgreSQL server:

```bash
PORTFOLIO_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54332/postgres npm test
```

The suite creates and drops a random database, applies the complete historical migration chain, proves representative data survives the forward migration, verifies constraints and access controls, and exercises repository lifecycle persistence.

Workflow writes use revision checks to reject stale concurrent updates. The cleanup migration `20261008120000_remove_workflow_pending_interaction` removes only the obsolete pending form column and its check constraint, preserving state, revisions and permissions. For production, deploy code that no longer reads or writes that column, retire all old instances, and only then apply the cleanup migration. Do not run a migration-first deployment for this cleanup.

Conversation transcripts, choices and drafts are not persisted. Generated free-text controls, structured form submissions, editable progress and preview components are not supported.
