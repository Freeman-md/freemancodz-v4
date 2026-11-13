# ADR-0001 — Canonical architecture authority and shared approval navigation

**ACCEPTED — OWNER APPROVED 2026-11-13**

Recorded: 2026-11-13. Origin: initial existing-codebase setup **Task04 / D1**. Original proposal impact: **NEW/REVISED ADR REQUIRED**. Current approval-propagation impact: **EXISTING APPROVED ADR**. Related rules: ARC-001, repository navigation for ARC-015/016. Related accepted decision: [ADR-0002](0002-injected-ports-and-inert-errors.md).

Owner decision: **APPROVE**, evidenced by [APPROVAL-001](../../engineering/setup/APPROVALS.md#approval-001--d1-and-d2-approved), received 2026-11-13. The owner approved both D1 and D2 in the exact reviewed versions. This ADR’s approved proposal SHA-256 is `c0ed89224ea70e8d9ff30278bf0ffd16ea892aeee3c558173c66622a525689ad`. The approval record preserves the original hashes, exact response and exclusions. Only approval/lifecycle metadata is propagated here; independent propagation review passed; the next-task dispatch/acknowledgement state is tracked in the setup checklist.

## Original owner brief — retained rationale

**Problem:** the existing architecture skill is binding, while the catalogue requires an architecture specification, ADR registry and shared change control. Without explicit authority, future setup and milestone agents can use inconsistent copies. Existing global milestone skills already implement the mandatory approval checkpoints; replacing them would add an unnecessary parallel process.

**Recommendation:** after explicit approval and propagation, make [ARCHITECTURE.md](../ARCHITECTURE.md) the repository architectural reference under higher-priority user/AGENTS/framework requirements. Keep the architecture skill as the mandatory entry point, aligning it to reference the approved contract during the authorised later task. Use one ADR set in `docs/architecture/adr/` and one change-control lifecycle shared by setup, reconciliation and existing milestone delivery.

**Alternative:** leave all detailed rules in the skill and reduce the architecture document to navigation. This reduces immediate skill maintenance, but does not provide the catalogue's requested standalone complete specification and risks contradictory detail as later artifacts arrive. Creating a new milestone framework is unnecessary and not proposed.

**Trade-off:** the adopted specification and skill need deliberate propagation, but reviewers and agents gain stable rule IDs and one decision history. Rule documentation does not itself enforce behaviour.

## Accepted decision and boundaries

The accepted decision adopts the ownership/dependency/flow specification without redesigning the modular monolith, adding services/layers or granting exceptions. Existing instructions remain binding now; unchanged rules are not being resubmitted for approval. Source-backed invariants preserve caller behaviour and are not claims of historical ADR approval.

The owner's mandatory ADR contract already applies. This decision supplies its repository navigation, not a competing approval policy:

- Architecture: `docs/architecture/ARCHITECTURE.md`, after adoption.
- Decision records: this single `docs/architecture/adr/` directory. Task06 will establish the index at `README.md` only after its architecture and standards prerequisites pass.
- Change-control lifecycle: owner's catalogue until Task16 creates and verifies `docs/engineering/CHANGE_CONTROL.md` consistently with it.
- Current task/approval/evidence state: `docs/engineering/ENGINEERING_SETUP_STATUS.md`.
- Existing host milestone authoring/execution skills remain the invocation workflow; Task15 links/trials them for Freemancodz rather than copying JPScents examples.

The shared lifecycle classifies impact during authoring/planning and independently during execution; proposes and pauses affected work; records owner APPROVE/REVISE/REJECT; propagates accepted scope before resumption; and independently verifies approval before implementation PASS/READY FOR MERGE. Routine compliant work needs no new ADR. An unapproved proposal can receive a documentation-quality review only, never implementation/adoption clearance.

Before Task05 dispatch, the minimum propagation is: record accepted ADR scope/version and owner evidence; align the architecture contract and setup status; document Task05 check requirements and the schedule for later artifact updates; and obtain the executor’s acknowledgement of the matching handoff. Task05 then authors standards from these accepted inputs. Task06’s registry follows standards approval; Task08 aligns skill/agent text; Tasks15–16 implement and trial the remaining lifecycle links. These future outputs are not falsely required to exist before Task05, and none is marked complete by architecture approval.

The owner explicitly accepted D2 in APPROVAL-001; that owner directive governs only the recorded ARC-006/ARC-007 changes to the current architecture skill until Task08 updates it. Other skill/AGENTS constraints remain binding. This interim scoped precedence takes effect only after evidence and the minimum propagation above, avoiding a Task05↔Task08 dependency cycle; it is not a blanket override or permission to adopt an unapproved proposal.

The retained architecture permits infrastructure-internal client factories and composition assembly. Cross-module public type-only use and injected runtime behaviour remain separate options; neither requires a newly named/exported interface. D2 supplies only its bounded additional technical/error allowance.

Approval of D1 does not decide D2, approve existing dependency drift, authorise remediation/hosted settings, complete Task06/15/16, or authorise any commit, push, merge or release.

## Affected and blocked work

Originating task: Task04 proposal authoring/review; no active delivery milestone is being created or executed.

- **Accepted now:** D1 and D2 only, with the exact approval evidence/version above; no existing drift or exception is waived.
- **Next-task gate:** minimum propagation passed independent review; Task05 execution requires the matching handoff acknowledgement recorded in the setup checklist. Task05 standards adoption later requires its own owner approval.
- **Blocked by sequence/dependency:** Tasks06–16, including full ADR registry, compliance classification, enforcement and milestone readiness; their own prerequisites remain.
- **Allowed now:** this approval metadata propagation, independent review/correction and honest setup status/evidence. No dependent application or enforcement implementation.

If revised/rejected, replan the affected contract and return it for review; do not quietly adopt the proposed navigation. Architectural approval never implies separate owner merge authorisation.

## Decision and propagation record

| Field                                                      | Recorded state                                                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Owner/authorised human decision                            | **APPROVE** — repository owner, 2026-11-13                                                                                      |
| Approval evidence/reference                                | [APPROVAL-001](../../engineering/setup/APPROVALS.md#approval-001--d1-and-d2-approved)                                           |
| Approved scope/version                                     | D1 canonical authority/navigation; approved proposal SHA-256 `c0ed89224ea70e8d9ff30278bf0ffd16ea892aeee3c558173c66622a525689ad` |
| Affected task IDs                                          | Task04 propagation; Task05 after independent propagation review; Tasks06–16 retain prerequisites                                |
| Accepted ADR/architecture metadata                         | **UPDATED AND INDEPENDENTLY VERIFIED**; normative scope unchanged                                                               |
| Setup status, Task05 check requirements and later schedule | **ALIGNED AND VERIFIED** in Task04 acceptance-propagation review                                                                |
| Task04 approval-propagation handoff acknowledgement        | **ACKNOWLEDGED** by executor, 2026-11-13; existing accepted scope only                                                          |
| Task05 execution handoff                                   | See [setup checklist](../../engineering/ENGINEERING_SETUP_STATUS.md) for dispatch and executor acknowledgement                  |
| Dependent work resumed                                     | See [setup checklist](../../engineering/ENGINEERING_SETUP_STATUS.md); only tasks meeting their own prerequisites may resume     |
| Independent propagation review                             | **PASS** — [acceptance-propagation review](../../engineering/setup/REVIEWS.md#task-04--acceptance-propagation-pass)             |
| Operational adoption/enforcement and lifecycle trials      | **NOT VERIFIED**; later tasks remain scheduled                                                                                  |
| Separate merge/release/hosted/exception authorisation      | **NOT GIVEN**                                                                                                                   |

Approval is recorded; the orchestrator completes the minimum Task05 propagation above and obtains the executor’s matching handoff acknowledgement before Task05 resumes. Each later task aligns the artifacts applicable to its own scope before execution; standards, skill alignment and operational trials stay scheduled until actually completed and verified. No status above changes merely because this file exists or passes formatting/review.

## Evidence and validation limits

Inputs: [AGENTS.md](../../../AGENTS.md), [architecture skill](../../../.agents/skills/nextjs-architecture/SKILL.md), [catalogue mandatory contract](../../engineering/setup/prompts/catalogue.md#mandatory-adr-approval-contract), [controls audit](../../engineering/CONTROLS_AUDIT.md), and inspected global milestone skills. Baseline HEAD: `f6ea50c13fbf245d4f0403c697c98f27cbd4f3f5`.

Task04 is documentation-only. It does not perform the Task15 authoring/execution/independent-review/merge-handoff trials or Task16 approval-denial dry run. Those remain explicit readiness prerequisites.

## Task06 registry cross-references — 2026-11-13

This additive entry supplies the [single registry index](README.md) and explicit standards/implementation mapping; it does not revise D1, its original rationale or approval scope. D2 remains a related accepted decision, not a successor. No superseding ADR is recorded.

- **Related rules/standards:** ARC-001 and navigation for ARC-015/016 in the [architecture](../ARCHITECTURE.md); STD-001 (architecture consistency), STD-023 (verification evidence) and STD-024 (approval/workspace controls) in the [coding standards](../../engineering/CODING_STANDARDS.md). Standards were separately accepted in [APPROVAL-002](../../engineering/setup/APPROVALS.md#approval-002--coding-standards-approved); their approval is not inferred from D1.
- **Consequences/components:** repository architecture/decision navigation and existing milestone instructions share one authority. The existing application module/data/transaction design is not changed by this authority record.
- **Implemented/verified:** owner acceptance and minimum metadata propagation passed independent review; Task06 now adds registry navigation for review. Current task dispatch and acknowledgement remain in the setup checklist.
- **Not yet implemented/verified/enforced:** Task08 skill/agent alignment, Tasks15–16 workflow/change-control integration and trials, and later operational enforcement proof. No merge/release/hosted or exception approval follows from D1 or this addendum.
- **Origin/affected work:** original Task04; Task05 prerequisite completed with its own approval; Task06 indexing prepared for independent review. Task07 awaits Task06 PASS and its next handoff; later tasks retain their own prerequisites. Historical source approval dates beyond the recorded D1 decision remain unknown, not backfilled.
