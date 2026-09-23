# Milestone 19: Audit Workflow

**Status:** Frozen
**Version:** 1.0.0
**Last Updated:** 2026-08-20
**Depends On:** Milestone 18 and Milestone 18 Amendment 1
**Target Pull Request:** —
**Target Branch:** `feat/milestone-19-audit-workflow`
**Superseded By:** —

## Goal

Turn the Free Customer Journey & Workflow Audit CTA into the first real conversion workflow.

At completion, a visitor can enter the Audit workflow, explain one customer journey or operational workflow naturally, confirm the assistant's summary, create one durable `AuditRequest`, and optionally continue into the existing Meeting Booking workflow.

Success means an `AuditRequest` exists. A useful conversation without a submitted request is not a completed conversion.

---

## Start gate

Milestone 18 PR [#20](https://github.com/Freeman-md/freemancodz-v4/pull/20) is merged.

Before implementation begins, the orchestrator must:

- verify PR #20 remains merged and its merge commit is on the latest remote default branch;
- archive the Milestone 18 parent and amendment contracts if their statuses are still stale;
- complete required post-merge branch cleanup;
- confirm this is the only relevant `Active` milestone;
- freeze this contract; and
- create exactly one Milestone 19 branch from the latest remote default-branch head.

Do not reuse the Milestone 18 branch or create a duplicate pull request.

---

## Source of truth

Read and enforce:

1. `AGENTS.md`;
2. `.agents/skills/nextjs-architecture/SKILL.md`;
3. `.agents/skills/supabase/SKILL.md`;
4. `.agents/skills/supabase-postgres-best-practices/SKILL.md` where relevant;
5. `.ai/README.md`, `.ai/prompts/**` and `.ai/workflow/**`;
6. this contract; and
7. the final merged Milestone 18 implementation.

The minimal-code rule is binding. Reuse existing workflow, assistant, admin, Prisma and Meeting infrastructure. Do not add generic machinery for future workflows.

---

## Workflow behaviour

### Identity and entry

Use:

```text
workflow ID: audit
version: 1
```

The workflow starts through either:

- a direct Audit CTA, which must start `audit` deterministically and record the web page and CTA entry point; or
- clear conversational intent, using the existing `start_workflow` path.

The assistant may suggest the Audit when relevant, but must not silently start it for an ambiguous question. Hiring, project, role or collaboration intent must not be forced into Audit.

Extend the existing assistant trigger/request path only as much as required for deterministic CTA start. Do not add a separate workflow-start endpoint.

### State

Keep the Audit state limited to:

```text
focus
currentProcess
friction
desiredOutcome
name
email
businessName?
websiteUrl?
additionalContext?
preparedInteractionId?
```

Required before submission:

- `focus`: the one journey or workflow to review;
- `currentProcess`: what happens now;
- `friction`: the main problem;
- `desiredOutcome`: what better should look like;
- `name`; and
- `email`.

`businessName`, `websiteUrl` and `additionalContext` are optional.

Do not add a persisted stage enum, lead score, transcript, conversation history, meeting state, analytics state or submission ID. Derive the next conversational action from the validated state.

### Conversation rules

The assistant must:

- extract and save every useful field supplied in a message;
- ask only for genuinely missing required information;
- never repeat a question for information already known;
- narrow an overly broad request to one journey or workflow;
- allow corrections at any time;
- clear the prepared confirmation whenever submitted details change; and
- continue to answer unrelated portfolio questions through global website search without cancelling the Audit.

The workflow should feel conversational, not like a fixed questionnaire.

---

## Workflow tools

Expose only these three Audit tools:

```text
update_audit_context
prepare_audit_submission
submit_audit
```

### `update_audit_context`

- Accept partial validated updates for any Audit state field.
- Record multiple fields in one call when the visitor supplied them together.
- Clear `preparedInteractionId` when any submitted detail changes.
- Produce no external side effect.

### `prepare_audit_submission`

- Be available only when all required information exists.
- Store the current interaction ID as `preparedInteractionId`.
- Return a concise semantic summary of the proposed submission.
- Tell the assistant to present that summary and ask for explicit confirmation.
- Create no `AuditRequest`.

### `submit_audit`

- Require a prepared summary and explicit confirmation in a later visitor interaction.
- Reject submission in the same interaction that prepared the summary.
- Submit only the already validated workflow state.
- Create or return the single Audit request for the current workflow instance.
- Complete the workflow only after the durable request exists.

Tool declarations, implementations and helpers should be separated only where that materially improves readability. Do not create one file per trivial function.

---

## Small foundation extension

Add the current workflow-instance ID to the workflow execution context so a definition can perform an idempotent business action for that exact instance.

Do not otherwise redesign `WorkflowService`, the registry, workflow persistence, transport or lifecycle.

---

## Audit persistence

Add one private `AuditRequest` Prisma model and forward migration with the logical fields:

```text
id                  UUID primary key
workflowInstanceId  unique foreign key to WorkflowInstance
focus
currentProcess
friction
desiredOutcome
name
email
businessName        nullable
websiteUrl          nullable
additionalContext   nullable
createdAt
```

Requirements:

- `workflowInstanceId` is the idempotency boundary;
- repeated submission for one workflow instance returns the existing request rather than creating a duplicate;
- the table has RLS enabled;
- access is revoked from `public`, `anon` and `authenticated`;
- no public policy or direct Data API surface is added; and
- Prisma migrations remain the only migration source of truth.

Use Prisma-generated types directly where they represent the required record. Do not create a duplicate Audit model, mapper or DTO without a real boundary difference.

---

## Audit module

Add the smallest coherent Audit backend capability required to:

- submit an Audit request idempotently; and
- list submitted requests for the protected admin.

The Audit workflow definition may depend on the Audit service through its public interface. Persistence belongs in one Audit request repository.

Do not create:

- a generic Lead model;
- a generic submission framework;
- a generic workflow-outcome service;
- a CRM abstraction; or
- a repository/service split beyond what the current architecture actually requires.

---

## Completion and optional meeting

After successful submission:

- mark the Audit `WorkflowInstance` as `completed`;
- clearly tell the visitor that the request was submitted for Freeman's personal review and is expected within 48 hours; and
- optionally offer a short meeting.

If the visitor accepts the meeting offer in a later message, start the existing `meeting-booking` workflow. Do not copy Calendar state or Meeting tools into the Audit workflow. Do not start a meeting automatically.

---

## Admin

Add one protected `/admin/audits` surface and navigation entry.

It must let Freeman inspect:

- submission time;
- name and email;
- business name and website when present;
- focus;
- current process;
- friction;
- desired outcome; and
- additional context when present.

Keep this to one practical list/page unless a separate detail page is genuinely required for readability. Do not build a CRM, status board, assignment flow or audit editor.

---

## Failure and recovery

Required behaviour:

- invalid or incomplete data creates no request and preserves valid workflow state;
- database submission failure leaves the workflow active and retryable;
- a request created before a later workflow-instance save failure is returned on retry, not duplicated;
- changing details after preparation requires a new summary and confirmation;
- corrupted workflow state fails safely without creating an Audit request;
- cancellation creates no Audit request; and
- client-facing errors remain generic while logs contain only safe identifiers and error categories.

Do not add a background worker, retry queue, saga engine or workflow expiry system.

---

## Outputs and presentation

Return semantic workflow outputs only, such as:

```text
context_updated
audit_preparation
audit_submitted
```

The workflow must not return React, HTML or channel-specific UI. The current web assistant renders text; richer web UI and other channel adapters remain future presentation concerns.

---

## Explicitly out of scope

Milestone 19 does not include:

- generating or delivering the actual audit;
- analytics/event infrastructure;
- a generic lead or submission model;
- lead scoring or budget qualification;
- email notifications;
- attachments;
- conversation persistence;
- workflow expiry or resumption UX;
- Generative UI;
- Telegram or other channel adapters;
- a new Meeting implementation;
- project, hiring, role, collaboration or general-contact workflows; or
- unrelated workflow-foundation refactoring.

Existing WorkflowInstance origin and timestamps plus `AuditRequest.createdAt` are sufficient measurement data for now.

---

## Focused tests

Keep test additions proportionate. Cover only critical regressions:

1. one message can update several Audit fields and the assistant asks only for what remains missing;
2. preparation is unavailable until all required information is valid;
3. submission is blocked in the same interaction as preparation;
4. changing prepared details invalidates the previous confirmation;
5. confirmed submission creates exactly one `AuditRequest` and completes the workflow;
6. retry after partial persistence returns the existing request without duplication;
7. deterministic Audit CTA entry records the correct workflow and origin; and
8. cancellation creates no request.

Add the smallest real PostgreSQL coverage needed to verify the migration, private-table security and unique idempotency boundary. Do not build a broad combinatorial test suite or test private file structure.

---

## Required validation

Run and report:

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Run any focused Audit/workflow database script added by the implementation with an explicitly named disposable PostgreSQL database. Do not claim live OpenAI, Calendar or production behaviour was verified through fakes.

---

## Agent-verifiable acceptance criteria

Checklist boxes remain unchecked.

- [ ] Implementation starts from the latest remote default branch after PR #20 merge and contract archival/cleanup are verified.
- [ ] The `audit` version 1 definition is registered without redesigning the workflow foundation beyond the required instance-ID execution context.
- [ ] Direct Audit CTAs start the workflow deterministically with web page and entry-point origin metadata.
- [ ] Clear natural-language Audit intent still starts through the existing workflow-routing path.
- [ ] Audit state contains only the approved required, optional and confirmation fields.
- [ ] The assistant records multiple supplied fields, asks only for missing information and permits corrections.
- [ ] Only the three approved Audit tools are exposed, with state-dependent availability.
- [ ] Preparation requires complete data and submission requires explicit confirmation in a later interaction.
- [ ] `AuditRequest` uses the approved minimal fields, a unique WorkflowInstance foreign key, RLS and revoked public/anon/authenticated access.
- [ ] Submission is idempotent and a partial persistence failure cannot create duplicate Audit requests.
- [ ] Successful submission completes the Audit workflow and cancellation creates no request.
- [ ] The existing Meeting Booking workflow is reused only after optional post-submission acceptance.
- [ ] `/admin/audits` provides the approved protected read-only operational view without CRM features.
- [ ] Prisma-generated types are reused where sufficient and no unnecessary model/DTO/mapper/framework is introduced.
- [ ] Focused tests cover the critical conversion, confirmation, idempotency, CTA and cancellation boundaries without disproportionate test volume.
- [ ] Repository-standard validation and build pass, with any real external limitation reported honestly.
- [ ] No analytics system, audit generator, GenUI, new channel, generic lead framework or unrelated refactor is included.

---

## Manual tasks

After review, Freeman must:

1. apply the forward migration in the intended local environment;
2. open `/audit`, use a real Audit CTA and complete one natural-language submission with live OpenAI;
3. confirm exactly one `AuditRequest` exists and appears correctly under `/admin/audits`;
4. retry the completed submission path and confirm no duplicate request appears;
5. optionally accept the meeting offer and confirm the existing Meeting Booking workflow starts; and
6. perform the controlled production migration/deployment after merge.

Do not perform production migration or live submission automatically during implementation or review.

## Manual acceptance criteria

- [ ] A real visitor can complete the Audit from CTA to durable submission without leaving the assistant.
- [ ] The assistant skips already supplied questions and presents an accurate summary before submission.
- [ ] The submitted request appears once in the protected admin with the correct information.
- [ ] Optional meeting acceptance reuses the existing Meeting Booking workflow without changing the submitted Audit.
