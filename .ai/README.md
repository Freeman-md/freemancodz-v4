# AI-Assisted Milestone Workflow

This directory contains the reusable process used by implementation, review and future quality agents.

Project-specific engineering rules belong in `AGENTS.md`. Project-specific work belongs in `.ai/milestones/`.

## Sources of truth

- `AGENTS.md`: repository-wide engineering and security rules
- `.ai/architecture/*.md`: optional recurring architecture guidance
- `.ai/workflow/lifecycle.md`: workflow states, cycles and stopping rules
- `.ai/workflow/branch-lifecycle.md`: branch and pull-request safety rules
- `.ai/milestones/milestone-*.md`: parent milestone contracts
- `.ai/milestones/milestone-*-amendment-*.md`: approved changes to an active milestone
- `.ai/prompts/orchestrator.md`: process controller
- `.ai/prompts/implementation.md`: implementation-agent contract
- `.ai/prompts/address-review.md`: review-fix contract
- `.ai/prompts/pr-review.md`: independent milestone review contract
- `.ai/prompts/quality-check.md`: optional post-review quality-agent contract

## Contract statuses

Milestones and amendments use:

- `Draft`: still being designed; must not be implemented
- `Active`: approved and ready to start
- `Frozen`: implementation has started; behavioural scope is stable
- `Superseded`: replaced by a newer amendment but retained for history
- `Archived`: completed and merged

Normal milestone flow:

```text
Draft → Active → Frozen → Archived
```

A contract must become `Frozen` when implementation begins.

Do not alter a frozen contract to make an incorrect implementation appear compliant. Behavioural changes require an explicit amendment.

## Milestone contracts

Milestones should be short and outcome-focused. They should define:

- the goal
- required behaviour
- constraints
- explicit exclusions
- focused tests
- agent-verifiable acceptance criteria
- manual tasks, when required
- manual acceptance criteria, when required

Describe what must become true. Prescribe classes, files or abstractions only when architecture is part of the requirement.

### Agent and human verification

Acceptance criteria must contain only outcomes the implementation and review agents can verify from repository evidence, automated tests, CI or accessible runtime behaviour.

Steps that require private credentials, local-only infrastructure, production access or human judgement belong under `Manual tasks`. The outcome the human must confirm belongs under `Manual acceptance criteria`.

Manual tasks and manual acceptance criteria:

- should be limited to the smallest necessary checks
- remain unchecked in the contract
- must be surfaced clearly in the `ready_for_human` report
- do not cause implementation-review loops
- do not prevent the workflow from reaching `ready_for_human`

Do not classify an automatable check as manual merely because it is inconvenient. Do not classify a credential-dependent or human-only check as an agent acceptance criterion.

Checklist boxes remain unchecked in the contract. The independent review acceptance matrix records `PASS`, `FAIL` or `NOT VERIFIED` only for agent-verifiable acceptance criteria.

## Amendments

Use an amendment when approved work must continue on the same branch and pull request but the contract needs a bounded correction or extension.

An amendment must declare its parent milestone, target branch, target pull request, reason, changed requirements and affected acceptance criteria.

Only one amendment may be active for a milestone at a time.

## Starting the workflow

After creating and activating a milestone, use:

```text
Run the active milestone.
```

The trigger is expanded by `AGENTS.md` and `.ai/prompts/orchestrator.md`.

## Completion

The workflow stops at:

- `ready_for_human`: implementation and required independent checks passed; any remaining manual tasks and manual acceptance criteria are handed to the human
- `blocked`: external access or an unresolved dependency prevents safe implementation progress
- `escalated`: the cycle limit was reached or a human decision is required

Pending manual verification by itself is not a blocker. Agents do not merge pull requests.
