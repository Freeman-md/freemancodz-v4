# Source snapshot: 📄 Task 05 — Define Coding Standards & Conventions

Source: https://app.notion.com/p/416b505dc852818ab3fcf2fb1bbdbbee?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-12T09:11:52.691Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc852818ab3fcf2fb1bbdbbee as of 2026-11-12T09:11:52.719Z:
<page url="https://app.notion.com/p/416b505dc852818ab3fcf2fb1bbdbbee" icon="📄">
<ancestor-path></ancestor-path>
<properties>
{"title":"Task 05 — Define Coding Standards & Conventions"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📄"}</iconMetadata>
<content>
Copy the full prompt below into the coding agent working in the target repository. Preserve the task sequence and review approvals before progressing.

```txt
# Task 5: Establish Coding Standards & Conventions

Act as a Principal Software Engineer responsible for establishing strict, consistent, and enforceable coding standards for this repository.

## Objective

Define how development agents MUST write and organise code so that implementation remains consistent, maintainable, readable, and aligned with the approved architecture.

The result must be a repository-specific engineering contract, not a generic collection of coding best practices.

## Inputs

Inspect:

- `docs/architecture/ARCHITECTURE.md`
- `docs/engineering/CONTROLS_AUDIT.md`
- `docs/CODEBASE_INTELLIGENCE.md`
- Existing `AGENTS.md` and relevant agent skills.
- Linter, formatter, TypeScript, testing, and project configuration.
- Representative implementations across different features.

Confirm the architecture is approved before proceeding. Treat its approved decisions as authoritative.

## Responsibilities

1. **Naming conventions:** Define consistent rules for files, directories, components, hooks, services, repositories, functions, variables, interfaces, types, and constants.

2. **Code organisation:** Establish conventions for imports, exports, module boundaries, file responsibilities, helper placement, and avoiding unnecessary fragmentation.

3. **Functions and classes:** Define when to use functions versus classes, how to organise methods and helpers, and how to limit excessive complexity, nesting, file size, and responsibility.

4. **Type safety:** Establish strict TypeScript practices covering type inference, explicit contracts, nullability, unsafe casts, `any`, and shared types.

5. **Frontend conventions:** Define standards for React components, hooks, state management, Server/Client Components, composition, accessibility, and UI error states.

6. **Backend conventions:** Define implementation standards for validation, services, repositories, error handling, asynchronous operations, logging, and transaction-safe code without duplicating architectural decisions.

7. **Reusability and maintainability:** Define rules for duplication, abstractions, dead code, utility functions, separation of concerns, and unnecessary dependencies.

8. **Testing conventions:** Establish test organisation, naming, assertions, mocking boundaries, success/failure-path verification, and regression-test expectations.

9. **Documentation:** Define when comments, JSDoc, README updates, and technical explanations are required.

10. **Enforcement mapping:** For every mandatory convention, identify how it can be checked through existing tooling, additional deterministic checks, tests, or independent review.

## Strictness Requirements

- Assign stable identifiers to mandatory rules, such as `STD-001`.
- Use **MUST** and **MUST NOT** for non-negotiable standards.
- Provide concise compliant and non-compliant examples.
- Define measurable limits where justified, including complexity and function-length thresholds.
- Never introduce arbitrary restrictions without explaining their engineering benefit.
- Do not require every service to be a class or every helper to be a class method; choose based on responsibility and state.
- Distinguish current conventions, approved standards, and existing violations.
- Classify enforcement as **Deterministic**, **Test-Verified**, or **Review-Required**.
- Never describe a proposed check as already operational.
- Identify exceptions explicitly; deviations require documented justification and approval.
- Do not contradict or silently revise the approved architectural specification.
- Prefer extending existing conventions and tooling over creating duplicate systems.

## Deliverable

Create:

`docs/engineering/CODING_STANDARDS.md`

Include:

1. Scope and relationship to approved architecture.
2. Mandatory coding conventions with stable rule IDs.
3. Concrete compliant and non-compliant examples.
4. A standards-to-enforcement matrix.
5. Existing inconsistencies and proposed exceptions.
6. Decisions requiring approval, with recommended defaults and trade-offs.

Mark the document **PROPOSED — AWAITING APPROVAL**.

Do not modify application code, tests, linting configurations, hooks, CI workflows, agent instructions, or the approved architecture.

If a proposed coding convention conflicts with the approved architecture, flag it rather than modifying the architecture.

## Final Response Contract

Store detailed findings, examples, and evidence in the repository document.

Your final response MUST contain no more than 120 words:

1. **Completed:** File created and number of standards defined.
2. **Standards:** Maximum three sentences describing the proposed conventions.
3. **Decisions needed:** Maximum five material decisions, each with a recommended default.
4. **Next step:** State what requires approval before proceeding.

Do not reproduce the full specification in chat.

This is strictly a documentation-only task.
```

</content>
</page>
