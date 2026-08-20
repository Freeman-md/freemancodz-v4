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

Every OpenAI iteration combines the portfolio assistant's global instructions and `search_website` tool with the current workflow context. With no active instance, that context can expose `start_workflow`. With an active instance, it exposes `cancel_workflow` and only the definition tools available at the current state. A start tool result is therefore followed immediately by another model iteration using the selected workflow's surface.

The browser request carries only:

```json
{
  "message": "...",
  "previousResponseId": "resp_... or null",
  "workflowInstanceId": "UUID or null"
}
```

The stream returns only safe instance metadata: ID, workflow ID, version, and lifecycle status. It never returns workflow state. The client keeps the active opaque ID in memory and clears it when completed or cancelled metadata arrives. There is no public workflow-instance read or write endpoint.

## Meeting booking version 1

The meeting definition uses the Meeting module's public service interface for London-time availability, final slot rechecking, Calendar creation, Meeting persistence, and partial-failure reconciliation. It owns all attendee fields, booking state, meeting prompts, and meeting tools.

Preparation exposes a confirmation tool but not the booking tool. The server records a private, request-local interaction marker with the preparation and rejects confirmation in that same visitor request; a later visitor message can explicitly confirm and then expose booking. A successful booking completes the instance. If Calendar creation succeeds before database persistence fails, private recovery state remains on the active instance so a retry reconciles the existing event instead of knowingly creating another one. Provider payloads, event identifiers, and Calendar URLs remain server-only.

## Adding a real future workflow

Add a definition only after its workflow is proven and required:

1. define a strict Zod state schema and infer its state type;
2. implement one positive integer version with its own instructions, tools, and semantic execution;
3. inject only the capability service interfaces that execution needs;
4. register the new definition in `src/server/composition/workflow.composition.ts`, retaining executable older versions; and
5. add focused registry, lifecycle, definition, adapter, and database regression coverage.

A new workflow does not require a definition table, generic lead model, condition language, or a second workflow service.

## Database and operations

Prisma migrations are the only migration source of truth. `workflow_instances` uses UUID identifiers and constrained JSON-object state. Row Level Security is enabled, table privileges are revoked from `PUBLIC`, `anon`, and `authenticated`, and there are no public policies. Only the trusted server database connection can access this internal state.

Run the focused suite against a disposable non-production PostgreSQL server:

```bash
PORTFOLIO_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54332/postgres npm run test:workflow
```

The suite creates and drops a random database, applies the complete historical migration chain, proves representative data survives the forward migration, verifies constraints and access controls, and exercises repository lifecycle persistence.

Current limitations are intentional: conversation transcripts are not persisted, the browser does not restore a workflow after refresh, and there are no additional workflows, analytics events, admin workflow UI, additional channel adapters, or generative UI contracts.
