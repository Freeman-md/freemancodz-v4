# Source snapshot: Task 01 — Universal Codebase Intelligence Prompt

Source: https://app.notion.com/p/416b505dc85281928109f96846830891?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-12T09:18:31.139Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc85281928109f96846830891 as of 2026-11-12T09:18:31.139Z:
<page url="https://app.notion.com/p/416b505dc85281928109f96846830891">
<ancestor-path></ancestor-path>
<properties>
{"title":"Task 01 — Universal Codebase Intelligence Prompt"}
</properties>
<iconMetadata>null</iconMetadata>
<content>
Act as a <b>Senior Software Architect and Technical Lead</b> conducting an evidence-based assessment of this repository.

Your objective is to help me understand the codebase quickly enough to <b>direct development agents, evaluate implementation decisions, and make informed architectural changes</b>, without needing to manually inspect every file.

Treat this as an unfamiliar codebase. Do not assume the implementation matches its documentation.

## 1. Product & Feature Inventory

- What does this application do, and who are its intended users?
- What are its main features and capabilities?
- Which features are fully implemented, partially implemented, stubbed, or planned?
- What are the primary user journeys and business workflows?

## 2. Architecture & Project Structure

- Identify the tech stack, frameworks, libraries, and infrastructure.
- Explain the architectural approach and how the repository is organised.
- Identify the major modules, services, packages, and their responsibilities.
- Explain how data, state, and control flow through the system.
- Identify external services, APIs, databases, and integrations.

## 3. Feature Execution & Component Relationships

For each major feature, explain:

- Its frontend entry points, components, hooks, and state management.
- Its backend routes, services, business logic, and persistence.
- How frontend and backend communicate.
- The end-to-end execution flow, from user interaction to response.
- The important files and dependencies involved.

Use concise flow diagrams where they improve clarity.

## 4. Engineering Standards & Conventions

Identify the established patterns for:

- Naming, folder organisation, and code structure.
- Component design, separation of concerns, and reusability.
- API design, error handling, validation, and logging.
- Authentication, authorisation, and data access.
- State management, typing, and dependency management.
- Testing, formatting, linting, and documentation.

Distinguish between conventions that are documented, consistently practised, and inconsistently applied.

## 5. Code Quality & Technical Health

Assess:

- Maintainability, modularity, and architectural consistency.
- Duplicated logic, tight coupling, and unnecessary complexity.
- Technical debt, fragile implementations, and potential bottlenecks.
- Security risks, missing validation, and problematic dependencies.
- Test coverage and confidence in existing functionality.

Prioritise findings by severity and impact. Do not invent issues or treat stylistic preferences as defects.

## 6. Development & Operational Readiness

- How is the application installed, configured, run, tested, built, and deployed?
- What environments, infrastructure, and CI/CD workflows exist?
- Which environment variables and external dependencies are required? List variable names, never secret values.
- What observability, monitoring, and recovery mechanisms exist?
- What might prevent a new developer or agent from working effectively?

## 7. Change Impact & Agent Guidance

- Where should an agent begin when implementing a new feature?
- Which existing patterns should it follow?
- Which architectural boundaries should it respect?
- What dependencies, tests, and integration points typically need attention when modifying a feature?
- Which areas are especially risky to change?
- What should an agent verify before declaring a task complete?

## 8. Gaps, Risks & Recommendations

Identify:

- Important missing functionality or incomplete workflows.
- Architectural inconsistencies and technical risks.
- Documentation and testing gaps.
- The highest-value improvements, ranked by impact, urgency, and estimated effort.

Separate confirmed problems from hypotheses and optional improvements.

---

## Analysis Rules

1. <b>Inspect the actual repository.</b> Prioritise source code, configurations, entry points, dependency manifests, tests, and deployment files.
2. <b>Use documentation as supporting evidence</b>, not unquestionable truth.
3. <b>Ground important claims in file paths and relevant symbols.</b> Include line references where possible.
4. <b>Distinguish verified facts, reasonable inferences, and unknowns.</b>
5. <b>Do not claim functionality works simply because code exists.</b> Identify what has actually been tested or executed.
6. <b>Be concise and systematic.</b> Prioritise system-level understanding over line-by-line explanations.
7. <b>Do not modify any files.</b> This is a read-only assessment.
8. <b>Avoid generic best-practice recommendations.</b> Focus on findings supported by this repository.
9. <b>Use progressive inspection.</b> Start with the repository structure and architectural entry points, then investigate relevant modules. Avoid exhaustively reading irrelevant files.

## Required Output

Produce a <b>Codebase Intelligence Report</b> containing:

1. <b>Executive Summary:</b> What the application does, its architecture, and overall technical condition.
2. <b>Feature Matrix:</b> Features, implementation status, frontend/backend ownership, and key files.
3. <b>Architecture Map:</b> Major components, their responsibilities, and communication paths.
4. <b>Execution Flows:</b> How the most important features work end to end.
5. <b>Engineering Conventions:</b> Established patterns agents should follow.
6. <b>Technical Health:</b> Strengths, weaknesses, risks, and testing confidence.
7. <b>Development & Deployment:</b> How the system runs and operates.
8. <b>Agent Playbook:</b> Where to make changes, what to preserve, and how to verify work.
9. <b>Prioritised Recommendations:</b> What deserves attention next, with supporting evidence.
10. <b>Unknowns:</b> Questions that cannot be resolved from repository evidence.

<b>Start with a concise executive summary and feature matrix. Use tables and diagrams where they improve understanding. Keep deep technical detail available through file references rather than overwhelming the main report.</b>

The final report should give me enough context to supervise agents and make decisions without needing a guided tour of the entire repository.
</content>
</page>
