# Source snapshot: 📄 Task 15 — Integrate Milestone Verification & Independent Review

Source: https://app.notion.com/p/416b505dc85281c496bedb93122f928f?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-13T08:08:13.516Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc85281c496bedb93122f928f as of 2026-11-13T08:08:13.516Z:
<page url="https://app.notion.com/p/416b505dc85281c496bedb93122f928f" icon="📄">
<ancestor-path></ancestor-path>
<properties>
{"title":"Task 15 — Integrate Milestone Verification & Independent Review"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📄"}</iconMetadata>
<content>
Use this after independent review and enforcement validation exist. The prompt extends the repository's current milestone workflow rather than replacing it. Known hosted and evidence-integrity issues remain separate follow-ups.

```txt
# Task 15: Integrate Verification & Independent Review into Milestone Delivery

Act as a Principal Software Engineer and Agent Workflow Architect.

## Objective

Integrate the existing APPROVED engineering controls into this repository's established milestone-authoring and milestone-execution workflow.

Every implementation milestone must reach a verifiable handoff: **implementation → applicable checks → revision-matched evidence → independent review → corrections or approval → completion**.

Preserve the current milestone workflow, its ownership and human approval boundaries. Do not create a parallel milestone-management system.

## Inputs

Read and inspect:
- Existing milestone authoring/execution skills, live milestone templates, delivery-workflow skill, repository `AGENTS.md`, and any related approved project instructions.
- `.agents/skills/independent-review/SKILL.md` and `docs/engineering/REVIEW_PROTOCOL.md`.
- `docs/engineering/VERIFICATION_CONTRACT.md`, `QUALITY_GATES.md`, `GATE_VALIDATION.md`, and `INTEGRATION_VERIFICATION.md`.
- Approved architecture, coding standards, ADRs, compliance baseline, exception register, and enforcement matrix.
- Actual commands (`npm run verify`, `npm run verify:acceptance`, scoped checks) and any supported project-local Codex hook configuration.

Do not assume a hook or agent automatically executes because a configuration file exists. Verify actual discovery and activation.

## Mandatory ADR Approval Checkpoints

The existing milestone system MUST perform a visible architectural-impact review (1) **during milestone authoring before execution approval**, (2) **during planning/orchestration before dispatching affected tasks**, (3) **at implementation when a previously unforeseen decision arises**, and (4) **at final independent review before READY FOR MERGE**.

Use `NONE`, `EXISTING APPROVED ADR`, or `NEW/REVISED ADR REQUIRED`. For a new/revised decision, the Orchestrator presents a concise proposed-ADR brief to the owner with recommendation, alternatives, impact, and affected/blocked tasks. Stop only dependent work. No acceptance of a proposal, implementation of the proposed approach, or READY status may be inferred from a passing test, reviewer verdict, or silence. Record owner `APPROVE`/`REVISE`/`REJECT` evidence; on approval, propagate the accepted ADR and changed contracts, tasks, tests, and handoff before resuming. Owner architectural approval and owner merge approval are separate.

## Responsibilities

1. **Map the existing workflow.** Identify its authoring, approval, execution, checkpoint, review, handoff, and completion stages. Locate its canonical instructions and artifacts. Extend existing skills rather than replacing or duplicating them.

2. **Define the milestone completion contract.** A milestone may be marked implementation-complete only when its approved acceptance criteria are met; applicable deterministic checks, targeted functional/integration/browser tests, and the required canonical verification have produced trustworthy results; and an independent reviewer has returned PASS on the same implementation snapshot.

3. **Attach standards to implementation.** Ensure the implementer reads relevant architecture, coding standards, ADRs, and scoped exceptions before editing. The Orchestrator MUST classify architecture impact and record required ADR references before milestone execution; the Execution Agent MUST independently raise unforeseen decisions and stop dependent work immediately. A new rule, exception, or material architectural deviation must be escalated before affected implementation, never introduced silently.

4. **Freeze and bind the reviewed change.** Require the base revision, target revision, and precise changed-file/diff identity. Verification evidence and independent review must correspond to that same snapshot (commit SHA plus tracked/untracked diff identity where applicable). Any code change after review invalidates the affected evidence and review verdict until rechecked.

5. **Run appropriate verification automatically at milestone checkpoints.** Invoke fast checks where genuinely useful during editing; at implementation handoff run the canonical `npm run verify` in the supported PostgreSQL-capable environment plus milestone-specific acceptance and risk-based checks. Record commands, exit codes, and non-sensitive evidence. Never claim that a missing, blocked, skipped, or partially run mandatory check passed.

6. **Validate evidence before trusting it.** Inspect recorded command exits and required JSON/report fields. Reject missing, malformed, schema-incompatible, stale, or revision-mismatched evidence as BLOCKED. Task 14 identified a CI wrapper accepting malformed JSON: do not assume that wrapper is trustworthy or silently mark it resolved. Track its remediation separately. Do not change CI/verifier infrastructure in this task unless explicitly authorised.

7. **Invoke truly independent review.** Hand the frozen diff, milestone specification, acceptance criteria, relevant rules/ADRs, and verified evidence to a separate reviewer context. Use the existing independent-review skill and its PASS / CHANGES REQUIRED / BLOCKED / ESCALATE verdicts. The implementer cannot approve its own work.

8. **Implement correction and escalation loops.** CHANGES REQUIRED returns findings to the implementer and triggers re-verification and re-review of the revised snapshot. BLOCKED stops dependent progression until evidence/capability/ADR approval is available; unrelated work may continue. ESCALATE produces a proposed-ADR decision brief with options for owner approval. After explicit APPROVE, update authoritative decisions and affected milestone/task instructions and reconfirm acceptance requirements before resuming; REVISE or REJECT returns affected work for re-planning. No silent exceptions, reduced tests, or automatic approvals.

9. **Separate milestone completion from product release.** The current JPScents D2–D4 acceptance tests remain failing and release readiness remains FAIL; that must not be concealed by a green scoped milestone or PR quality check. A milestone may complete if its own approved scope is verified and independent review passes, but no automatic release or claim of overall application readiness follows.

10. **Define agent-hook policy.** Inspect whether the supported coding agent can reliably invoke lightweight project-scoped post-edit or task-completion hooks. If supported and safe, a minimal hook MAY provide earlier feedback, with actual invocation evidence and no expensive full suite after every edit. Do not rely on Codex-specific hooks for portable enforcement. Do not add an unverified lifecycle hook or create infinite validation loops; if not suitable, leave it deferred and rely on explicit milestone checkpoints.

11. **Preserve human and hosting boundaries.** Owner authorisation remains required for material architectural changes, rule exceptions, destructive operations, merge, hosted branch protection, and deployment. GitHub Actions hosted execution is still unverified and `main` remains unprotected; track those as separate outstanding Task 12 follow-ups rather than calling them complete.

12. **Make completion visible to the orchestrator.** Define minimal milestone status and evidence fields: milestone ID, scope/acceptance checklist, architecture impact (NONE / EXISTING APPROVED ADR / NEW ADR REQUIRED), relevant/proposed ADR IDs, impacted and blocked tasks, owner architectural decision and reference, contract/task propagation and resumption status, snapshot identity, required checks, observed exit/status, reviewer context and verdict, outstanding risks, separate owner merge-authorisation status, and final READY / CHANGES REQUIRED / BLOCKED / ESCALATE outcome. A final owner summary should be short and decision-focused.

## Strictness Requirements

- Integrate into the existing authoring/execution workflow; do not create a second milestone framework or reviewer skill.
- A valid independent PASS and matching, trustworthy mandatory evidence are required for implementation-complete status.
- Missing runner, malformed evidence, skipped tests, stale diff, or missing separate reviewer MUST produce BLOCKED, not PASS.
- Do not rerun unrelated expensive checks unnecessarily, but never use old evidence for changed code.
- A new code change after review MUST trigger the applicable rechecks and fresh reviewer verdict.
- Preserve release-readiness failure for D2–D4 and the separate hosted GitHub protection and CI-evidence-parser gaps.
- Never weaken specifications, acceptance tests, checks, or existing approval requirements to make the workflow green.
- Do not modify production application behaviour as part of workflow integration.

## Deliverables

- Update only the necessary existing milestone/delivery skill or instruction files and narrowly scoped workflow scripts/configuration, if needed.
- Update `AGENTS.md` only if necessary to point to the existing integrated workflow.
- Create `docs/engineering/MILESTONE_INTEGRATION.md` documenting lifecycle triggers, delegated agent roles, evidence schema/snapshot binding, review/retry/escalation, approval boundaries, and known unresolved gaps.
- Add minimal isolated workflow tests/fixtures if required; reuse existing artifact locations and verification commands.

## Validation

1. Verify the existing milestone authoring, owner approval, and execution entry points still work.
2. Demonstrate an isolated trial milestone with valid matching evidence and an actual separate-reviewer PASS where capabilities permit.
3. Demonstrate that failing checks, malformed evidence, stale evidence, and missing independent review prevent completion.
4. Demonstrate CHANGES REQUIRED returns to implementation, and ESCALATE requires owner action.
5. Confirm the D2–D4 release block remains visible even when a scoped milestone passes.
6. Document precisely which hooks or automatic checkpoints actually fired and which remain advisory/unverified.
7. Check the diff for unintended edits and rerun relevant existing checks.
8. Demonstrate mandatory architectural impact screening during milestone authoring and planning, including a no-new-decision case and an authoring-stage proposed ADR that blocks dependent implementation.
9. Demonstrate an execution-discovered decision escalates via the Orchestrator, pauses only dependent tasks, and resumes only after explicit owner approval has been recorded and propagated.
10. Confirm independent review refuses PASS/READY FOR MERGE when any required ADR approval is unresolved; verify owner architectural approval never counts as merge approval.

If a genuinely independent context or required runner is unavailable, mark integration BLOCKED/UNVERIFIED rather than inventing proof.

## Execution Constraints

Do not modify production application code, business acceptance tests, approved architecture/standards/ADRs, exceptions, existing CI workflows, branch-protection settings, or deployment settings.

Do not change the CI evidence parser defect under this task. Record a separate remediation item with a reproducible failing example.

Do not commit, push, merge, deploy, or change hosted settings without explicit authorisation.

## Final Response Contract

No more than 120 words covering:
1. **Integrated:** Existing milestone components updated.
2. **Evidence:** One successful and relevant blocked/retry trial with revision-matched proof.
3. **Limitations:** Any unsupported hooks or unavailable independent review.
4. **Open issues:** Evidence-parser defect, unverified hosted CI, unprotected branch, and D2–D4 acceptance blockers.
5. **Next step:** Whether Task 16 can begin.

Detailed workflow diagrams, evidence, and remediation records belong in the repository documentation, not the final message.
```

</content>
</page>
