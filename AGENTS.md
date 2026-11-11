# Repository engineering standards

## Before changing code

- Identify the user outcome, normal entry point, relevant data flow, and existing tests. Read nearby code and reuse the established pattern when it serves the requirement.
- Keep the change focused. Prefer direct code, existing dependencies, and deletion of replaced code. Add a file, interface, or dependency when it owns a real responsibility or materially improves correctness, clarity, or testing.
- For a proposed feature or architectural decision, test the underlying assumption before building infrastructure. For an approved implementation, proceed unless you find a material correctness, security, or product issue.
- Preserve existing caller behavior and data unless the request changes them. Consider retries, partial failures, concurrency, and older records where relevant.

## Next.js and project conventions

- Before planning, editing, or reviewing Next.js code, read [the Next.js architecture skill](.agents/skills/nextjs-architecture/SKILL.md). It defines the canonical layout, ownership, naming, dependency direction, and client/server boundaries. Check the design against it before writing code and again during review. Get explicit approval for exceptions.
- Check the installed Next.js version. Use its bundled official docs in `node_modules/next/dist/docs` for framework-specific decisions, and current official docs when the bundled docs are unavailable or incomplete. Distinguish framework requirements from project conventions.
- Follow conventions across the whole feature, including file placement, tool definitions, schemas, provider wiring, and tests. Keep composition in the composition root. Keep shared runtime capabilities independent of plugins and put product rules in the feature that owns them.
- Validate input at trust boundaries and infer types from the runtime schema. Keep request handlers bounded and persist work that must survive requests, retries, or restarts. Use the central environment module for runtime configuration.
- Keep Prisma migrations as the schema source of truth and the database seed workflow as the source for published content. Preserve applied migrations and use a new migration for schema changes.

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
- Review the diff for scope, ownership, client/server imports, duplication, regressions, and error paths. Report the commands, outcomes, and anything still unverified. Use the architecture skill's completion format for Next.js changes.

## Milestones

- **Run Active Milestone** and **Resume Active Milestone** invoke the global `milestone-workflow` skill. Use the active contract, preserve its review count, and delegate independent review. The human merges.
- **Sync After Merge** invokes that skill's synchronization path. Verify the merge and preserve local work while synchronizing.
- Creating or amending a milestone invokes the global `milestone-authoring` skill. The only active contract is `.agents/milestones/active.md` in the current worktree. Keep it locally ignored and freeze the contract in the PR. Completed contracts live in `.agents/milestones/archive/`.
- Keep one branch and one PR per milestone. Preserve acceptance checkboxes and review history. Activate a new contract before beginning its work. Ordinary coding requests follow their own authorized scope.
- Apply platform and security constraints first, then these repository instructions and the architecture skill, then the active contract and workflow. Verify PR claims against the code and test evidence.
