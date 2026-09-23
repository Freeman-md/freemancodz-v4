# Milestone 20: Simplify Application Architecture

**Status:** Frozen
**Version:** 1.0.0
**Last Updated:** 2026-09-23
**Depends On:** Milestone 19
**Target Pull Request:** https://github.com/Freeman-md/freemancodz-v4/pull/22
**Target Branch:** `refactor/milestone-20-architecture-simplification`
**Merge Mode:** Manual
**Merge Method:** squash
**Superseded By:** —

## Goal

Replace the repository's ceremony-heavy `src/server` architecture with one small, explicit modular-monolith structure: browser UI in `features`, backend capabilities in `modules`, vendor and technical implementations in `infrastructure`, non-HTTP adapters in `entrypoints`, and all dependency wiring in `src/modules/composition.ts`. Preserve current public, admin, assistant, workflow, indexing and maintenance behaviour while deleting redundant interface/model/provider/composition layers and leaving one clear import path for every responsibility.

## Required behaviour

### Approved architecture decision

This milestone records Freeman's explicit approval to replace the current mandatory Next.js project convention. The implementing agent must first revise `.agents/skills/nextjs-architecture/SKILL.md` and the directly affected repository guidance in `AGENTS.md` so that the authoritative instructions describe this approved structure before source files are moved.

The revised standard must preserve verified Next.js and React requirements, thin App Router adapters, server/client isolation, constructor injection where a class has dependencies, runtime validation at trust boundaries, and the final architecture-completion report. It must remove the old requirements for:

- a `src/server` wrapper;
- `src/server/composition-root.ts` and per-capability composition files;
- one interface file for every service, repository and provider;
- `I`-prefixed interfaces used only for pattern compliance;
- mandatory `models/`, `interfaces/`, `providers/`, `services/` and `public.ts` folders in every module; and
- module-owned Supabase, OpenAI or Google implementation classes.

The new standard must require responsibility-led files, not mechanical role folders. Keep a separate type or behavioural contract only when it defines a real runtime boundary, cross-module capability, replaceable dependency or useful test seam. Simple TypeScript data definitions are `types.ts` or live beside their sole owner; they are not called models.

## Required top-level structure

At completion, hand-authored application code uses this shape:

```text
src/
├── app/
├── features/
├── modules/
│   └── composition.ts
├── infrastructure/
├── entrypoints/
├── contracts/
├── generated/
├── shared/
└── proxy.ts
```

`src/server` must not remain. Do not keep compatibility barrels, duplicate old paths or forwarding wrappers.

### Ownership and dependency direction

- `app` owns Next.js pages, layouts, Route Handlers, Server Actions and framework boundaries. It stays thin.
- `features` owns browser-facing UI, hooks, browser APIs and browser state. It must not import `modules`, `infrastructure`, Prisma, secrets or server-only packages.
- `modules` owns backend product capabilities, business decisions, persistence boundaries, workflow orchestration and provider-neutral application types.
- `infrastructure` owns Prisma configuration, environment access, logging implementations and vendor-specific OpenAI, Supabase and Google Calendar integrations. It must not own product policy or import feature code.
- `entrypoints` owns thin job and maintenance adapters. It imports configured capabilities from `modules/composition.ts` and contains no reusable business logic.
- `contracts` remains the canonical home only for runtime-validated values crossing an HTTP, stream, Server Action, Client Component or other trust/runtime boundary. It must not become a general type directory.
- `shared` remains frontend-safe and domain-free.
- `generated` remains generated-only.

The normal runtime path is:

```text
App Router adapter or entrypoint
→ src/modules/composition.ts
→ configured module service
→ repository and/or infrastructure dependency
```

Only outer adapters in `app` and `entrypoints` may import `modules/composition.ts`. Individual modules, infrastructure and features must never import it.

## Composition

Create exactly one production composition file:

```text
src/modules/composition.ts
```

It must:

- be explicitly server-only;
- obtain configured infrastructure clients;
- instantiate repositories, infrastructure adapters, workflow definitions and services;
- inject cross-module dependencies;
- export the configured service instances used by App Router adapters and entrypoints; and
- contain no business rules, request-specific state or provider operations.

Delete `src/server/composition-root.ts` and `src/server/composition/*.composition.ts`. Do not recreate per-capability composition files, a dependency-injection container, service locator or global mutable registry.

## Backend module structure

Move backend capabilities to `src/modules` and simplify them toward this responsibility map. Create only files that retain real code; a listed `types.ts`, `schemas/`, `repositories/` or `mappers/` location is not a requirement when the remaining content belongs more clearly beside its single consumer.

```text
src/modules/
├── composition.ts
├── admin-auth/
│   ├── service.ts
│   └── types.ts
├── assistant/
│   ├── service.ts
│   ├── types.ts
│   ├── prompt.ts
│   └── tools/
├── audit/
│   ├── service.ts
│   ├── repository.ts
│   └── types.ts
├── meeting/
│   ├── service.ts
│   ├── repository.ts
│   ├── config.ts
│   └── types.ts
├── portfolio/
│   ├── service.ts
│   ├── administration.ts
│   ├── media.ts
│   ├── cache.ts
│   ├── types.ts
│   └── repositories/
├── rate-limit/
│   ├── service.ts
│   ├── repository.ts
│   └── types.ts
├── search-index/
│   ├── service.ts
│   ├── search.ts
│   ├── types.ts
│   ├── repositories/
│   └── mappers/
└── workflow/
    ├── service.ts
    ├── repository.ts
    ├── registry.ts
    ├── types.ts
    ├── schemas/
    └── definitions/
        ├── audit/
        └── meeting-booking/
```

### Module-specific requirements

- **Admin Auth:** collapse the current service/provider interface ceremony. Keep one `AdminAuthService`; move Supabase-specific auth operations to infrastructure. Preserve approved-admin provisioning, magic-link request, confirmation, authorization and sign-out behaviour.
- **Assistant:** keep one application service, its prompt and cohesive tools. Preserve streaming, rate limiting, website search and workflow behaviour. Remove the unused frontend fallback answer and other genuinely dead aliases encountered in this path.
- **Audit:** keep one service and one `AuditRequest` repository. Preserve idempotent submission and protected admin listing.
- **Meeting:** keep one service, repository, config and genuine types. Calendar SDK work belongs in infrastructure.
- **Portfolio:** replace `HomeService`, `WorkService`, portfolio `AuditService`, `AboutService` and `ProfileService` plus their one-to-one interfaces with one cohesive `PortfolioService` exposing the public read operations still required by the current single-page portfolio and search indexing. Keep administration and media as separate responsibilities because they have different mutation and credential lifecycles. Retain focused persistence classes, but collapse their matching interface files into the smallest structural dependency types actually needed by services/tests. Preserve current cache tags and invalidation behaviour.
- **Rate limit:** keep the database-backed service/repository behaviour without mandatory matching interface files.
- **Search index:** keep indexing/worker orchestration separate from query-time site search, but within one module. Preserve the database-driven job lifecycle, rebuild/run commands, whole-snapshot replacement, embeddings and assistant retrieval behaviour. Do not merge indexing and retrieval merely to reduce file count.
- **Workflow:** keep the durable workflow engine, repository, registry, schemas and versioned definitions. Audit and Meeting workflow definitions must remain under `modules/workflow/definitions` because Workflow owns orchestration; they receive Audit and Meeting capabilities through composition. Audit and Meeting modules continue to own their persistence and business service boundaries.

Remove current `public.ts` barrels when they merely re-export neighboring files. Consumers must use one canonical direct module path after the refactor. Do not leave compatibility exports. A narrow top-level export may remain only when it materially protects a real cross-module boundary and is demonstrably simpler than direct imports.

## Infrastructure structure

Move reusable technical and vendor-specific code to:

```text
src/infrastructure/
├── config/
│   └── env.ts
├── database/
│   └── prisma.ts
├── logging/
│   └── logger.ts
├── openai/
│   ├── client.ts
│   └── types.ts
├── supabase/
│   ├── clients.ts
│   ├── auth.ts
│   ├── storage.ts
│   └── refresh-auth.ts
└── google-calendar/
    ├── client.ts
    └── types.ts
```

Requirements:

- Move `SupabaseAuthProvider` out of Admin Auth and `SupabaseStorageProvider` out of Portfolio into `infrastructure/supabase`.
- Consolidate the current Supabase client factories in `clients.ts` while preserving separate browser-safe/public, cookie-based SSR and secret-backed admin/storage credential boundaries. Privileged clients and credentials remain server-only and lazily constructed where currently required.
- Consolidate the current OpenAI client/provider split into one cohesive infrastructure client unless inspection proves a separate layer still owns a distinct responsibility. Preserve response streaming and embedding operations.
- Move Google Calendar SDK integration out of the Meeting module's conceptual boundary and expose one focused infrastructure client.
- Keep one logger implementation and the minimal logger shape needed by consumers in `logging/logger.ts`; do not retain a one-file interface directory.
- Infrastructure configuration must continue to read environment variables through the central environment module. Never read secret files during implementation or tests.
- Product retry, fallback, authorization, workflow and outcome decisions remain in modules, not infrastructure.

## Entrypoints and commands

Move `src/server/entrypoints` to `src/entrypoints` with the current `jobs`, `maintenance` and genuinely shared entrypoint helpers. Update every active `package.json` command to the new paths while preserving command names, arguments, production confirmation safeguards, sanitized output, exit behaviour and database disconnection.

The following workflows must remain operational:

- local and production portfolio bootstrap;
- local and production admin-user provisioning;
- local and production index worker run; and
- local and production full index rebuild.

Do not add a root `scripts` directory or duplicate local/production implementations.

## Frontend features and App Router boundaries

- Move reusable admin editor/upload UI from `src/app/admin/_components` to `src/features/admin/components`; keep admin pages, actions, authorization adapters and route files in `app`.
- Replace `src/features/assistant/models/chat-message.ts` with a clearly owned `types.ts` definition, preserving browser-owned conversation state.
- Replace `src/features/portfolio/models` with `src/features/portfolio/types` and keep only presentation/source types owned by the browser-facing portfolio.
- Remove the one-component `features/audit` wrapper; use the existing Portfolio action/assistant trigger directly from the portfolio scene without duplicating behaviour.
- Keep the current portfolio presentation mapper and icon registry with the portfolio feature. Do not move browser presentation mapping into a backend module.
- Keep Client Components dependent only on contracts, feature code and frontend-safe shared code.
- Keep App Router files thin: validate/authorize transport input, import configured services from `modules/composition.ts`, call them and translate the result.
- Preserve the current single-page public experience and redirect behaviour. Do not restore removed `/work`, `/about` or `/audit` public pages.

## Type and abstraction rules

- Rename only misleading architectural terminology required by this milestone; do not churn product language.
- Use `types.ts` or a small `types/` directory for plain TypeScript data definitions.
- Keep runtime schemas where untrusted data is parsed; infer types from those schemas when they are the source of truth.
- Keep generated Prisma types generated-only. Use them directly where they accurately represent persistence records, and do not publish them across browser/trust boundaries.
- Preserve constructor injection for services with dependencies, but do not require a named interface for every concrete class.
- Prefer narrow structural dependency types or `Pick`-style seams when tests or cross-module injection need substitution.
- Retain a separate interface only when it has more than ceremonial value. Do not create `interfaces/`, `models/`, `providers/`, `services/` or `public.ts` mechanically.
- Do not add factories, managers, adapters, base classes, a DI framework or generic repositories.

## Documentation and enforcement

Update active documentation that describes the current architecture or executable paths, including at minimum:

- `README.md`;
- `docs/workflow-foundation.md`;
- `docs/portfolio-content-system.md`; and
- the indexing documents under `docs/indexing` where paths or ownership statements are affected.

Do not rewrite archived contracts under `.agents/milestones/archive`; they are historical evidence.

Update ESLint import restrictions so they enforce the new boundaries:

- features cannot import app, modules or infrastructure;
- shared cannot import app, features, modules or infrastructure;
- infrastructure cannot import app or features and must not depend on business-module implementations;
- modules other than `modules/composition.ts` cannot import app, features or composition;
- app and entrypoints cannot construct repositories, infrastructure adapters or module services; and
- only app and entrypoints may import `modules/composition.ts`.

Enforce dependency direction with lint/import rules where practical. Do not add brittle tests that assert an exact file tree, class name or interface count.

## Behaviour that must remain unchanged

This is a structural refactor. Preserve:

- the rendered public homepage, metadata, proxy redirects and portfolio content;
- admin login, confirmation, sign-out, authorization, provisioning and all protected admin CRUD/media flows;
- assistant request/stream contracts, UI behaviour, site search and rate limiting;
- Audit and Meeting workflow definitions, state transitions, persistence, idempotency and tool behaviour;
- database-driven search-index job creation and processing;
- cache registration and invalidation;
- all environment variable names and server-only credential boundaries;
- Prisma schema, migrations and generated-client behaviour; and
- current developer-facing command names.

## Constraints

- Work from the latest `main` and create only the target branch named in this contract.
- Inspect the installed Next.js 16.2.x documentation under `node_modules/next/dist/docs` before changing framework-boundary or cache code.
- Do not read `.env`, `.env.local`, `.env.production.local` or any secret-bearing file.
- Make the refactor in coherent vertical slices so imports and tests can be repaired with each responsibility move; do not maintain old and new canonical paths at completion.
- Reuse existing behaviour and tests. Do not rewrite working algorithms merely because files move.
- Preserve safe client-facing errors and intentional structured backend logging.
- Remove dead files and stale imports in the same change that replaces them.
- Keep the final worktree free of generated validation artifacts and unrelated changes.

## Explicitly out of scope

- Product redesign, copy/content changes or new public pages.
- New assistant, Audit, Meeting, admin or portfolio functionality.
- Prisma schema changes, migrations, seed-data changes or production data operations.
- Redesigning the search-index architecture, job lifecycle or schedule.
- Changing authentication providers, storage buckets, OpenAI models, Calendar configuration or environment variable names.
- New dependencies unless a current dependency is demonstrably incapable of preserving existing behaviour.
- Deployment, production migration, production bootstrap or production indexing.
- Rewriting archived milestone contracts to use the new paths.

## Required tests

Update existing tests and imports without weakening behavioral assertions. Add focused regression coverage only where collapsing a boundary would otherwise leave important behaviour unprotected.

1. Portfolio public reads, admin mutations, media operations, cache tags and presentation mapping remain covered.
2. Admin Auth magic-link, confirmation, authorization, sign-out and provisioning behaviour remains covered.
3. Assistant streaming, rate limiting, site search and browser conversation behaviour remains covered.
4. Audit and Meeting workflow definitions and WorkflowService transitions remain covered.
5. Search indexing, site search, worker route and entrypoint behaviour remains covered.
6. Package-command tests prove each command resolves to the new `src/entrypoints` target and retains its production guard.
7. ESLint proves the new client/server, module/infrastructure and composition import boundaries.
8. Existing database integration tests remain green when their disposable database is available; an unavailable database must be reported honestly rather than bypassed.

Run and report:

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run test:portfolio:admin
npm run test:search-index
npm run test:workflow
npm run test:audit
npm run build
git diff --check
```

If an existing aggregate test already covers an explicitly listed focused suite, it is still acceptable to run the focused suite as required regression evidence. If the build is blocked only by unavailable external font/network access or integration tests skip because no disposable database is available, record the exact boundary; do not add a workaround or claim runtime verification.

## Acceptance criteria

- [ ] `.agents/skills/nextjs-architecture/SKILL.md` and affected guidance in `AGENTS.md` describe the approved simplified architecture and no longer mandate the superseded `src/server`/interface-per-class convention.
- [ ] The hand-authored source tree uses `app`, `features`, `modules`, `infrastructure`, `entrypoints`, `contracts`, `generated` and `shared` as sibling responsibilities under `src`.
- [ ] `src/server` is absent and no active import, package command or current documentation references it.
- [ ] `src/modules/composition.ts` is the only production dependency-composition location, contains no business rules, and is imported only by app/entrypoint adapters.
- [ ] Supabase Auth and Storage, OpenAI, Google Calendar, Prisma, environment and logging implementations live under `src/infrastructure` with server-only credential boundaries intact.
- [ ] Audit and Meeting workflow definitions live under `src/modules/workflow/definitions`, while Audit and Meeting retain their own database/service responsibilities.
- [ ] Portfolio public reads are consolidated into one cohesive service; administration and media remain separate; redundant page-service interfaces/classes are gone.
- [ ] Ceremonial one-to-one interfaces, mechanical role folders, redundant `public.ts` barrels and compatibility wrappers removed by the refactor are absent.
- [ ] Plain TypeScript definitions no longer live in misleading `models` folders in the refactored feature/module areas.
- [ ] Reusable admin UI lives in `features/admin`; App Router admin files remain thin adapters.
- [ ] The redundant Audit feature wrapper and genuinely dead assistant aliases/fallbacks identified in scope are removed without changing behavior.
- [ ] All operational package commands point to existing `src/entrypoints` files and preserve their names and safety behaviour.
- [ ] ESLint enforces the new dependency boundaries without file-layout tests.
- [ ] Active README/docs paths and architecture descriptions match the final source tree; archived milestone history is unchanged.
- [ ] No Prisma schema, migration, seed-content, environment-name or production-data change is included.
- [ ] Public, admin, assistant, workflow, indexing, caching and maintenance behavior is preserved by the required tests.
- [ ] All required validation is reported exactly and `git diff --check` passes.
- [ ] The final repository search finds no stale `@/server`, `src/server`, old composition-root or removed compatibility imports outside archived historical documents.
- [ ] Architecture validation reports `Architecture validation: passed` against the revised authoritative skill.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual tasks

None.

## Manual acceptance criteria

None.

## Completion Record

**Implementation Outcome:** PR #22 merged externally into `main` at `842109b8caec96d0f6d28f2c718b0687bf263308` before the required independent review and final handoff completed. The missing corrective commit `ff03f066a9262759980baa051954cefecd8a705b` was subsequently integrated into `main` by repair merge `1ec7337` under explicit user authorization.
**Important Decisions:** Adopted the approved responsibility-led `app`/`features`/`modules`/`infrastructure`/`entrypoints` structure with one `src/modules/composition.ts`, removing legacy `src/server` ceremony while preserving product behaviour.
**Contract Deviations:** The required review/handoff sequence was interrupted by the external merge. The corrective commit was integrated directly into `main` after the PR merge under explicit user authorization. Four disposable PostgreSQL integration cases were skipped because no test database was configured in the workspace.
**Verification Summary:** On corrected tree `ff03f06`, `npm run prisma:validate`, `npm run prisma:generate`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:portfolio:admin`, `npm run build`, and `git diff --check` passed. Unit/browser tests passed 123/123; integration tests passed 15/15 with four disposable-PostgreSQL cases skipped. The first sandboxed build was blocked only by Google Fonts; the network-enabled build completed all 24 routes successfully. Repair merge `1ec7337` has the identical Git tree.
**Review Outcome:** Approved after repair. The repair audit isolated the only post-merge difference to the valid Next.js Server Action export correction. The corrected tree passed the full relevant validation and is now contained in `main`.
**Reviewed Head:** ff03f066a9262759980baa051954cefecd8a705b
**Pull Request:** https://github.com/Freeman-md/freemancodz-v4/pull/22
**Merge Commit:** 842109b8caec96d0f6d28f2c718b0687bf263308
**Follow-up Notes:** Corrective merge `1ec7337` is on remote `main`; archive the contract and remove the fully merged milestone branch locally and remotely.
