# Freemancodz V4 architectural decision registry

Recorded: **2026-11-13** · Task06 · impact: **EXISTING APPROVED ADR** application.

This is the single ADR index for existing-codebase setup, new setup, reconciliation and ongoing milestone delivery. It records the two evidenced architectural decisions already accepted by the owner; it introduces no new architectural decision, exception or implementation permission. Task06's independent review is recorded in the [setup checklist](../../engineering/ENGINEERING_SETUP_STATUS.md) and [review log](../../engineering/setup/REVIEWS.md). Creating this index does not itself pass Task06 or start Task07.

## Authority and prerequisites

The [architecture contract](../ARCHITECTURE.md) owns ARC rules. The [coding standards](../../engineering/CODING_STANDARDS.md) own STD rules. [AGENTS.md](../../../AGENTS.md) and the [architecture skill](../../../.agents/skills/nextjs-architecture/SKILL.md) remain required inputs; accepted D2 changes only its recorded ARC-006/007 scope until Task08 aligns the skill text. All other requirements remain binding.

The owner's [catalogue ADR contract](../../engineering/setup/prompts/catalogue.md#mandatory-adr-approval-contract) and ARC-015/016 govern the lifecycle below. Task16 will establish `docs/engineering/CHANGE_CONTROL.md` consistently with that same authority; it does not create a second approval route. Existing host milestone-authoring/workflow skills are reused, with repository-specific linkage and trials scheduled for Tasks15–16.

Both Task06 prerequisites were verified before execution:

| Prerequisite                     | Explicit owner evidence                                                                                                                                 | Independently verified propagation                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Architecture and D1/D2           | [APPROVAL-001](../../engineering/setup/APPROVALS.md#approval-001--d1-and-d2-approved), 2026-11-13; exact response and reviewed proposal hashes retained | [Task04 acceptance propagation PASS](../../engineering/setup/REVIEWS.md#task-04--acceptance-propagation-pass) |
| Coding standards and CS-D1–CS-D3 | [APPROVAL-002](../../engineering/setup/APPROVALS.md#approval-002--coding-standards-approved), 2026-11-13; reviewed proposal hash retained               | [Task05 acceptance propagation PASS](../../engineering/setup/REVIEWS.md#task-05--acceptance-propagation-pass) |

The executor read and acknowledged the [Task06 handoff](../../engineering/ENGINEERING_SETUP_STATUS.md#task-06-execution-handoff), independently assessed the accepted scope and found no new architectural choice necessary. Standards approval did not expand D2, waive existing debt or authorise hosted changes, Git publication, merge or release.

## Accepted decisions

| Stable ID / record                                   | Decision                                                                                | Status, recording and decision dates                         | Rules / related standards                                          | Approval and exact scope                                                                                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ADR-0001](0001-canonical-architecture-authority.md) | Canonical architecture authority and one shared approval/change-control navigation path | **ACCEPTED**; recorded 2026-11-13; owner decision 2026-11-13 | ARC-001, navigation for ARC-015/016; STD-001/023/024               | APPROVAL-001 / D1. Reuse existing instructions and milestone lifecycle; no parallel framework or reapproval of unchanged rules.                             |
| [ADR-0002](0002-injected-ports-and-inert-errors.md)  | Type-only injected technical ports and narrowly bounded inert public error contracts    | **ACCEPTED**; recorded 2026-11-13; owner decision 2026-11-13 | ARC-006 and bounded ARC-007 extension; STD-001/006/008/011/015/018 | APPROVAL-001 / D2. Preserves injected runtime behaviour and infrastructure factories; excludes client-file errors and private Meeting helper/config access. |

The individual records preserve the original owner brief, alternatives, trade-offs, approval evidence and original reviewed hashes. ADR-0002 depends on ADR-0001's authority/navigation; neither supersedes the other. **No ADR is currently superseded.** The next unused identifier is ADR-0003; it is not reserved for a decision or authorised by this statement.

CS-D1 naming/import/type precision, CS-D2 complexity review and CS-D3 UI/async obligations were separately accepted in APPROVAL-002. They remain in the coding standards and are mapped above where relevant. They are not additional architectural choices requiring duplicate ADRs. No D3–D5 architectural decisions are documented in this setup; template labels are not evidence that such decisions exist.

## Inherited requirements and historical uncertainty

The current modular monolith, single composition root, module/UI boundaries, central environment authority, Prisma migration authority, published-content seed workflow, transaction/approval/claim invariants and verification obligations remain binding through existing instructions and the accepted contract. See ARC-002–005 and ARC-008–014. This index does not invent one historical ADR per rule or infer a past approval date from implementation.

The current source and [intelligence](../../CODEBASE_INTELLIGENCE.md)/[audit](../../engineering/CONTROLS_AUDIT.md) show why these responsibilities matter: persisted booking approvals, retries and uncertainty already require durable state and consistency controls. That is present-day source evidence; original debates, rejected alternatives and initial owner approval dates for those earlier implementation choices were not recorded in the inspected material.

History scope: baseline HEAD `f6ea50c13fbf245d4f0403c697c98f27cbd4f3f5`; `git ls-tree -r --name-only HEAD -- docs/architecture/adr` returned no tracked ADR paths. A bounded `git log -6 --format='%h %cs %s' -- AGENTS.md .agents/skills/nextjs-architecture/SKILL.md docs/architecture docs/engineering/CODING_STANDARDS.md` inspection showed instruction changes through commits including `78800c8` (2026-11-11) and `7e20f20` (2026-09-27). Commit messages record repository changes, not owner architectural acceptance. This is not an exhaustive history or a claim that no earlier discussion occurred. The new setup documents remain working-tree artifacts; no commit was authorised or created.

## Implementation and enforcement state

Approval, implementation, verification and enforcement are separate facts. A status of ACCEPTED means the recorded owner approved the exact decision; it does not imply that code conforms, tests ran or a merge gate rejects violations.

| Decision / contract         | Implemented or observed                                                                                                                                                                | Still required / not claimed                                                                                                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR-0001                    | Accepted architecture/ADR metadata and approval evidence propagated and independently verified; this task adds the single index. Existing global milestone checkpoints were inspected. | Task06 index review; Task08 instruction/skill alignment; Tasks15–16 authoring/planning/execution-discovery/review/separate-merge-handoff trials and shared change-control completion.                                                     |
| ADR-0002                    | Approved rule text and candidate error/type shapes inspected; technical injection patterns already exist.                                                                              | Task07 classification of actual edges; no legacy waiver. Meeting helper/config and Resend client-file error debt remain unresolved. Precise resolved-import/type-value/inertness checks and behavioural evidence are not yet established. |
| Approved STD rules          | Existing formatting/lint/type tools and focused tests available; standards owner approval and propagation independently verified.                                                      | Task03's eleven bounded formatting failures, test isolation/skip gaps and browser/build/provider limits remain open. Adoption of rules does not fix source drift.                                                                         |
| Hosted/operational controls | Audit observed main deletion/force-update protection and Vercel status.                                                                                                                | No observed required quality-check/PR gate; no inference of scheduler, DB migration/privilege, provider, release or operational readiness. No hosted settings changed.                                                                    |

Exact executed results and scope remain in the audit: lint/typecheck/schema validation passed; 39 unit cases passed; the approved loopback integration rerun passed 40 with six DB skips. No skipped case becomes verified through this registry. Future controls must be tested at their actual rejection boundary; naming a check is not enforcement evidence.

## Record format and stable naming

Use the existing sequence `0001-descriptive-kebab-case-title.md` and stable identifier `ADR-0001`. Do not renumber or reuse an existing ID. Every record includes:

1. Identifier/title and explicit status: **PROPOSED — AWAITING APPROVAL**, **ACCEPTED**, or **SUPERSEDED**.
2. Recording date and decision date separately, only where evidenced; unknown historical dates/rationale/alternatives are labelled not recorded.
3. Context/problem, exact decision, alternatives, rationale, trade-offs and consequences/affected components.
4. Related ARC/STD IDs, related ADRs and predecessor/successor links if applicable.
5. Implementation, migration, verification and enforcement state, including gaps and exact evidence scope.
6. Originating setup/milestone/task IDs, affected/blocked tasks, owner decision/reference/scope/version, propagation and executor acknowledgement/resumption state.

The existing two records contain these fields in their original brief, decision, propagation and evidence sections plus the Task06 cross-reference addendum. No fixed class/file template or separate management system is introduced. Approval references identify the exact reviewed version/hash; later metadata corrections remain traceable without changing normative substance.

## Shared lifecycle and agent handoff

This is navigation for the already binding catalogue and ARC-015/016, not a replacement policy. Routine work that conforms to approved contracts needs no new ADR.

1. **Assess:** during milestone authoring and planning, the orchestrator records `NONE`, `EXISTING APPROVED ADR`, or `NEW/REVISED ADR REQUIRED`, with applicable rules and evidence. The execution agent independently reassesses before affected work and whenever an unforeseen consequential choice arises. A source pattern alone is not an accepted ADR.
2. **Propose and block:** a new/revised boundary, dependency, data/transaction owner, consistency contract or exception gets a **PROPOSED — AWAITING APPROVAL** ADR. The concise owner brief identifies the problem, recommendation, alternatives/trade-offs, rule/ADR IDs, originating task/milestone IDs and exact blocked work. The executor escalates through the orchestrator and stops dependent work immediately; unrelated work may continue only if it does not constrain the decision.
3. **Owner decision:** only an explicit authorised human `APPROVE`, `REVISE` or `REJECT` resolves the request. Record evidence/reference, date, reviewed version/hash, scope and affected tasks. Silence, code already written, passing tests and reviewer approval cannot change a proposal to ACCEPTED. A rejected or revision-requested proposal stays non-accepted, with its disposition/history retained; affected work is replanned rather than silently adopting it.
4. **Propagate and resume:** after APPROVE, align the accepted ADR, architecture/standards, bounded debt/exception scope, applicable milestone/task instructions and verification/enforcement requirements; send a matching execution handoff and obtain acknowledgement. Record resumption only when these inputs agree. Future artifact work is explicitly scheduled, not falsely completed or made a circular prerequisite for its authoring task. The checklist records dispatch and current progress; approval alone is not execution evidence.
5. **Independent review:** the reviewer checks exact owner scope/version, corresponding implementation and revision-matched executed evidence. Unapproved architectural implementation, unresolved dependent ADRs or unmatched changes prevent implementation PASS/READY FOR MERGE. Proposal-quality review is possible without adoption. Corrections return to the executor and are reverified/reviewed; tests/rules are not weakened to obtain PASS.
6. **Merge separately:** after implementation, applicable checks and independent review, the owner makes a separate merge decision. Architectural/standards approval, including permission to continue setup, does not authorise commit, push, merge, hosted changes or release outside their explicit scope.
7. **Supersede:** a material revision uses a new proposed ADR linked to its predecessor. Keep the accepted predecessor authoritative until the new decision is explicitly approved and its propagation/adoption boundary is recorded. Mark the predecessor SUPERSEDED only with the evidenced successor relationship and effective scope; preserve its original decision, dates and rationale. A partial replacement must state which rules remain in force rather than implying a blanket repeal.

Milestone records carry impact class, ADR IDs/status/version, affected/blocked task IDs, owner evidence, propagation and resumption status. The same registry is used by setup and the existing milestone workflow. Task15/16 trials must demonstrate these checkpoints; this documentation is not their execution proof.

## Open Decisions

**No unresolved owner decision is recorded for ADR-0001/0002 or the adopted coding standards.** Task06 proposes no additional architectural choice. The following remain open work/evidence, not silently accepted decisions:

- Task07 must classify observed dependency/configuration drift and determine scoped remediation or a separately proposed exception; no exception is currently granted by these records.
- Task08 must align skill references to the accepted scope. D2's existing owner directive governs only its exact change in the interim; other skill/AGENTS rules remain binding.
- Missing DB/browser/build/operational and hosted quality-gate evidence must be addressed by the later applicable tasks. Hosted-enforcement changes retain their explicit approval requirement.
- If reconciliation exposes a genuinely new architecture decision or contradictory approved source, stop its dependent work and use the lifecycle above. Do not reinterpret D2, invent historical approval or create an accepted ADR to legitimise drift.

Task07 is **not started by this record**. Its dispatch requires independent Task06 PASS and the orchestrator's next handoff. No engineering-readiness, merge or release conclusion follows from registry completion.

## Task06 validation scope

Only this index and additive cross-references under `docs/architecture/adr/` are authored in Task06. Existing ADR decision/rationale/exclusion content is preserved. Validation covers exact approval references/scope, stable IDs, relative links/anchors, mappings to existing ARC/STD IDs, pending-vs-accepted status, preserved source/approved specifications and formatting. Prior runtime evidence is reused within its audit limits; no new application/database/provider/browser/build checks are claimed. Exact commands/results and final artifact hashes accompany the independent-review handoff and are recorded centrally by the orchestrator.
