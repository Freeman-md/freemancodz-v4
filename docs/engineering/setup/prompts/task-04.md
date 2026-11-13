# Source snapshot: 📄 Task 04 — Define the Architecture Contract

Source: https://app.notion.com/p/416b505dc8528121a8ebdda9c95d1ed0?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-13T08:07:17.597Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc8528121a8ebdda9c95d1ed0 as of 2026-11-13T08:07:17.597Z:
<page url="https://app.notion.com/p/416b505dc8528121a8ebdda9c95d1ed0" icon="📄">
<ancestor-path></ancestor-path>
<properties>
{"title":"Task 04 — Define the Architecture Contract"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📄"}</iconMetadata>
<content>
Copy the full prompt below into the coding agent working in the target repository. Preserve the task sequence and review approvals before progressing.

```txt
# Task 4: Establish the Repository Architecture Contract

Act as a Principal Software Architect.

Your task is to establish a strict, evidence-based architectural specification that future coding agents must follow.

This specification must be reusable as a methodology across repositories, while its actual rules reflect this codebase's requirements.

## Inputs

Read:
- `docs/CODEBASE_INTELLIGENCE.md`
- `docs/engineering/CONTROLS_AUDIT.md`
- Existing `AGENTS.md`, architecture skills and relevant technical documentation.
- Representative implementation paths to independently verify architectural claims.

## Responsibilities

1. **Define architecture:** Establish the system's layers, domain boundaries, module ownership, dependency direction and allowed communication paths.

2. **Define responsibilities:** Specify what belongs in routes, actions, services, repositories, components, hooks, mappers, validators and utilities. Do not require unnecessary layers or classes.

3. **Define dependency contracts:** Specify permitted and forbidden imports, public feature APIs, cross-feature interactions, database access and transaction ownership.

4. **Standardise execution flows:** Document the approved frontend-to-backend patterns for reads, writes, validation, business logic and persistence, with representative examples from this repository.

5. **Define architectural invariants:** Specify rules that must remain true regardless of which agent implements a feature, including relevant authorisation, data consistency and transaction requirements.

6. **Resolve inconsistencies:** Investigate conflicting conventions identified in the audit. Propose one coherent standard rather than silently preserving every existing pattern.

7. **Classify enforceability:** For every normative rule, specify whether it can be enforced through static analysis, architecture tests, integration tests or requires independent architectural review.

8. **Establish exception handling:** Any deviation from an approved architectural rule must require documented justification and explicit approval. No agent may silently introduce exceptions.

9. **Establish the milestone ADR contract:** Include explicit owner approval BEFORE implementing new or revised architectural decisions, milestone-authoring impact classification, execution-time escalation of unforeseen decisions, blocking only dependent tasks, and separate owner merge approval. Specify the canonical ADR/change-control sources so downstream agent instructions can reuse them.

## Strictness Requirements

- Express mandatory rules using **MUST** and prohibitions using **MUST NOT**.
- Give each mandatory rule a stable identifier.
- Provide concrete compliant and non-compliant examples.
- Specify how compliance will be verified.
- Distinguish proposed rules from already enforced rules.
- Do not mistake an existing implementation for an approved architectural decision.
- Do not invent architectural layers or unnecessary abstractions simply for uniformity.
- Flag architectural conflicts rather than making consequential decisions silently.
- Keep architectural constraints separate from coding style conventions, which will be handled in Task 5.

## Deliverable

Create or update:

`docs/architecture/ARCHITECTURE.md`

This document must contain the complete architecture contract, approved dependency patterns, representative execution flows, architectural invariants, verification strategy and proposed exceptions.

Include the architectural decision policy: routine changes conforming to approved rules do not need ADRs; new or changed architectural contracts require a proposed ADR and evidenced owner approval before affected implementation. The milestone workflow must reference this policy rather than duplicate it.

Mark the specification **PROPOSED — AWAITING APPROVAL**.

Include a clearly identified section titled **Decisions Requiring Approval**, containing no more than five material decisions, each with a recommended default and its trade-off.

Do not modify application code, tests, agent instructions, tooling or CI. Do not mark the architecture approved on my behalf.

## Final Response Contract

**The full technical detail belongs in repository documentation, not your final chat response.**

Your final response must contain no more than 150 words, organised into:

1. **Completed:** Files created or updated.
2. **Proposed architecture:** Maximum three sentences describing the architectural model.
3. **Decisions needed:** Maximum five concise decisions requiring my approval, including your recommended choice.
4. **Next step:** One sentence explaining what is needed to proceed.

Do not reproduce documentation, lengthy tables or implementation details in chat.

Be rigorous in the repository documentation and exceptionally concise when reporting to me.
```

</content>
</page>
