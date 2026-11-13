# Source snapshot: 📚 Repository Engineering Setup — Reusable Prompts

Source: https://app.notion.com/p/416b505dc85281e4b5b6d65e7fd02da0?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-13T08:07:15.852Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc85281e4b5b6d65e7fd02da0 as of 2026-11-13T08:08:51.030Z:
<page url="https://app.notion.com/p/416b505dc85281e4b5b6d65e7fd02da0" icon="📚">
<ancestor-path></ancestor-path>
<properties>
{"title":"Repository Engineering Setup — Reusable Prompts"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📚"}</iconMetadata>
<content>
A reusable onboarding and engineering-governance sequence for any new or inherited codebase. This Notion catalogue stores the reusable prompts; each repository stores its own specifications, code, checks, and verification evidence.

<b>Operating model:</b> The orchestrator delegates execution and independent review, while you retain approval of material architectural decisions. Keep technical details in repository artifacts and human-facing summaries brief.

## Task prompt library

Use the child pages below in order. Every page contains a copy-ready task prompt.

<b>Execution rule:</b> All 16 copy-ready prompts are now catalogued. An orchestrator must still verify each target repository's prerequisites, evidence, decisions, and approval gates. Resume from the last verified task when work is interrupted.

<page url="https://app.notion.com/p/416b505dc85281928109f96846830891">
Task 01 — Universal Codebase Intelligence Prompt
</page>

<page url="https://app.notion.com/p/416b505dc85281118b53d485b50e8686">
Task 02 — Persist Codebase Intelligence Report
</page>

<page url="https://app.notion.com/p/416b505dc85281c0b0b7d1b09f2d10bc">
Task 03 — Audit Engineering Controls
</page>

<page url="https://app.notion.com/p/416b505dc8528121a8ebdda9c95d1ed0">
Task 04 — Define the Architecture Contract
</page>

<page url="https://app.notion.com/p/416b505dc852818ab3fcf2fb1bbdbbee">
Task 05 — Define Coding Standards & Conventions
</page>

<page url="https://app.notion.com/p/416b505dc85281e493d0dc31a7e50581">
Task 06 — Establish Architectural Decision Records
</page>

<page url="https://app.notion.com/p/416b505dc85281b1886efaea9593eee5">
Task 07 — Compliance Baseline & Exception Registry
</page>

<page url="https://app.notion.com/p/416b505dc85281b5b4b8c462923ef890">
Task 08 — Configure Agent Instructions
</page>

<page url="https://app.notion.com/p/416b505dc85281fb89b8e82e007e492e">
Task 09 — Implement Deterministic Engineering Checks
</page>

<page url="https://app.notion.com/p/416b505dc852819f9b75f72b40872265">
Task 10 — Risk-Based Integration Verification
</page>

<page url="https://app.notion.com/p/416b505dc85281f38229d7550e24518d">
Task 11 — Canonical Verification & Evidence
</page>

<page url="https://app.notion.com/p/416b505dc85281a9a757e9d580b78ec4">
Task 12 — Automate Quality Gates with Git Hooks & CI
</page>

<page url="https://app.notion.com/p/416b505dc85281749f56e29c3795665d">
Task 13 — Independent Architectural Review
</page>

<page url="https://app.notion.com/p/416b505dc85281a79923fc982713d217">
Task 14 — Validate Engineering Enforcement
</page>

<page url="https://app.notion.com/p/416b505dc85281c496bedb93122f928f">
Task 15 — Integrate Milestone Verification & Independent Review
</page>

<page url="https://app.notion.com/p/416b505dc8528177aeedc3b068ae9992">
Task 16 — Architecture Change Control & Engineering Handoff
</page>

<b>Library status:</b> Complete reusable prompt library for Tasks 1–16. Prompts are templates; their presence does not establish that any target repository has completed the tasks.

## Reusable setup sequence

1. Run the codebase intelligence assessment.
2. Persist the intelligence report in the repository.
3. Audit existing instructions, skills, tests, tools, hooks, and CI.
4. Define and approve the architectural contract.
5. Define and approve coding standards and conventions.
6. Record significant architectural decisions as ADRs.
7. Triage existing code violations and document approved exceptions.
8. Point agent instructions to canonical specifications and checks.
9. Implement deterministic style, type, dependency, and architecture checks.
10. Add architecture and risk-specific integration tests.
11. Provide one canonical verification command with visible exit status and results.
12. Run appropriate local hooks and mandatory CI status checks.
13. Introduce independent architectural review and human escalation rules.
14. Prove the gates work by deliberately testing controlled violations.
15. Integrate the verification contract with the existing milestone workflow.
16. Define how architectural changes are proposed, approved, and reflected in rules.

## Agent orchestration instructions

When assigned this page and a target repository:

1. <b>Plan and track:</b> Read all available task prompts and the 16-step sequence; establish a persistent, repository-specific checklist with task statuses, deliverables, check results, review verdicts, and required approvals. Inspect existing progress so completed tasks are verified rather than blindly repeated.
2. <b>Delegate:</b> For each ready task, give its full child-page prompt and repository context to an execution agent. Keep milestone/feature implementation in its separate established workflow.
3. <b>Independently review:</b> Have a separate review agent examine the actual changed files, requirements, rule compliance, and relevant check results, not just the executor's summary. Require evidence of completion and explicit PASS/FAIL/UNVERIFIED outcomes.
4. <b>Correct and advance:</b> Return failures to the execution agent, rerun verification, and advance only after an evidenced PASS and any required human approval. Never weaken tests, rules, or acceptance criteria to obtain a pass.
5. <b>Escalate decisions:</b> The Orchestrator must assess architectural impact during milestone authoring/planning, and the Execution Agent must re-assess during implementation. New architectural decisions or exceptions must be proposed to the owner before affected work continues. An independent reviewer must verify approval before PASS. Do not silently approve decisions, merges, or deployments.
6. <b>Report concisely:</b> Store technical details in repository documentation. Give the user only key decisions, blockers, and a compact final summary of completed tasks, outstanding risks, and evidence. Do not claim approvals or operational controls that have not been verified.
7. <b>Preserve two owner approvals:</b> Architectural approval is required BEFORE implementing a new architectural decision; merge approval is separate and occurs AFTER implementation, verification, and independent review. Record both decisions separately. Unaffected tasks may proceed while dependent tasks remain blocked.

<b>Completion condition:</b> All 16 tasks are verified, applicable human approvals are recorded, mandatory checks are genuinely operational and observable, and remaining exceptions are explicitly documented.

## Mandatory ADR Approval Contract

This contract applies to <b>initial existing-codebase setup, new-codebase setup, recurring reconciliation, and ongoing milestone delivery</b>. All entry points and the repository's existing milestone workflow MUST use the same ADR registry and change-control authority—do not create a parallel approval process.

1. <b>Detect:</b> During milestone authoring and planning, the Orchestrator classifies architectural impact as <code>NONE</code>, <code>EXISTING APPROVED ADR</code>, or <code>NEW/REVISED ADR REQUIRED</code>. The Execution Agent independently repeats this assessment before affected implementation and whenever a consequential design choice arises. Routine work following approved contracts does not need a new ADR.
2. <b>Propose and pause:</b> For a new/revised architectural contract, prepare a <code>PROPOSED — AWAITING APPROVAL</code> ADR and a concise owner brief (problem, recommendation, alternatives, trade-offs, relevant rule/ADR IDs, affected milestone/task IDs, and exactly what work is blocked). Stop dependent work immediately; unrelated work may continue if it does not constrain the pending decision.
3. <b>Decide:</b> Only the owner/authorised human may <code>APPROVE</code>, <code>REVISE</code>, or <code>REJECT</code>. Record the explicit decision, approval evidence/reference, scope, and affected tasks. Silence, agent review, completed implementation, or passing checks do not count as approval.
4. <b>Propagate and resume:</b> On approval, update the accepted ADR and affected architecture/standards, milestone and task instructions, verification/enforcement requirements, and Execution Agent handoff. Resume dependent work only after these agree. Revision or rejection returns affected work for re-planning; do not adopt the rejected approach.
5. <b>Review and merge separately:</b> The independent reviewer MUST confirm no unapproved architectural change, unresolved proposed ADR, or unmatched implementation exists before <code>PASS</code> or <code>READY FOR MERGE</code>. Owner architectural approval never implies permission to merge; completed implementation requires a separate merge authorisation.

<b>Milestone record:</b> Architecture impact; ADR IDs; decision status; affected/blocked task IDs; owner decision evidence; propagation and resumption status. Missing approval means dependent work remains <code>BLOCKED</code>.

## Engineering Setup Entry Points

Choose <b>one entry point</b> based on the repository's state. All three use this same 16-task prompt library, the reusable setup sequence, and the agent orchestration instructions above. They are not separate standards or competing workflows. Replace <code>[TARGET REPOSITORY]</code> before use.

### 1. Existing Codebase — Initial Engineering Setup

<b>When to use:</b> The repository already contains implementation, but has not completed this engineering setup (or its previous setup cannot be verified). Establish governance and enforcement before delegating further milestones.

```txt
Use this Notion engineering setup catalogue:
https://app.notion.com/p/416b505dc85281e4b5b6d65e7fd02da0

For [TARGET REPOSITORY], conduct the initial engineering setup of an existing codebase using the full 16-task sequence, task prompts, and agent orchestration instructions.

Inspect existing progress and create a persistent checklist. Delegate applicable tasks in order to an execution agent, use a separate reviewer to verify repository artifacts and execution evidence, and return corrections for rework until each task passes.

Reuse already-valid work instead of duplicating it, but do not skip a task without documented evidence or a justified not-applicable status. Escalate architecture, exception, hosted-enforcement, merge, and release decisions for my approval under the catalogue's rules.

Before handing the established repository to milestone delivery, verify authoring, execution, independent review, and merge handoff all follow this catalogue's mandatory ADR approval contract.

Keep detailed evidence in the repository and give me concise decisions, blockers, and the final engineering readiness status. Never claim a task, required gate, or release is complete without verification.
```

### 2. New Codebase — Initial Architecture & Engineering Setup

<b>When to use:</b> A greenfield repository contains requirements, a scaffold, or partial implementation but lacks an approved engineering system. Establish appropriate architecture before substantive feature development.

```txt
Use this Notion engineering setup catalogue:
https://app.notion.com/p/416b505dc85281e4b5b6d65e7fd02da0

For [TARGET REPOSITORY], establish the initial engineering architecture and enforcement system using the existing 16-task sequence, task prompts, and orchestration instructions.

This is a new repository that may contain only requirements, scaffolding, or partial implementation.

Adapt the existing tasks to the repository's maturity. Where architecture or standards do not yet exist, propose them using the relevant task prompts and obtain my approval before adopting them.

Create a checklist, delegate work to an execution agent, independently review deliverables, and continue through the applicable setup sequence. Mark requirements that cannot yet be exercised as not applicable or unverified with supporting reasons, not as passed.

Do not invent existing functionality, violations, or verification evidence. Preserve the catalogue's approval requirements, enforcement standards, and separate milestone workflow boundaries.

Ensure foundational architecture decisions are approved before affected development and that future milestone authoring and execution inherit the same mandatory ADR approval checkpoints.

Report material decisions, blockers, and final engineering readiness.
```

### 3. Established Codebase — Recurring Engineering Reconciliation

<b>When to use:</b> The repository has already completed the initial setup and undergone subsequent milestones, architectural changes, or meaningful development. Maintain its approved engineering contracts without repeating the entire setup.

```txt
Use this Notion engineering setup catalogue:
https://app.notion.com/p/416b505dc85281e4b5b6d65e7fd02da0

For [TARGET REPOSITORY], conduct a recurring engineering reconciliation using the existing task library, approved specifications, and orchestration instructions.

This repository has already completed its initial engineering setup.

Identify the last verified baseline and what has changed since then, determine which existing tasks need to be revisited, and create a scoped checklist.

Delegate the necessary tasks to an execution agent, independently review the results, and reconcile outdated descriptive documentation and applicable enforcement. Treat unapproved architectural drift as a finding or proposal, never as an automatically accepted design change.

Do not restart the entire 16-task setup or silently modify approved architectural decisions, ADRs, coding standards, or exception scope.

Follow the catalogue's existing verification, change-control, milestone, and human-approval requirements.

For architectural drift or new patterns without approval, create a proposed ADR, mark dependent remediation or adoption work blocked, and seek an explicit owner decision before treating the pattern as authorised. Do not retrospectively approve drift.

Report only material changes, architectural inconsistencies, decisions requiring approval, and final verification status.
```

<b>Ongoing milestone delivery (fourth case, not a setup entry point):</b> Use the established milestone workflow. Assess architecture before execution, escalate unexpected decisions during implementation, and require an independent approval check before READY FOR MERGE. Architectural approval is not merge approval.

<b>Shared completion rule:</b> For all three entry points, the orchestrator tracks task status and evidence, uses an independent reviewer where required, pauses for consequential owner approvals, and does not confuse engineering setup with product release readiness.
</content>
</page>
