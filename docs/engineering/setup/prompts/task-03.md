# Source snapshot: 📄 Task 03 — Audit Engineering Controls

Source: https://app.notion.com/p/416b505dc85281c0b0b7d1b09f2d10bc?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-12T09:11:52.691Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc85281c0b0b7d1b09f2d10bc as of 2026-11-12T09:11:52.713Z:
<page url="https://app.notion.com/p/416b505dc85281c0b0b7d1b09f2d10bc" icon="📄">
<ancestor-path></ancestor-path>
<properties>
{"title":"Task 03 — Audit Engineering Controls"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📄"}</iconMetadata>
<content>
Copy the full prompt below into the coding agent working in the target repository. Preserve the task sequence and review approvals before progressing.

```txt
# Task 3: Engineering Controls & Enforcement Audit

Act as a Senior Software Architect auditing the existing engineering controls in this repository.

Read `docs/CODEBASE_INTELLIGENCE.md` for context, then independently inspect the repository.

**Objective:** Establish precisely which engineering standards, architectural rules, automated checks, and agent instructions already exist, how they operate, and whether they are actually enforced.

Do not design or implement new standards yet.

## 1. Inventory Existing Controls

Inspect the following:

1. **Agent instructions:** `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, Copilot instructions, and other applicable configuration files.
2. **Agent skills:** Existing `SKILL.md` files, their responsibilities, activation mechanisms, and overlapping or conflicting instructions.
3. **Architecture enforcement:** Dependency boundaries, feature isolation, layer restrictions, import rules, and custom architecture checkers.
4. **Code quality:** ESLint, Prettier, TypeScript, naming conventions, complexity limits, and static analysis.
5. **Testing:** Unit, integration, architecture, and end-to-end tests, including coverage configuration and assertion quality.
6. **Git hooks:** Pre-commit, pre-push, commit-message checks, and any hook-management framework.
7. **CI/CD:** GitHub Actions or equivalent pipelines, required checks, build verification, and deployment gates.
8. **Security:** Dependency audits, secret detection, security scanners, and automated vulnerability checks.

Inspect actual configuration files, scripts, and their invocation paths. Do not assume a control is operational simply because its configuration exists.

## 2. Verify Enforcement

For every discovered control, establish:

- What rule or behaviour does it enforce?
- Where is it defined?
- How is it triggered?
- Is it advisory, AI-reviewed, or deterministically enforced?
- Does it run manually, during development, before commit, before push, in CI, or before deployment?
- Can implementation bypass it?
- Is its execution observable through exit codes, logs, or CI results?
- Does it conflict with another rule or established codebase convention?

Execute existing safe, non-destructive checks where practical. Record their commands, exit codes, and results.

Do not run destructive operations, alter production data, or claim that a check passed without executing it.

## 3. Assess Architectural Consistency

Trace representative frontend-to-backend flows and cross-feature dependencies.

Determine whether existing architecture rules consistently govern:

- Feature entry points and public APIs.
- Actions, services, repositories, and persistence.
- Cross-feature imports and dependencies.
- Business logic ownership and separation of concerns.
- Component, hook, helper, and utility placement.
- File naming, module structure, and function organisation.

Distinguish genuine architectural violations from legitimate design variations.

Pay particular attention to whether existing architecture checks enforce only folder structure and imports, or also verify the intended architectural responsibilities.

## 4. Identify Enforcement Gaps

Identify:

- Rules documented but not mechanically enforced.
- Controls that exist but are not automatically executed.
- Missing or ineffective verification gates.
- Conflicting, redundant, or outdated instructions.
- Tests that can pass despite incorrect behaviour.
- Architecture boundaries that currently depend on agent discretion.
- Controls whose operational status cannot be verified.

Classify each finding as **Verified**, **Partially Enforced**, **Advisory Only**, **Missing**, or **Unverified**.

## 5. Deliverables

Create `docs/engineering/CONTROLS_AUDIT.md` containing:

### A. Executive Summary
A concise assessment of the current enforcement maturity.

### B. Existing Controls Matrix

| Control | Location | Purpose | Trigger | Enforcement Type | Verification Status |
|---|---|---|---|---|---|

### C. Architectural Consistency Findings
Existing patterns, inconsistencies, and their supporting evidence.

### D. Enforcement Gaps
Ranked by their impact on architectural consistency and implementation reliability.

### E. Controls Worth Preserving
Existing rules and tooling that should be reused rather than duplicated.

### F. Recommendations for Task 4
Specific decisions that must be made when defining the approved architecture.

Do not implement these recommendations.

## Execution Rules

- Ground every significant finding in repository-relative paths and relevant symbols or line references.
- Distinguish source evidence, executed verification, and assumptions.
- Do not introduce dependencies or new enforcement tools.
- Do not modify application code, configurations, tests, hooks, or workflows.
- The only permitted repository change is the audit document.
- Keep the report concise, evidence-based, and actionable.

**Final response:** Summarise what is already enforced, what is advisory, what is missing, and what should be addressed before establishing architectural standards.
```

</content>
</page>
