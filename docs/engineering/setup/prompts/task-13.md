# Source snapshot: 📄 Task 13 — Independent Architectural Review

Source: https://app.notion.com/p/416b505dc85281749f56e29c3795665d?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-13T08:08:12.379Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc85281749f56e29c3795665d as of 2026-11-13T08:08:12.379Z:
<page url="https://app.notion.com/p/416b505dc85281749f56e29c3795665d" icon="📄">
<ancestor-path></ancestor-path>
<properties>
{"title":"Task 13 — Independent Architectural Review"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📄"}</iconMetadata>
<content>
Use after automated quality gates have been configured. This prompt defines independent review and escalation; integration with the milestone workflow occurs in Task 15.

```txt
# Task 13: Establish Independent Architectural Review

Act as a Principal Software Architect establishing a reusable, independent code-review system for AI-assisted development.

## Objective

Create a review contract that enables a separate AI reviewer to independently assess implementation changes against the approved architecture, coding standards, business requirements, and verification evidence.

The reviewer must identify architectural drift, questionable implementations, missing tests, and consequential risks without requiring the repository owner to manually inspect every file.

This task establishes the review capability and escalation rules. Task 15 will integrate them into the existing milestone implementation workflow.

## Inputs

Inspect:

- `docs/architecture/ARCHITECTURE.md` and accepted ADRs.
- `docs/engineering/CODING_STANDARDS.md`.
- `docs/engineering/COMPLIANCE_BASELINE.md` and `EXCEPTIONS.md`.
- `docs/engineering/ENFORCEMENT_MATRIX.md`.
- `docs/engineering/INTEGRATION_VERIFICATION.md`.
- `docs/engineering/VERIFICATION_CONTRACT.md` and `QUALITY_GATES.md`.
- Existing `AGENTS.md`, review skills, delivery workflows, and milestone acceptance conventions.

Preserve existing review mechanisms wherever they already meet the requirements.

## Responsibilities

### 1. Establish independent review

Define a reusable review capability that:

- Runs in a separate agent context from the implementation agent.
- Reviews the actual source diff and affected dependencies, not merely the implementation summary.
- Reads the relevant approved specifications and ADRs.
- Identifies the intended change, acceptance criteria, and affected architectural boundaries.
- Does not inherit the implementation agent's conclusions as facts.

A reviewer MUST NOT approve its own implementation.

### 2. Define architectural review criteria

Evaluate:

- Layer responsibilities and dependency direction.
- Feature boundaries and public APIs.
- Business logic placement and separation of concerns.
- Database access, transactions, and consistency.
- Types, validation, error handling, and security.
- Naming, complexity, duplication, and maintainability.
- Approved architectural patterns and scoped exceptions.
- Unnecessary abstractions or inconsistent implementations.

Do not treat legitimate design variations as defects.

### 3. Review functional correctness

Independently inspect:

- Whether implementation satisfies the feature's acceptance criteria.
- Whether tests assert meaningful observable outcomes.
- Whether success, failure, and edge cases are covered.
- Whether mocks conceal important integration failures.
- Whether the implementation contains race conditions, stale writes, incorrect state transitions, or unexpected side effects.
- Whether changes introduce regressions in related features.

Prioritise functional tests and high-risk implementation paths rather than exhaustively reviewing every unchanged file.

### 4. Verify implementation evidence

The reviewer MUST:

- Inspect available verification output and actual command results.
- Distinguish executed tests from unverified claims.
- Confirm the relevant deterministic checks passed.
- Identify missing integration, browser, security, or release evidence.
- Never treat passing unit tests as proof of real-boundary behaviour.

Do not rerun expensive checks unnecessarily when trustworthy, commit-matched evidence already exists.

### 5. Establish finding classifications

Every material finding must have:

- Stable finding ID.
- Severity: Critical, High, Medium, or Low.
- Exact repository-relative evidence.
- Affected rule, ADR, or acceptance criterion.
- Explanation of impact.
- Recommended corrective action.
- Classification as Confirmed, Probable, or Unverified.

Distinguish:

- Newly introduced defects.
- Existing documented technical debt.
- Pending approved architectural changes.
- Legitimate exceptions.
- Unverified risks.

Avoid reporting known legacy violations as newly introduced defects.

### 6. Define review outcomes

Use these outcomes:

**PASS:** No blocking findings, required evidence is available, and the change satisfies its acceptance criteria.

**CHANGES REQUIRED:** Confirmed blocking findings must be corrected and independently reviewed again.

**BLOCKED:** Required evidence, review capability, or approval is unavailable. A proposed ADR awaiting an owner's decision blocks affected work and prohibits a PASS/READY FOR MERGE verdict.

**ESCALATE:** A material architectural decision, exception, or consequential trade-off requires human approval. Send an actionable proposed-ADR brief to the Orchestrator for owner review; do not allow the Execution Agent or reviewer to approve it.

A review MUST NOT return PASS simply because automated checks are green.

### 7. Establish human escalation rules

Escalate only consequential decisions, including:

- Changes to approved architectural contracts.
- New exceptions or rule suppressions.
- Conflicting business requirements.
- Material security, privacy, or data-integrity risks.
- Significant technical trade-offs without an approved precedent.
- Destructive or irreversible operations.
- Merge, release, or deployment decisions requiring owner authorisation.

Routine implementation corrections should return directly to the execution agent.

Human escalation must contain a concise problem statement, recommended option, alternatives, and consequences.

### 8. Define reviewer authority

The reviewer MAY:

- Inspect code, specifications, diffs, tests, and verification evidence.
- Report findings and request corrections.
- Recommend architectural changes or exceptions.
- Return a review verdict.

The reviewer MUST NOT:

- Approve new architectural decisions.
- Modify approved standards.
- Grant exceptions.
- Weaken verification requirements.
- Merge or deploy code.
- Silently fix implementation issues.
- Claim a missing second-agent review was completed.

### 9. Establish the review handoff contract

Define the minimum inputs supplied by an orchestrator to an independent reviewer:

- Repository and target revision.
- Base revision and implementation diff.
- Feature or milestone specification.
- Acceptance criteria.
- Relevant architecture and coding rules.
- Applicable ADRs and exceptions, including milestone architectural-impact classification, outstanding proposed ADRs, affected/blocked task IDs, and explicit owner approval evidence.
- Verification results and known limitations.

Define a structured reviewer response containing:

1. Review outcome.
2. Blocking findings.
3. Non-blocking recommendations.
4. Evidence examined.
5. Required corrections or approvals.
6. Remaining uncertainty.

Keep detailed findings in repository review artifacts; the owner receives only a concise decision summary.

## Deliverables

Create or update:

`docs/engineering/REVIEW_PROTOCOL.md`

This must define the independent review process, review criteria, severity classifications, evidence requirements, outcomes, escalation policy, and reviewer authority.

Create or update an appropriate repository-local review skill, for example:

`.agents/skills/independent-review/SKILL.md`

The skill must provide repeatable instructions for conducting the review and producing consistent results.

Reuse an existing review skill if one already provides equivalent functionality.

Do not duplicate the approved architecture or coding standards inside the skill. Reference their canonical locations.

## Validation

1. Verify that the review contract references existing, approved repository documents.
2. Confirm the review skill can be discovered and invoked through the repository's supported agent mechanism, where available.
3. Perform an isolated trial review of a representative existing change or controlled example.
4. Confirm the reviewer produces evidence-based findings, appropriate severity, and a defensible outcome.
5. Verify that missing evidence produces BLOCKED rather than a fabricated PASS.
6. Check that known baseline violations and pending D2–D4 changes are correctly distinguished from newly introduced defects.
7. Confirm existing milestone routing and verification commands remain unchanged.
8. Demonstrate that an implemented architectural change without accepted ADR evidence, and a milestone with a proposed ADR awaiting approval, cannot produce PASS or READY FOR MERGE. An authoring-stage proposal requires ESCALATE before affected implementation.

If a separate agent context is unavailable, report that limitation explicitly. Do not represent a self-review as independent.

## Execution Constraints

Modify only the review protocol and necessary repository-local review skill files.

Do not modify application code, tests, approved architecture, coding standards, ADRs, exceptions, verification scripts, Git hooks, CI, or deployment settings.

Do not integrate the reviewer into the milestone implementation workflow yet. That is Task 15.

Do not commit, merge, or deploy without explicit authorisation.

## Final Response Contract

Return no more than 120 words:

1. **Implemented:** Review protocol and skill created or updated.
2. **Review contract:** How independent review works and when humans are involved.
3. **Evidence:** Trial review results and verified invocation mechanism.
4. **Limitations:** Anything not yet automatically enforced or operational.
5. **Next step:** Whether Task 14 can begin.

Store detailed review procedures and evidence in repository files, not the final response.
```

</content>
</page>
