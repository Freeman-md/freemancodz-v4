# Milestone 21: Assistant Lead Capture and Owner Notifications

**Status:** Archived
**Version:** 1.0.0
**Last Updated:** 2026-09-23
**Depends On:** Milestone 20
**Target Pull Request:** https://github.com/Freeman-md/freemancodz-v4/pull/23
**Target Branch:** `feat/milestone-21-assistant-lead-notifications`
**Merge Mode:** Manual
**Merge Method:** squash
**Superseded By:** —

## Goal

Turn the existing portfolio assistant into a clearer conversion surface without redesigning or re-architecting it: show four useful starter actions when an empty assistant opens, add one durable Leave-a-message workflow for general enquiries, and send Freeman a concise email notification after an Audit request, Meeting booking or general message has been durably recorded. Reuse the current assistant, workflow, logging, Prisma, admin and composition patterns; add no generic messaging framework, queue or email tool.

## Required behaviour

### Assistant starter actions

When the assistant is open and the current conversation has no messages, show these actions:

```text
Ask about my work
Request a free audit
Book a meeting
Leave a message
```

- Render one shared starter-action implementation in the existing assistant UI. Do not duplicate desktop and mobile action components.
- Preserve the current desktop panel and mobile bottom-sheet behaviour, composer, conversation, dismissal, expansion, scrolling and keyboard handling.
- Selecting an action submits a short natural-language opening message through the existing `submitMessage` path. Do not add a second assistant endpoint or a parallel conversation state.
- `Ask about my work` starts no workflow and lets the existing assistant answer normally.
- `Request a free audit`, `Book a meeting` and `Leave a message` start their exact workflows deterministically through the existing `workflowStart` request field.
- Hide the starter actions after the first message is submitted. They must not interrupt or replace an active conversation.
- Prevent repeated selection while a submission is in progress and retain accessible button names and keyboard operation.

Extend the runtime-validated assistant workflow-start contract as a strict discriminated union. Preserve the existing Audit CTA origins and add only the starter origins required here:

```text
audit            /  assistant-starter-audit
meeting-booking  /  assistant-starter-meeting
contact          /  assistant-starter-contact
```

Do not weaken the contract to arbitrary workflow IDs, pages or origin strings. The browser receives no server implementation types.

### Leave-a-message workflow

Add one versioned workflow definition owned by `src/modules/workflow/definitions/contact`:

```text
workflow ID: contact
version: 1
```

It handles project enquiries, collaboration enquiries and other messages that should reach Freeman but do not belong in the Audit or Meeting Booking workflows.

Keep its state limited to:

```text
name
email
message
businessName?
preparedInteractionId?
```

`name`, `email` and `message` are required. `businessName` is optional.

Expose only the three actions needed by the established prepare/confirm/submit lifecycle:

```text
update_contact_context
prepare_contact_submission
submit_contact
```

The workflow must:

- extract and save every useful contact detail supplied in a message;
- ask only for genuinely missing required details;
- allow corrections at any time;
- clear the prepared confirmation when any submitted detail changes;
- create no record when preparing a summary;
- require explicit confirmation in a later visitor interaction before submission;
- persist one `ContactRequest` for the workflow instance;
- return the existing request on a repeated submission for that workflow instance;
- complete only after the durable request exists; and
- tell the visitor that the message was sent to Freeman without claiming that an email provider delivered the owner notification.

Do not add a generic enquiry engine, form builder, lead scorer, CRM abstraction, transcript store or generic workflow-outcome layer.

### Contact persistence and protected admin view

Add one Prisma `ContactRequest` model and one forward migration with the logical fields:

```text
id                  UUID primary key
workflowInstanceId  unique foreign key to WorkflowInstance
name
email
message
businessName        nullable
createdAt
```

Requirements:

- `workflowInstanceId` is the idempotency boundary and the relation uses the same restrictive ownership semantics as `AuditRequest`.
- The unique foreign-key index is sufficient for workflow-instance lookup; do not add speculative indexes.
- The table has RLS enabled, no public policy, and privileges revoked from `PUBLIC`, `anon` and `authenticated`.
- It is not exposed as a browser data source. The trusted Prisma connection is the only application access path.
- Prisma migrations under `prisma/migrations` remain the only migration source of truth. Do not create a second migration under `supabase/migrations`.
- Use generated Prisma record types where they accurately describe persistence. Do not duplicate a Contact model or DTO without a real boundary difference.

Add the smallest cohesive Contact module needed to submit idempotently and list messages for the protected admin. Add one protected `/admin/messages` page and navigation item showing, newest first:

- submission time;
- name;
- email;
- business name when present; and
- the message.

Keep this as one practical read-only list. Do not add status management, editing, assignment, deletion, pagination or a separate detail route.

### Owner email notifications

Send Freeman one plain-text owner notification after each of these durable outcomes:

1. an `AuditRequest` is created or returned by its idempotent submission;
2. a Meeting has a Calendar event and a persisted/reconciled `Meeting` record; or
3. a `ContactRequest` is created or returned by its idempotent submission.

Use one small notification capability and one Resend-specific infrastructure client:

```text
src/modules/notification/service.ts
src/infrastructure/resend/client.ts
```

Private helper functions and the narrow injected email-sender shape should remain beside their sole owner unless a separate file has a concrete second responsibility. Do not create mechanical `interfaces`, `providers`, `models`, `templates` or `public.ts` layers.

The notification capability must provide only the three current use cases:

```text
notifyAuditSubmitted
notifyMeetingBooked
notifyContactSubmitted
```

Requirements:

- Send to the centrally configured `ADMIN_EMAIL`.
- Use a server-only `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, read through the central environment module.
- Keep configuration lazy enough that importing production composition does not fail unrelated pages before an email is attempted.
- Add only the variable names and safe placeholders/documentation to `.env.example`; never read or expose real secret files or secret values.
- Use the current official Resend Email API through focused standard `fetch` code. Do not add the Resend SDK, React Email or another production dependency for three plain-text notifications.
- Set the visitor's email as the reply-to address.
- Include only the useful persisted details in each internal email. A Meeting notification may include its internal Calendar event URL but must never include the raw provider payload.
- Derive a stable Resend idempotency key from the notification kind and persisted record ID, such as `<event-type>/<entity-id>`. Treat Resend's documented 24-hour retention as short-window duplicate protection, not permanent exactly-once delivery.
- Trigger notifications from the owning Audit, Meeting and Contact services only after the corresponding durable record exists. UI components, App Router adapters and workflow tool handlers must not send email directly.
- Preserve Google Calendar's existing attendee invitation behaviour. This milestone adds an owner summary email; it does not send a second meeting-confirmation email to the visitor.

Owner notification is deliberately a best-effort operational convenience in this milestone:

- an email-provider, network or notification-configuration failure must not roll back or report failure for an already persisted Audit, Meeting or Contact request;
- the notification service must record an intentional safe backend error containing only the notification kind, persisted record ID and a non-sensitive error category;
- raw Resend responses, visitor message content, visitor email addresses, credentials and stack traces must not be written to logs or returned to the assistant; and
- successful workflow output remains based on durable database/Calendar state, not email delivery.

Do not add an outbox, email table, retry worker, webhook receiver, background queue, scheduled job or generic event bus. Guaranteed delivery and delivery-status tracking are explicitly deferred until there is evidence that best-effort owner notifications are insufficient.

### Composition and boundaries

- Construct the Resend infrastructure client and notification service only in `src/modules/composition.ts`.
- Inject the notification capability into the existing Audit and Meeting services and the new Contact service.
- Register the Contact workflow beside Audit and Meeting in the existing workflow registry.
- Keep `src/app` as thin protected/admin or HTTP adapters; keep interactive starter actions in `src/features/assistant`; keep persistence and workflow policy in `src/modules`; keep Resend API work and environment access in `src/infrastructure`.
- Do not introduce `src/server`, per-capability composition files, a dependency-injection container, a service locator or compatibility wrappers.

## Constraints

- Work only on `feat/milestone-21-assistant-lead-notifications`, created from the latest `main` represented by this contract.
- Before implementation, read and follow `AGENTS.md`, `.agents/skills/nextjs-architecture/SKILL.md`, `.agents/skills/supabase/SKILL.md`, and the relevant Supabase Postgres guidance.
- Inspect Next.js 16.2.x bundled documentation under `node_modules/next/dist/docs` before changing a framework boundary. Keep browser interaction at the smallest existing Client Component boundary.
- Verify the current official Resend send-email and idempotency documentation before implementing the provider request shape.
- Never read `.env`, `.env.local`, `.env.production.local` or another secret-bearing file.
- Reuse the existing workflow prepare/confirm/submit semantics and existing structured logger. Do not weaken current Audit or Meeting behaviour.
- Keep provider errors private and client-facing assistant errors generic.
- Do not use module-level memory for idempotency or correctness.
- Make the smallest coherent implementation. Keep single-use helpers private and avoid new abstractions that have no present second use.
- Preserve all unrelated homepage, portfolio, admin, authentication, search-indexing and assistant presentation behaviour.

## Explicitly out of scope

- A generic `send_email` assistant tool or allowing visitors to choose arbitrary recipients.
- Visitor confirmation emails for Audit or Contact submissions.
- An extra visitor email for Meeting bookings; Google Calendar remains responsible for its existing attendee invitation.
- Guaranteed email delivery, retries, an outbox, queue, webhook handling, delivery tracking or email history.
- Marketing email, newsletters, broadcasts, mailing lists or Resend Contacts/Audiences.
- React Email templates, HTML email design or a template-management system.
- CRM features, lead scoring, message status, assignments, editing, deletion or analytics.
- Changes to the search index, portfolio content, public-page design, authentication, storage or deployment architecture.
- Production migration, Vercel deployment, production secret configuration or live production email sends by the implementing agent.
- Unrelated refactors or new dependencies.

## Required tests

Add only focused behavioural coverage that protects the new side effects and trust boundaries. Reuse and update existing tests where that is clearer than creating a new suite.

1. The Contact workflow collects validated fields, requires a prepared summary plus later explicit confirmation, invalidates preparation after corrections, and creates only one request per workflow instance.
2. Contact persistence integration coverage verifies the unique workflow-instance boundary and private table posture when the disposable PostgreSQL database is available. An unavailable disposable database may skip using the repository's existing convention and must be reported honestly.
3. Notification coverage with a small fake sender verifies the three notification kinds use `ADMIN_EMAIL`, configured sender, visitor reply-to, useful persisted content and a stable record-based idempotency key.
4. Audit, Meeting and Contact coverage proves notification is attempted only after durable persistence, while notification failure is safely logged and does not turn a successful business action into a visitor-facing failure.
5. Assistant contract coverage accepts only the approved strict workflow-start variants and rejects arbitrary workflow IDs/origins.
6. One focused browser test proves the shared empty-conversation starter actions dispatch the correct messages/workflow starts, disappear after conversation begins, and cannot be resubmitted while loading. Existing desktop and mobile assistant regression tests remain green.
7. Existing Audit prepare/confirm/idempotency behaviour, Meeting confirmation/reconciliation behaviour, Calendar attendee updates, assistant streaming and admin authorization remain covered by the current suites.

Do not add file-layout assertions, snapshots of email markup, tests of private helper functions, duplicated desktop/mobile action suites, live Resend calls, credential-dependent automated tests or tests that merely assert an implementation has a particular number of files.

Run and report:

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run test:audit
npm run test:workflow
npm run build
git diff --check
```

If integration tests skip because no disposable PostgreSQL database is available, or the build is blocked only by an unavailable external font/network resource, record the exact boundary. Do not add a workaround or claim live Resend, local Supabase or production behaviour was verified when it was not.

## Acceptance criteria

- [ ] Opening an empty assistant on desktop or mobile presents the four shared starter actions without changing the established responsive container behaviour.
- [ ] The work action uses ordinary assistant conversation, and the other three actions deterministically start only their approved workflows through the validated request contract.
- [ ] A visitor can complete a confirmed Contact workflow and create exactly one durable `ContactRequest` for its workflow instance.
- [ ] Protected admin users can inspect Contact requests at `/admin/messages`; unauthenticated access remains protected by the existing admin layout.
- [ ] Audit, Meeting and Contact durable outcomes each attempt one correctly addressed owner email with a stable record-based Resend idempotency key.
- [ ] Notification failure is observable through safe structured logging and never rolls back or misreports an already successful durable outcome.
- [ ] The implementation adds no generic email tool, new queue/worker, event bus, React Email layer, Resend SDK dependency or duplicate client/server type system.
- [ ] The Prisma migration preserves the repository's single migration source, private-table RLS posture and revoked public roles.
- [ ] Existing assistant, Audit, Meeting, admin and Calendar invitation behaviour remains intact.
- [ ] Required focused and aggregate verification passes, with environmental skips or blockers reported exactly.
- [ ] The final diff contains only this milestone's coherent implementation and no secret values or unrelated work.
- [ ] Architecture completion is reported in the exact format required by `.agents/skills/nextjs-architecture/SKILL.md`.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual tasks

1. Configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and an explicit `ADMIN_EMAIL` in the local and Vercel environments. Keep all three server-only.
2. Verify the `RESEND_FROM_EMAIL` sender/domain in Resend before expecting production delivery.
3. After merge and before exercising the production Contact workflow, apply the committed Prisma migration using the repository's existing production migration command.

## Manual acceptance criteria

- [ ] With valid local configuration, complete one Audit request, one Meeting booking and one Leave-a-message request; confirm each durable record/outcome exists and the configured admin inbox receives the corresponding owner notification.
- [ ] Confirm Reply on each owner notification targets the visitor's supplied email.
- [ ] Confirm the Contact request appears in `/admin/messages` and the Meeting attendee still receives the existing Google Calendar invitation without an additional application confirmation email.
- [ ] After production configuration and migration, repeat one safe end-to-end submission in production and confirm no secret, raw provider error or visitor content appears in Vercel logs.

## Completion Record

**Implementation Outcome:** Implemented the shared empty-assistant starter actions, strict workflow-start variants, versioned Contact workflow and private ContactRequest persistence, protected messages list, and best-effort owner notifications for durable Audit, Meeting and Contact outcomes.
**Important Decisions:** Kept starter actions inside the existing assistant conversation surface and existing submit path; used workflow-instance uniqueness for Contact idempotency; kept notification failure swallowing and safe categorised logging inside the notification capability; used the Resend Email API through standard fetch with record-based idempotency keys and lazy configuration.
**Contract Deviations:** None. The first sandboxed build attempt could not fetch Google Fonts, then the approved network-enabled build passed. Disposable PostgreSQL tests were unavailable and skipped under the repository convention.
**Verification Summary:** `npm run prisma:validate`, `npm run prisma:generate`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:audit`, `npm run test:workflow`, `npm run build`, and `git diff --check` passed. Five aggregate integration tests skipped because `PORTFOLIO_TEST_DATABASE_URL` was unavailable; this included Audit, Contact, portfolio, rate-limit, and workflow database coverage. No live Resend, local Supabase, or production behavior was verified.
**Review Outcome:** APPROVE — no actionable findings remain. The first pass found an unbounded Resend request; the implementation now applies a five-second abort boundary. A second pass found the new timeout test depended on unrelated event-loop activity; the test now owns and clears a referenced timer and passes independently. Complete review: https://github.com/Freeman-md/freemancodz-v4/pull/23#issuecomment-5802879067
**Reviewed Head:** `93127e3ea8f447d85e8cba32afd7c54b595efd34`
**Pull Request:** https://github.com/Freeman-md/freemancodz-v4/pull/23
**Merge Commit:** f60bed0b50324b151876a4fcba3a95e8f9b0a805
**Follow-up Notes:** Ready for human review and manual squash merge. GitGuardian, Vercel deployment, and Vercel Preview Comments checks passed on the reviewed head. Manual configuration, migration, inbox/reply-to, Calendar, admin, and production-log acceptance tasks remain pending.
