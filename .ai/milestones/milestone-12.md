# Milestone 12: Real Meeting Booking

**Status:** Frozen
**Version:** 1.0.0  
**Last Updated:** 2026-08-03  
**Depends On:** Milestone 11  
**Target Pull Request:** —  
**Target Branch:** `feat/milestone-12-real-meeting-booking`  
**Superseded By:** —

## Goal

Replace the dummy meeting tools introduced in Milestone 11 with a real, text-based meeting-booking workflow that uses transient session state, deterministic user confirmation, configurable availability rules, Google Calendar for availability and event creation, and Prisma-backed Supabase persistence for successfully created meetings.

## Required behaviour

### End-to-end booking flow

Implement this flow without introducing a generic state-machine framework:

```text
collect available details
→ find genuine available slots
→ user selects a returned slot
→ prepare and display the complete booking summary
→ user explicitly confirms
→ recheck the slot
→ create the Google Calendar event
→ persist the completed meeting through Prisma
→ reset the transient workflow state
```

- Normal conversation and website-search behaviour from Milestone 11 must remain intact.
- Meeting details may be collected across several assistant turns.
- The assistant may infer a proposed reason for the call from the conversation, but that reason must be included in the visible confirmation summary before booking.
- The model may decide when meeting tools are useful, but application logic must enforce slot validity, required details and confirmation.
- A meeting must never be created solely because the model claims that the user confirmed it.

### Transient meeting workflow state

Keep temporary meeting workflow state only for the current browser assistant session.

- Do not persist workflow state in Supabase or another database.
- Do not introduce workflow IDs.
- Refreshing or restarting the assistant may reset the workflow.
- Do not use a module-level singleton, global mutable object or in-memory server map as the source of workflow state.
- The browser carries the current transient workflow between assistant requests.
- The server must validate all incoming workflow data before use.
- Because browser-supplied state is user-controlled, confirmation and other protected state must be tamper-evident. Use the smallest clear server-signed or server-encrypted workflow-state token so a visitor cannot manually submit `confirmed: true` or alter a selected slot without detection.
- The client may also receive a safe public representation for later display, but internal integrity data must not be exposed as editable application state.

Use the minimum workflow data required by the real transitions:

```ts
type MeetingWorkflowState = {
  name: string | null;
  email: string | null;
  timezone: string | null;
  reason: string | null;
  availableSlots: MeetingSlot[];
  availabilityCheckedAt: string | null;
  selectedSlot: MeetingSlot | null;
  confirmed: boolean;
};
```

Equivalent property names are acceptable when they follow repository conventions.

Do not add general statuses such as:

```text
collecting_details
awaiting_slot_selection
booking
booked
```

The current step should be derived from the state where practical.

- Any change to the visitor name, email, timezone, reason or selected slot must set `confirmed` to `false`.
- A new availability search must replace the previous available slots, clear the selected slot and set `confirmed` to `false`.
- A selected slot must come from the latest valid availability result.
- After a successful Google Calendar event and meeting record have both been created, reset the workflow to its initial empty state.

### Assistant workflow layer

Keep assistant-session workflow concerns inside the assistant module:

```text
src/server/modules/assistant/workflow/
├── meeting-workflow.state.ts
├── meeting-workflow.schema.ts
└── meeting-workflow.service.ts
```

Equivalent repository-compliant names are acceptable when clearer.

`MeetingWorkflowService` owns only:

- creating the initial empty state;
- validating and decoding the transient protected state;
- applying validated detail updates;
- storing the latest availability result;
- validating and recording slot selection;
- invalidating confirmation when protected details change;
- recording explicit user confirmation;
- producing the protected state returned to the browser;
- exposing a safe public state shape;
- resetting state after successful booking.

Do not turn this into a reusable workflow engine or move Google Calendar and Prisma behaviour into it.

### Deterministic confirmation

Confirmation is an application-controlled boundary.

- `prepare_meeting` must return the complete proposed booking summary and indicate that explicit confirmation is required.
- The summary must include the name, email, timezone, reason, start time and end time.
- The application must interpret a deliberately narrow set of clear confirmation or cancellation messages while a complete prepared booking exists.
- Accepted confirmation phrases may include exact, normalised forms such as:

```text
confirm
book it
yes, confirm
confirm booking
```

- Ambiguous messages must not set `confirmed` to `true`.
- Cancellation or any protected-detail change must clear confirmation.
- The model must not receive a tool argument that allows it to set confirmation directly.
- `book_meeting` must independently verify the protected workflow state and require `confirmed === true` before any external write.

### Meeting domain

Create one small meeting domain rather than separate availability and booking domains:

```text
src/server/modules/meeting/
├── interfaces/
│   ├── meeting.service.interface.ts
│   └── meeting.repository.interface.ts
├── services/
│   └── meeting.service.ts
├── repositories/
│   └── meeting.repository.ts
├── config/
│   └── meeting.config.ts
├── schemas/
├── types/
└── public.ts
```

Create only folders and files required by the final implementation. Keep local types near their owner where separate `schemas/` or `types/` folders would add no clarity.

`MeetingService` owns the meeting business rules and coordinates the calendar provider and meeting repository. It should expose focused operations equivalent to:

```ts
findAvailableSlots(input)
isSlotAvailable(slot)
bookMeeting(input)
```

Responsibilities:

- generate candidate slots from meeting configuration;
- remove past slots;
- query Google Calendar busy periods;
- remove candidate slots that overlap busy periods;
- perform the final availability recheck before booking;
- create the Google Calendar event;
- persist the completed meeting through `MeetingRepository`;
- return application-owned results rather than Google SDK or Prisma objects.

Do not split availability and booking into separate services in this milestone. Split later only if the meeting domain becomes independently complex.

### Configurable availability rules

Initial meeting availability is:

```text
Timezone: Europe/London
Days: Monday to Friday
Window: 12:00–13:00
Slot duration: 30 minutes
Slots per day: 2
```

- Define these rules once in `meeting.config.ts` or the repository’s equivalent configuration mechanism.
- Do not duplicate working days, time windows or duration values across tools, services or providers.
- The availability generator must create consecutive 30-minute candidates inside the configured window.
- Exclude past candidates.
- Use timezone-aware date handling and preserve the configured meeting timezone through daylight-saving changes.
- Request only a bounded future date range suitable for the assistant flow.
- Return stable structured slots containing at least start time, end time and timezone.

### Google Calendar infrastructure

Add a dedicated infrastructure boundary:

```text
src/server/infrastructure/google-calendar/
├── interfaces/
│   └── google-calendar.provider.interface.ts
├── google-calendar.provider.ts
├── google-calendar.config.ts
└── google-calendar.types.ts
```

Equivalent names are acceptable when aligned with existing infrastructure conventions.

The Google Calendar provider owns:

- OAuth client creation;
- refresh-token-based server authentication;
- access-token refresh through the Google client library;
- FreeBusy API requests;
- event creation through the Calendar Events API;
- mapping Google responses into application-owned provider results;
- mapping provider failures into controlled internal errors.

The provider must not own:

- business working days or available hours;
- candidate-slot generation;
- assistant workflow state;
- confirmation rules;
- tool dispatch;
- Prisma persistence.

Expected server configuration includes the repository-equivalent values for:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN
GOOGLE_CALENDAR_ID
```

- Credentials must remain server-only.
- Use the narrowest practical Google Calendar OAuth scopes needed to query free/busy data and create events on Freeman’s calendar.
- Do not require website visitors to authenticate with Google.
- Configuration failures must fail clearly during server setup or first provider use without leaking credentials to visitors.

### Real meeting tools

Replace the dummy Milestone 11 implementations while retaining the existing tool declarations, schema-per-tool organisation and central executor.

Keep these tools:

```text
find_meeting_slots
prepare_meeting
book_meeting
```

#### `find_meeting_slots`

- Accept a requested date range and user timezone using a strict schema.
- Reject invalid, past-only or unreasonably large ranges.
- Call `MeetingService.findAvailableSlots()`.
- Store the returned slots and check timestamp in the transient workflow state.
- Clear any previous selected slot and confirmation.
- Return structured available slots and the updated protected workflow state.
- Do not expose raw Google Calendar responses.

#### `prepare_meeting`

- Accept the user’s name, email, timezone, reason and selected slot through a strict schema.
- Validate and normalise the visitor details.
- Verify that the selected slot exists in the latest workflow availability result.
- Update the workflow state and clear any previous confirmation.
- Return the complete readable booking summary and `requires_confirmation: true`.
- Do not call Google Calendar or persist a meeting.

#### `book_meeting`

- Accept no visitor, slot or confirmation details from the model. It may use an empty strict argument object if required by the tool API.
- Read the protected current workflow state from the tool execution context.
- Require valid name, email, timezone, reason, selected slot and explicit confirmation.
- Recheck the selected slot immediately through `MeetingService.isSlotAvailable()`.
- If the slot is no longer available, return a controlled retryable result, clear the stale selection and confirmation, and require a new availability search.
- Create the Google Calendar event through `MeetingService.bookMeeting()`.
- Persist the successful booking through the Prisma-backed repository.
- Return a structured public booking result.
- Reset the transient workflow state only after both calendar creation and required record keeping have completed successfully.

The meeting tools remain thin adapters. They must not contain OAuth setup, raw Google API calls, slot-generation policy or direct Prisma operations.

### Prisma meeting persistence

Add a Prisma `Meeting` model for completed calendar bookings and create the required migration.

The final model must capture at least:

```text
id
googleEventId
name
email
timezone
reason
startsAt
endsAt
status
googleEventUrl
rawProviderPayload
createdAt
updatedAt
```

Follow existing Prisma conventions:

- map database table and snake_case column names where appropriate;
- use PostgreSQL timestamp types consistently with the current schema;
- make `googleEventId` unique to prevent duplicate local records for the same Google event;
- keep `reason`, event URL or raw payload nullable only when the actual provider flow permits them to be absent;
- use JSON only for the provider payload, not as a replacement for searchable meeting fields.

`MeetingRepository` must implement `IMeetingRepository` and use the shared generated Prisma Client.

It should expose only persistence operations required by this milestone, equivalent to:

```ts
createMeeting(input)
findMeetingByGoogleEventId(googleEventId)
updateMeeting(input)
```

Do not add unused generic CRUD methods.

No assistant tool or meeting service may call Prisma directly outside `MeetingRepository`.

### Calendar-success and persistence-failure handling

Google Calendar and PostgreSQL cannot share one transaction.

Implement the smallest safe behaviour for this first version:

- retain the Google event ID as soon as event creation succeeds;
- use the unique Google event ID to make local persistence retry-safe;
- before creating another event after an uncertain failure, check whether the workflow or known result already contains a Google event ID;
- do not blindly create a second calendar event because the Prisma write failed;
- return a controlled internal failure when the calendar event exists but local persistence could not be completed;
- log enough server-side information to recover or reconcile the booking without exposing private provider payloads to visitors.

Do not introduce a distributed transaction, queue, webhook or generic saga framework.

### Assistant request and streaming integration

Extend the assistant request and stream contracts only as much as required to carry transient workflow state.

- Preserve the existing chat route responsibilities: parse, validate, rate-limit and return the stream.
- Preserve the current NDJSON text, sources, response ID, error and completion behaviour.
- Add the smallest explicit event or response field needed to return updated protected workflow state to the browser.
- The client must retain the latest valid workflow state for the current assistant session and include it in the next request.
- A refresh may discard it.
- Do not expose raw OAuth data, Google responses, Prisma records, signatures, encryption keys or internal errors.
- Preserve abort handling and stop external work as safely as possible when the request is cancelled.
- Do not redesign the assistant interface or add slot-selection UI in this milestone.

### Composition and dependency boundaries

Update the composition root so dependencies flow as:

```text
meeting tools
→ MeetingWorkflowService
→ MeetingService
→ GoogleCalendarProvider
→ MeetingRepository
→ Prisma Client
```

The exact call path may vary by operation, but ownership must remain clear:

- assistant module: conversation orchestration, tool adapters and transient workflow state;
- meeting module: availability and booking business rules;
- Google Calendar infrastructure: provider authentication and API calls;
- meeting repository: Prisma persistence;
- Prisma model: completed meeting records only.

### Existing code disposition

Retain:

- Milestone 11 manual tool-calling loop;
- `search_website` and current retrieval behaviour;
- existing route, streaming, rate-limit and visitor-safe error behaviour;
- central tool declaration and execution structure;
- one strict schema per tool;
- OpenAI provider as a thin Responses API wrapper;
- current Prisma Client setup and composition-root patterns.

Replace:

- dummy `find_meeting_slots`, `prepare_meeting` and `book_meeting` implementations;
- dummy meeting schemas or declarations where their real contracts differ;
- any prompt text that describes meeting booking as simulated.

Add:

- transient protected workflow-state support;
- deterministic confirmation handling;
- meeting domain;
- Google Calendar infrastructure provider;
- Prisma `Meeting` model and migration;
- Prisma-backed meeting repository;
- real text-based availability and booking flow.

Remove:

- dummy meeting data and dummy success responses;
- any superseded booking helpers or types;
- duplicate calendar or meeting-persistence paths.

### Completion condition

This milestone is complete when a visitor can ask for a meeting, receive genuine free 30-minute slots inside the configured Monday-to-Friday 12:00–13:00 Europe/London window, select a returned slot, review the complete details, explicitly confirm, create one Google Calendar event, persist one corresponding Prisma meeting record in Supabase, receive a final streamed confirmation, and start again with an empty transient workflow state.

## Constraints

- Implement the smallest complete real booking flow.
- Keep workflow state transient and session-scoped.
- Protect browser-carried workflow state from tampering.
- Do not persist temporary workflow state.
- Do not pass workflow IDs into tools.
- Keep one `MeetingService` with focused methods.
- Keep both meeting service and repository interfaces consistent with repository architecture conventions.
- Keep Google Calendar behind an infrastructure provider interface.
- Keep Prisma operations inside `MeetingRepository`.
- Use configurable availability rules rather than repeated hard-coded values.
- Recheck availability immediately before event creation.
- Require application-recorded explicit confirmation before external writes.
- Keep tool results structured and serialisable.
- Preserve existing assistant, retrieval and streaming behaviour.
- Do not create speculative automated tests for behaviour that has not failed or stabilised.
- Prefer direct implementation review and focused manual verification.
- Avoid unrelated refactoring.

## Explicitly out of scope

- Persistent workflow state
- Workflow IDs
- Multi-browser or cross-device workflow coordination
- Generic workflow or state-machine frameworks
- Calendly
- MCP
- OpenAI Agents SDK
- Google authentication for website visitors
- Multiple calendars
- Multiple meeting types or durations
- User-configurable availability rules
- Cancellation tools
- Rescheduling tools
- Google Calendar webhooks
- Background reconciliation jobs
- Generative UI
- Selectable slot components
- A user-facing workflow panel
- Email reminder infrastructure beyond Google Calendar’s normal event behaviour
- Broad speculative schema, provider or end-to-end test suites
- Unrelated refactoring or future work

## Verification strategy

- Build the complete milestone behaviour first.
- Review each dependency boundary directly against this contract.
- Use focused manual verification for OAuth configuration, genuine availability, confirmation enforcement, Google event creation, Prisma persistence and workflow reset.
- Run existing relevant validation commands and update existing tests only when intentional contracts changed.
- Add an automated test only when:
  1. a concrete regression is discovered;
  2. a small deterministic rule is important and repeatedly fragile to verify manually; or
  3. an existing test must change because the public contract intentionally changed.
- Keep any new regression test targeted to the exact failure.
- Do not create mocked end-to-end suites merely to imitate Google Calendar or Supabase success paths before real manual verification.

## Required tests

No broad new automated test suite is required by default.

The implementation agent must:

1. Run existing relevant assistant, route, client, Prisma and repository validation commands.
2. Update existing contract tests only where the workflow-state request or stream shape intentionally changed.
3. Add the smallest focused regression test when implementation or review discovers a concrete failure.
4. Consider a small deterministic test only for logic such as slot generation, overlap filtering, confirmation invalidation or protected-state verification when direct review shows that automated protection provides clear value.
5. Avoid speculative OAuth, Google API, Prisma CRUD permutation and full end-to-end test suites.

## Acceptance criteria

Include only criteria the implementation and review agents can verify from repository evidence, existing checks, implementation review or accessible runtime behaviour.

- [ ] The three dummy meeting tools have been replaced by real implementations.
- [ ] Temporary workflow state is not stored in Supabase or a server-global map.
- [ ] No workflow ID is required by the meeting tools.
- [ ] Browser-carried workflow state is validated and protected against tampering.
- [ ] The workflow contains only the agreed minimum meeting details, availability, selection and confirmation data.
- [ ] Confirmation is invalidated whenever protected booking details or availability change.
- [ ] Explicit confirmation is recorded by application logic and cannot be set through model tool arguments.
- [ ] `book_meeting` accepts no model-supplied booking details and refuses unconfirmed workflows.
- [ ] The meeting domain contains one focused `MeetingService` and matching service interface.
- [ ] The Prisma meeting repository has a matching repository interface.
- [ ] Availability rules are defined once and initially represent weekdays from 12:00 to 13:00 Europe/London in 30-minute slots.
- [ ] Candidate slots exclude past times and Google Calendar busy overlaps.
- [ ] The selected slot must come from the latest returned availability.
- [ ] Availability is rechecked immediately before event creation.
- [ ] Google Calendar authentication, FreeBusy and event creation are isolated behind the provider interface.
- [ ] Google credentials and refresh tokens remain server-only.
- [ ] A Prisma `Meeting` model and migration exist for completed bookings.
- [ ] `googleEventId` is uniquely constrained.
- [ ] Meeting persistence uses Prisma only through `MeetingRepository`.
- [ ] Successful calendar bookings are recorded with the agreed searchable fields and provider payload where useful.
- [ ] The implementation does not blindly create a duplicate Google event after a local persistence failure.
- [ ] The workflow resets only after calendar creation and required persistence succeed.
- [ ] Updated protected workflow state is returned through the smallest compatible assistant stream or response extension.
- [ ] Existing conversational, website-search, streaming, rate-limit, abort and safe-error behaviour remains intact.
- [ ] No Calendly, persistent workflow, cancellation, rescheduling, Generative UI, MCP or Agents SDK work was introduced.
- [ ] The implementation agent reviewed the final code against every required behaviour and boundary in this contract.
- [ ] Existing relevant validation commands pass.
- [ ] Any concrete regression found during implementation has the smallest valuable regression test or a recorded reason why automation would not help.
- [ ] No speculative broad test suite was added.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual tasks

1. Create or confirm the Google Cloud project and enable the Google Calendar API.
2. Configure an OAuth consent screen appropriate for Freeman’s private server integration.
3. Create the OAuth client credentials and perform the one-time authorisation needed to obtain a refresh token for Freeman’s Google account.
4. Configure the required server environment variables for local development without committing secrets.
5. Apply the Prisma migration to the local Supabase database and regenerate Prisma Client when required by the repository workflow.
6. Run the assistant locally and verify:
   - a normal greeting still works without meeting tools;
   - a portfolio question still uses website retrieval;
   - a meeting request returns genuine available weekday slots inside the configured window;
   - a known busy calendar period is excluded;
   - changing prepared details clears confirmation;
   - an ambiguous reply does not book;
   - a clear confirmation creates the event;
   - one corresponding meeting record exists in Supabase;
   - the transient workflow resets after success.
7. Inspect the created Google Calendar event and confirm its title, attendee, times, timezone, description and event link are correct.
8. Review the implementation against the required behaviour and acceptance criteria before approval.

## Manual acceptance criteria

These are confirmed by the human after the workflow reaches `ready_for_human`. They do not block the agent workflow from reaching that state.

- [ ] Google OAuth credentials and refresh-token authentication work locally without visitor authentication.
- [ ] The assistant offers only genuine free slots inside the configured meeting window.
- [ ] Busy or newly occupied slots are not booked.
- [ ] The confirmation summary accurately reflects the final name, email, timezone, reason and selected slot.
- [ ] No meeting is created before explicit confirmation.
- [ ] One successful confirmation creates exactly one correct Google Calendar event.
- [ ] One corresponding Prisma meeting record is stored in Supabase.
- [ ] The assistant returns a clear successful result and resets the transient workflow.
- [ ] Existing portfolio conversation and retrieval behaviour remains stable enough to proceed to Generative UI later.
