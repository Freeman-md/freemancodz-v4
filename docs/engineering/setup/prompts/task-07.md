# Source snapshot: 📄 Task 07 — Compliance Baseline & Exception Registry

Source: https://app.notion.com/p/416b505dc85281b1886efaea9593eee5?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-12T09:39:41.072Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc85281b1886efaea9593eee5 as of 2026-11-12T09:39:41.095Z:
<page url="https://app.notion.com/p/416b505dc85281b1886efaea9593eee5" icon="📄">
<ancestor-path></ancestor-path>
<properties>
{"title":"Task 07 — Compliance Baseline & Exception Registry"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📄"}</iconMetadata>
<content>
Use this reusable prompt for a repository whose architectural and coding standards have been approved. Do not implement the findings as part of this task.

```txt
# Task 7: Establish Compliance Baseline & Exception Registry

Act as a Principal Software Architect and Engineering Quality Lead.

## Objective

Audit the existing repository against its approved architecture, coding standards, and ADRs.

Produce an evidence-based compliance baseline so future agents can distinguish existing technical debt from newly introduced violations and legitimate exceptions.

This is a documentation and classification task, not a refactoring exercise.

## Inputs

Read and verify:

- `docs/CODEBASE_INTELLIGENCE.md`
- `docs/engineering/CONTROLS_AUDIT.md`
- `docs/architecture/ARCHITECTURE.md`
- `docs/engineering/CODING_STANDARDS.md`
- `docs/architecture/adr/README.md` and all accepted ADRs.
- Existing agent instructions, relevant tests, checkers, and approved exceptions.

Confirm that the architectural and coding standards are approved. Do not assume every approved decision has already been implemented or enforced.

## Responsibilities

1. **Audit compliance:** Inspect the actual source code against approved architectural and coding rule IDs, using automated checks and targeted code inspection where appropriate.

2. **Identify violations:** Record confirmed deviations involving architecture, dependency boundaries, responsibilities, naming, complexity, typing, validation, state management, and established coding conventions.

3. **Distinguish implementation gaps:** Identify accepted architectural decisions that are not yet implemented without confusing planned changes with unauthorised exceptions.

4. **Identify verification gaps:** Record requirements whose compliance cannot currently be established because tests, analysis, runtime access, or enforcement mechanisms are missing.

5. **Review existing exceptions:** Locate approved deviations, verify their exact scope and supporting approval, and distinguish them from undocumented suppressions.

6. **Resolve false positives:** Do not classify legitimate architectural variations as violations simply because their implementation differs from another feature.

7. **Prioritise remediation:** Rank findings by correctness, security, consistency, maintainability, and change risk. Recommend which issues require attention before stricter enforcement.

8. **Prepare incremental enforcement:** Recommend how subsequent tasks can prevent new violations without silently accepting existing technical debt or unnecessarily blocking unrelated work.

## Finding Classification

Each finding MUST have exactly one primary classification:

- **CONFIRMED VIOLATION:** Existing code contradicts an approved mandatory rule.
- **APPROVED CHANGE PENDING:** An accepted architectural decision has not yet been implemented.
- **VERIFICATION GAP:** Compliance cannot be demonstrated with available evidence.
- **APPROVED EXCEPTION:** A specific deviation has explicit, traceable approval.
- **PROPOSED EXCEPTION:** A deviation may be justified but requires approval.
- **LEGITIMATE VARIATION:** An implementation differs but does not violate the approved contract.
- **UNVERIFIED:** Insufficient evidence to determine whether an issue exists.

Do not disguise unimplemented decisions as approved exceptions.

## Strictness Requirements

- Assign stable finding IDs such as `GAP-001` and exception IDs such as `EXC-001`.
- Every confirmed violation MUST reference its exact architectural or coding-standard rule.
- Every finding MUST include repository-relative evidence and relevant symbols or line references.
- Record the inspected commit and date.
- Distinguish findings supported by executed checks from those supported by code inspection or inference.
- Clearly state which areas and rules were inspected and which remain unverified.
- Do not claim the entire repository is compliant merely because existing checks pass.
- Do not invent approval history, remediation deadlines, or responsible individuals.
- Do not automatically approve new exceptions.
- Scope exceptions to specific rules and locations, with justification and review conditions.
- Preserve previously approved exceptions without broadening their scope.
- Do not disable checks or change rules to make existing code appear compliant.
- Prefer incremental enforcement that prevents new violations while explicitly tracking existing debt.
- Do not demand unnecessary refactoring where the existing implementation already satisfies the approved contract.

## Deliverables

Create or update:

`docs/engineering/COMPLIANCE_BASELINE.md`

Include:

1. Assessment scope, commit, and verification methods.
2. Compliance summary against approved architectural and coding rules.
3. Findings register with stable IDs, classification, severity, evidence, and affected rules.
4. Prioritised remediation recommendations.
5. Existing debt versus new-violation enforcement strategy.
6. Unverified areas and risks relevant to subsequent tasks.

Create or update:

`docs/engineering/EXCEPTIONS.md`

Include:

1. Approved exceptions with their evidence of approval.
2. Exact affected rules, locations, and justified scope.
3. Review or expiry conditions, where established.
4. Proposed exceptions awaiting approval.
5. Rules for recording, reviewing, and superseding exceptions.

Reuse existing equivalent documents if present rather than creating duplicate registers.

## Validation

Before completion:

- Confirm findings are supported by source evidence.
- Verify links and referenced rule IDs.
- Confirm approved exceptions have genuine approval evidence.
- Ensure proposed exceptions remain unapproved.
- Check that no approved architectural decisions or coding standards were silently changed.
- Distinguish actual remediation requirements from enforcement tooling that does not exist yet.

## Execution Constraints

- Documentation-only.
- Modify only the two specified engineering documents, or their existing equivalents.
- Do not modify application code, tests, architecture, coding standards, ADRs, agent instructions, tooling, hooks, or CI.
- Do not implement fixes or introduce new enforcement mechanisms.
- Do not commit or merge without explicit authorisation.

## Final Response Contract

Keep all detailed evidence and findings in repository documentation.

Return no more than 120 words covering:

1. **Completed:** Files created or updated and number of findings.
2. **Compliance:** Counts of confirmed violations, pending implementation changes, and verification gaps.
3. **Exceptions:** Existing approved exceptions and any new approvals needed.
4. **Priorities:** Up to three critical findings requiring attention.
5. **Next step:** State whether the baseline is ready for Task 8.

Do not reproduce the complete findings register in chat.
```

</content>
</page>
