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
- stable acceptance criteria
- manual verification

Describe what must become true. Prescribe classes, files or abstractions only when architecture is part of the requirement.

Checklist boxes remain unchecked in the contract. The independent review acceptance matrix records `PASS`, `FAIL` or `NOT VERIFIED`.

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

- `ready_for_human`: implementation and required independent checks passed
- `blocked`: external access or an unresolved dependency prevents safe progress
- `escalated`: the cycle limit was reached or a human decision is required

Agents do not merge pull requests.
