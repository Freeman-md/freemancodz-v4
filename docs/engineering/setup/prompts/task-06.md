# Source snapshot: 📄 Task 06 — Establish Architectural Decision Records

Source: https://app.notion.com/p/416b505dc85281e493d0dc31a7e50581?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-13T08:07:18.781Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc85281e493d0dc31a7e50581 as of 2026-11-13T08:07:18.781Z:
<page url="https://app.notion.com/p/416b505dc85281e493d0dc31a7e50581" icon="📄">
<ancestor-path></ancestor-path>
<properties>
{"title":"Task 06 — Establish Architectural Decision Records"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📄"}</iconMetadata>
<content>
Copy the full prompt below into the coding agent working in the target repository. Preserve existing approvals and keep this task documentation-only.

```txt
# Task 6: Establish Architectural Decision Records (ADRs)

Act as a Principal Software Architect responsible for establishing the repository's Architecture Decision Record (ADR) system.

## Objective

Create a structured, version-controlled record of significant architectural decisions so future development agents understand what was decided, why it was decided, what alternatives exist, and what must remain true.

This task documents approved decisions. It does not authorise new architectural choices or implementation changes.

## Inputs

Read and verify:

- `docs/architecture/ARCHITECTURE.md`
- `docs/engineering/CODING_STANDARDS.md`
- `docs/engineering/CONTROLS_AUDIT.md`
- `docs/CODEBASE_INTELLIGENCE.md`
- Existing ADRs, agent instructions, relevant technical documentation, and decision history available in the repository.

Confirm that the architectural specification and coding standards have been approved. If either remains unapproved, report the blocker rather than assuming approval.

## Responsibilities

1. **Identify significant decisions:** Extract approved, durable architectural decisions concerning system structure, feature boundaries, dependency direction, data ownership, transactions, consistency, and verification.

2. **Preserve approval history:** Record the decisions already approved, including D1–D5 where documented. Do not request approval again for unchanged decisions.

3. **Avoid unnecessary ADRs:** Do not create separate records for every architectural rule, naming convention, implementation detail, or routine coding preference.

4. **Establish ADR conventions:** Use sequential identifiers, descriptive filenames, consistent status labels, and explicit relationships between related decisions.

5. **Document rationale:** Explain the problem each decision solves, its chosen approach, alternatives, consequences, and relevant trade-offs.

6. **Map architectural contracts:** Link each ADR to applicable architectural rules, standards, feature boundaries, and system invariants.

7. **Track implementation:** Distinguish decisions already implemented from those requiring implementation, migration, tests, or automated enforcement.

8. **Handle conflicts:** Identify contradictory, superseded, or undocumented decisions without silently reconciling or overwriting approved specifications.

9. **Establish decision lifecycle:** Define how ADRs are proposed, approved, superseded, and referenced by future agents.

10. **Connect decisions to milestones:** Define how an Orchestrator links a proposed ADR to the originating milestone and blocked task IDs, records the owner's explicit approval/revision/rejection, and communicates approved decisions to the Execution Agent. Approval must precede affected implementation; rejected/revised proposals cannot be silently adopted.

## Strictness Requirements

- Every ADR MUST have a stable identifier and explicit status.
- Accepted ADRs MUST correspond to an evidenced approval.
- ADR approval is distinct from approval to merge a completed milestone. Milestone authoring and implementation MUST stop affected work when a new architectural decision is proposed; unaffected work may continue.
- New architectural decisions MUST remain **PROPOSED — AWAITING APPROVAL**.
- Do not fabricate historical discussions, dates, alternatives, or rationale.
- For retrospective ADRs, distinguish the recording date from the original approval date, if known.
- If alternatives or historical reasoning are unavailable, explicitly state that they were not recorded.
- Approved decisions MUST NOT be silently altered or contradicted.
- Superseded decisions MUST remain traceable rather than being deleted.
- Distinguish architectural decisions from coding conventions and ordinary implementation details.
- Do not claim an accepted decision is implemented or mechanically enforced without supporting evidence.
- Avoid duplicate ADRs covering the same decision.
- Use repository-relative links and reference the relevant rule IDs.

## Required ADR Structure

Each ADR must include:

1. **Identifier and title**
2. **Status:** Proposed, Accepted, or Superseded
3. **Decision and recording dates:** Where evidenced
4. **Context and problem**
5. **Decision**
6. **Alternatives:** Evidence-based, or explicitly not recorded
7. **Rationale and trade-offs**
8. **Consequences and affected components**
9. **Related architectural rules and standards**
10. **Implementation and enforcement status**
11. **Related or superseding ADRs**, where applicable
12. **Originating milestone and affected task IDs; owner decision evidence and scope; dependent-work blocking/resumption status**, when applicable

## Deliverables

Create or update:

`docs/architecture/adr/README.md`

This must serve as the ADR index, explaining naming, statuses, approval requirements, and links to individual records.

Create individual records using the repository's existing numbering convention, or sequential filenames such as:

`docs/architecture/adr/0001-decision-title.md`

Select the smallest useful set of ADRs that captures the approved architectural decisions without unnecessary fragmentation.

Include an **Open Decisions** section in the index for material questions requiring approval.

## Validation

Before completion:

- Verify that every accepted ADR has evidence of approval.
- Check consistency with the approved architecture and coding standards.
- Verify that identifiers, statuses, references, and links are valid.
- Confirm that no existing decision was silently changed.
- Report any missing rationale or unresolved contradictions.

## Execution Constraints

- Documentation-only.
- Modify files only under `docs/architecture/adr/`.
- Do not change application code, tests, configurations, agent instructions, architectural specifications, coding standards, or CI workflows.
- Do not implement architectural changes.
- Do not commit or merge changes without explicit authorisation.

## Final Response Contract

All detailed reasoning and evidence belong in the repository ADRs.

Return no more than 120 words covering:

1. **Completed:** Files created and number of ADRs recorded.
2. **Decisions captured:** A concise summary of the major architectural decisions.
3. **Outstanding questions:** Only unresolved decisions or evidence gaps requiring attention.
4. **Next step:** State whether the ADR registry is ready for Task 7.

Do not reproduce the ADR contents in chat.
```

</content>
</page>
