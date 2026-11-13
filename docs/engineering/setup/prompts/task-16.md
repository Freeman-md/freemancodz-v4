# Source snapshot: 📄 Task 16 — Architecture Change Control & Engineering Handoff

Source: https://app.notion.com/p/416b505dc8528177aeedc3b068ae9992?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-13T08:08:51.030Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc8528177aeedc3b068ae9992 as of 2026-11-13T08:08:51.030Z:
<page url="https://app.notion.com/p/416b505dc8528177aeedc3b068ae9992" icon="📄">
<ancestor-path></ancestor-path>
<properties>
{"title":"Task 16 — Architecture Change Control & Engineering Handoff"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📄"}</iconMetadata>
<content>
Final reusable setup task. Establish approval-based architectural change control and produce an honest engineering-readiness handoff without claiming that pending application or hosted enforcement issues are resolved.

```txt
# Task 16: Establish Architecture Change Control & Final Engineering Handoff

Act as a Principal Software Architect and Engineering Governance Lead.

## Objective

Establish a lightweight, enforceable change-control process so coding agents can evolve the architecture and engineering standards **only through explicit, traceable approval**, with corresponding specifications, tests, and enforcement updated together.

This is the final repository engineering-setup task. It must also give the owner a short, evidence-based handoff stating what is ready for delegated development and what remains blocked.

Do not confuse completion of this governance setup with completion of product features, hosted merge protection, or release readiness.

## Inputs

Read and verify:

- `AGENTS.md` and existing relevant agent/milestone/review skills.
- `docs/architecture/ARCHITECTURE.md` and `docs/architecture/adr/README.md` plus accepted ADRs.
- `docs/engineering/CODING_STANDARDS.md`, `EXCEPTIONS.md`, `COMPLIANCE_BASELINE.md`, and `ENFORCEMENT_MATRIX.md`.
- `docs/engineering/VERIFICATION_CONTRACT.md`, `INTEGRATION_VERIFICATION.md`, `QUALITY_GATES.md`, `GATE_VALIDATION.md`, `REVIEW_PROTOCOL.md`, and `MILESTONE_INTEGRATION.md`.
- Actual tracked quality scripts, hooks, CI configuration, and repository status.

Confirm which decisions and conventions are genuinely approved. Distinguish source documentation from executed evidence and any unavailable hosted settings.

## Responsibilities

1. **Establish the change request contract.** Define when an agent MUST request approval: architectural boundaries, dependencies, data/transaction ownership, coding-standard changes, mandatory-check changes, new suppressions/exceptions, security-relevant rules, or consequential trade-offs. Routine implementation that follows current rules does not require a new ADR. Require architectural impact screening during milestone authoring/planning and during implementation; the Orchestrator owns approval requests and the Execution Agent owns immediate discovery/escalation of unexpected decisions.

2. **Require an impact assessment.** Every proposed deviation MUST state the current rule/ADR IDs, problem and motivating evidence, proposed change, alternatives, consequences, affected features, relevant migrations/data risks, backward compatibility, test impacts, enforcement updates, rollout/rollback plan, and the recommended option. Keep the owner-facing summary short.

3. **Make approval explicit and narrowly scoped.** A proposal starts PROPOSED; its dependent tasks remain BLOCKED until decision. Only an evidenced owner/authorised decision can mark it ACCEPTED. Present a short decision brief showing ADR ID, recommendation, alternatives, risks, rule changes, affected milestone/tasks, and blocked work. Record the owner response (APPROVE / REVISE / REJECT), reference, date where evidenced, scope, and affected tasks. Silence, an AI review verdict, a passing test, or implementation convenience MUST NOT count as approval. Revisions and rejections return affected work for replanning; no agent may silently adopt them.

4. **Manage ADR lifecycle.** Reuse the existing ADR naming/status scheme. Preserve historical decisions; supersede rather than overwrite materially changed decisions. Link successors and predecessors, preserve rationale, and record the current approval date only when evidenced. Maintain stable rule IDs; do not silently redefine an existing identifier to mean a different rule.

5. **Synchronise authoritative artifacts after approval.** Define the ordered update sequence: accepted ADR with explicit owner approval evidence and relevant architecture/standards → permitted exceptions and debt tracking → affected milestone/task scope and Execution Agent handoff → enforcement matrix and deterministic checks → tests/integration/acceptance evidence → agent/milestone instructions and review criteria → CI/release requirements where authorised. Resume dependent work only after approved contracts and affected instructions agree. Require independent review and revision-matched verification before declaring an approved change adopted.

6. **Treat temporary exceptions as controlled debt.** An exception must identify exact rule, file/symbol or bounded scope, rationale, approving decision, review trigger, and intended removal or expiry when applicable. Prevent exception drift, blanket suppressions, automatic baseline expansion, and permanent silent waivers.

7. **Separate approval, adoption, and enforcement.** Report these states independently: APPROVED (owner accepted the decision), IMPLEMENTED (code or documentation reflects it), VERIFIED (applicable evidence was executed), and ENFORCED (a real check or reviewed gate operates at its stated boundary). No agent may claim one state implies the others.

8. **Bind the workflow to milestone delivery.** Point to the existing milestone and independent-review process for implementations resulting from approved changes. Define architecture-impact, ADR-reference, decision-status, blocked-task, approval-reference, and resumption fields in milestones. Require an authoring-stage checkpoint before affected execution and an execution-stage escalation checkpoint when new decisions emerge. Final review MUST block PASS/READY FOR MERGE for unresolved approvals. Owner architectural approval occurs before affected implementation; separate owner merge approval occurs only after verified independent review. Do not create a competing feature-delivery workflow. A reviewed diff must remain revision-matched; code changes after review require relevant rechecks and new review.

9. **Define drift detection and maintenance.** State how subsequent repository intelligence refreshes, failed checks, independent reviews, or changed requirements trigger a proposed ADR/standard update. Document that routine agents should inspect current canonical files, not rely on old summaries. Make adding rules a deliberate approval and testable-enforcement decision.

10. **Validate the change-control contract safely.** Run an isolated tabletop/dry-run with a hypothetical proposal involving an existing rule. Demonstrate that an unapproved change cannot be treated as accepted, that approval would require updating linked artifacts, and that a proposed exception does not silently widen an existing one. Do not create a fake approval or modify live standards as a test.

11. **Produce a final engineering-setup readiness snapshot.** Review the evidence from Tasks 1–15 and classify each major boundary as VERIFIED, CONFIGURED BUT UNVERIFIED, FAIL, BLOCKED, or NOT APPLICABLE. State the precise remaining owner and implementation actions, not just a generic green status.

## Known JPScents Issues to Preserve

- The CI evidence parser/wrapper accepted malformed JSON in Task 14; treat this as a distinct evidence-integrity remediation, not an approved exception.
- The hosted GitHub Actions run has not been verified and `main` is unprotected. Do not claim required status checks prevent merging.
- D2–D4 acceptance tests fail; release readiness remains FAIL until approved application changes genuinely satisfy them.
- Codex lifecycle hooks are deferred; Task 15 relies on explicit milestone checkpoints and independent review.
- Do not assume other repositories share these issues; only include them when actually found.

## Strictness Requirements

- No agent may amend approved architecture, standards, mandatory checks, ADR status, or exception scope without explicit authorisation.
- A new ADR is NOT required for ordinary changes that comply with existing contracts.
- A passing lint/check/AI review is NOT evidence of architectural approval.
- A new architectural decision requires explicit owner approval BEFORE the affected implementation begins or resumes, including decisions first discovered during execution. Unaffected independent tasks may continue.
- Architecture approval MUST NOT be conflated with separate owner authorisation to merge completed work.
- Never automatically broaden a violation baseline or weaken an acceptance test to unblock delivery.
- A rule change MUST include its effect on automated checks and verification; a documentation-only approval is not proof of operational enforcement.
- Do not conflate local checks, hosted merge protection, independent review, and release readiness.
- Preserve the existing milestone workflow and human merge/deploy authority.
- Do not fabricate historical approval, completion evidence, or operational checks.

## Deliverables

Create `docs/engineering/CHANGE_CONTROL.md` covering:

1. Decision categories and approval thresholds.
2. A copy-ready proposal template and concise owner decision brief.
3. States and transitions: proposed → approved/rejected → adopted → verified → enforced, with appropriate blocked states.
4. ADR supersession, rule IDs, exception lifecycle, and traceability.
5. The ordered cross-document/check/test update protocol.
6. Human escalation, independent review, and milestone integration.
7. A controlled dry-run with evidence of correct approval boundaries.

Create `docs/engineering/ENGINEERING_SETUP_STATUS.md` covering:

1. Repository revision and scope of assessment.
2. Evidence-linked setup checklist across Tasks 1–16.
3. Actual local and hosted enforcement status.
4. Implementation/acceptance and release-readiness status.
5. Outstanding defects, risk owners if documented, and exact next actions.
6. A concise handoff for the owner and future orchestrating agents.

Make minimal pointer updates to existing `AGENTS.md`, ADR index, or milestone/review skills ONLY when necessary to make the change-control entry point discoverable. Do not duplicate the policy across multiple files.

## Validation

1. Verify all references, rule IDs, and referenced artifacts exist.
2. Perform the isolated approval/denial dry-run without altering approved decisions.
3. Verify that the documented states distinguish approval from implementation, verification, and actual enforcement.
4. Confirm the existing milestone and independent-review workflow still applies without conflicts.
5. Demonstrate authoring-stage detection, execution-stage escalation, blocked dependent work, and explicit owner APPROVE / REVISE / REJECT handling using isolated scenarios.
6. Demonstrate an unresolved proposed ADR cannot receive PASS/READY FOR MERGE and owner architectural approval is not treated as merge approval.
7. Run relevant safe checks on changed documentation/instructions; record commands and results.
8. Verify the final readiness report does not claim hosted protection or release readiness without evidence.

## Execution Constraints

This is governance/documentation work. Only create the two named documents and make genuinely necessary, narrowly scoped pointers in existing instructions/ADR navigation.

Do NOT modify production code, tests, existing enforcement scripts, hooks, CI workflows, branch protections, deployments, architectural decisions, coding standards, or approved exceptions.

Do not commit, push, merge, deploy, or make destructive changes without explicit authorisation.

Any discovered operational defect belongs in an explicit remediation follow-up, not a silent scope expansion.

## Final Response Contract

Return no more than 120 words:

1. **Established:** Change-control artifacts and any navigation updates.
2. **Validated:** Dry-run outcome and checks actually executed.
3. **Readiness:** Which engineering controls are usable for delegated work and which remain unverified.
4. **Blockers:** Evidence parser, hosted protection, outstanding acceptance changes, and any new critical issues.
5. **Handoff:** Exact owner/agent actions needed before production or protected merging.

Keep full evidence and the future-agent runbook in repository documents.
```

</content>
</page>
