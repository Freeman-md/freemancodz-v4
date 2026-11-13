# Architecture change control

Task 16 · 2026-11-13 · **EXISTING APPROVED ADR** application. This is the canonical navigation and operating procedure for the already approved D1/ARC-015/016 contract. The [independent review](setup/REVIEWS.md#task-16--change-control-and-engineering-handoff-pass) verified the procedure and dry runs.

## Authority and decision thresholds

Use [AGENTS](../../AGENTS.md), accepted [architecture](../architecture/ARCHITECTURE.md), [coding standards](CODING_STANDARDS.md), the [single ADR registry](../architecture/adr/README.md) and [exception register](EXCEPTIONS.md). The owner's [mandatory catalogue contract](setup/prompts/catalogue.md#mandatory-adr-approval-contract) governs initial setup, new setup, reconciliation and ongoing milestones. The existing [milestone integration](MILESTONE_INTEGRATION.md) and [independent review protocol](REVIEW_PROTOCOL.md) remain the only delivery/review route. Read current canonical files, not old status prose or agent summaries.

During authoring and planning, the orchestrator records `NONE`, `EXISTING APPROVED ADR` or `NEW/REVISED ADR REQUIRED`. The executor independently repeats the assessment before affected edits and immediately on a consequential discovery. A proposal does not authorize its implementation. Stop only dependent work; independent preparation may continue when it cannot constrain the owner decision.

| Change                               | Approval threshold and example                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ordinary implementation or repair    | No new ADR when it preserves accepted contracts: fix an owner-check bug, add a regression, format a changed file, or repair an evidence parser to reject already-prohibited malformed input. Existing task authorization and risk-based verification still apply.                                                                                                  |
| Existing accepted decision           | Cite exact ADR/rule and owner version/scope. D2 permits bounded injected types/inert errors; it does not authorize private Meeting helpers or provider-client-file error imports. Unsupported checker recognition can be corrected against the same rule with tests/review; changing the rule requires approval.                                                   |
| Architecture/dependencies            | Proposed ADR before changing ownership, dependency direction, client/server or trust boundaries, public cross-module contracts, data/transaction/consistency ownership, or introducing a consequential platform/service/production dependency. An ordinary compatible dependency update is assessed for actual impact; it is not automatically a new architecture. |
| Standards and mandatory verification | Proposed ADR/brief before changing a normative ARC/STD requirement, mandatory stage, acceptance obligation, test omission, gate bypass or evidence policy. Strengthening tests or repairing a gate within its existing contract is routine authorized work; reducing coverage to obtain green is not.                                                              |
| Exceptions/suppressions/baselines    | Every proposed rule exception requires a proposed ADR and exact owner scope before affected work. No blanket ignore, automatic baseline expansion or new suppression. Removing a resolved exact baseline entry is a reviewed repair, not a waiver; a returning violation fails as new.                                                                             |
| Security or consequential trade-off  | Escalate a material privacy/access rule, persistence/retry guarantee, destructive migration, incompatible behavior or conflict between accepted requirements. Safe remediation within an unchanged contract does not require inventing a new decision.                                                                                                             |
| Hosted, Git, merge and release       | Preserve their separate explicit authorization. Architecture approval never grants publication, hosted mutation, destructive operations, merge or deployment beyond the owner's stated scope. Only the human merges in the milestone workflow.                                                                                                                     |

Ambiguous scope stays unresolved for the affected task until evidence or owner clarification resolves it. Passing tests, existing drift, an agent's preference and implementation convenience do not establish historical approval. Do not repeatedly ask the owner to reapprove unchanged binding rules.

## Proposed ADR and owner brief

Use the next unused registry identifier and existing `0001-descriptive-kebab-case-title.md` convention. Do not reserve or create an accepted record merely for this template. Keep stable rule IDs; a materially changed meaning needs an explicitly mapped revision/successor, not a silent redefinition.

```markdown
# ADR-<next ID> — <concrete decision>

PROPOSED — AWAITING APPROVAL
Recorded: <date>; decision date: NOT RECORDED
Origin: <milestone/version and task IDs>
Impact: NEW/REVISED ADR REQUIRED
Current authority: <ARC/STD IDs, current ADR/version and exact rule>

## Problem and evidence

<Observed pressure; relevant source/test/data evidence; why current rules are insufficient.>

## Proposed decision

<Exact bounded change and recommendation; what remains unchanged.>
Alternatives: <prefer existing implementation/injection/remediation where sufficient.>
Trade-offs: <consequences, affected features and operating/maintenance cost.>
Data/migration and compatibility: <specific risks, or justified not applicable.>
Rollout/rollback: <ordered adoption and safe reversal limits; applied migration history stays preserved.>
Verification/enforcement: <affected checks/tests/acceptance/CI and real evidence required.>

## Approval and dependent work

Owner decision/reference: PENDING; reviewed version/hash: <exact proposal>
Affected tasks: <IDs>; BLOCKED tasks: <IDs and reason>
Independent allowed work: <bounded preparation that cannot constrain the decision>
Propagation/check requirements: PENDING
Executor acknowledgement: PENDING; dependent resumption: NO
Implementation: NOT DONE; verification: NOT DONE; enforcement: NOT DONE
Merge/release/hosted authorization: NOT GIVEN by this proposal
Related/superseded ADRs: <links or None; predecessor remains authoritative>
```

The orchestrator presents this short owner-facing brief and retains the full ADR with its exact reviewed version:

```text
Decision: ADR-<ID>, originating milestone/tasks and current rule/ADR.
Problem: one sentence and strongest concrete evidence.
Recommend: smallest viable change and decisive trade-off.
Alternatives: one or two meaningful choices, including retaining the current rule.
Impact/risks: affected contracts, compatibility/data, verification and rollback.
Stopped work: exact dependent task IDs; independent work still allowed.
Owner choice: APPROVE exact version/scope, REVISE with conditions, or REJECT.
Architecture approval does not authorize merge or release.
```

Only an explicit authorized human decision can accept the proposal. Record its reference, exact response, date when evidenced, reviewed version/hash, scope, conditions and affected tasks. If wording is ambiguous, do not infer a broader grant. `REVISE` returns the proposal and dependent tasks for replanning/re-review; `REJECT` retains the rationale and stops adoption. Silence remains pending. A reviewer can approve the quality of a brief without approving its architecture.

## Separate states and traceability

The registry's record statuses remain **PROPOSED — AWAITING APPROVAL**, **ACCEPTED**, and **SUPERSEDED**. Revision/rejection is a decision/disposition on an unaccepted proposal, not permission to relabel it ACCEPTED. Keep rejected/revised history and the owner evidence; do not invent an approval date. These operational facts are tracked independently:

| Fact        | Required evidence; what it does not imply                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| APPROVED    | Exact owner acceptance; ADR may become ACCEPTED. No implementation, test or enforcement follows merely from acceptance.                                                                                             |
| IMPLEMENTED | Actual scoped code/document/check changes and diff identity. Implementation without required approval remains blocked, not retrospectively legitimate.                                                              |
| VERIFIED    | Applicable tests/checks and independent review match the actual implementation snapshot. A failed, skipped, missing or stale required check is not verified.                                                        |
| ENFORCED    | Actual rejection/allowance at the claimed boundary, such as exact local ratchet, independent approval checkpoint or required hosted check. Local tooling/configuration alone does not establish hosted enforcement. |
| Adopted     | Approved scope has been propagated, implemented and independently verified for the stated adoption boundary. Report enforcement separately; never use “adopted” to hide pending operational work.                   |

Typical progression is proposal → owner decision → consistent propagation/acknowledged handoff → implementation → applicable verification/review → adoption, with enforcement proven at its actual boundary. A gate can already exist while implementation is pending; these are evidence dimensions, not a machine that automatically advances every field. Required unavailable evidence or approval keeps affected work BLOCKED. A new decision requiring presentation is ESCALATE; use the existing review/workflow status mapping.

For a material successor, create a new proposed ADR linked to the accepted predecessor. Keep the predecessor authoritative until explicit successor acceptance and the effective propagation/adoption boundary are recorded. Then mark only the replaced scope SUPERSEDED, link both directions and retain original rationale/dates. Partial replacement must state which rules remain. No deletion or backfilled historical approval.

## Ordered propagation and resumption

1. Record the accepted ADR and exact owner evidence; update affected architecture/standards only within that grant. Preserve prior versions and rationale.
2. Align any explicitly approved exception/debt scope. A baseline entry is still debt, not an exception. No new exception is inferred from approving a broader project goal.
3. Align the affected milestone/version, task boundaries, acceptance/check obligations and executor handoff. Freeze an explicitly approved milestone revision in the same PR before coding; preserve history and review count.
4. Identify and schedule the required enforcement-matrix/deterministic-check updates with precise positive/negative cases. Do not call a future checker implemented or enforced.
5. Identify the required tests, integration/acceptance evidence and rollout/rollback prerequisites. Execute them on the implementation when available, preserving failures and actual counts.
6. Align applicable agent/milestone instructions and independent review criteria so the next executor and reviewer use the same accepted scope.
7. Apply CI/hosted/release changes only if separately authorized; prove their actual boundary and retain evidence.

Before dependent implementation resumes, steps 1–3 and the applicable instructions/verification obligations from 4–7 must agree, and the executor must acknowledge the exact accepted handoff. Checks/tests whose implementation is the next task are explicitly scheduled with their own prerequisites; they are not falsely marked complete or circularly required before being authored. Record who acknowledged, which version, exact resumed tasks and remaining scheduled work. Approval alone never flips resumption to YES.

After implementation, run required [canonical verification](VERIFICATION_CONTRACT.md) and scoped acceptance, validate reports in the exact checkout and bind the broader safe review snapshot through [milestone integration](MILESTONE_INTEGRATION.md). A separate reviewer verifies approval coverage, implementation, propagation and real evidence. Corrections return to the executor without weakening criteria. Any changed implementation invalidates affected evidence/review until rechecked. Preserve the global three-review budget and exact PR recovery. The current implementation snapshot may reach engineering READY/APPROVED after required verification and independent PASS. Copy any milestone-specific Manual Checkpoint unchecked for the owner; those items and the owner's separate merge decision govern the later human merge, not the agent's engineering verdict. Required ADR approval is never deferred to that checkpoint. An eventual merge may trigger an existing production deployment integration: establish the release decision or explicitly authorized deployment handling before choosing to merge, without inventing or changing hosted settings.

## Temporary exceptions and drift

No approved or proposed exception currently exists in the live registry. A concrete future exception must identify exact rule, path/symbol/behavior, count/content boundary where relevant, necessity and alternatives, risks/compensating checks, linked proposed ADR, owner decision/version, affected tasks, review trigger and intended removal/expiry where actually agreed. Never invent an expiry date or permit a wider scope than approved.

Re-evaluate an exception when its scoped code/rule changes, the agreed trigger occurs, or the original pressure disappears. Removal/supersession is traceable. Expanding a path, binding, count, behavior or lifetime requires new explicit approval; no silent baseline refresh or blanket suppression. A proposed one-symbol exception cannot authorize a folder ignore. Prefer remediation or the existing exact non-regression ratchet where no concrete exception need is established.

Intelligence refreshes, failed checks, review findings and changed requirements trigger reconciliation against current canonical sources. Classify each item as a compliant implementation repair, unchanged known debt, approved work pending, legitimate variation, verification gap, or genuinely new/revised decision. Restore compliance within authorized scope where possible; otherwise propose and stop dependent work. Adding a rule needs motivating evidence, a bounded requirement, its checking/review mechanism and owner approval. Do not treat all old prose as current operational status: use the [current setup snapshot](ENGINEERING_SETUP_STATUS.md) and revision-matched receipts while preserving historical documents.

## Isolated validation and limits

Task 16 uses tabletop fixtures outside the repository for hypothetical APPROVE, REVISE and REJECT, unresolved authoring/executor discovery, a narrower proposed exception, propagation stops and separate merge authority. Hypothetical transitions are modelled expectations only: every fixture retains `actualOwnerDecision: null`, and none is a live ADR, exception or implementation grant. Actual [APPROVAL-001](setup/APPROVALS.md#approval-001--d1-and-d2-approved) and its verified propagation are reused only as real historical evidence of the accepted D1/D2 scope.

The actual separate reviewer `/root/setup_review` invoked the existing review role and inspected all eight frozen cases, proposal/exception scope and real approval references. It verified every fixture hash and the no-actual-approval guards; the following are observed tabletop review results, not production transition tests or newly accepted decisions.

| Case                                                    | Independent result and affected-work outcome                                                                                                                                                                     |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T16-01 unresolved authoring/executor discovery          | Correct ESCALATE through orchestrator; X1 remains BLOCKED before implementation, independent X2 inventory eligible. No implementation PASS/READY.                                                                |
| T16-02 hypothetical APPROVE without propagation         | Model distinguishes owner acceptance from resumption: missing alignment/acknowledgement keeps dependent work BLOCKED. Actual approval remains null.                                                              |
| T16-03 hypothetical APPROVE with applicable propagation | Model permits only named implementation after aligned obligations and acknowledged handoff; implementation/verification/enforcement remain undone and no READY/merge follows. Actual eligibility remains false.  |
| T16-04 hypothetical REVISE                              | Revised version requires its own exact acceptance; preserve prior history and replan/re-review. Dependent work stays BLOCKED.                                                                                    |
| T16-05 hypothetical REJECT                              | No acceptance/adoption; retain rejected proposal/disposition and existing authoritative rule. A compliant alternative still needs its task scope.                                                                |
| T16-06 narrower proposed exception                      | One importer/target/symbol/value/count proposal cannot authorize a second occurrence, alias drift or folder ignore. Both unapproved scopes remain BLOCKED; live exception/baseline unchanged.                    |
| T16-07 actual approval reuse                            | Bounded PASS: APPROVAL-001's real D1/D2 scope and verified historical propagation support existing-rule reuse only, not the hypothetical proposal or exceptions. No merge/release grant.                         |
| T16-08 proposed successor / brief-quality review        | Accepted predecessor remains authoritative; passing tests or brief review cannot accept the successor, authorize affected implementation or grant READY. Exact owner acceptance and propagation remain required. |

Frozen inputs are at `/private/tmp/freemancodz-task16-hd64yubu`. `manifest.json` SHA-256 is `35786cb6b08dd46ac1891778b9ea07a74331a3fd3268db66a8283b508accb40f`; `cases.json` is `fa89b926284e946f21b7712acc006498c1a69fddd9407b9cc0b57cdfa65d2d12`. The manifest binds the actual handoff, proposed ADR, one-binding proposed exception and real-approval-reuse assessment. These deliberately isolated identifiers do not reserve live ADR/exception IDs. Detailed independent outcomes are retained in the [review ledger](setup/REVIEWS.md). R16-001's wording correction was independently verified: engineering READY follows current required evidence/review, while the later human merge/manual decision stays separate.

This task's executed checks are targeted Prettier, local-link/rule/command consistency, preservation hashes and the genuine separate tabletop review. No new application/DB/browser run was needed for these documentation changes. Historical matching runtime/hosted receipts retain their exact scope; final changed documentation still needs current publication/head evidence before final PR handoff.

No application, accepted decision, live milestone, script, test, hook, CI or hosted setting is changed by this governance task. The [R14-01 correction](setup/evidence/task-14-correction.md) is independently verified; the [hosted PR trial](setup/evidence/hosted-quality-trial.md) records actual positive/failing/corrected Actions and required checks. Main-push execution remains unexercised, and no protected merge or production release occurred. The catalogue's ecommerce cases are not applicable. Final setup readiness and remaining risks belong in the checklist, separately from future product/release approval.
