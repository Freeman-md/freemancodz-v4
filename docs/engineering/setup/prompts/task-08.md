# Source snapshot: 📄 Task 08 — Configure Agent Instructions

Source: https://app.notion.com/p/416b505dc85281b5b4b8c462923ef890?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-13T08:07:20.151Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc85281b5b4b8c462923ef890 as of 2026-11-13T08:07:20.151Z:
<page url="https://app.notion.com/p/416b505dc85281b5b4b8c462923ef890" icon="📄">
<ancestor-path></ancestor-path>
<properties>
{"title":"Task 08 — Configure Agent Instructions"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📄"}</iconMetadata>
<content>
Copy this prompt into the coding agent working in a repository whose architectural and coding standards have been approved and audited.

```txt
# Task 8: Configure Agent Instructions & Canonical Engineering Guidance

Act as a Principal Software Engineer establishing a consistent instruction contract for coding agents working in this repository.

## Objective

Make the approved architecture, coding standards, ADRs, compliance baseline, and exceptions discoverable and authoritative for supported coding agents.

The aim is predictable agent behaviour, not another layer of duplicated documentation or a claim that instructions alone enforce compliance.

## Inputs

Inspect:
- `AGENTS.md`, `CLAUDE.md`, any nested agent files, editor-specific rules, and existing `SKILL.md` files.
- `docs/architecture/ARCHITECTURE.md` and `docs/architecture/adr/README.md`.
- `docs/engineering/CODING_STANDARDS.md`, `COMPLIANCE_BASELINE.md`, `EXCEPTIONS.md`, and `CONTROLS_AUDIT.md`.
- The repository's actual scripts, tools, and test commands.

Check approval and status labels. Do not treat proposed decisions, existing technical debt, or unimplemented checks as approved exceptions or passing gates.

## Responsibilities

1. **Establish one navigation entry point:** Make root `AGENTS.md` a concise index of binding repository guidance, the relevant agent skills, and verification commands. Preserve useful existing instructions.
2. **Clarify authority:** State which documents define approved architecture and coding rules, which ADRs explain decisions, and which registers describe known gaps and precisely approved exceptions.
3. **Align supported agents:** Reconcile `CLAUDE.md` and existing tool-specific instructions with `AGENTS.md` using short pointers rather than duplicating long rules. Only configure clients actually present or supported in this repository.
4. **Preserve skill routing:** Keep existing feature-structure, delivery/milestone, and design workflows intact. Clarify when a skill is relevant and ensure it reads the canonical specifications.
5. **Define change protocol:** Before editing, agents MUST inspect the affected feature, approved contracts, related ADRs, and applicable exceptions. They MUST identify impact on dependencies, data flow, transactions, and tests.
6. **Define implementation discipline:** Agents MUST follow approved patterns, avoid expanding legacy violations, and MUST NOT silently introduce a new architecture, exception, suppression, or rule override.
7. **Define verification behaviour:** Point to actual existing commands, require relevant targeted tests and quality checks, and require the agent to report commands run, results, failures, and unverified boundaries.
8. **Define conflict handling:** If an implementation request conflicts with approved standards, agents MUST propose an ADR or scoped exception and obtain approval rather than modifying standards or proceeding silently.
9. **Keep the task separate from enforcement:** Instructions may require checks, but hooks, CI, static analysis, and integration gates are implemented in later tasks. Explicitly distinguish written obligations from automatically enforced controls.

10. **Align orchestrator and execution roles:** Require the Orchestrator to classify architectural impact during milestone authoring and planning, propose ADRs and obtain explicit owner decisions, track blocked tasks, and transmit accepted decisions to the Execution Agent. Require the Execution Agent to detect emerging decisions, stop dependent implementation, and escalate through the Orchestrator immediately.

11. **Preserve distinct approvals:** The independent reviewer checks ADR approval before PASS/READY FOR MERGE. The owner separately approves architectural decisions before implementation and approves the completed milestone before merge. No agent may infer either approval.

## Strictness Requirements

- Keep instructions compact, actionable, and repository-specific.
- Link to the canonical files using valid repository-relative paths.
- Use MUST / MUST NOT only for approved obligations.
- Avoid duplicating the full architecture or coding standards into agent files.
- Preserve the existing milestone implementation workflow and human-approval boundaries.
- Do not grant an agent authority to approve architectural changes, merge, deploy, or perform destructive actions.
- Never hide, widen, or automatically accept existing violations and exceptions.
- Do not claim every coding client loads a file without verifying its supported instruction-loading behaviour.
- Do not claim the codebase complies with an approved rule merely because that rule is in `AGENTS.md`.
- Do not invent checks or commands. Describe proposed future gates as not yet operational.
- Do not change the approved specifications to make the instructions easier to follow.

## Deliverables

Update the existing root `AGENTS.md` and its existing compatibility pointers (for example `CLAUDE.md`) as needed.

Update an existing agent skill or project-specific instruction file **only if necessary** to remove conflicts or point to canonical documents. Do not create new frameworks, duplicate skill libraries, or client-specific files without a demonstrated need.

The resulting instructions must provide:

1. Canonical document map and precedence.
2. Existing skills and when agents should consult them.
3. Pre-change investigation checklist.
4. Implementation and exception-escalation protocol, including authoring and execution-stage ADR checkpoints, proposal handoff, blocked-task status, owner decision evidence, and approval propagation.
5. Actual verification commands and completion evidence.
6. Clear statement of advisory versus deterministic enforcement.

## Validation

- Check that every referenced file, path, command, and rule source exists.
- Check consistency with the approved architecture, standards, ADRs, and scoped exceptions.
- Verify that existing skills remain discoverable and milestone workflow behaviour is preserved.
- Inspect the diff for contradictory or duplicated instructions.
- Where possible, validate instruction discovery in an available agent environment; otherwise mark it unverified.
- Run any relevant existing safe checks for the files modified. Report the actual results.

## Execution Constraints

- Modify only existing agent instruction and skill files that are necessary for this task.
- Do not modify application code, tests, repository specifications, ADRs, exceptions, lint configurations, hooks, or CI.
- Do not implement compliance fixes or new enforcement gates.
- Do not commit, merge, or deploy without explicit authorisation.

## Final Response Contract

Return no more than 120 words:

1. **Updated:** Exact instruction files changed.
2. **Contract:** Where agents will find the binding rules and how conflicts escalate.
3. **Verification:** What was tested and what remains advisory or unverified.
4. **Next step:** Whether Task 9 can begin.

Keep detailed evidence in the repository, not in the chat response.
```

</content>
</page>
