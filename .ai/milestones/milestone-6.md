# Milestone 6: Next.js Architectural Standard Migration

**Status:** Draft
**Version:** 1.0.0
**Last Updated:** 2026-07-30
**Depends On:** Milestone 5
**Target Pull Request:** —
**Target Branch:** `feat/milestone-6-nextjs-architecture`
**Superseded By:** —

## Goal

Refactor the current Next.js App Router repository into the modular-monolith architecture required by `.agents/skills/nextjs-architecture/SKILL.md` without changing application behaviour.

The completed repository must have:

1. a feature-based browser frontend under `src/features`;
2. backend capabilities under `src/server/modules`;
3. reusable technical backend setup under `src/server/infrastructure`;
4. thin non-HTTP process boundaries under `src/server/entrypoints`;
5. Next.js-only framework surfaces under `src/app`;
6. explicit runtime contracts under `src/contracts`;
7. genuinely generic frontend code under `src/shared`; and
8. generated code under `src/generated`.

This resolves the current mixture of browser code and backend code inside feature folders, direct database and provider access outside their architectural roles, root operational scripts that also own workflows, old shared `src/lib` and `src/components` ownership, inconsistent role naming, and imports that bypass deliberate backend module APIs.

## Governing architecture and naming decision

Before planning or implementing this milestone, every agent must read:

- `AGENTS.md`;
- `.agents/skills/nextjs-architecture/SKILL.md`;
- the installed Next.js version from `package.json`; and
- the matching bundled Next.js documentation in `node_modules/next/dist/docs`.

The installed framework at contract creation is Next.js `16.2.10`. The implementation must preserve its required App Router filenames and `src/proxy.ts` convention.

The architecture skill is authoritative except for the following naming decision, which is explicitly required and approved by this milestone:

- React component files use `PascalCase.tsx`.
- Hook files use `useSomething.ts`, and the primary exported Hook has the same name.
- Every other project-authored TypeScript source file uses kebab-case.
- Files with architectural roles retain a dot role suffix, including files inside a role-named folder. Examples include `chat-message.model.ts`, `assistant-conversation.state.ts`, `create-assistant-response.service.ts`, `content-block.repository.ts`, `assistant-context.mapper.ts`, `openai-response.provider.ts`, and `assistant.contract.ts`.
- Project-authored directories use kebab-case.
- Next.js special files keep their exact framework names.

The `.model.ts` and `.state.ts` suffixes are a deliberate, user-approved milestone-specific exception to the skill's normal preference against redundant role suffixes inside `models/` and `state/`. No other exception is implied.

## Scope

### Included

- Move existing browser, backend, infrastructure, contract, shared, and entrypoint code into the locations specified in this contract.
- Rename project-authored TypeScript files to the approved naming convention.
- Split mixed files where a verified file currently contains more than one architectural role.
- Make each backend capability expose a deliberate `public.ts`.
- Convert Route Handlers into thin HTTP controllers.
- Replace root `scripts/` with `src/server/entrypoints/cli`, `jobs`, and `maintenance`.
- Extract script workflows into server-module services before creating thin entrypoints.
- Retarget package scripts and Prisma seed configuration to the new entrypoints.
- Update imports, tests, mocks, ESLint boundary rules, TypeScript-resolved paths, and documentation.
- Delete old paths, obsolete adapters, duplicate helpers, and empty directories only after their replacements pass focused validation.
- Preserve assistant, portfolio, protected asset, search-indexing, worker, seed, and operational-command behaviour.

### Explicitly out of scope

- New product features, routes, UI, copy, visual design, or public API behaviour.
- Database schema or migration changes.
- Changing search ranking, chunking, embedding, retry, rate-limit, streaming, or seed semantics.
- Replacing Prisma, OpenAI, Vercel Blob, Zod, `tsx`, or the current test runner.
- Changing deployment topology or introducing a separate backend service.
- Adding empty folders merely to mirror an example tree.
- Editing generated Prisma files.
- Introducing compatibility re-export files after consumers have moved.
- Keeping both old and new import paths as a transitional architecture.
- Changing environment names or inspecting secret environment files.

## Current-state assessment

This assessment records repository evidence verified when the contract was created. The implementation agent must recheck the listed paths before editing and stop if the active repository has materially diverged.

### Relevant current directories

| Current location | Verified responsibility | Architectural problem |
| --- | --- | --- |
| `src/app` | App Router pages, layouts, metadata, Route Handlers, loading/error boundaries, and `globals.css` | Route Handlers import feature internals and, in the blob route, a provider SDK directly. |
| `src/features/assistant` | Assistant UI, Hook, browser client, state, contracts, backend retrieval, rate limiting, OpenAI streaming, prompt, and raw vector search | Browser and backend runtime responsibilities are mixed in one feature. |
| `src/features/portfolio` | Portfolio components, browser/view types, schemas, page loaders, Prisma queries, and mappers | Backend persistence and services live inside a frontend feature. |
| `src/features/search-index` | Backend-only indexing types, document builders, embeddings, repositories, workflows, and worker | A backend-only capability is incorrectly classified as a frontend feature. |
| `src/components` | Site layout and generic UI components | Shared frontend ownership uses a superseded top-level location; four React component filenames are lowercase. |
| `src/lib` | Prisma, OpenAI, environment, navigation, metadata, and generic utilities | Backend infrastructure and frontend shared configuration are mixed in a generic folder. |
| `scripts` | Indexing, worker, status, preview, rebuild, seed commands, and shared script helpers | Several executable files contain reusable workflow logic and bypass module public APIs. |
| `prisma/seed-data` | Canonical portfolio seed inputs plus seed persistence workflow | Pure seed data imports frontend types, and `portfolio-seed.ts` also performs database I/O. |
| `prisma/seed.ts` | Prisma seed adapter | Duplicates the root seed entrypoint and prevents direct use of the required maintenance entrypoint. |
| `src/generated/prisma` | Generated Prisma client | Correct generated ownership; it must remain generated-only. |
| `tests` | Assistant, portfolio, search-index, Route Handler, and architecture coverage | Imports and architecture assertions reference the old paths; one worker test imports a root script. |

`src/components/chat` is an empty stale directory and must be removed during cleanup.

### Existing root scripts and verified responsibilities

| Current script | Current responsibility | Mixed concern |
| --- | --- | --- |
| `scripts/index-source.ts` | Parse a source type/id, invoke source indexing, print the result, set failure status | Mostly an adapter, but imports an internal feature service directly. |
| `scripts/index-worker.ts` | Start the polling worker, handle signals, run batches, log results, and disconnect Prisma | Process lifecycle is valid entrypoint work; reusable batch workflow must remain in a module service. |
| `scripts/preview-search-index.ts` | Load a source, build prospective documents/chunks, compare stored state, and print create/update/unchanged/delete actions | Owns a reusable preview workflow and terminal presentation in one file. |
| `scripts/rebuild-search-index.ts` | Enumerate supported sources, index each source, aggregate totals, print progress, and handle production confirmation | Owns a reusable rebuild workflow and an operational adapter in one file. |
| `scripts/search-index-job-status.ts` | Query job status data and format terminal output | Calls persistence directly instead of a use-case service. |
| `scripts/seed-portfolio-data.ts` | Load local configuration, guard production execution, run the seed workflow, report results, and disconnect Prisma | Uses a root adapter while seed persistence also lives in `prisma/seed-data`. |
| `scripts/lib/indexing-arguments.ts` | Parse and validate supported indexing source arguments | Reusable boundary validation is outside the owning module. |
| `scripts/lib/production-confirmation.ts` | Require explicit production confirmation and report the target database | This is a maintenance-entrypoint helper, not business logic. |

### Naming violations and role renames

Verified filename violations or required architectural-role renames include:

- `src/components/ui/button.tsx` → `Button.tsx`
- `src/components/ui/card.tsx` → `Card.tsx`
- `src/components/ui/scroll-area.tsx` → `ScrollArea.tsx`
- `src/components/ui/textarea.tsx` → `Textarea.tsx`
- `src/features/assistant/use-assistant.ts` → `hooks/useAssistant.ts`
- `src/features/assistant/assistant-session.ts` → `state/assistant-conversation.state.ts`
- `src/features/assistant/client.ts` → `api/stream-assistant-response.ts`
- `src/features/assistant/types.ts` → role-owned frontend and backend model files
- `src/features/assistant/schema.ts` → `src/contracts/assistant.contract.ts`
- `src/features/assistant/constants.ts` and `server/chat-stream-constants.ts` → owner-specific constants or the boundary contract
- `src/features/portfolio/types.ts` → server-owned portfolio result models, component-local presentation props, and boundary contracts according to actual data flow
- `src/features/portfolio/server/loaders/*.loader.ts` → backend `services/*.service.ts`
- `src/features/portfolio/server/queries/*.query.ts` → backend `repositories/*.repository.ts`
- `src/features/search-index/server/*.ts` → explicit service, provider, mapper, factory, repository, or model files
- `src/lib/utils.ts` → `src/shared/utils/class-names.ts`

Existing assistant and portfolio component filenames are already PascalCase and should keep their names unless this contract explicitly says otherwise.

### Mixed business and boundary concerns

- `src/app/api/blob/[...pathname]/route.ts` calls `@vercel/blob` directly. Provider access must move behind the portfolio backend module.
- `src/app/api/chat/route.ts` performs HTTP work correctly but imports assistant backend internals. It must use the assistant module's `public.ts` and the shared boundary contract.
- `src/app/api/internal/search-index-worker/route.ts` currently owns configuration lookup, authorization, worker dependency construction, logging, and response translation. Configuration and worker orchestration must move behind the search-index public API while the route preserves its current HTTP statuses and bounded-batch behaviour.
- `src/features/assistant/server/create-assistant-response.ts` combines use-case decisions, OpenAI SDK streaming, provider-event translation, and response stream formatting.
- `src/features/assistant/server/retrieve-context.ts` combines assistant context decisions with search-index retrieval.
- `src/features/assistant/server/match-site-chunks.ts` owns raw vector SQL and ranking/diversification concerns.
- `src/features/search-index/server/create-embeddings.ts` combines SDK access with module workflow use.
- `src/features/search-index/server/builders` plus `build-search-documents.ts` are one representation-conversion responsibility split behind an unnecessary barrel.
- `src/features/search-index/server/prepare-site-chunk.ts` performs deterministic non-trivial object construction.
- `prisma/seed-data/portfolio-seed.ts` combines pure seed-data assembly with destructive persistence.

### Ownership questions resolved by this contract

The current repository provides enough evidence to resolve the files that initially have ambiguous names or mixed ownership:

- `src/features/assistant/types.ts` is not moved as one file. Browser message/stage types go to the assistant frontend model, boundary types are inferred from the assistant contract, and vector-search result types go to search-index backend models.
- `src/features/assistant/models/chat-message.model.ts` remains a legitimate feature model because `ChatMessage` is created and mutated by browser-owned conversation state. It may reference assistant source data from `assistant.contract.ts`; the server module must never return a `ChatMessage`.
- `OpenPortfolioChatDetail` is not a feature model. The home-page Server Component passes it into the client `AssistantTriggerButton`, and the browser dispatches it as a `CustomEvent`, so its runtime-validated shape belongs in `assistant.contract.ts`.
- `src/features/portfolio/types.ts` is not moved to a feature-level `portfolio-view.model.ts`. `HomePageData`, `WorkPageData`, `AboutPageData`, `Project`, `Experience`, `Principle`, `ProfileService`, and the content structures are returned by portfolio backend services and remain server-owned under `src/server/modules/portfolio/models`.
- The current portfolio pages and portfolio components are Server Components. Passing portfolio results from a page to those components does not create a runtime boundary and does not justify a portfolio contract. Portfolio components must use narrow component-local presentation prop types and must not import server models.
- `src/features/assistant/utils.ts` is not a shared utility. Its one used browser helper is private to `ChatConversation.tsx`.
- `src/lib/navigation.ts` and `src/lib/links.ts` are one shared frontend link-configuration responsibility and become `src/shared/config/links.ts`.
- `src/lib/site-metadata.ts` is shared runtime configuration. It must become the source consumed by seed data, rather than importing seed data at runtime.
- `src/features/search-index/server/builders` is one pure search-document mapping responsibility, not a collection of services.
- `src/features/search-index/server/prepare-site-chunk.ts` is a deterministic factory because it centralizes non-trivial chunk identity/hash construction.
- `prisma/seed-data/portfolio-seed.ts` must split: pure canonical input remains with seed data, database writes move to the portfolio repository, and orchestration moves to a portfolio service.
- `scripts/lib/production-confirmation.ts` is permitted beside maintenance entrypoints because it performs only process-boundary confirmation/formatting; it must not expand into reusable workflow logic.

There is no unresolved ownership decision in the verified current tree. If a new or materially changed file appears before implementation, Phase 0 must classify it with the skill's placement decision tree and add its exact disposition to the milestone implementation ledger before code is moved.

### Affected imports, tooling, tests, and documentation

- The only configured TypeScript alias is `@/*` → `./src/*`. Keep this alias and update its targets; do not introduce a second canonical alias system.
- `eslint.config.mjs` protects the old `src/features/**/server`, selected `src/lib` files, and old client globs. It must be replaced with rules for the new layers and naming/boundary tests.
- `package.json` commands point at root `scripts/`. Every active command must point directly at `src/server/entrypoints`.
- `package.json` contains `test:rag-rpc`, which points to the nonexistent `scripts/test-match-site-chunks.ts`. Remove this stale command; do not recreate an obsolete script.
- The repository has ESLint but no dedicated formatter or `format` package command. Formatting validation must therefore use ESLint plus whitespace/diff checks; do not add a formatter solely for this structural migration.
- `prisma.config.ts` points Prisma seed execution at `prisma/seed.ts`. It must call the new maintenance entrypoint directly.
- `README.md` documents the superseded `src/components`, feature-owned server code, `src/lib`, and root-script paths. Replace that guidance with the final architecture and operational command locations.
- `tests/assistant/architecture-boundaries.test.ts` asserts the old architecture and ESLint globs.
- `tests/search-index/index-worker.test.ts` imports `scripts/index-worker.ts`.
- The remaining tests import assistant, portfolio, search-index, or shared code at paths that will move.
- `src/lib/site-metadata.ts` imports `prisma/seed-data/profile.ts` at runtime. This dependency must be reversed so shared runtime metadata owns the display constant and seed data consumes it.
- `next.config.mjs` requires no path change.
- `vercel.json` targets the existing HTTP worker Route Handler and must continue to target that unchanged route.
- No dedicated circular-dependency detector is currently configured. Do not add an architecture framework solely for this migration; use lint boundary rules, the TypeScript build graph, focused architecture tests, and explicit import review.

## Required target structure

Create only folders that receive a verified responsibility:

```text
src/
├── app/
├── contracts/
│   ├── assistant.contract.ts
│   ├── portfolio-asset.contract.ts
│   └── search-index-worker.contract.ts
├── features/
│   ├── assistant/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── models/
│   │   └── state/
│   └── portfolio/
│       └── components/
├── server/
│   ├── entrypoints/
│   │   ├── cli/
│   │   ├── jobs/
│   │   └── maintenance/
│   ├── infrastructure/
│   │   ├── config/
│   │   ├── database/
│   │   ├── logging/
│   │   └── openai/
│   └── modules/
│       ├── assistant/
│       ├── portfolio/
│       └── search-index/
├── shared/
│   ├── components/
│   │   ├── layout/
│   │   └── ui/
│   ├── config/
│   └── utils/
├── generated/
│   └── prisma/
└── proxy.ts
```

Keep the existing App Router route tree, framework files, metadata files, loading boundaries, `globals.css`, icon, and `src/proxy.ts` in place.

## Dependency rules

The final imports must follow:

```text
app
├── features
├── contracts
└── server/modules through public.ts

features
├── contracts
└── shared

server/modules
├── contracts
├── other modules through public.ts
├── server/infrastructure
└── runtime-neutral shared utilities only when genuinely necessary

server/infrastructure
├── generated
└── external packages
```

The following imports are prohibited:

- `features → server`
- `server → features`
- `shared → features`
- `shared → server`
- `infrastructure → modules`
- one module → another module's internal files
- repositories or providers → services
- browser code → Prisma, server infrastructure, provider SDKs, secrets, or `server-only` code

Route Handlers and server-rendered pages may call module services directly through `public.ts`. Server Components must not call this application's own Route Handlers.

Use these data-flow paths:

```text
Server page or Server Component
→ server/modules/<module>/public.ts
→ feature component

Client Component
→ features/<feature>/api
→ app/api/.../route.ts
→ server/modules/<module>/public.ts
```

- Pages and Server Components may call backend services only through the owning module's `public.ts` and may compose `features/<feature>/components`.
- Client Components must never import `server/`; browser requests and streams use a feature-owned `api` adapter and an explicit framework boundary.
- Route Handlers call backend services only through module `public.ts`.
- Server modules must never import or return feature-owned models.
- Server-only service results remain in the owning server module.
- Request, response, stream, Server Action, Server-to-Client prop, and other runtime/trust-boundary shapes use runtime-validated contracts under `src/contracts`.
- Feature models are limited to browser-owned state, browser-derived presentation data, and UI-only concepts.
- Passing props only between Server Components does not require a contract.
- Do not create a contract or feature model merely to fill the target tree.

## Current-to-target mapping

### Framework surfaces

| Current path | Proposed path | Architectural role | Required changes | Dependencies or risks |
| --- | --- | --- | --- | --- |
| `src/app/page.tsx` | same | Next.js page | Call `getHomePageData` through portfolio `public.ts`, then compose portfolio feature components and shared UI. Keep the returned page-data type server-owned; use `assistant.contract.ts` for the trigger-detail object passed to `AssistantTriggerButton`. | Preserve server rendering and page data shape; do not import portfolio module internals or make the server service return a feature model. |
| `src/app/about/page.tsx` | same | Next.js page | Call `getAboutPageData` only through portfolio `public.ts`; pass results through the Server Component tree and update shared imports. | Preserve loading/error and rendered copy; no contract is required solely for Server Component props. |
| `src/app/work/page.tsx` | same | Next.js page | Call `getWorkPageData` only through portfolio `public.ts`; pass results through the Server Component tree and update shared imports. | Preserve loading/error and rendered projects; no feature model may be used as the service return type. |
| `src/app/layout.tsx` and metadata files | same | Next.js framework files | Update layout, metadata, navigation, and assistant component imports to new feature/shared paths. | Do not rename framework files or alter metadata output. |
| `src/app/api/chat/route.ts` | same | HTTP controller | Parse requests and serialize JSON/stream responses with `assistant.contract.ts`; extract the transport client identifier; call assistant services only through `server/modules/assistant/public.ts`. | Preserve request schema, error responses, rate-limit response, stream event sequence, error sanitization, and Node runtime. |
| `src/app/api/blob/[...pathname]/route.ts` | same | HTTP controller | Validate pathname input with `portfolio-asset.contract.ts`; remove direct `@vercel/blob` use; call `getPortfolioAsset` through portfolio `public.ts` and translate its server-owned result to the binary HTTP response. | Preserve protected-path handling, headers, streaming, missing asset status, and Node runtime. Do not invent a JSON response model for the binary body. |
| `src/app/api/internal/search-index-worker/route.ts` | same | HTTP controller | Delegate configured authorization and one bounded worker batch through search-index `public.ts`; serialize success/error bodies with `search-index-worker.contract.ts`. | Preserve missing-secret `500`, invalid-secret `401`, default batch `5`, maximum `20`, logging, and cron contract. |
| `src/proxy.ts` | same | Next.js proxy framework file | Update imports only if shared/config paths moved. | `proxy.ts` is required by Next.js 16; do not rename it. |

### Frontend features and contracts

| Current path | Proposed path | Architectural role | Required changes | Dependencies or risks |
| --- | --- | --- | --- | --- |
| `src/features/assistant/components/*.tsx` | same relative component paths | Assistant UI | Keep PascalCase names; update Hook, browser model, state, event, API, contract, and shared component imports. `AssistantTriggerButton` uses the trigger-detail type inferred from `assistant.contract.ts`. | Client components must not import `src/server`; all backend interaction stays behind the feature API adapter. |
| `src/features/assistant/use-assistant.ts` | `src/features/assistant/hooks/useAssistant.ts` | React Hook | Rename primary export to `useAssistant`; preserve coherent assistant browser behaviour and update all consumers/tests. | Only the Hook may use the `use` prefix. |
| `src/features/assistant/client.ts` | `src/features/assistant/api/stream-assistant-response.ts` | Browser HTTP/stream client | Keep fetch, stream decoding, and browser-safe callbacks; use the boundary contract. | No server or provider imports; preserve cancellation and malformed-stream behaviour. |
| `src/features/assistant/assistant-session.ts` | `src/features/assistant/state/assistant-conversation.state.ts` | Pure frontend state transitions | Move conversation state transitions and `ChatStage`; fold in the trivial `ChatMessage` constructors from `utils/create-search-message.ts`. | Preserve response identity and message-state behaviour; this state is browser-owned. |
| `src/features/assistant/types.ts` | `src/features/assistant/models/chat-message.model.ts` plus contract and backend model destinations | Ownership split | Keep only browser-created `ChatMessage` in the feature model. Import its source shape from `assistant.contract.ts`; keep private stream handler types beside the browser API; move `ChatStage` to state and the raw search row to search-index models. | The assistant server module must never import or return `ChatMessage`; stream/source data remains contract-owned. |
| `src/features/assistant/schema.ts` and the boundary type in `events.ts` | `src/contracts/assistant.contract.ts` | Runtime boundary contract | Move public request, error response, source, stream event, and server-to-client assistant trigger-detail schemas/types; place transport limits here when shared by runtimes. | Preserve wire/event formats, validate the trigger detail before use, and infer TypeScript types from Zod. |
| `src/features/assistant/events.ts` | `src/features/assistant/assistant.events.ts` | Browser feature events | Keep the browser event name/dispatch implementation; import the validated trigger-detail type/schema from `assistant.contract.ts`. | Do not redefine a competing feature-owned boundary type. |
| `src/features/assistant/constants.ts` and `server/chat-stream-constants.ts` | `src/contracts/assistant.contract.ts`, `src/features/assistant/assistant.constants.ts`, or `src/server/modules/assistant/assistant.constants.ts` according to ownership | Boundary/frontend/backend constants | Move transport limits to the contract, display constants to the feature, and fallback/rate/retrieval policy to the backend module; delete duplicates. Do not create the frontend constants file if no frontend-owned constant remains. | Values and behaviour must remain unchanged. |
| `src/features/assistant/utils/create-search-message.ts` | `src/features/assistant/state/assistant-conversation.state.ts` | Trivial state construction | Inline the simple object literals; delete the utility file and folder. | No factory for trivial literals. |
| `src/features/assistant/utils.ts` | private helper in `ChatConversation.tsx` | Single-consumer UI helper | Inline `isExternalUrl`; remove unused React imports and delete the file. | Preserve external-link rendering. |
| `src/features/portfolio/components/*.tsx` | same relative component paths | Portfolio Server Component UI | Keep PascalCase names and update shared imports. Replace imports from `features/portfolio/types.ts` with narrow component-local UI prop types; when two components genuinely share a derived UI-only shape, a feature model may be introduced only if the page explicitly creates that presentation shape. | These components must not import server models. Passing server-owned data into them from a Server Component page does not itself require a contract. |
| `src/features/portfolio/types.ts` | `src/server/modules/portfolio/models/portfolio-view.model.ts` plus component-local prop types | Server result ownership split | Move `HomePageData`, `WorkPageData`, `AboutPageData`, `Project`, `Experience`, `Principle`, `ProfileService`, and server-returned content shapes into the portfolio module model. Keep only narrow rendering props beside components; do not create `src/features/portfolio/models/portfolio-view.model.ts`. | Portfolio services return server-owned models. Structural compatibility at a Server Component call site must not become a `server → features` type import. |
| HTTP pathname accepted by the blob Route Handler | `src/contracts/portfolio-asset.contract.ts` | Runtime boundary contract | Add the runtime schema/type for the public pathname input. Keep the retrieved asset stream/result as a server-owned portfolio model until the Route Handler creates the binary response. | Do not create a placeholder JSON contract for an unstructured binary stream. |
| JSON emitted by the internal worker Route Handler | `src/contracts/search-index-worker.contract.ts` | Runtime boundary contract | Define runtime-validated success and sanitized error response shapes for the HTTP boundary. | Search-index services retain their server-owned worker result model; the Route Handler converts it to the contract response. |

### Server infrastructure

| Current path | Proposed path | Architectural role | Required changes | Dependencies or risks |
| --- | --- | --- | --- | --- |
| `src/lib/db.ts` | `src/server/infrastructure/database/prisma.ts` | Prisma client construction | Move unchanged singleton/client setup, add `server-only` protection, and update repositories/entrypoints. | Preserve generated-client path and process reuse. |
| `src/lib/openai.ts` | `src/server/infrastructure/openai/openai-client.ts` | OpenAI client construction | Move configuration/client creation and add `server-only`. | SDK must never enter a client bundle. |
| `src/lib/env.ts` | `src/server/infrastructure/config/env.ts` | Runtime environment validation | Move server environment loading/validation and add `server-only`. | Preserve lazy/eager validation behaviour and test seams; do not read secret files during migration. |
| Intentional current server logging | `src/server/infrastructure/logging/logger.ts` | Shared logging adapter | Centralize safe contextual server logging used by routes, services, and jobs; keep injectable logger seams where tests rely on them. | Do not change operational severity or expose secrets. |

### Assistant backend module

| Current path | Proposed path | Architectural role | Required changes | Dependencies or risks |
| --- | --- | --- | --- | --- |
| `server/create-assistant-response.ts` | `server/modules/assistant/services/create-assistant-response.service.ts` | Assistant use case | Retain workflow, fallback, continuation, and outcome decisions; delegate SDK streaming to the provider and event conversion to mappers. | Preserve exact streaming and fallback behaviour. |
| `server/retrieve-context.ts` | `server/modules/assistant/services/retrieve-assistant-context.service.ts` | Assistant context use case | Call `searchSiteIndex` through search-index `public.ts`; map retrieval results into assistant context/source models. | Avoid importing search-index internals. |
| `server/rate-limit.ts` | `server/modules/assistant/services/check-assistant-rate-limit.service.ts` | Rate-limit use case | Accept a transport-neutral client identifier and time/dependency seam rather than a `Request`; retain current best-effort in-memory policy. | Preserve rate-limit outcomes; do not imply global distributed enforcement. |
| OpenAI code inside `create-assistant-response.ts` | `server/modules/assistant/providers/openai-response.provider.ts` | External provider adapter | Isolate response creation/stream iteration using the infrastructure client. | Provider event/error types must be mapped before reaching services. |
| Context/source formatting in `retrieve-context.ts` | `server/modules/assistant/mappers/assistant-context.mapper.ts` | Pure mapper | Convert search results into backend assistant context and the source representation defined by `assistant.contract.ts`. | No I/O or ranking decisions; do not use a feature model for the stream boundary. |
| Stream/provider conversion in `create-assistant-response.ts` and `stream-utils.ts` | `server/modules/assistant/mappers/assistant-stream-event.mapper.ts` | Pure mapper | Map provider events to internal/contract stream events and encode the existing stream format. | Preserve event ordering and terminal/error events. |
| Backend assistant types in `types.ts` | `server/modules/assistant/models/assistant-context.model.ts` | Backend business model | Define assistant-owned context structures without Prisma or provider types. | Contract types stay in `src/contracts`. |
| `server/prompt.ts` | `server/modules/assistant/prompts/portfolio-assistant.prompt.ts` | Version-controlled AI prompt | Rename without changing prompt content or purpose. | Prompt remains module behaviour, not provider setup. |
| Duplicate normalization/stream helpers | owning service, mapper, or contract | Private implementation | Keep each helper in the one role that owns it; delete duplicate `normalizePreviousResponseId` and obsolete wrappers after tests move. | Wire compatibility must be regression-tested. |
| new | `server/modules/assistant/public.ts` | Cross-module/adapter API | Export only route-facing assistant use cases, deliberate server-owned results, and contract-aware boundary operations. | Do not export providers, mappers, prompt, private models, or any feature model. |

### Portfolio backend module

| Current path | Proposed path | Architectural role | Required changes | Dependencies or risks |
| --- | --- | --- | --- | --- |
| `server/loaders/home-page.loader.ts` | `server/modules/portfolio/services/get-home-page-data.service.ts` | Page-data use case | Move and update repository/mapper dependencies. | Preserve returned page data and ordering. |
| `server/loaders/work-page.loader.ts` | `server/modules/portfolio/services/get-work-page-data.service.ts` | Page-data use case | Move and update repository/mapper dependencies. | Preserve project/service output. |
| `server/loaders/about-page.loader.ts` | `server/modules/portfolio/services/get-about-page-data.service.ts` | Page-data use case | Move and update repository/mapper dependencies. | Preserve experience/principle output. |
| `queries/content-blocks.query.ts` | `server/modules/portfolio/repositories/content-block.repository.ts` | Persistence | Rename query functions around repository intent; keep Prisma confined here. | Preserve selection, ordering, and null handling. |
| `queries/experiences.query.ts` | `server/modules/portfolio/repositories/experience.repository.ts` | Persistence | Move and update callers/tests. | Preserve selection/order. |
| `queries/principles.query.ts` | `server/modules/portfolio/repositories/principle.repository.ts` | Persistence | Move and update callers/tests. | Preserve selection/order. |
| `queries/projects.query.ts` | `server/modules/portfolio/repositories/project.repository.ts` | Persistence | Move and update callers/tests. | Preserve nested relations/order. |
| `queries/services.query.ts` | `server/modules/portfolio/repositories/service.repository.ts` | Persistence | Move and update callers/tests. | Preserve selection/order. |
| `mappers/content-block.mapper.ts` | `server/modules/portfolio/mappers/content-block.mapper.ts` | Pure mapper | Move unchanged in behaviour. | Keep Zod parsing separate from persistence. |
| `mappers/portfolio.mapper.ts` | `server/modules/portfolio/mappers/portfolio-view.mapper.ts` | Pure mapper | Rename and retain service, project, experience, and principle conversions. | No frontend-feature import. |
| Server-returned types in `src/features/portfolio/types.ts` | `server/modules/portfolio/models/portfolio-view.model.ts` | Server-only page/service results | Define the page-data and mapped portfolio structures returned by the three page-data services. | The model may be exposed deliberately by portfolio `public.ts` for Server Component callers, but must never be imported from or defined in `features`. |
| `src/features/portfolio/schema.ts` | `server/modules/portfolio/schemas/content-block.schema.ts` and `project-links.schema.ts` | Runtime validation | Split by validated external/persisted representation and update mappers/tests. | Preserve schema failures and inferred types. |
| Blob SDK use in Route Handler | `server/modules/portfolio/providers/vercel-blob.provider.ts` | External provider adapter | Move provider-specific download/list/error handling out of `app`. | Preserve protected streaming semantics. |
| Blob retrieval workflow | `server/modules/portfolio/services/get-portfolio-asset.service.ts` and `models/portfolio-asset.model.ts` | Use case and backend model | Return a framework-neutral tagged asset result to the controller. | Avoid `NextResponse` in the service. |
| Persistence in `prisma/seed-data/portfolio-seed.ts` | `repositories/portfolio-seed.repository.ts` | Persistence | Move destructive transaction and table writes into the repository. | Preserve transaction order and generated types. |
| Seed orchestration | `services/seed-portfolio-data.service.ts` and `models/portfolio-seed.model.ts` | Use case and backend model | Accept pure seed input, call the seed repository, and return current counts/results. | Seed source files must stop importing frontend types. |
| new | `server/modules/portfolio/public.ts` | Cross-module/adapter API | Export page-data, protected-asset, and seed use cases plus deliberate server-owned result types/schemas needed by Server Components or another module. | Search-index may consume portfolio-owned parsing only through this file; no exported type may be owned by `features`. |

### Search-index backend module

| Current path | Proposed path | Architectural role | Required changes | Dependencies or risks |
| --- | --- | --- | --- | --- |
| Entire `src/features/search-index` | `src/server/modules/search-index` | Backend-only capability | Remove the frontend feature after all files below move. | No server-to-feature dependency may remain. |
| `types.ts` | `models/search-index.model.ts`, `search-index-job.model.ts`, and `site-chunk.model.ts` | Backend models | Split by owned concept; include the raw match-row shape currently in assistant types where it is needed internally. | Do not expose Prisma records as contracts. |
| `server/build-search-documents.ts` and `server/builders/*.ts` | `mappers/search-document.mapper.ts` | Pure representation mapper | Consolidate dispatcher and source-specific pure mapping functions; remove `builders/index.ts`. | Preserve document identity, text, metadata, and ordering. |
| `server/create-embeddings.ts` | `providers/openai-embedding.provider.ts` | External provider adapter | Isolate embedding SDK operations using infrastructure client. | Preserve model, batching, and retry/error semantics. |
| `server/data/site-chunk.repository.ts` | `repositories/site-chunk.repository.ts` | Persistence | Move Prisma/raw vector SQL here; absorb persistence-only matching query from assistant. | Vector SQL result mapping must remain tested. |
| `server/data/indexing-source.repository.ts` | `repositories/indexing-source.repository.ts` | Persistence | Move and update service imports. | Preserve supported source loads. |
| `server/data/search-index-job.repository.ts` | `repositories/search-index-job.repository.ts` | Persistence | Move and update worker/status imports. | Preserve claim/retry/failure concurrency behaviour. |
| `server/index-source-record.ts` | `services/index-source-record.service.ts` | Indexing use case | Retain source load, mapping, hashing, embedding, upsert, and obsolete-chunk removal decisions; depend on repositories/provider/factory. | Preserve idempotency and counts. |
| `server/index-worker.ts` | `services/run-index-worker.service.ts` | Worker use case | Retain one bounded batch operation and dependency seams; no process signals or polling loop. | Both HTTP and job entrypoints must call this service. |
| `server/remove-indexed-source.ts` | `services/remove-indexed-source.service.ts` | Removal use case | Move and update repository dependencies. | Preserve source validation/deletion counts. |
| `server/prepare-site-chunk.ts` | `factories/site-chunk.factory.ts` | Deterministic object construction | Rename to express its non-trivial construction role. | Preserve hashing and embedding reuse decisions; no I/O. |
| `assistant/server/match-site-chunks.ts` and `diversify-chunk.ts` | `services/search-site-index.service.ts` plus `repositories/site-chunk.repository.ts` | Search use case and persistence | Repository executes raw SQL; service owns retrieval, diversification, thresholds, and result policy. | Preserve ranking/diversification and mock seams. |
| Workflow in preview script | `services/preview-search-index.service.ts` | Preview use case | Return a terminal-neutral action summary. | Must not write data or generate new behaviour. |
| Workflow in rebuild script | `services/rebuild-search-index.service.ts` | Rebuild use case | Enumerate supported sources and aggregate existing indexing results. | Preserve source order, partial-failure, and totals. |
| Direct status repository use in status script | `services/get-search-index-job-status.service.ts` | Status use case | Query and return a terminal-neutral status view. | Preserve status filters and output data. |
| Script argument validation | `schemas/index-source-input.schema.ts` | Runtime input validation | Define supported source type/id validation used by entrypoints. | Preserve accepted CLI syntax and failure messages. |
| Module policy constants | `search-index.constants.ts` | Backend module constants | Centralize embedding model, batching, worker, retry, and retrieval policy values only where the module owns them. | Delete duplicates; do not change values. |
| new | `public.ts` | Cross-module/adapter API | Export services required by assistant, Route Handlers, and entrypoints plus deliberate server-owned result/input types. | Never export repositories, provider, factory, mapper internals, or feature-owned models. HTTP response shapes come from `src/contracts`. |

### Shared frontend code, seed sources, and cleanup

| Current path | Proposed path | Architectural role | Required changes | Dependencies or risks |
| --- | --- | --- | --- | --- |
| `src/components/layout/*.tsx` | `src/shared/components/layout/*.tsx` | Shared layout UI | Move and update all page/layout imports. | Must remain domain-free. |
| PascalCase files in `src/components/ui` | `src/shared/components/ui` | Shared UI primitives | Move and update all consumers. | Preserve exports and styles. |
| `button.tsx`, `card.tsx`, `scroll-area.tsx`, `textarea.tsx` | `Button.tsx`, `Card.tsx`, `ScrollArea.tsx`, `Textarea.tsx` under `src/shared/components/ui` | Shared React components | Rename files and update imports; primary component export must match the file. | Case-only changes need a two-step Git rename on case-insensitive filesystems. |
| `src/lib/utils.ts` | `src/shared/utils/class-names.ts` | Pure generic utility | Move only the generic `cn`/class-name behaviour. | No backend imports. |
| `src/lib/links.ts` and `navigation.ts` | `src/shared/config/links.ts` | Shared frontend configuration | Consolidate link/navigation constants under one clear owner and update consumers. | Preserve hrefs and ordering; avoid duplicate exports. |
| `src/lib/site-metadata.ts` | `src/shared/config/site-metadata.ts` | Shared frontend metadata | Move and become the runtime owner of site metadata/name. | Must stop importing `prisma/seed-data`. |
| `prisma/seed-data/profile.ts` | same | Pure seed source | Import the site-owner display constant from shared config or duplicate no value; remove dependency on frontend portfolio types. | Shared config must remain domain-free and browser-safe. |
| `prisma/seed-data/experience.ts`, `projects.ts`, `portfolio-seed.ts` | same source-data directory | Pure seed sources | Replace frontend type imports with the backend seed model; keep `getPortfolioSeedData` pure and move all Prisma writes out. | No runtime application code may import seed sources. |
| `src/generated/prisma` | same | Generated code | Update only generation output through the existing command if imports require regeneration. | Never manually edit. |
| `src/components`, `src/lib`, `src/features/search-index`, `src/features/*/server`, and root `scripts` | removed | Obsolete paths | Delete only after consumers and tests use final paths and focused validation passes. | No compatibility barrels or wrappers. |

### Tests, package tooling, and documentation

| Current path | Proposed path | Architectural role | Required changes | Dependencies or risks |
| --- | --- | --- | --- | --- |
| `tests/assistant/architecture-boundaries.test.ts` | `tests/architecture/nextjs-architecture.test.ts` | Architecture regression test | Replace old feature-server assertions with naming, runtime, layer, data-flow, contract/model ownership, public-module, provider, Prisma, entrypoint, and obsolete-path rules. | It must prove `features → server` and `server → features` are forbidden and inspect public behaviour/imports without freezing every internal file. |
| Other files under `tests/assistant` | same test paths | Assistant behaviour tests | Update imports/mocks to browser paths, `assistant.contract.ts`, assistant `public.ts`, and explicit dependency seams. Add trigger-detail boundary validation and prove `ChatMessage` is created only by browser state. | Preserve request/error/stream contracts, rendering, and session assertions. |
| Files under `tests/portfolio` | same test paths | Portfolio behaviour tests | Update query/loader/schema/mapper imports to final module public APIs or directly tested pure internals where the test owns that unit. Assert page-data results use the server-owned portfolio model and Server Component props require no boundary contract. | No test or production module may import a feature-level portfolio view model; do not assert obsolete folder layout. |
| Files under `tests/search-index` | same test paths | Search-index behaviour tests | Update imports to service/public paths; split worker service tests from job-entrypoint lifecycle tests. | Preserve migration SQL coverage and worker Route Handler coverage. |
| `package.json` | same | Command registry | Retarget the ten active operational command variants, preserve command names/env-file flags, and remove stale `test:rag-rpc`. | A wrong path can break local/production operations even when the app builds. |
| `prisma.config.ts` | same | Prisma tool configuration | Point seed execution directly at `src/server/entrypoints/maintenance/seed-portfolio-data.ts`. | Preserve existing config bootstrap behaviour; no wrapper. |
| `eslint.config.mjs` | same | Mechanical boundary enforcement | Replace old path globs with final layer/client/module restrictions, including bidirectional `features`/`server` import bans and module-public access. | Globs must cover PascalCase components, `hooks`, `api`, `state`, `models`, `shared`, contracts, app controllers/pages, and server modules. |
| `tsconfig.json` | same | TypeScript path configuration | Retain `@/*` → `./src/*`; confirm moved files remain included. | Do not add competing aliases. |
| `README.md` | same | Repository operating documentation | Replace old structure/script guidance with the final architecture, module public APIs, and entrypoint categories. | Keep the skill authoritative rather than duplicating it in full. |
| `next.config.mjs` | same | Next.js configuration | No planned change; verify no move requires an unsupported bundling workaround. | Any change requires version-matched Next.js evidence. |
| `vercel.json` | same | Cron configuration | Keep the existing `/api/internal/search-index-worker` target and verify it still reaches the same bounded service. | Do not point cron directly at a process entrypoint. |

## Entrypoint migration matrix

Every final entrypoint must only parse runtime input, load configuration, resolve dependencies, call one public module service, report the result, and convert failures to a process/job outcome.

| Current file | Classification and target | Service called | Logic extracted | Package command | Inputs | Output and exit behaviour |
| --- | --- | --- | --- | --- | --- | --- |
| `scripts/index-source.ts` | Maintenance → `src/server/entrypoints/maintenance/index-source-record.ts` | `indexSourceRecord` from search-index `public.ts` | Source validation moves to `index-source-input.schema.ts`; indexing remains/lands in `index-source-record.service.ts`. | `index:source` | Existing source type and source id arguments; existing environment loading | Print the existing result summary; exit `0` on success and non-zero with sanitized context on validation/service failure. |
| `scripts/index-worker.ts` | Background job → `src/server/entrypoints/jobs/run-search-index-worker.ts` | `runIndexWorker` from search-index `public.ts` | One-batch work stays in `run-index-worker.service.ts`; entrypoint retains the fixed 2,000 ms idle polling delay, signals, dependency resolution, and shutdown/disconnect only. | `index:worker`, `index:worker:production` | Existing environment plus `SIGINT`/`SIGTERM`; no positional arguments | Keep current contextual batch/stop logs; gracefully stop after the current job; exit non-zero on unrecoverable startup/loop failure. |
| `scripts/preview-search-index.ts` | CLI → `src/server/entrypoints/cli/preview-search-index.ts` | `previewSearchIndex` from search-index `public.ts` | Source load, document/chunk construction, stored-state comparison, and create/update/unchanged/delete classification move to `preview-search-index.service.ts`. | `index:preview` | Existing source type/id arguments and local environment | Format the returned preview exactly as today; perform no writes; non-zero on invalid input or service failure. |
| `scripts/rebuild-search-index.ts` | Maintenance → `src/server/entrypoints/maintenance/rebuild-search-index.ts` | `rebuildSearchIndex` from search-index `public.ts` | Source enumeration, per-source indexing, and totals aggregation move to `rebuild-search-index.service.ts`. | `index:rebuild`, `index:rebuild:production` | Existing environment and production confirmation flag | Preserve progress/final totals; reject unconfirmed production; non-zero on validation or rebuild failure. |
| `scripts/search-index-job-status.ts` | CLI → `src/server/entrypoints/cli/show-search-index-job-status.ts` | `getSearchIndexJobStatus` from search-index `public.ts` | Direct repository access moves behind `get-search-index-job-status.service.ts`. | `index:status`, `index:status:production` | Existing environment; no positional arguments | Preserve the aggregate table and recent-failed-jobs table; non-zero on query failure; always disconnect cleanly. |
| `scripts/seed-portfolio-data.ts` | Maintenance → `src/server/entrypoints/maintenance/seed-portfolio-data.ts` | `seedPortfolioData` from portfolio `public.ts` | Seed transaction moves to `portfolio-seed.repository.ts`; orchestration/counts move to `seed-portfolio-data.service.ts`; pure source assembly remains in `prisma/seed-data`. | `seed:portfolio`, `seed:portfolio:production`, Prisma configured seed | Existing environment and `--production` confirmation semantics | Preserve result counts/reporting; reject unconfirmed production; disconnect cleanly; non-zero on failure. |
| `scripts/lib/indexing-arguments.ts` | Reusable module validation → `server/modules/search-index/schemas/index-source-input.schema.ts` | Used by public search-index services/entrypoints | All supported-source runtime validation moves to the schema; argv extraction remains in each entrypoint. | none | Parsed argument values | Returns typed validated input or a deterministic validation error; no process exit calls. |
| `scripts/lib/production-confirmation.ts` | Maintenance helper → `src/server/entrypoints/maintenance/require-production-confirmation.ts` | none | Keep only trivial target formatting and confirmation guard beside maintenance entrypoints. | none | Existing production flag and configured target metadata | Return/throw to the calling adapter; never own business workflow or database access. |
| `prisma/seed.ts` | Obsolete adapter → remove | New maintenance seed entrypoint calls portfolio service | Its seed call is replaced by direct Prisma configuration of the new entrypoint. | Prisma seed command in `prisma.config.ts` | Existing Prisma seed invocation | Same seed outcome; no wrapper retained. |

Retarget package commands without changing their public names:

```text
seed:portfolio              → tsx --env-file=.env src/server/entrypoints/maintenance/seed-portfolio-data.ts
seed:portfolio:production   → tsx --env-file=.env.production.local src/server/entrypoints/maintenance/seed-portfolio-data.ts --production
index:source                → tsx --env-file=.env src/server/entrypoints/maintenance/index-source-record.ts
index:worker                → tsx --env-file=.env src/server/entrypoints/jobs/run-search-index-worker.ts
index:worker:production     → tsx --env-file=.env.production.local src/server/entrypoints/jobs/run-search-index-worker.ts
index:rebuild               → tsx --env-file=.env src/server/entrypoints/maintenance/rebuild-search-index.ts
index:rebuild:production    → tsx --env-file=.env.production.local src/server/entrypoints/maintenance/rebuild-search-index.ts --production
index:status                → tsx --env-file=.env src/server/entrypoints/cli/show-search-index-job-status.ts
index:status:production     → tsx --env-file=.env.production.local src/server/entrypoints/cli/show-search-index-job-status.ts
index:preview               → tsx --env-file=.env src/server/entrypoints/cli/preview-search-index.ts
```

Keep the current TypeScript runtime and environment-file flags. Do not retain root wrappers. Remove the stale `test:rag-rpc` command.

## Refactoring phases

Execute the migration in this dependency order:

1. Baseline and migration ledger.
2. Target boundaries and mechanical enforcement.
3. Server infrastructure.
4. Portfolio backend module.
5. Search-index backend module.
6. Assistant backend module.
7. Script workflow extraction.
8. CLI, job, and maintenance entrypoints plus package commands.
9. Frontend features, contracts, shared code, and naming.
10. Tests, mocks, aliases, and framework adapters.
11. Obsolete-path removal and documentation.
12. Final architecture and regression validation.

This order keeps infrastructure available before repositories/providers, moves the backend-only search capability before assistant context retrieval consumes its public API, extracts workflows before executable adapters are switched, and delays destructive cleanup until all final consumers pass.

## Task-level instructions

Each phase is a rollback point. Complete its focused checks before deleting its old paths or beginning the next phase. Use Git moves where a file's responsibility is unchanged; use extraction commits where responsibilities split.

### Phase 0 — Baseline and migration ledger

1. Re-read the governing documents and confirm the installed Next.js version.
2. Record the current results of:
   - `npm run prisma:validate`
   - `npm run prisma:generate`
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
   - `npm run build`
3. Record existing failures separately; do not silently weaken validation to hide them.
4. Create a temporary implementation ledger in the milestone working notes, not application source, listing every current path in the mapping tables and its final disposition.
5. Classify every existing/proposed data type as a server-owned result, browser-owned feature model, or runtime/trust-boundary contract. Record why a contract is or is not required.
6. Confirm no active source imports `scripts/` except tests/package tooling and no generated file will be manually edited.

**Verify:** Baseline commands and current failures are captured in the pull-request evidence. No source change is made in this phase.

### Phase 1 — Establish target boundaries and mechanical enforcement

1. Create only the target directories that immediately receive files in later phases.
2. Add `public.ts` to assistant, portfolio, and search-index modules as each module receives its first usable service; do not publish placeholder APIs.
3. Rewrite `eslint.config.mjs` boundary globs:
   - features cannot import `app` or `server`;
   - server modules cannot import `features` or return feature-owned types;
   - shared cannot import `app`, `features`, or `server`;
   - client components, Hooks, state, API clients, and browser models cannot import server infrastructure, generated Prisma, provider SDKs, or `server-only`;
   - infrastructure cannot import modules;
   - each server module may import another module only through its `public.ts`;
   - pages and Route Handlers may import server modules only through `public.ts`;
   - repositories/providers cannot import services.
4. Replace `tests/assistant/architecture-boundaries.test.ts` with `tests/architecture/nextjs-architecture.test.ts`.
5. Make that test scan project-authored source names and imports. Exclude generated files and explicitly allow Next.js special filenames. Enforce PascalCase component files, `useSomething.ts` Hook files, kebab-case other TypeScript files/directories, role suffixes where assigned by this contract, prohibited dependency directions, `public.ts` access, contract/model ownership, Prisma/provider SDK placement, and the absence of a root `scripts/` directory at final completion.
6. Add focused assertions for the two permitted data flows: Server Component → module `public.ts` → feature component, and Client Component → feature `api` → Route Handler → module `public.ts`.

**Verify:** Run `npm run lint` and the architecture test in an intermediate mode that permits mapped old paths until their phase completes. Any temporary allowance must be removed in Phase 10; do not disable the final rules globally.

**Rollback point:** Boundary test/ESLint changes can be reverted independently before file moves begin.

### Phase 2 — Migrate server infrastructure

1. Move `src/lib/db.ts`, `openai.ts`, and `env.ts` to the exact infrastructure paths in the mapping table.
2. Add `import "server-only"` at appropriate infrastructure boundaries.
3. Create `logger.ts` and route existing intentional server logging through it without changing externally visible output or testable log events.
4. Update only current server-side consumers. Do not update browser code to import infrastructure.
5. Keep `@/*` as the single alias; do not add compatibility exports under `src/lib`.

**Verify:** Run `npm run lint`, `npm run typecheck`, assistant tests that exercise injected OpenAI/config dependencies, portfolio query tests, and search-index repository/worker tests.

**Rollback point:** Do not delete the old `src/lib` files until all consumers use infrastructure/shared final paths.

### Phase 3 — Migrate the portfolio backend module

1. Move queries to the five named repositories.
2. Move loaders to the three named services.
3. Move `HomePageData`, `WorkPageData`, `AboutPageData`, and mapped portfolio result structures from `src/features/portfolio/types.ts` to `server/modules/portfolio/models/portfolio-view.model.ts`. Annotate the page-data services with this server-owned model, never a feature model.
4. Move and split mappers/schemas exactly as specified; make mappers return the server-owned portfolio model.
5. Extract protected blob provider/service/model, add `portfolio-asset.contract.ts` for pathname validation, and convert the blob Route Handler to a thin controller that calls portfolio `public.ts`.
6. Split pure seed data from persistence:
   - keep pure source values under `prisma/seed-data`;
   - move transaction/database writes to `portfolio-seed.repository.ts`;
   - add the seed model and `seed-portfolio-data.service.ts`;
   - remove seed-data imports of frontend feature types.
7. Populate portfolio `public.ts` with page-data, protected-asset, and seed operations plus only deliberate server-owned result types.
8. Update App Router pages and the blob route to import module operations through `public.ts`.
9. Keep portfolio components as Server Components. Replace their imports from `features/portfolio/types.ts` with narrow component-local presentation props; do not import portfolio server models into `features`.
10. Pass server-owned results from each page to its Server Component children without creating a placeholder contract. If implementation makes any portfolio child a Client Component, stop and define the crossed data as a runtime-validated contract before proceeding.
11. Keep return values framework-neutral and prevent the backend module from importing or returning anything owned by `src/features/portfolio`.

**Verify:** Run all `tests/portfolio`, protected blob route coverage, architecture ownership tests, `npm run lint`, and `npm run typecheck`. Render-data tests must prove the same content/order and confirm the service return type is server-owned. Import scans must show neither `server → features` nor `features → server`. Seed tests must use fakes or a test transaction and must not require production credentials.

**Rollback point:** Keep old loader/query files until the page and route tests pass against the new module, then delete them in the same phase.

### Phase 4 — Migrate the search-index backend module

1. Move models and repositories to their exact mapped paths.
2. Consolidate pure document builders into `search-document.mapper.ts`; remove the barrel after consumers change.
3. Move embedding SDK operations into the OpenAI embedding provider.
4. Move deterministic chunk construction into `site-chunk.factory.ts`.
5. Move indexing, removal, and one-batch worker workflows into their named services.
6. Move vector SQL into `site-chunk.repository.ts`.
7. Move retrieval/diversification policy from assistant into `search-site-index.service.ts`.
8. Add source-input schema and module constants without duplicating existing values.
9. Expose only deliberate service functions/result types from search-index `public.ts`.
10. Update assistant retrieval to use search-index `public.ts`, never its repository.
11. Add `search-index-worker.contract.ts` for the internal HTTP Route Handler's success/error payloads. Keep the reusable worker batch result server-owned and convert it to the contract at the Route Handler boundary.

**Verify:** Run every test under `tests/search-index`, assistant retrieval/contract tests, `npm run lint`, and `npm run typecheck`. Tests must cover document parity, embedding reuse, raw match mapping, indexing idempotency, job claiming/retry/failure, removal, and bounded worker outcomes.

**Rollback point:** Complete and validate one vertical path—models/repositories → provider/mapper/factory → service → public API—before deleting its old feature files.

### Phase 5 — Migrate the assistant backend module

1. Move the prompt, models, backend constants, and the three named services.
2. Extract OpenAI response operations into the provider.
3. Extract context/source and provider/stream transformations into the named mappers.
4. Make the rate-limit service transport-neutral.
5. Make the response service depend on the provider/mappers/search-index public service, not Next.js or raw SDK structures.
6. Move shared request, sanitized error response, stream/source, and assistant trigger-detail schemas to `assistant.contract.ts`.
7. Delete duplicate normalizers, stream helpers, and constants after their owners are verified.
8. Populate assistant `public.ts` only with route-facing service operations and deliberate server-owned result types. It must not import or return `ChatMessage`.
9. Update the chat Route Handler to import the contract and assistant `public.ts` only.
10. Make `assistant.events.ts`, `AssistantTriggerButton`, and the assistant Hook consume the validated trigger-detail contract rather than redefining a feature-owned boundary type.

**Verify:** Run `tests/assistant/contracts.test.ts`, trigger-detail tests, response/stream tests, rate-limit tests, chat route tests, architecture ownership tests, `npm run lint`, and `npm run typecheck`. Prove that `ChatMessage` is browser-created state, all server-supplied source/stream/trigger data is contract-owned, and neither side imports the other's model. Add missing focused tests before moving on if current coverage does not assert fallback and stream parity.

**Rollback point:** Preserve the old chat path until contract byte/event parity and fallback tests pass against the new public service.

### Phase 6 — Extract script workflows

1. Extract `preview-search-index.service.ts`, `rebuild-search-index.service.ts`, and `get-search-index-job-status.service.ts`.
2. Confirm `index-source-record.service.ts`, `run-index-worker.service.ts`, and `seed-portfolio-data.service.ts` accept terminal-neutral inputs and return terminal-neutral results.
3. Move source argument validation into the search-index schema.
4. Keep production confirmation as the one permitted trivial maintenance adapter helper.
5. Add service tests that call no process APIs and verify the current outputs/decisions using fakes.

**Verify:** Run focused service tests, then all portfolio/search-index tests, lint, and typecheck. Search for `process.argv`, `process.exit`, signal handlers, and terminal formatting under `server/modules`; there must be none.

**Rollback point:** Do not create final entrypoints until each extracted workflow passes independently.

### Phase 7 — Create and wire thin entrypoints

1. Create each file in the entrypoint migration matrix.
2. Keep process lifecycle only in entrypoints:
   - argv parsing and validation invocation;
   - configuration/dependency resolution;
   - polling and signal handling for the job;
   - terminal formatting;
   - explicit exit status and cleanup.
3. Retarget all package commands to the exact paths listed above.
4. Point `prisma.config.ts` at the maintenance seed entrypoint and delete `prisma/seed.ts` after validation.
5. Remove `test:rag-rpc`.
6. Add focused adapter tests for arguments, output formatting, error exit status, job shutdown, production confirmation, and package-command target resolution without reading real environment files.

**Verify:** Exercise every entrypoint through its dependency-injected adapter test, and make the package-command architecture test prove that every public command targets an existing file under `src/server/entrypoints`. Where a safe disposable local database is available, run the non-production commands through their unchanged package names. Do not add a new `--help` contract merely for validation and do not access production. Run worker entrypoint tests and confirm the HTTP worker route calls the same service.

**Rollback point:** Package script changes can point back to old scripts until every new adapter passes. Once switched and validated, remove old wrappers rather than supporting both.

### Phase 8 — Migrate frontend features, shared code, and naming

1. Move assistant browser API, Hook, state, models, events, and any remaining frontend constants to their exact mapped paths.
2. Rename the primary Hook export to `useAssistant` and update `FloatingPortfolioChat` and tests.
3. Keep `ChatMessage` in `features/assistant/models/chat-message.model.ts` because browser state creates it; keep `ChatStage` with assistant state and import source/stream/trigger shapes from `assistant.contract.ts`.
4. Remove the proposed feature-level `portfolio-view.model.ts`. Portfolio service results already moved to the server module in Phase 3; portfolio Server Components use narrow local presentation prop types without importing `server`.
5. Move layout/UI components into `src/shared`.
6. Perform the four case-sensitive component renames with safe intermediate Git names if required.
7. Move class-name utility, links/navigation config, and site metadata to `src/shared`.
8. Reverse the metadata/seed dependency so runtime source never imports Prisma seed data.
9. Update all page, feature, contract, test, and stylesheet consumers.
10. Do not create placeholder feature models/contracts or `shared/services`, `helpers`, `common`, `misc`, `general`, or `managers`.

**Verify:** Run assistant render/client/session/contract tests, portfolio route-state/render tests, architecture naming/ownership tests, lint, typecheck, and a production build. Inspect the client import graph for `@/server`, Prisma, OpenAI, Vercel Blob, environment config, and `server-only`; no browser module may reach them. Inspect server modules for imports from `@/features`; none are permitted.

**Rollback point:** Move each component/config family and its consumers together. Do not delete `src/components` or remaining `src/lib` until the build passes.

### Phase 9 — Update all tests, mocks, aliases, and framework adapters

1. Update every test import to final paths.
2. Replace mocks of old feature-server files with public service or explicit dependency seams.
3. Move architecture coverage to `tests/architecture`.
4. Update `tests/search-index/index-worker.test.ts` so service behaviour is tested through the module service and process lifecycle through the new jobs entrypoint.
5. Keep Route Handler tests at the HTTP boundary and assert contract validation/serialization, `public.ts` delegation, and result translation rather than module internals.
6. Confirm tsconfig retains only `@/*`; update no alias unless a verified tool requires it.
7. Confirm `vercel.json` still targets `/api/internal/search-index-worker` and Next.js route/proxy filenames remain exact.
8. Add type/import regression cases proving server pages use module `public.ts`, Client Components use feature API adapters, Route Handlers use module `public.ts`, server modules never import/return feature models, and server-only Server Component props do not require placeholder contracts.

**Verify:** Run each focused test command and `npm test`. Search test files for `src/lib`, `src/components`, `features/*/server`, `features/search-index`, `scripts/`, and direct module internals; only fixture strings in explicit migration assertions may remain.

**Rollback point:** Update mocks in the same change as their target move to avoid false green tests.

### Phase 10 — Remove obsolete paths and update documentation

1. Delete root `scripts/`, `prisma/seed.ts`, empty `src/components/chat`, old `src/components`, old `src/lib`, backend subtrees under frontend features, and `src/features/search-index`.
2. Delete obsolete barrels, duplicate implementations, compatibility exports, and unused dependencies/imports.
3. Update `README.md` with:
   - the final source ownership tree;
   - the two required server/client data-flow paths;
   - server-owned, feature-owned, and contract-owned model rules;
   - module `public.ts` import rules for pages, Route Handlers, and cross-module calls;
   - thin Route Handler and process-entrypoint rules;
   - package command paths/categories;
   - seed-data ownership;
   - where future UI, use cases, persistence, providers, contracts, and workers belong.
4. Do not copy the entire architecture skill into README; link to the skill as authoritative.
5. Remove every temporary ESLint/test allowance from Phase 1.

**Verify:** Run repository searches proving:

```text
no root scripts directory
no active import from @/lib
no active import from @/components
no active import from @/features/*/server
no active import from @/features/search-index
no import from @/server anywhere under src/features
no import from @/features anywhere under src/server
no active import of another module's internal path
no feature-owned model used as a server service return type
no manually edited generated file
```

Then run lint, typecheck, tests, and build.

**Rollback point:** Deletions occur only after a clean import search and full focused tests; keep the immediately preceding phase commit as the recovery point.

### Phase 11 — Final architecture and regression validation

1. Apply the skill's placement decision tree to every new/moved file.
2. Inspect each Route Handler and process entrypoint for reusable business logic.
3. Inspect every Prisma, raw SQL, OpenAI, and Vercel Blob import.
4. Inspect cross-module imports and each `public.ts`.
5. Trace every page/Server Component backend call, Client Component backend interaction, and Route Handler service call through the required data-flow path.
6. Classify every exported model/type as server-owned, browser/UI-owned, or a runtime-boundary contract. Remove placeholder contracts/models and any server return annotation owned by `features`.
7. Run all commands in the validation strategy.
8. Compare assistant, portfolio, protected asset, indexing, worker, and operational-command behaviour with the Phase 0 baseline.
9. Record any proposed exception using the skill's exception report and obtain explicit user approval. No unexplained exception may ship.

**Verify:** All acceptance criteria are checked from repository evidence and the completion report uses the architecture skill's required format.

## Validation strategy

### Per-phase validation

Every phase must run:

```bash
npm run lint
npm run typecheck
git diff --check
```

Run the focused suite whose ownership changed:

```bash
npm run test:portfolio
npm run test:assistant
npm run test:search-indexing
```

Run `npm run build` after any App Router, client/server boundary, alias, component, configuration, or package-runtime change.

### Final automated validation

Run in this order:

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Then run the package-command/entrypoint architecture test. It must parse `package.json` and `prisma.config.ts`, prove that every operational command resolves directly to an existing file under `src/server/entrypoints`, and prove no command references root `scripts/` or `prisma/seed.ts`.

Exercise each entrypoint's exported adapter function with injected fakes for configuration, persistence, providers, logging, stdout/stderr, and exit status as applicable. Execute real seed/rebuild commands only against a disposable local database. Do not run destructive commands against shared or production data merely to validate path resolution.

### Required behavioural evidence

- Portfolio page-data service tests prove the same records, ordering, mapping, and schema behaviour for `/`, `/work`, and `/about`, with results typed by the server-owned portfolio model.
- App Router render/route-state tests prove existing loading and error boundaries still work.
- Assistant tests prove request/error/trigger/stream contract validation, prior-response normalization, rate-limit outcomes, context retrieval, fallback, stream event ordering, source mapping, continuation, and browser-owned `ChatMessage` state behaviour.
- Protected asset tests prove contract-based path parsing, provider delegation, missing/error responses, and stream headers without inventing a binary JSON model.
- Search-index tests prove source-document parity, chunk identity/hash parity, embedding reuse, indexing idempotency, deletion, vector result mapping, diversification, durable job claim/retry/failure, and bounded batch behaviour.
- Entrypoint tests prove argument parsing, confirmation guards, output formatting, exit status, worker signal shutdown, and service delegation.
- HTTP worker tests prove contract-validated success/error payloads, authorization, current `500`/`401`/success outcomes, and the `5` default/`20` maximum batch.
- Package-command smoke checks prove every command resolves a file under `src/server/entrypoints`.

### Architecture evidence

- The architecture test enforces filename/directory naming, dependency boundaries, required data flows, and model/contract ownership.
- ESLint enforces client/server, layer, infrastructure, and module-public import restrictions, including both `features → server` and `server → features`.
- A repository search confirms every Server Component and Route Handler imports backend operations through module `public.ts`.
- A repository search confirms every Client Component backend interaction flows through a feature-owned browser API adapter and explicit framework boundary.
- A type/import review confirms server modules never import or return feature models; server-only results remain module-owned; runtime-boundary shapes are contracts; Server Component-only prop passing has no placeholder contract.
- A repository search confirms Prisma/raw SQL imports exist only in infrastructure client construction and module repositories.
- A repository search confirms external provider SDK imports exist only in infrastructure client construction or module providers.
- A repository search confirms no old path is imported.
- A repository search confirms the root `scripts/` directory is absent.
- `npm run build` validates Next.js server/client bundling and required framework filenames.
- TypeScript, lint, and explicit review of module-public imports provide cycle evidence because no dedicated cycle detector exists in the current toolchain. Any discovered cycle must be removed; do not add a shared dumping ground to conceal it.

### Manual verification

Against a safe local environment with representative data:

1. Open `/`, `/work`, and `/about`; compare content, ordering, links, metadata, loading, and error behaviour with the baseline.
2. Open the assistant, send a message, observe streamed text/sources, continue the conversation, cancel/retry where supported, and confirm external links.
3. Request an existing protected blob and a missing blob.
4. Run preview and status commands against safe local data.
5. Run one bounded local worker batch and confirm the HTTP cron adapter reports the same service result.
6. Run seed/rebuild only against a disposable local database and compare summary counts; production commands require human-controlled credentials and explicit confirmation.

## Risks and rollback points

| Risk | Prevention | Safe sequencing / rollback |
| --- | --- | --- |
| Broken `@/*` paths after moves | Move a dependency family and all consumers together; run typecheck and import searches after each phase. | Revert the family move before deleting its old files. |
| Circular imports between assistant, portfolio, and search-index | Make ownership explicit; assistant consumes search-index through `public.ts`; search-index consumes only deliberately exported portfolio APIs; never solve a cycle through `shared`. | Stop at the module's pre-`public.ts` commit, narrow the API, and rerun typecheck/tests. |
| Client bundle reaches server code | Enforce ESLint/test restrictions and `server-only`; inspect feature API/Hook/state/component imports. | Revert the offending frontend move and introduce a contract/Route Handler boundary, not a direct import. |
| Server services reuse a convenient feature model | Make service/page results server-owned and ban `server → features`; keep browser/UI state models in features only. | Stop before publishing the module API, move the result type into the server module, and update Server Component composition without creating a reverse import. |
| Boundary data lacks a contract or a server-only prop gains a placeholder contract | Trace actual runtime/trust crossings; require contracts for Client Component, HTTP, stream, and Server Action data, but not Server Component-only props. | Revert the premature model/contract move, classify the data flow, and add or remove the contract before continuing. |
| Entrypoint behaves differently under `tsx` | Preserve current runtime flags and environment loading; smoke-check each exact package command. | Keep package command pointed to the old script until the new adapter passes, then switch once. |
| Environment loading changes | Move existing validation intact; keep `--env-file` package flags; do not read secret files during implementation. | Revert config-path move independently; compare validation/error tests. |
| Production confirmation is lost | Preserve `--production` and explicit confirmation semantics in the maintenance helper and tests. | Do not delete the old production script until rejection/confirmation tests pass. |
| Script extraction changes indexing/seed behaviour | Characterize current outputs first; extract pure service before moving adapter; use fakes and parity tests. | Revert the service extraction commit without changing package paths or data. |
| Tests stay green through stale mocks | Update mocks with their target in the same phase; add public-behaviour assertions and old-path searches. | Revert the test and production move together. |
| Next.js route or proxy filename changes | Keep current `route.ts`, page/layout/error/loading files, and `src/proxy.ts`; consult Next.js 16.2.10 docs. | Revert only framework-surface import edits. |
| Provider errors leak after extraction | Map provider-specific errors into internal outcomes before services/controllers. | Restore the previous sanitized mapping and add regression coverage before proceeding. |
| Raw Prisma/generated types leak into contracts | Repositories map persistence results; contracts remain explicit and runtime-validated. | Stop before publishing `public.ts`; replace exported persistence types with module/contract types. |
| Case-only component rename fails on macOS | Use an intermediate filename in Git and verify tracked casing. | Reset only the rename operation before consumer updates. |
| Root scripts are removed too early | Switch commands, tests, and Prisma seed config first; run command smoke checks and import searches. | Keep the pre-deletion commit as the Phase 10 recovery point. |
| Local command validation mutates data | Use help/validation paths and dependency fakes; run destructive checks only against a disposable local database. | Stop before invoking the command; no production validation is automated. |

## Acceptance criteria

- [ ] The repository follows `.agents/skills/nextjs-architecture/SKILL.md` plus the explicit `.model.ts`/`.state.ts` naming decision in this contract.
- [ ] `src/app` contains only Next.js framework surfaces and thin HTTP controllers.
- [ ] Browser-facing assistant and portfolio code lives under `src/features` and imports no server-only module.
- [ ] Server pages and Server Components call backend services only through the owning module's `public.ts` and may compose feature components without importing module internals.
- [ ] Every Client Component backend interaction flows through `features/<feature>/api` and a Route Handler or another explicit runtime boundary.
- [ ] Every Route Handler calls backend services only through the owning module's `public.ts`.
- [ ] Assistant, portfolio, and search-index backend capabilities live under `src/server/modules`.
- [ ] Search indexing is no longer represented as a frontend feature.
- [ ] Prisma, OpenAI, environment, and logging setup lives under `src/server/infrastructure`.
- [ ] All non-HTTP executable adapters live under `src/server/entrypoints/cli`, `jobs`, or `maintenance`.
- [ ] Every entrypoint is thin and contains no reusable business workflow.
- [ ] Root `scripts/` and `prisma/seed.ts` no longer exist.
- [ ] All active package and Prisma seed commands point directly to the new entrypoints and preserve their public command names.
- [ ] React component files are PascalCase, Hook files use `useSomething.ts`, and all other project-authored TypeScript files and directories use the required kebab-case/role suffix convention.
- [ ] Next.js framework filenames, including `src/proxy.ts`, retain their required names.
- [ ] `assistant.contract.ts`, `portfolio-asset.contract.ts`, and `search-index-worker.contract.ts` validate the runtime-boundary shapes assigned to them and contain no business logic or database access.
- [ ] All request, response, stream, Server Action, Server-to-Client prop, and other runtime/trust-boundary data uses an appropriate contract under `src/contracts`.
- [ ] Server-only results remain inside the owning server module; passing props only between Server Components has not created a placeholder contract.
- [ ] No server module imports or returns a model owned by `features`.
- [ ] `chat-message.model.ts` contains only browser-created assistant conversation state; no feature-level `portfolio-view.model.ts` exists.
- [ ] Feature models contain only browser-owned state, browser-derived presentation data, or UI-only concepts, and no contract or feature model exists merely as a structural placeholder.
- [ ] Each backend module exposes a deliberate `public.ts`; no consumer imports another module's internal repository, provider, mapper, factory, model, prompt, or private service.
- [ ] Repositories own all application persistence/raw SQL; external SDK operations live only in infrastructure client construction or module providers.
- [ ] Shared frontend code lives under `src/shared`, is domain-free, and does not import features or server code.
- [ ] Generated Prisma files remain generated-only and are not manually edited.
- [ ] `src/components`, `src/lib`, `src/features/search-index`, and frontend `server` subfolders are removed after migration.
- [ ] No obsolete wrappers, duplicate implementations, compatibility barrels, stale mocks, or imports from deleted paths remain.
- [ ] Assistant streaming, continuation, sources, fallback, and rate-limit behaviour are preserved.
- [ ] Portfolio pages, protected assets, metadata, links, and loading/error behaviour are preserved.
- [ ] Search document construction, embeddings, indexing, removal, durable worker, preview, status, rebuild, and seed behaviour are preserved.
- [ ] ESLint and architecture tests mechanically enforce naming and import boundaries where practical.
- [ ] `npm run prisma:validate`, `npm run prisma:generate`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.
- [ ] Package-command and entrypoint smoke checks pass without production access.
- [ ] README documents the final structure and points to the architecture skill as authoritative.
- [ ] No unexplained architectural exception is introduced.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual tasks

1. Provide or select a disposable local database for destructive seed/rebuild parity checks.
2. Confirm production-only commands in the actual production environment after the milestone reaches `ready_for_human`; agents must not use private production credentials.

## Manual acceptance criteria

- [ ] `/`, `/work`, and `/about` are visually and functionally unchanged.
- [ ] The assistant opens, streams, continues a conversation, renders sources, and handles failure as before.
- [ ] Protected asset streaming works for an existing asset and returns the expected result for a missing asset.
- [ ] Preview, status, one bounded worker batch, disposable-local seed, and disposable-local rebuild commands behave as before from their unchanged package command names.
- [ ] Production command confirmation and environment behaviour are accepted by the human operator.
