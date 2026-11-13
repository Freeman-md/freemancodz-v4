# ADR-0002 — Injected technical ports and inert public error contracts

**ACCEPTED — OWNER APPROVED 2026-11-13**

Recorded: 2026-11-13. Origin: initial existing-codebase setup **Task04 / D2**. Original proposal impact: **NEW/REVISED ADR REQUIRED**. Current approval-propagation impact: **EXISTING APPROVED ADR**. Related rules: ARC-006 and bounded error-value extension of ARC-007. Accepted authority decision: [ADR-0001](0001-canonical-architecture-authority.md).

Owner decision: **APPROVE**, evidenced by [APPROVAL-001](../../engineering/setup/APPROVALS.md#approval-001--d1-and-d2-approved), received 2026-11-13. The owner approved both D1 and D2 in the exact reviewed versions. This ADR’s approved proposal SHA-256 is `5ce9a2e6b9d328e66e864c6e336ed9368e9c9515f7ea33fd8f216d80f66d3409`. The approval record preserves the original hashes, exact response and exclusions. Only approval/lifecycle metadata is propagated here; independent propagation review passed; the next-task dispatch/acknowledgement state is tracked in the setup checklist.

## Original owner brief — retained rationale

**Problem:** the skill's terse modules-to-own-code diagram omits technical type contracts already used for injection. Its public-type/injected-dependency rule also does not explicitly permit runtime public error classes. Treating all these edges as equivalent would either approve implementation drift or require needless duplicated interfaces. Runtime client imports and direct cross-module helpers are materially different.

**Recommendation:** permit type-only public technical interfaces for injected dependencies, plus explicitly bounded inert runtime error contracts. Keep cross-module business operations injected and prohibit importing a client implementation just to obtain an error class. No new ports directory, framework, wrapper or general public-helper API.

**Alternative:** enforce the literal diagram and relocate/duplicate every technical port/error into consumer-owned boundaries. This makes visual dependency direction simpler but adds churn and translation without evidence that it improves present behaviour. Allowing arbitrary runtime infrastructure or module helpers would weaken real ownership and is not recommended.

**Trade-off:** the proposed allowance preserves useful simple seams, but reviewers/static checks must distinguish erased imports from runtime graphs and verify inertness; a filename ending `types.ts` is not proof.

## Accepted decision and exact scope

1. Type-only technical interfaces may reside with their technical owner and be consumed by modules solely as injected contracts. Examples: `OpenAITransport`/request types in `src/infrastructure/openai/types.ts`, `CalendarClient` in `src/infrastructure/google-calendar/types.ts`, and `Logger` from `src/infrastructure/logging/logger.ts`. Business modules other than composition, app adapters and entrypoints gain no permission to construct/import concrete clients. Infrastructure-internal vendor/database configuration and factories remain permitted, including `createOpenAIClient` in `src/infrastructure/openai/client.ts` and `createPrismaClient` in `src/infrastructure/database/prisma.ts`; composition consumes these and assembles the application.
2. A deliberate public runtime error contract is eligible only when its file and runtime graph contain no client implementation, environment access, I/O, provider SDK runtime dependency or business execution. It exposes bounded error codes/outcomes; raw `cause` remains unsafe for clients/logs. This narrow allowance covers technical and capability error contracts, not arbitrary exported functions or constants.
3. The exact current candidate error symbols are `CalendarAvailabilityError` and `CalendarEventError` in `src/infrastructure/google-calendar/types.ts`, and `MeetingBookingError` in `src/modules/meeting/types.ts`. They are candidates under the accepted rule, not retrospectively accepted exceptions. Task07 must classify their actual edges against the accepted rule and record evidence.
4. Cross-module use otherwise retains the existing alternatives: deliberately exposed type-only contracts or injected runtime dependencies. Type-only use does not require a runtime dependency; injected operations can use structural inference or `Pick` without a new named/exported interface. Direct private service/repository/helper/config access remains debt. Future contracts require public-boundary review; changing this allowance requires a revised ADR, not an unrecorded exception.

Explicit exclusions:

- `ResendClientError` imported by `src/modules/workflow/definitions/meeting-booking/actions.ts` from `src/infrastructure/resend/client.ts` remains disallowed: the file contains provider client implementation. Moving only the inert error contract to its existing technical owner is a possible later correction, not work authorised or performed in Task04.
- `MEETING_CONFIG`, `getLondonDate`, `resolveMeetingTime` in `tool-handlers.ts`, and `assertMatchingCalendarEvent`/`assertMatchingMeeting` in `actions.ts`, all under `src/modules/workflow/definitions/meeting-booking/`, remain direct cross-module helper/config debt. Pure code is not automatically an approved public API.
- Direct app environment reads remain subject to central env authority; no platform-metadata exception.
- No repository internals, Prisma singleton, client constructors, secret configuration or SDK operations become module/browser imports through this proposal.

Approval authorises only the described boundary rule prospectively. Existing implementation alone provides neither historical approval nor a waiver; approved, implemented, verified and enforced remain separate states. No application edits, exceptions, merge, release or hosted enforcement changes are requested here.

## Verification consequences

Later enforcement needs resolved alias/relative import coverage, type-versus-value distinction, exact error-contract runtime dependency inspection and independent ownership review. Positive fixtures should allow an injected type-only port and an approved inert error; negative fixtures should reject client-file errors, cross-module private helpers, infrastructure-to-business implementation and browser server-dependencies. Current lint does not prove those distinctions.

Focused behaviour tests must preserve safe error/outcome translation and retry/uncertainty semantics after any correction. Changes touching persistence require the applicable disposable-database tests; a fake or skipped suite cannot substitute. These are accepted verification requirements for later authorised tasks, not completed tests in this task.

## Affected and blocked work

Origin: Task04. ARC-006 and its bounded ARC-007 extension are owner-accepted under APPROVAL-001; code compliance/adoption/enforcement is not thereby verified. Minimum propagation has passed independent review; Task05 execution requires the matching handoff acknowledgement recorded in the setup checklist; its standards need separate owner approval before adoption. Tasks06–16 retain the catalogue sequence and their own prerequisites, including debt classification/enforcement and milestone readiness. Existing valid work is preserved; approval metadata propagation and independent review/correction may continue.

The executor escalates any new dependency decision through the orchestrator. On rejection/revision, replan the boundary and affected tasks without adopting the rejected allowance. Before Task05, record the explicit owner resolution and accepted ADR scope/version, align the architecture contract/setup status and Task05 check requirements, and obtain the executor’s matching handoff acknowledgement. An explicit owner acceptance of D2 then governs only these recorded ARC-006/ARC-007 changes to the existing skill until its Task08 alignment; all other skill/AGENTS constraints remain binding. Task05 authors standards from the accepted inputs, Task06 follows their approval, and Tasks08/15/16 complete scheduled skill/lifecycle propagation and trials. Those future outputs are not circular prerequisites for Task05 or claims of completed propagation; each later task must align the inputs applicable to its work before execution. Owner merge approval remains separate after implementation, checks and independent review.

## Decision and propagation record

| Field                                                      | Recorded state                                                                                                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner/authorised human decision                            | **APPROVE** — repository owner, 2026-11-13                                                                                                                    |
| Approval evidence/reference                                | [APPROVAL-001](../../engineering/setup/APPROVALS.md#approval-001--d1-and-d2-approved)                                                                         |
| Approved scope/version                                     | D2 bounded technical ports/inert error contracts and exclusions; approved proposal SHA-256 `5ce9a2e6b9d328e66e864c6e336ed9368e9c9515f7ea33fd8f216d80f66d3409` |
| Affected task IDs                                          | Task04 propagation; Task05 after independent propagation review; Tasks06–16 retain prerequisites                                                              |
| Accepted ADR/architecture metadata                         | **UPDATED AND INDEPENDENTLY VERIFIED**; normative scope unchanged                                                                                             |
| Setup status, Task05 check requirements and later schedule | **ALIGNED AND VERIFIED** in Task04 acceptance-propagation review                                                                                              |
| Task04 approval-propagation handoff acknowledgement        | **ACKNOWLEDGED** by executor, 2026-11-13; existing accepted scope only                                                                                        |
| Task05 execution handoff                                   | See [setup checklist](../../engineering/ENGINEERING_SETUP_STATUS.md) for dispatch and executor acknowledgement                                                |
| Dependent work resumed                                     | See [setup checklist](../../engineering/ENGINEERING_SETUP_STATUS.md); only tasks meeting their own prerequisites may resume                                   |
| Independent propagation review                             | **PASS** — [acceptance-propagation review](../../engineering/setup/REVIEWS.md#task-04--acceptance-propagation-pass)                                           |
| Operational adoption/enforcement and lifecycle trials      | **NOT VERIFIED**; later tasks remain scheduled                                                                                                                |
| Separate merge/release/hosted/exception authorisation      | **NOT GIVEN**                                                                                                                                                 |

## Evidence

The [controls audit](../../engineering/CONTROLS_AUDIT.md), ARCH-AUD-02/03, identifies the tensions. Task04 re-inspected the exact files above, `src/modules/assistant/service.ts`, `src/modules/workflow/types.ts`, `src/modules/composition.ts` and the [architecture skill](../../../.agents/skills/nextjs-architecture/SKILL.md). Baseline HEAD: `f6ea50c13fbf245d4f0403c697c98f27cbd4f3f5`. Source inspection establishes dependency shape, not owner approval or operational enforcement.

## Task06 registry cross-references — 2026-11-13

This additive entry supplies the [single registry index](README.md) and explicit standards/implementation mapping; it does not revise the accepted boundary or exclusions. ADR-0001 supplies authority/navigation. No superseding ADR is recorded.

- **Related rules/standards:** ARC-006 and the bounded ARC-007 extension in the [architecture](../ARCHITECTURE.md); STD-001 (architecture consistency), STD-006 (type-only imports), STD-008 (optional structural seams), STD-011 (type safety), STD-015 (safe failure handling) and STD-018 (safe logging) in the [coding standards](../../engineering/CODING_STANDARDS.md). Their separate approval is [APPROVAL-002](../../engineering/setup/APPROVALS.md#approval-002--coding-standards-approved), not an expansion of D2.
- **Consequences/components:** assistant/workflow injected technical interfaces and the named Calendar/Meeting inert error candidates can be assessed against one precise rule without new layers. Infrastructure client factories remain legitimate; Resend client-file errors and direct Meeting helper/config imports remain excluded debt.
- **Implemented/verified:** accepted rule metadata and exact owner scope were independently verified; existing source shapes were inspected. This does not certify all import edges or historical conformity.
- **Not yet implemented/verified/enforced:** Task07 edge/debt classification, subsequent authorised remediation if needed, deterministic resolved-import/type-value/inertness checks and their negative/positive proof, and applicable behaviour/DB tests. Required skipped or unexecuted suites remain unverified.
- **Origin/affected work:** original Task04; Task05 standards separately accepted; Task06 indexing prepared for independent review. Task07 requires Task06 PASS and the next handoff. Existing approval does not waive debt or grant an exception, new feature, hosted change, Git publication, merge or release.
