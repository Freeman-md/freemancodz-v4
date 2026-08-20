# Milestone 18: Database-Backed Workflow Foundation

**Status:** Frozen
**Version:** 1.0.0
**Last Updated:** 2026-08-20
**Depends On:** Milestone 17
**Target Pull Request:** —
**Target Branch:** `feat/milestone-18-workflow-foundation`
**Superseded By:** —

## Goal

Replace the assistant's meeting-shaped, browser-carried workflow state with one small, generic, database-backed workflow foundation.

At completion:

1. executable workflow definitions are code-defined and versioned;
2. workflow instances and their private state are stored durably in PostgreSQL;
3. one `WorkflowService` owns generic lifecycle and tool orchestration without knowing workflow-specific fields;
4. the assistant receives only global tools plus the tools exposed by the active workflow on each model iteration;
5. the web adapter carries only an opaque workflow-instance ID and safe public metadata, never workflow state;
6. the current meeting-booking behaviour runs through the new foundation without making meeting concepts part of the generic model; and
7. the old encrypted workflow token, meeting-specific generic service and duplicate paths are removed.

This milestone builds the foundation only. It does not design or implement the Audit, Project, Hiring, Role, Collaboration or General Contact workflows.

---

## Dependency state and start gate

Milestone 17 PR [#19](https://github.com/Freeman-md/freemancodz-v4/pull/19) was merged into `main` on 2026-08-20.

Before implementation begins, the orchestrator must:

- verify PR #19 remains merged and its merge commit is present on the latest remote default branch;
- archive the Milestone 17 contract if its status is still stale after merge;
- confirm no earlier milestone pull request remains open or unmerged;
- fetch and prune the remote and complete required post-merge branch cleanup;
- confirm this is the only relevant `Active` milestone;
- freeze this contract before implementation changes begin; and
- create exactly one implementation branch from the exact latest remote default-branch head.

Do not reuse an earlier milestone branch, implement from a documentation branch, or create duplicate pull requests.

---

## Source of truth

Read and enforce, in order:

1. `AGENTS.md`;
2. `.agents/skills/nextjs-architecture/SKILL.md`;
3. `.agents/skills/supabase/SKILL.md`;
4. `.agents/skills/supabase-postgres-best-practices/SKILL.md` and the relevant schema, security, query and locking rules;
5. `.ai/README.md`, `.ai/prompts/**` and `.ai/workflow/**`;
6. this milestone contract;
7. the final merged Milestone 17 implementation; and
8. current repository, installed-package and bundled-framework evidence.

Prisma migrations remain the only schema migration source of truth. Workflow definitions are executable application code, not database-authored configuration.

---

## Verified starting point

The implementation begins from these repository facts, which must be rechecked on the final branch head:

- `AssistantService` currently receives `IMeetingService` and a meeting-shaped `IWorkflowService` directly;
- every OpenAI iteration currently receives one static tool list containing website-search and meeting tools;
- the current generic `WorkflowState` is actually meeting state containing attendee details, available slots, selection, confirmation and pending booking recovery;
- workflow state is encrypted into `workflowToken`, returned through a `meeting_workflow` stream event and held in browser memory;
- `MEETING_WORKFLOW_SECRET` exists only to protect that browser-carried state;
- the assistant prompt owns meeting-specific orchestration instructions;
- the separate Meeting module already owns Google Calendar availability, booking, persistence and reconciliation capabilities;
- PostgreSQL contains persisted `Meeting` records but no generic workflow-instance entity; and
- existing assistant, client, meeting and route tests cover important current behaviour and must be migrated rather than discarded.

Do not preserve the misleading meeting-specific generic architecture as a compatibility layer.

---

## Approved architecture

These decisions are fixed for Milestone 18. A genuine contradiction found in the merged code must be escalated rather than answered with a larger workflow engine.

### A. Workflow Definition

A `WorkflowDefinition<State>` represents one executable version of one workflow in application code.

Its required conceptual surface is:

```ts
interface WorkflowDefinition<State> {
  id: string;
  version: number;
  description: string;

  stateSchema: ZodType<State>;

  createInitialState(context: WorkflowStartContext): State;

  getInstructions(state: State): string;

  getTools(state: State): OpenAIResponseTool[];

  executeTool(
    name: string,
    rawArguments: string,
    state: State,
  ): Promise<WorkflowExecutionResult<State>>;
}
```

Exact supporting type names may follow repository conventions, but the semantics are required:

- `stateSchema` is the runtime source of truth for that definition's state;
- state must be JSON-compatible structured data and must not contain functions, classes or browser/UI objects;
- `createInitialState` creates valid state for a new instance;
- `getInstructions` and `getTools` derive the active model surface from validated state;
- `executeTool` may use constructor-injected capability service interfaces and returns semantic output plus the next state;
- a result may request lifecycle continuation or completion, but the definition does not persist its own instance;
- definitions return semantic data, never React, HTML, channel-specific markup or Generative UI components; and
- definitions must remain strongly typed without `any`, unsafe JSON casts or duplicated hand-written types when Zod is the source of truth.

A workflow definition is not a Prisma model, repository record, prompt-only object, JSON DSL or database-authored graph.

### B. Workflow Definition Registry

Create one immutable, code-level `WorkflowDefinitionRegistry` responsible only for definition discovery and version resolution.

It must support the equivalent of:

```ts
registry.get(workflowId, version);
registry.getLatest(workflowId);
registry.listRoutable();
```

Required behaviour:

- an exact `(workflowId, version)` resolves existing instances;
- `getLatest(workflowId)` selects the version used for a new instance;
- `listRoutable()` exposes only the latest startable version of each workflow ID;
- duplicate IDs and versions are rejected during composition or construction;
- versions are positive integers;
- publishing a newer definition does not mutate or auto-upgrade an older instance; and
- older definition versions must remain registered while persisted active instances may still reference them.

The registry is not a repository and does not perform persistence. Do not add a `WorkflowDefinition` database table or `WorkflowDefinitionRepository`.

### C. Workflow Instance

Add one persistent `WorkflowInstance` entity representing one visitor's execution of one exact workflow version.

Required logical fields:

```text
id                random UUID primary key
workflow_id       stable definition ID
workflow_version  positive integer copied at start
status            active | completed | cancelled
state             JSONB private workflow state
origin_channel    non-empty channel identifier
origin_page       nullable page/path
origin_entry      nullable CTA or entry-point identifier
started_at        timestamptz
completed_at      nullable timestamptz
updated_at        timestamptz
```

Required invariants:

- creation always begins as `active`;
- only `active → completed` and `active → cancelled` terminal transitions are valid;
- terminal instances cannot execute further workflow tools or return to active;
- `completed_at` is set only on completion;
- `workflow_version` is never silently changed;
- `state` is a JSON object and is validated by the exact definition schema whenever loaded and before persistence; and
- there is no `idle` instance: absence of an instance means no workflow is active.

Use one forward Prisma migration. Do not edit, squash or replace historical migrations.

Because the table is internal workflow state in Supabase's exposed `public` schema:

- enable Row Level Security;
- revoke table access from `public`, `anon` and `authenticated`;
- add no public policies or Data API surface; and
- retain only the access required by the server-side Prisma role.

Do not persist assistant transcripts, global conversation history, prompts, rendered responses or arbitrary provider payloads except private workflow state genuinely required by an existing workflow's recovery behaviour.

### D. Workflow Instance Repository

Create one class-based `WorkflowInstanceRepository` implementing a matching interface.

Its responsibility is persistence only. Its minimum behavioural surface is equivalent to:

```ts
create(input): Promise<WorkflowInstance>;
findById(id): Promise<WorkflowInstance | null>;
save(input): Promise<WorkflowInstance>;
```

Exact method names may be tightened after inspecting repository conventions.

The repository must:

- map Prisma records into workflow-module models;
- perform no definition resolution, prompting, tool selection or workflow-specific decisions;
- avoid exposing Prisma-generated models across the module boundary;
- prevent updates to terminal instances; and
- surface normalized persistence failures to the service without exposing raw Prisma or PostgreSQL errors to clients.

Do not create generic/base repositories or a repository per workflow definition.

### E. Workflow Service

Replace the current meeting-shaped service with one genuinely generic `WorkflowService` implementing `IWorkflowService`.

Its required conceptual surface is:

```ts
interface IWorkflowService {
  start(
    workflowId: string,
    context: WorkflowStartContext,
  ): Promise<WorkflowInstance>;

  getAssistantContext(
    instanceId: string | null,
  ): Promise<WorkflowAssistantContext>;

  executeTool(
    instanceId: string | null,
    toolCall: ToolCall,
  ): Promise<WorkflowToolExecutionResult>;

  cancel(instanceId: string): Promise<WorkflowInstance>;
}
```

The service owns generic lifecycle and orchestration:

```text
load optional instance
→ resolve exact definition version
→ validate stored state
→ derive currently exposed instructions and tools
→ reject unavailable or stale tool names
→ execute the definition or generic workflow-control tool
→ validate returned state
→ persist state and lifecycle
→ return safe semantic output and public instance metadata
```

Required behaviour:

- when no workflow is active, the workflow context may expose one generic `start_workflow` control tool based on `listRoutable()`;
- when a workflow is active, only generic cancellation plus that definition's currently exposed tools are available;
- starting another workflow while one is active is rejected rather than creating nested or parallel workflows;
- `start_workflow` uses the latest registered version and persists that exact version on the new instance;
- an existing instance always resolves its stored exact version;
- `cancel_workflow` performs the same lifecycle operation as the public `cancel` method;
- the service verifies a requested workflow tool is currently present in `getTools(state)` before execution;
- global assistant tool names, workflow-control tool names and active workflow tool names cannot collide;
- invalid IDs, missing definitions, invalid persisted state, illegal lifecycle transitions and unexpected failures fail safely without leaking state or internals; and
- the service never reads workflow-specific fields such as slots, contact data, role titles, project timelines or audit friction.

Do not create a runtime DSL, node graph, condition engine, nested-workflow framework, service locator or dependency-injection container.

### F. Assistant and web-adapter integration

`AssistantService` must depend on `IWorkflowService`, not on Meeting or any concrete workflow definition.

On every OpenAI tool-call iteration, including the iteration immediately after a workflow starts, compose the model surface from:

```ts
tools = [
  ...GLOBAL_ASSISTANT_TOOLS,
  ...workflowContext.tools,
];

instructions = combine(
  BASE_ASSISTANT_PROMPT,
  workflowContext.instructions,
);
```

This must allow one request to perform:

```text
user expresses routable intent
→ model calls start_workflow
→ WorkflowService creates the instance
→ next model iteration receives that workflow's instructions and tools
→ conversation continues without another user message
```

Keep `search_website` as a global assistant capability. Workflow definitions control only their own model-facing tools and the capabilities behind those tools.

Replace browser-carried state with an opaque instance reference:

```json
{
  "message": "...",
  "previousResponseId": "resp_... or null",
  "workflowInstanceId": "uuid or null"
}
```

Replace the meeting-specific stream event with a generic safe event equivalent to:

```json
{
  "type": "workflow_instance",
  "instance": {
    "id": "uuid",
    "workflowId": "meeting-booking",
    "workflowVersion": 1,
    "status": "active"
  }
}
```

Required transport behaviour:

- the client stores only the active instance ID and safe public metadata;
- private workflow state is never returned to the browser;
- terminal status causes later requests to carry no active instance ID;
- request and stream data remain runtime-validated in `src/contracts`;
- invalid or unknown instance IDs receive a safe generic response;
- workflow instance IDs are random UUIDs and no direct public read/write endpoint is added; and
- no UI component becomes part of a workflow definition.

The web client may continue holding the instance ID in memory for this milestone. Session restoration, conversation persistence and cross-page conversation UX are deferred.

---

## Existing meeting behaviour migration

Move the current meeting-booking orchestration behind one code-defined workflow definition, using a stable ID such as `meeting-booking` and version `1`.

This is a migration of existing behaviour, not the design of a new commercial workflow.

The definition must depend on `IMeetingService` through the Meeting module's `public.ts` API and preserve:

- genuine calendar availability lookup;
- Europe/London timezone behaviour;
- collection of name, email, reason and one returned slot;
- preparation of a complete booking summary;
- explicit user confirmation before a real booking;
- a final slot-availability recheck;
- Meeting persistence and Google Calendar creation;
- existing partial provider/persistence reconciliation behaviour;
- safe retry/recovery messages; and
- generic client-facing errors with contextual safe backend logs.

Meeting-specific state, schemas, prompts and tools belong to this definition or the Meeting capability, never the generic `WorkflowService`.

After successful booking, the workflow instance becomes `completed`. Cancellation makes it `cancelled` without deleting its durable record.

The base assistant prompt must no longer hardcode meeting-specific instructions. Those instructions belong to the meeting definition.

No Audit-specific meeting extension is designed in this milestone.

---

## Failure, security and versioning rules

- Treat database JSON state as untrusted whenever it is loaded.
- Validate initial state, loaded state and returned next state with the exact definition schema.
- Do not fall back to the latest definition when the stored version is missing.
- Do not persist a new state or terminal status after an unexpected definition/capability failure.
- Expected workflow-level failures may return semantic error output and a deliberately unchanged or recoverable state.
- Never log or stream full workflow state, attendee details, raw provider responses, credentials or stack traces.
- Safe logs may include instance ID, workflow ID, version, status, tool name and normalized error category.
- External side-effect idempotency and reconciliation remain owned by the capability/definition that performs them; do not add a generic saga or transaction engine.
- The current web adapter continues to allow one in-flight assistant request at a time. Generic multi-adapter concurrency leases are out of scope.
- Existing pre-deployment browser-only workflow tokens do not require migration. An in-progress meeting flow may need to restart after deployment.

---

## Remove the obsolete workflow architecture

Remove or replace the behaviours represented by:

- the current meeting-shaped `WorkflowState` generic type;
- the current meeting-shaped `IWorkflowService` and `WorkflowService` implementation;
- AES token encode/decode and workflow signing-secret configuration;
- `workflowToken` request/client state;
- the `meeting_workflow` stream event;
- the global meeting tools and meeting-specific branches in the assistant tool executor;
- meeting-specific instructions in the base assistant prompt; and
- tests whose only purpose is to preserve the retired token architecture.

Remove active code and documentation references to:

```text
MEETING_WORKFLOW_SECRET
getWorkflowSecret
workflowToken
meeting_workflow
```

Keep:

- the Meeting module and its public service interface;
- Meeting persistence and Google Calendar provider behaviour;
- `previousResponseId` conversation continuity;
- website retrieval and source streaming;
- existing assistant rate limits and safe stream errors; and
- current public portfolio behaviour outside the workflow transport change.

Do not leave two canonical workflow services, duplicate state models, compatibility wrappers or stale exports after the migration.

---

## Implementation order

### Phase 0 — Preflight

- verify dependency, branch, pull-request and contract state;
- freeze this contract;
- inspect current Next.js, Prisma and PostgreSQL behaviour and relevant bundled documentation;
- inventory the old workflow/token paths and current meeting tests; and
- confirm the final module boundaries against the architecture skill.

### Phase 1 — Persistent instance foundation

- add the forward migration and Prisma model;
- add workflow-instance models, mapping, repository and focused disposable-database tests; and
- verify constraints, RLS, grants and terminal-update protection before proceeding.

### Phase 2 — Definition, registry and service

- implement the code-defined contract and registry;
- implement the generic service lifecycle, state validation and tool allowlisting; and
- prove exact-version resolution and terminal behaviour with focused fakes.

### Phase 3 — Assistant and meeting migration

- make assistant context dynamic on every model iteration;
- migrate existing meeting behaviour into the first definition;
- replace request/stream/client token transport with instance IDs; and
- remove assistant-to-Meeting coupling and meeting instructions from the base prompt.

### Phase 4 — Cleanup and verification

- delete obsolete token/state/tool paths and environment configuration;
- update active documentation and tests;
- run focused database, assistant, Meeting and repository-wide validation; and
- inspect the final diff for scope, security, stale paths and architecture compliance.

Do not begin a later phase while the prior phase has a known schema, lifecycle or regression failure.

---

## Focused test requirements

Tests must verify public behaviour and important boundaries rather than private file layout.

### Definition and registry

Prove that:

- initial state validates against its definition schema;
- duplicate definition ID/version pairs are rejected;
- latest-version selection is deterministic;
- existing instances resolve their exact stored version;
- adding a newer version does not auto-upgrade an older instance; and
- invalid definition output is rejected before persistence.

### Workflow service

Prove that:

- starting creates one active instance with the latest version and supplied origin;
- an active instance cannot start a nested or replacement workflow;
- only currently exposed workflow tools can execute;
- a tool removed after a state transition cannot be replayed as a stale tool;
- unknown instance IDs, missing versions and corrupt state fail safely;
- completion and cancellation are terminal and persisted;
- terminal instances reject further execution; and
- workflow-specific fields never appear in generic service models or decisions.

### Database and security

Use a disposable PostgreSQL database to prove that:

- the complete historical Prisma migration chain applies cleanly from empty state;
- the forward migration preserves existing portfolio, Meeting, search-index and unrelated data;
- workflow-instance status, version and JSON-object constraints reject invalid values;
- RLS is enabled and table access is revoked from `public`, `anon` and `authenticated`;
- repository create/read/save behaviour persists JSON state and lifecycle correctly; and
- terminal records cannot be mutated through the repository path.

Migration-text assertions alone are not sufficient evidence for RLS, grants or executed database behaviour.

### Assistant and adapter

Prove that:

- ordinary portfolio Q&A still streams with global tools and sources;
- no active workflow exposes only the approved global and generic start surface;
- `start_workflow` changes the next OpenAI iteration's instructions and tools within the same request;
- an active workflow exposes only global, cancellation and definition-specific tools;
- workflow tool output is returned to the next model iteration;
- workflow state is absent from request responses, stream events and client models;
- the browser sends and updates only `workflowInstanceId`;
- terminal workflow metadata clears the active client reference; and
- invalid request and provider failures retain safe existing responses.

### Meeting regression

Migrate and retain focused coverage proving:

- availability boundaries and London-time presentation remain correct;
- booking cannot occur before complete preparation and explicit confirmation;
- unavailable slots force a new availability check;
- successful booking persists the Meeting and completes the workflow instance;
- calendar-created/database-failed recovery still reconciles without knowingly creating a duplicate; and
- raw provider payloads and event URLs are not exposed in assistant output.

Tests using fakes prove orchestration only. They must not be reported as a live Google Calendar verification.

---

## Documentation requirements

Update active documentation and `.env.example` so they describe only the final foundation:

- code-defined, versioned workflow definitions;
- durable PostgreSQL workflow instances;
- exact-version execution and no automatic state migration;
- the difference between the definition registry and instance repository;
- the generic `WorkflowService` lifecycle;
- dynamic workflow-specific tools and instructions;
- opaque instance-ID transport and private server-side state;
- the migrated meeting-booking definition;
- how a future workflow is added without creating a definition table or DSL;
- the accepted absence of Conversation persistence, analytics, GenUI and additional workflows; and
- removal of `MEETING_WORKFLOW_SECRET`.

Use `README.md` and one focused workflow document if needed. Do not make historical milestone contracts the only operational documentation.

---

## Explicitly out of scope

Milestone 18 does not include:

- Audit Workflow v1 or any Audit state, qualification or submission model;
- Project, Hiring, Role, Collaboration, General Contact, promotion or offer workflows;
- a `WorkflowDefinition` database model or repository;
- database-authored workflow configuration;
- a visual workflow builder, graph, node engine, condition DSL or JSON interpreter;
- multiple simultaneous, nested or child workflows;
- workflow state auto-migration between definition versions;
- a Conversation model, transcript persistence or cross-channel identity resolution;
- Telegram, WhatsApp, Slack, voice or another channel adapter;
- analytics/event persistence, funnel reporting or admin conversion dashboards;
- workflow administration UI or generic business-record/lead models;
- Generative UI, React component descriptors or presentation-specific workflow state;
- session restoration across browser refreshes;
- generic concurrency leases, job queues, sagas or event buses;
- redesign of portfolio content, search indexing, admin, auth, storage or deployment; or
- unrelated cleanup.

Do not add infrastructure for future workflows until a real workflow requires it.

---

## Required validation

Run focused checks first, then the full repository gates. Final implementation and review evidence must report exact commands and outcomes for:

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run test:workflow
npm run test:portfolio:database
npm run test:search-index
npm run build
git diff --check
```

Database-backed commands must be run with the repository's documented disposable PostgreSQL configuration. If an aggregate script intentionally skips a database suite without the required URL, run that suite separately and report it honestly.

Also verify:

- the full migration history from an empty disposable database;
- the forward migration over representative populated data;
- no generated validation artefact or environment file is committed;
- no old workflow token, stream event, secret, service or global meeting-tool path remains;
- the final worktree and pull-request head are exact and clean; and
- the architecture completion format required by the Next.js architecture skill is included.

A production database or real Calendar must not be mutated during automated implementation or review.

---

## Agent-verifiable acceptance criteria

Checklist boxes remain unchecked. The independent reviewer records `PASS`, `FAIL` or `NOT VERIFIED` with evidence for each criterion.

### Workflow and scope

- [ ] Milestone 17 merge/archive and branch cleanup were verified before Milestone 18 implementation began.
- [ ] This contract was frozen before implementation changes began.
- [ ] Exactly one Milestone 18 implementation branch and pull request are used; the agent does not merge it.
- [ ] Final changes remain within the workflow foundation and required migration, meeting migration, tests and documentation.
- [ ] No Audit or other future conversion workflow was designed or implemented.

### Definition and versioning

- [ ] Workflow definitions are executable, schema-driven application code rather than database records or a DSL.
- [ ] The definition registry resolves exact versions, selects the latest version for new starts and rejects duplicates.
- [ ] Persisted instances retain their original definition version and are never silently upgraded.
- [ ] Older registered versions remain executable for instances that reference them.
- [ ] Definition state, instructions, tools and execution remain workflow-owned and strongly typed.

### Instance persistence and security

- [ ] A forward Prisma migration adds the constrained database-backed workflow-instance entity without changing historical migrations.
- [ ] New instances are active, use random UUIDs and persist workflow ID, exact version, private JSON state and origin.
- [ ] Only active-to-completed and active-to-cancelled terminal transitions are allowed.
- [ ] Loaded and returned state is validated with the exact definition schema.
- [ ] Workflow state is never exposed through a public table, route, stream event, client model or log.
- [ ] RLS is enabled and `public`, `anon` and `authenticated` cannot access the workflow-instance table.
- [ ] The repository owns persistence only and prevents terminal-instance mutation.

### Service and tool boundaries

- [ ] The generic `WorkflowService` coordinates registry and repository without containing meeting or future-workflow fields.
- [ ] The service exposes only generic start, context, execution and cancellation behaviour needed by the assistant and future adapters.
- [ ] Starting while active is rejected; nested and parallel workflows were not added.
- [ ] Only tools currently returned by the active definition may execute.
- [ ] Unknown tools, missing definitions, invalid state and illegal transitions fail safely without persistence corruption or data leakage.
- [ ] Global, workflow-control and definition tool names cannot collide.
- [ ] Semantic workflow output contains no React, HTML or channel-specific presentation contract.

### Assistant and transport

- [ ] `AssistantService` no longer imports or receives Meeting or a concrete workflow definition.
- [ ] Every model iteration composes global tools/instructions with the current workflow context.
- [ ] A workflow can start and expose its tools on the next OpenAI iteration within the same request.
- [ ] Website search remains globally available without exposing unrelated backend capabilities.
- [ ] The public request uses nullable `workflowInstanceId`; `workflowToken` is removed.
- [ ] The generic stream event exposes only safe instance metadata and never workflow state.
- [ ] The web client stores/sends only the active instance ID and clears it after a terminal result.
- [ ] Existing Q&A, source streaming, response continuity, rate limits and safe error behaviour remain compatible.

### Meeting migration

- [ ] Existing meeting orchestration is implemented as one versioned workflow definition using `IMeetingService` through its public module surface.
- [ ] Meeting fields, schemas, tools and instructions no longer shape the generic service or base assistant prompt.
- [ ] Availability, preparation, explicit confirmation, slot recheck, booking, persistence and recovery behaviour remain covered and compatible.
- [ ] Successful booking completes the workflow instance and cancellation terminates it without deleting history.
- [ ] Raw Calendar payloads and event URLs remain server-only.

### Removal, tests and documentation

- [ ] The old encrypted token service/state/schema and meeting-specific generic paths are removed without wrappers or duplicate exports.
- [ ] `MEETING_WORKFLOW_SECRET`, `getWorkflowSecret`, `workflowToken` and `meeting_workflow` have no active code or documentation references.
- [ ] Focused definition, registry, service, database, assistant, client and meeting tests cover the required behaviour.
- [ ] Executed PostgreSQL tests prove migration, constraints, RLS, grants and repository lifecycle behaviour.
- [ ] Existing assistant, Meeting, portfolio and search-index suites pass without weakened assertions.
- [ ] Active documentation explains the final foundation, its extension path and current limitations.
- [ ] Repository-standard validation and production build pass, or a genuine external-only limitation is recorded precisely.
- [ ] Final architecture validation finds no stale, debug, generated or unrelated changes.

---

## Manual tasks

These checks require Freeman's local or production credentials and remain pending at `ready_for_human`.

### Local live verification

1. Apply the documented Prisma migrations to the intended local database.
2. Start the application with real OpenAI and Google Calendar credentials.
3. Ask the assistant to book a meeting and confirm a `WorkflowInstance` is created as `active`.
4. Complete availability, preparation and explicit confirmation.
5. Confirm one real Calendar event and one Meeting record are created and the workflow instance becomes `completed`.
6. Inspect the browser network stream and confirm private workflow state is absent.
7. Cancel a separate test workflow and confirm its durable instance becomes `cancelled`.
8. Remove `MEETING_WORKFLOW_SECRET` locally and confirm the final application no longer requires it.

### Controlled production rollout

1. Apply the forward Prisma migration before enabling the deployed workflow-foundation code.
2. Deploy the reviewed application with existing OpenAI, database and Calendar configuration.
3. Exercise one safe production meeting booking end to end.
4. Confirm the instance, Meeting record and Calendar event settle correctly without duplicate creation.
5. Inspect runtime logs for useful safe workflow identifiers and no state, attendee data, payloads or stack traces.
6. Remove the obsolete `MEETING_WORKFLOW_SECRET` deployment variable after the new release is confirmed healthy.

Do not run production migrations, bookings or environment changes automatically during implementation or review.

---

## Manual acceptance criteria

- [ ] A real web conversation creates and advances a durable workflow instance using only its opaque ID in the browser.
- [ ] A real meeting booking still requires explicit confirmation and creates exactly one Calendar event and Meeting record.
- [ ] Successful booking completes the persisted workflow instance; cancellation leaves a durable cancelled instance.
- [ ] Browser requests and stream responses contain no private workflow state.
- [ ] Production logs contain useful workflow lifecycle context without personal data, raw provider payloads or secrets.
- [ ] The application runs correctly after `MEETING_WORKFLOW_SECRET` is removed.

---

## Completion / `ready_for_human` report

The final handoff must include:

- pull request number/link and reviewed head SHA;
- the final definition/registry/instance/repository/service architecture in plain English;
- the exact database model and security result;
- the final assistant request and stream contract;
- confirmation that current meeting behaviour was migrated and tested;
- exact validation and disposable-database outcomes;
- removed token/secret paths;
- live Calendar and production checks reported honestly as verified or pending;
- the manual rollout and verification steps; and
- real remaining limitations, especially no Conversation persistence, additional workflows, analytics, channels or GenUI.

Do not require Freeman to reconstruct the foundation from private agent notes, commit messages or review threads.
