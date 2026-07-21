# Repository Engineering Instructions

This file defines the repository-wide engineering rules and the entry point for the milestone workflow.

## Project architecture

`freemancodz-v4` is a Next.js App Router modular monolith.

Next.js is the rendering host and Backend-for-Frontend boundary for this project. It is not permission to mix React, HTTP transport, database access, OpenAI orchestration and worker logic in the same files.

The required dependency direction is:

```text
Next.js entry points (`src/app`)
  -> feature modules (`src/features`)
    -> shared application libraries (`src/lib`)
      -> generated clients and external packages
```

### Source ownership

- `src/app` owns routing, layouts, pages, metadata, loading/error states, Route Handlers and Server Action entry points.
- `src/app` must remain thin. It may compose UI, validate transport input, perform endpoint-level authentication/authorization and call a feature operation. It must not contain database queries, OpenAI orchestration, indexing algorithms or reusable business logic.
- `src/features/<feature>` owns all code specific to one product capability.
- A feature may use only the subfolders it genuinely needs, such as `components`, `server` or `builders`. Do not create template folders pre-emptively.
- Server-only feature code belongs under that feature's `server` boundary and must use `import "server-only"` at an appropriate entry module.
- `src/components/ui` contains generic UI primitives with no product knowledge.
- `src/components/layout` contains site-wide layout components.
- A component used by only one feature belongs to that feature, not the shared components folder.
- `src/lib` is limited to small cross-feature infrastructure and configuration modules such as the database client, environment parsing, OpenAI client construction and truly generic utilities.
- `src/lib` must not become a home for feature logic.
- `src/generated` contains generated code only and must not be manually edited.
- `scripts` and protected cron Route Handlers are adapters. They must call the same reusable server operation rather than reimplementing it.
- Seed source data belongs with the database seed workflow, not in runtime `src/data` modules.

### Dependency rules

- `src/features` must never import from `src/app`.
- Shared components and shared libraries must not import feature implementations.
- Client Components, client hooks and browser modules must never import feature `server` modules, Prisma, server credentials or Node-only dependencies.
- Server modules must not import React UI components.
- Feature-to-feature imports must be explicit, one-directional and based on a real dependency. Do not create a shared abstraction merely to avoid one honest dependency.
- Avoid circular dependencies. Move the owned contract to the feature that defines it rather than creating a global dumping ground.
- Do not use compatibility re-export files after an import migration is complete.
- Avoid barrel `index.ts` files by default. Add one only when a feature intentionally exposes a small public API to several consumers.

## Next.js boundaries

- Use Server Components by default.
- Add `"use client"` only at the smallest boundary that needs state, effects, event handlers or browser APIs.
- Do not turn a large component tree into client code for convenience.
- Server Components should read data directly through a server-only feature function. They must not call the application's own Route Handlers.
- Route Handlers are public HTTP endpoints. Validate all request bodies, params, query values and headers that affect behaviour.
- Server Actions are for UI-triggered mutations. Do not use them as a general data-fetching layer or background-job mechanism.
- Treat every Server Action like a public endpoint: validate input and repeat authorization inside the action or the called server operation.
- Route Handlers and Server Actions translate framework input into feature calls and translate results into framework responses. They are not the business layer.
- Do not expose raw provider, database or stack-trace errors to clients.
- Code that uses Prisma, OpenAI, PostgreSQL drivers or worker operations must run in the Node.js runtime.
- Never rely on module-level memory for correctness across requests. Serverless instances do not share process memory.
- Long-running or retryable work must use the durable job path. A production Route Handler may process only a bounded batch.

## Data and validation

- Database access belongs in focused server-only modules owned by the relevant feature.
- Return deliberate application/view types rather than leaking complete Prisma records into React or browser code.
- Generated database types must not become client contracts.
- Use Zod at untrusted runtime boundaries, including HTTP input, stored JSON payloads and external API data where malformed values are possible.
- Infer TypeScript types from schemas when the schema is the runtime source of truth. Do not maintain duplicate interfaces by hand.
- Do not cast parsed JSON directly to a trusted application type.
- Keep raw SQL inside the smallest named module that requires it.
- Application code reads environment variables through the central environment module. Configuration files and bootstrap adapters are the only normal exceptions.
- Keep secrets server-only. Only values intentionally exposed to the browser may use the `NEXT_PUBLIC_` prefix.
- There must be one documented migration source of truth and one canonical runtime content source.

## Clean-code rules

- Prefer obvious code over clever code.
- A file should have one coherent reason to change. File length is a warning signal, not a target to game by creating meaningless fragments.
- Keep a private helper in the same file when it has one consumer and does not obscure the main flow.
- Extract code when it represents a separate responsibility, is reused, needs independent tests or makes the caller materially easier to understand.
- Do not create `manager`, `factory`, `handler`, `service`, `helper`, `utils`, `common` or `base` abstractions without a precise responsibility that the name communicates.
- Do not introduce interfaces for concrete classes or functions unless there is a real alternate implementation or a justified testing seam.
- Prefer small functions and composition. Do not add a dependency-injection container.
- Function-parameter dependency injection is allowed at side-effect boundaries when it materially improves deterministic tests.
- Do not add patterns merely because they appear in SOLID, Clean Architecture, DDD or enterprise examples.
- Remove dead code, stale comments, obsolete wrappers, duplicate implementations and unused dependencies in the same change that replaces them.
- Do not commit temporary `console.log` debugging. Operational logs must be intentional, contextual and safe.
- Do not leave untracked TODOs. Tie deferred work to an issue, milestone or explicit documented limitation.
- Avoid nested ternaries and deeply nested control flow. Prefer named conditions and early returns.
- Error messages must add useful context without exposing secrets or internals to users.
- Comments should explain why a non-obvious decision exists, not narrate straightforward code.
- Do not use `any` as an escape hatch.
- Do not use `@ts-ignore`. Use `@ts-expect-error` only for a verified external limitation and include a reason.
- Do not suppress lint or type errors to make validation pass unless the suppression is narrowly justified in code.
- Do not duplicate constants, schemas or transport contracts across client and server.
- Do not split code into additional files solely to reduce line count.
- Do not keep two naming systems or two canonical import paths during a completed refactor.

## Naming and file conventions

- React component files use `PascalCase.tsx`.
- React hooks use `useDescriptiveName.ts` and begin with `use`.
- Other source files use descriptive `kebab-case.ts` names.
- Next.js special files keep their required names, such as `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx` and `error.tsx`.
- Prefer named exports except where Next.js requires or conventionally expects a default export.
- Name files and functions after behaviour or owned data, for example `get-home-page-data.ts`, `retrieve-assistant-context.ts` or `run-index-batch.ts`.
- Avoid vague suffix taxonomies such as `.service`, `.manager`, `.use-case`, `.repository`, `.mapper` and `.loader` unless the suffix communicates a distinction that genuinely exists in that feature.
- Feature-specific types, schemas and constants stay in the feature.
- Shared types are permitted only when multiple features genuinely own the same contract. The root must not contain a general `types` dumping ground.
- Prefer one clear `types.ts`, `schema.ts` or `constants.ts` per small feature before creating a directory of tiny files.

## React and UI rules

- Keep rendering components focused on rendering and interaction.
- Do not query Prisma, call OpenAI or read secrets from React components.
- Keep server-fetched props minimal and serializable when passing them to Client Components.
- Keep state as local as possible.
- Use `useReducer` only when coordinated state transitions become clearer than several independent state setters. Do not add reducer architecture automatically.
- Custom hooks must represent a coherent reusable behaviour, not serve as a place to hide a large component unchanged.
- Prefer composition over prop-heavy configurable mega-components.
- Shared UI primitives must not know about portfolio, assistant or indexing concepts.
- Do not hand-build parsers, state libraries or design-system primitives when a small maintained dependency already solves the concrete requirement better.

## Testing rules

- Tests live under `tests/<feature>` unless a framework convention requires colocation.
- Test public behaviour and important boundaries, not private implementation trivia.
- Add focused regression coverage when moving or simplifying behaviour-heavy code.
- Keep pure logic independent from network and database effects where practical.
- Use small fakes or injected functions for OpenAI, database and clock effects. Do not introduce a mocking or DI framework without need.
- Do not weaken assertions, delete meaningful tests or snapshot large unstable output merely to complete a refactor.
- Architecture boundary rules should be enforced through ESLint where a simple built-in restriction can prevent regressions.

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

Report exact commands and outcomes. Do not claim database, OpenAI, local Supabase or production behaviour was verified when only mocks or static inspection were used.

## Change discipline

- Inspect the current repository before choosing a target structure.
- Preserve externally observable behaviour unless the active milestone explicitly changes it.
- A refactor is incomplete while old paths, old dependencies, stale documentation or compatibility wrappers remain.
- Update tests, scripts and documentation together with structural changes.
- Prefer one decisive architecture over a transitional mixture of old and new patterns.
- Do not rewrite working algorithms merely to make the diff look architectural.
- Do not merge pull requests as an agent.

## Milestone workflow trigger

When Freeman says:

```text
Run the active milestone.
```

execute the complete workflow defined by:

- this file
- `.ai/README.md`
- `.ai/prompts/orchestrator.md`
- `.ai/workflow/lifecycle.md`
- `.ai/workflow/branch-lifecycle.md`
- the active contract in `.ai/milestones/`
- any active amendment for that milestone
- the current Git, pull-request, review and CI state

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
2. this `AGENTS.md`
3. `.ai/architecture/*.md`, when present
4. `.ai/workflow/*.md`
5. the active parent milestone
6. an active amendment, only for sections it changes
7. implementation, review and quality prompts
8. pull-request descriptions and agent summaries
9. Future branches must not contain a `codex/` prefix. For example, use `feat/milestone-5-architecture-simplification`, not `codex/feat/milestone-5-architecture-simplification`.

Pull-request descriptions and summaries are not evidence of correctness.
