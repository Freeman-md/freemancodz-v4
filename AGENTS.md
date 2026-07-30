# Repository Engineering Instructions

This file defines repository-wide engineering rules and the entry point for the milestone workflow.

## Mandatory Next.js architectural standard

Before planning, implementing, reviewing, or refactoring any Next.js code, read and follow `.agents/skills/nextjs-architecture/SKILL.md`. Treat it as the authoritative architectural standard for all Next.js implementations, milestones, and refactors.

Validate every proposed file location, name, dependency, architectural role, and client/server boundary against that skill before writing code and again before completion. Do not introduce an exception without explicit user approval. Existing repository inconsistencies do not override the skill.

Before making a framework-specific decision:

1. Inspect the installed Next.js version.
2. Read the matching official Next.js documentation bundled with the installed package under `node_modules/next/dist/docs` when available.
3. Use current official Next.js documentation only as a fallback or supplement.
4. Distinguish a verified framework requirement from a project convention.

The complete architecture and naming standard lives only in `.agents/skills/nextjs-architecture/SKILL.md`; do not create or maintain a competing architectural specification in this file, a milestone, or a pull-request description.

## Runtime and implementation quality

- Do not expose raw provider, database, or stack-trace errors to clients.
- Never rely on module-level memory for correctness across requests; deployed instances do not share process memory.
- Send long-running or retryable work through the durable job path. Keep production request handlers bounded.
- Infer TypeScript types from runtime schemas when the schema is the source of truth. Do not maintain a duplicate type by hand.
- Do not cast parsed JSON directly to a trusted application type.
- Read application environment variables through the central environment module; configuration files and bootstrap adapters are the normal exceptions.
- Keep secrets server-only. Use `NEXT_PUBLIC_` only for values intentionally exposed to browsers.
- Maintain one documented migration source of truth and one canonical runtime content source.
- Keep frontend state as local as practical. Use `useReducer` only when coordinated transitions are clearer than independent setters.
- Prefer composition over prop-heavy configurable mega-components.
- Do not hand-build parsers, state libraries, or design-system primitives when a small maintained dependency solves the concrete requirement better.
- Keep seed source data in the database seed workflow, not a runtime `src/data` module.

## Clean-code rules

- Prefer obvious code over clever code.
- Give each file one coherent reason to change. Treat file length as a warning signal, not a target to game with meaningless fragments.
- Keep a private helper in the same file when it has one consumer and does not obscure the main flow.
- Extract code when it represents a separate responsibility, is reused, needs independent tests, or materially clarifies its caller.
- Do not create `manager`, `factory`, `handler`, `service`, `helper`, `utils`, `common`, or `base` abstractions without a precise responsibility communicated by the name.
- Do not introduce interfaces for concrete classes or functions unless a real alternate implementation or justified testing seam exists.
- Prefer small functions and composition. Do not add a dependency-injection container.
- Function-parameter dependency injection is allowed at side-effect boundaries when it materially improves deterministic tests.
- Do not add patterns merely because they appear in SOLID, Clean Architecture, DDD, or enterprise examples.
- Remove dead code, stale comments, obsolete wrappers, duplicate implementations, and unused dependencies in the same change that replaces them.
- Do not commit temporary `console.log` debugging. Make operational logs intentional, contextual, and safe.
- Do not leave untracked TODOs. Tie deferred work to an issue, milestone, or explicit documented limitation.
- Avoid nested ternaries and deeply nested control flow. Prefer named conditions and early returns.
- Make errors useful without exposing secrets or internals.
- Use comments to explain non-obvious decisions, not narrate straightforward code.
- Do not use `any` as an escape hatch.
- Do not use `@ts-ignore`. Use `@ts-expect-error` only for a verified external limitation and include a reason.
- Do not suppress lint or type errors merely to make validation pass.
- Do not split code into extra files solely to reduce line count.
- Do not keep two naming systems or two canonical import paths after a completed refactor.

## Testing rules

- Keep tests under `tests/<feature>` unless a framework convention requires colocation.
- Test public behavior and important boundaries, not private implementation details or file layout.
- Add focused regression coverage when moving or simplifying behavior-heavy code.
- Keep pure logic independent from network and database effects where practical.
- Use small fakes or injected functions for OpenAI, database, and clock effects. Do not introduce a mocking or dependency-injection framework without need.
- Do not weaken assertions, delete meaningful tests, or snapshot large unstable output merely to complete a refactor.
- Enforce architectural boundaries through ESLint or another focused check when a simple rule can prevent regressions.

## Required validation

Use the scripts that exist after the active milestone is implemented. At minimum, relevant changes must pass:

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run build
```

If `npm test` does not yet exist, the active architecture milestone must add one aggregate script that runs the focused test suites.

Report exact commands and outcomes. Do not claim database, OpenAI, local Supabase, or production behavior was verified when only mocks or static inspection were used.

For any Next.js implementation or refactor, also use the architecture completion format required by `.agents/skills/nextjs-architecture/SKILL.md`.

## Change discipline

- Inspect the current repository before planning an implementation, while treating the architectural skill—not existing inconsistencies—as the standard.
- Preserve externally observable behavior unless the active milestone explicitly changes it.
- A refactor is incomplete while old paths, old dependencies, stale documentation, or compatibility wrappers remain.
- Update tests, scripts, and documentation together with structural changes.
- Prefer one decisive architecture over a transitional mixture of old and new patterns.
- Do not rewrite working algorithms merely to make a diff look architectural.
- Do not merge pull requests as an agent.

## Milestone workflow trigger

When Freeman says:

```text
Run the active milestone.
```

execute the complete workflow defined by:

- this file
- `.agents/skills/nextjs-architecture/SKILL.md`
- `.ai/README.md`
- `.ai/prompts/orchestrator.md`
- `.ai/workflow/lifecycle.md`
- `.ai/workflow/branch-lifecycle.md`
- the active contract in `.ai/milestones/`
- any active amendment for that milestone
- the current Git, pull-request, review, and CI state

Resume from the current state. Do not restart completed work.

Continue until one of these terminal states is reached:

- `ready_for_human`
- `blocked`
- `escalated`

Do not merge the pull request.
Do not create duplicate branches or pull requests.
Do not modify checklist boxes in milestone contracts.
Do not begin a future milestone.

## Post-merge cleanup trigger

After Freeman has merged the completed milestone pull request and deleted its remote feature branch, when Freeman says:

```text
Sync after merge.
```

execute `.ai/workflow/post-merge-cleanup.md`.

This workflow must:

- verify the pull request was merged
- protect uncommitted and unmerged work
- fetch and prune the remotes
- switch to the repository's local default branch
- fast-forward it from the remote default branch
- delete the completed local milestone branch only when it is fully merged
- confirm the local default branch matches the remote
- stop without creating or starting the next milestone

## Instruction precedence

When instructions conflict, use this order:

1. platform and security constraints
2. this `AGENTS.md`, including its mandatory architectural skill
3. `.ai/architecture/*.md`, when present
4. `.ai/workflow/*.md`
5. the active parent milestone
6. an active amendment, only for sections it changes
7. implementation, review, and quality prompts
8. pull-request descriptions and agent summaries
9. Future branches must not contain a `codex/` prefix. For example, use `feat/milestone-5-architecture-simplification`, not `codex/feat/milestone-5-architecture-simplification`.

Pull-request descriptions and summaries are not evidence of correctness.
