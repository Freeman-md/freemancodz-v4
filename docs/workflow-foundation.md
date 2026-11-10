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

Every normal OpenAI iteration combines the portfolio assistant's global instructions and the `ask_user_choice` tool with the current workflow context. With no active instance, that context can expose `start_workflow`. With an active instance, it exposes `cancel_workflow` and the definition tools available at the current state. It exposes `switch_workflow` only when another workflow is available. A start tool result is therefore followed immediately by another model iteration using the selected workflow's surface.

An ordinary browser request carries:

```json
{
  "message": "...",
  "previousResponseId": "resp_... or null",
  "workflowInstanceId": "session-bound reference or null"
}
```

The stream returns safe workflow metadata, including its revision and read-only progress. Private state stays on the server. The session-bound reference survives refresh and terminal booking outcomes. The chat route verifies it against the anonymous HttpOnly session cookie before looking up an instance.

Use `confirm_workflow` with the reference, action key and exact reviewed revision. Use `retry_workflow` with the reference to resume an eligible execution. Use `workflow_status` with the reference to restore saved status without a model call. All three are strict actions on `POST /api/chat`.

### Conversational choices

The global `ask_user_choice` tool accepts a model-written question and two to six distinct reply strings. It has no workflow dependency. Once requested, remaining tool calls receive skipped acknowledgements. A single tools-disabled model continuation completes before the browser receives the choice and its response checkpoint.

The picker temporarily replaces the composer. Selecting and sending an option submits its exact text through the ordinary chat request; “Write my own reply” restores text entry without sending anything. Choices are memory-only, never stored on a workflow, and disappear on refresh. The normal workflow tools still validate details and switch atomically. Neither a choice nor typed confirmation can authorise meeting booking; the saved summary's Confirm booking button is required. Read-only progress is unchanged.

## Meeting booking

`update_meeting_context` saves name, email, reason and a selection from returned availability incrementally. A correction invalidates the prior review while preserving the other saved fields. Confirming freezes the reviewed input, saves a pending Meeting reservation under the slot lock, and queues a durable execution. The Calendar and owner email steps advance independently. Only a confirmed Calendar event and matching Meeting row produce a booked status.

New workflows use version 2. Saved version 1 reviews remain available, and approved version 1 operations may be picked up after earlier writers are drained. See [Workflow recovery operations](workflow-recovery.md) for the scheduler, diagnostics and reconciliation procedure.
