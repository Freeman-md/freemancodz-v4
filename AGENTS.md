# Repository engineering standards

## Canonical guidance

Read the current sources, not a prior agent summary:

- [Architecture](docs/architecture/ARCHITECTURE.md) defines approved ownership, dependencies, flows and ARC rules; [ADR registry](docs/architecture/adr/README.md) records decision scope, rationale and the shared approval lifecycle.
- [Coding standards](docs/engineering/CODING_STANDARDS.md) define approved STD conventions and their verification methods.
- [Compliance baseline](docs/engineering/COMPLIANCE_BASELINE.md) identifies precise existing debt and unverified areas; [exceptions](docs/engineering/EXCEPTIONS.md) alone records evidenced exception scope. Legacy debt is not a waiver, and a non-regression result is not full compliance.
- [Controls audit](docs/engineering/CONTROLS_AUDIT.md) and [setup status](docs/engineering/ENGINEERING_SETUP_STATUS.md) distinguish executed evidence, missing gates and future work. [Owner decisions](docs/engineering/setup/APPROVALS.md) preserve exact approvals; agent review or tests cannot replace them.

Apply platform/security constraints and explicit owner instructions first, then these repository instructions and accepted contracts/ADRs, then skill guidance and the active task/milestone within that scope. The architecture skill is the practical entry point to the accepted architecture, not a parallel authority. Proposed decisions, source drift and unrelated template examples are not approved rules or exceptions.

## Before changing code

- Identify the user outcome, normal entry point, relevant data flow, and existing tests. Read nearby code and reuse the established pattern when it serves the requirement.
- Inspect the applicable ARC/STD rules, related accepted ADRs and exact exception scope before editing; identify effects on dependencies, trust boundaries, transactions, failure paths and tests. Do not expand a known legacy violation or add a suppression/rule override silently.
- Keep the change focused. Prefer direct code, existing dependencies, and deletion of replaced code. Add a file, interface, or dependency when it owns a real responsibility or materially improves correctness, clarity, or testing.
- For a proposed feature or architectural decision, test the underlying assumption before building infrastructure. For an approved implementation, proceed unless you find a material correctness, security, or product issue.
- Preserve existing caller behavior and data unless the request changes them. Consider retries, partial failures, concurrency, and older records where relevant.

## Next.js and project conventions

- Before planning, editing, or reviewing Next.js code, read [the Next.js architecture skill](.agents/skills/nextjs-architecture/SKILL.md) and its linked accepted architecture/standards. Check the design before writing code and again during review. Get explicit approval through the shared ADR contract for exceptions.
- Check the installed Next.js version. Use its bundled official docs in `node_modules/next/dist/docs` for framework-specific decisions, and current official docs when the bundled docs are unavailable or incomplete. Distinguish framework requirements from project conventions.
- Follow conventions across the whole feature, including file placement, tool definitions, schemas, provider wiring, and tests. Keep composition in the composition root. Keep shared runtime capabilities independent of plugins and put product rules in the feature that owns them.
- Validate input at trust boundaries and infer types from the runtime schema. Keep request handlers bounded and persist work that must survive requests, retries, or restarts. Use the central environment module for runtime configuration.
- Keep Prisma migrations as the schema source of truth and the database seed workflow as the source for published content. Preserve applied migrations and use a new migration for schema changes.
- Consult the existing [Supabase skill](.agents/skills/supabase/SKILL.md) or [PostgreSQL guidance](.agents/skills/supabase-postgres-best-practices/SKILL.md) for relevant platform/query work. Their generic direct-schema/Supabase-migration instructions are subordinate to this repository's Prisma migration authority, target verification and secret restrictions; they do not authorise direct hosted schema changes or a second migration history.

## Architectural decisions and exceptions

- The orchestrator MUST classify impact during milestone authoring/planning as `NONE`, `EXISTING APPROVED ADR`, or `NEW/REVISED ADR REQUIRED`, cite exact accepted scope/evidence and identify affected/blocked tasks. The executor MUST independently reassess before affected implementation and on consequential discoveries.
- New/revised architecture or any exception requires a proposed ADR under the shared registry before affected work. The executor stops dependent implementation and escalates through the orchestrator; unrelated work may continue only if it does not constrain the decision. Do not resolve a conflict by silently changing a standard or widening an exception.
- The orchestrator presents the problem, recommendation, alternatives/trade-offs, rule/ADR IDs and exact blocked work; records owner `APPROVE` / `REVISE` / `REJECT` evidence, date/version/scope and affected tasks; and propagates accepted contracts, task/check requirements and a matching executor-acknowledged handoff before resumption. Revision/rejection returns dependent work for replanning.
- Independent review MUST verify approval coverage and revision-matched evidence before implementation PASS/READY FOR MERGE. Architecture/standards approval never implies separate owner merge, release or hosted-change authorisation. Routine compliant work needs no new ADR. Reuse the existing milestone workflow; do not create another approval process.

## Clean code

- Give each module one coherent responsibility. Prefer explicit names, small functions, early returns, and straightforward control flow. Keep a private helper near its caller when that makes the flow easier to read.
- Apply KISS, YAGNI, DRY, and SOLID as design principles. Reuse logic that shares a responsibility. Introduce abstraction or indirection when it solves an actual problem. Use the architecture skill's dependency injection conventions.
- Remove dead code, obsolete imports, stale documentation, and temporary diagnostics with the change that replaces them. Comments explain decisions and constraints. Record deferred work in an issue, contract, or documented limitation.
- Handle expected failures explicitly. Use safe, actionable errors. Keep raw provider responses, database errors, stack traces, and sensitive values out of client responses and logs. Fix lint and type errors at the source.
- Use the repository's naming, formatting, and import conventions. Enforce stable boundaries with focused lint checks when a rule can catch violations reliably.

## Security and workspace safety

- Never inspect secret files or output credentials. Use documented variable names and non-secret examples. Keep secrets server-side and use `NEXT_PUBLIC_` only for intentionally public values.
- Check the working tree before editing and preserve unrelated user changes. Commit, push, merge, or alter remote branches only as authorized. Use project branch naming without a `codex/` prefix.
- Follow the requested deployment scope. Verify database targets before any write and rehearse destructive changes on disposable data.

## Verification

- Test observable behavior and important boundaries. Use small injected fakes for provider and clock behavior and disposable databases for persistence or concurrency. Add focused regression coverage where the change introduces a case existing tests miss.
- Run the relevant checks. For a complete application change, run `npm run prisma:validate`, `npm run prisma:generate`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Include relevant integration and browser tests, and check that required suites actually ran.
- Current focused scripts are `npm run test:unit`, `npm run test:integration` and the separate `npm run test:portfolio:database`. `npm test` does not include the portfolio database suite and integration cases can skip without prerequisites. Verify disposable DB targets and actual test counts/skips; a skipped required suite remains unverified. Browser invocation requires the existing e2e configuration and prepared app/browser, not an invented package command.
- Preflight commands for implicit secret-file loading and writes. For read-only typechecking, `npm run typecheck -- --incremental false` avoids cache writes. For changed documentation, use the installed `node_modules/.bin/prettier --check` with explicit safe paths. Broad `npm run format` rewrites files; broad `npm run format:check` is not a safe secret-file scan policy. Do not waive a blocked check or run it against an unknown target.
- These commands are local capabilities, not proof of automatic enforcement. The audit records partial import checks and missing canonical/hosted quality gates; later setup tasks must implement and verify them. Instructions alone do not make the repository compliant.
- Review the diff for scope, ownership, client/server imports, duplication, regressions, and error paths. Report the commands, outcomes, and anything still unverified. Use the architecture skill's completion format for Next.js changes.

## Milestones

- **Run Active Milestone** and **Resume Active Milestone** invoke the global `milestone-workflow` skill. Use the active contract, preserve its review count, and delegate independent review. The human merges.
- **Sync After Merge** invokes that skill's synchronization path. Verify the merge and preserve local work while synchronizing.
- Creating or amending a milestone invokes the global `milestone-authoring` skill. The only active contract is `.agents/milestones/active.md` in the current worktree. Keep it locally ignored and freeze the contract in the PR. Completed contracts live in `.agents/milestones/archive/`.
- Keep one branch and one PR per milestone. Preserve acceptance checkboxes and review history. Activate a new contract before beginning its work. Ordinary coding requests follow their own authorized scope.
- Apply platform and security constraints first, then these repository instructions and accepted contracts/ADRs with their skill guidance, then the active contract and workflow. Verify PR claims against the code and test evidence.
