# Milestone 5: Architecture Simplification and Clean Module Boundaries

**Status:** Frozen  
**Version:** 1.0.0  
**Last Updated:** 2026-07-21  
**Depends On:** Milestone 4  
**Target Pull Request:** —  
**Target Branch:** `feat/milestone-5-architecture-simplification`  
**Superseded By:** —

## Goal

Refactor the current Next.js App Router codebase into one plain, feature-first modular monolith that is easy to navigate, extend and test without changing public functionality.

The finished repository must make four boundaries obvious:

1. Next.js routing and rendering entry points
2. feature-owned frontend code
3. feature-owned server code
4. small shared infrastructure

The implementation may move, merge, rename or delete existing files aggressively. It must not preserve a confusing structure merely because that structure already exists.

The outcome is not the maximum number of layers. The outcome is the minimum structure required to keep responsibilities clear.

## Architecture decision

Do not create a separate Express, Fastify, NestJS or other Node.js backend in this milestone.

A separate backend would add another deployment, another transport boundary, duplicated contracts and additional operational work before the internal code boundaries are corrected. The current project can remain one deployable repository because its backend responsibilities are limited to:

- server-rendered portfolio reads
- one public assistant streaming endpoint
- search-index maintenance
- one protected bounded cron endpoint
- local operational scripts

Next.js must be treated as the rendering host and Backend-for-Frontend boundary, not as the location of all server implementation.

The `app` directory must contain framework entry points. Reusable server behaviour must live outside `app` in feature-owned `server` modules.

The internal server modules should remain independent of Next.js APIs wherever that is natural. This keeps a future extraction into a separate Node.js service possible without forcing a premature split now.

Long-running or retryable indexing work must continue to run through the existing durable queue and reusable Node-compatible worker operation. A production Route Handler may invoke only a bounded batch.

## Research basis

The architecture is based on the following current guidance:

- Next.js project structure is intentionally unopinionated, but recommends choosing one organization strategy and applying it consistently. It explicitly supports keeping application code outside `app` so `app` remains focused on routing.
- Next.js describes its backend capabilities as a Backend-for-Frontend/API layer, not a complete backend replacement.
- Route Handlers are public endpoints and some deployments run them as isolated functions that cannot share process memory and may terminate long-running work.
- Server Components should fetch directly from their data source rather than call the application's own Route Handlers.
- Server Components are the default. Client Components should be limited to state, effects, event handlers and browser APIs.
- Next.js recommends an explicit server-only Data Access Layer for growing applications and safe, minimal data passed into rendering.
- Feature-first organization keeps product-specific code together and prevents shared folders from becoming dumping grounds.

References:

- `https://nextjs.org/docs/app/getting-started/project-structure`
- `https://nextjs.org/docs/app/guides/backend-for-frontend`
- `https://nextjs.org/docs/app/getting-started/server-and-client-components`
- `https://nextjs.org/docs/15/app/guides/data-security`
- `https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md`

The implementation agent must also consult the documentation matching the installed Next.js version before changing framework-specific behaviour.

## Current repository state

The implementation agent must inspect the latest repository state before editing. Do not rely only on this summary.

Known current problems include:

- `src/app/api/chat/route.ts` still owns request parsing, manual validation, rate limiting, context retrieval, OpenAI orchestration, stream translation, fallback behaviour, error handling and HTTP response creation.
- Route-specific chat implementation remains under `src/app/api/chat/_lib`, while related implementation has also been moved into `src/features/chat`.
- `src/features/chat/application` mixes browser-side fetch code, server-side retrieval code, raw database access and shared transport types under one misleading folder name.
- `src/features/chat/types.ts` imports a client-facing source type from the implementation-oriented `application` folder.
- Retrieval types still depend on generated Supabase RPC types even though retrieval now uses Prisma and pgvector directly.
- The latest work-in-progress chat refactor contains committed debug logging, formatting defects, type-only imports used as values and an unexported error helper that is not actually usable by its consumer.
- `useFloatingPortfolioChat.ts` owns assistant session state, streamed message updates, response identity, input state, focus, scrolling, outside-click handling, keyboard handling, global browser events and motion configuration.
- A home-grown Markdown renderer contains a large amount of parsing and rendering code that a maintained library can replace more safely and clearly.
- The in-memory chat rate limiter uses module-level Maps. It cannot provide a global production guarantee across serverless instances.
- Chat components have more than one canonical import path because root component files re-export or wrap feature components.
- `src/components` mixes generic UI, site layout and portfolio/assistant-specific components.
- Root `src/types`, `src/data`, broad `utils` modules and suffix-heavy folders make ownership unclear.
- Static portfolio data remains in runtime `src/data` even though its remaining legitimate role is database seeding.
- Runtime Supabase client code and Supabase JavaScript dependencies appear to remain even though active application data access now uses Prisma.
- `README.md` still describes the application as static-only and states that Supabase migrations are canonical, while the current package scripts, Prisma configuration and Milestone 4 use Prisma migrations.
- The repository does not currently expose one aggregate `npm test` command.
- `AGENTS.md` previously contained placeholder project rules rather than enforceable architecture and clean-code standards.

Working behaviour that must be preserved includes:

- `/`, `/work` and `/about` render the current portfolio content.
- portfolio content is read server-side through Prisma and validated/mapped before rendering.
- the floating portfolio assistant opens, sends messages, streams responses, continues conversations and renders sources.
- search documents are built from canonical portfolio records.
- indexing creates embeddings only when required.
- durable indexing jobs are claimed, completed, retried and failed safely.
- the local worker and production cron path call the same worker operation.
- protected blob streaming continues to work.
- current public URLs, copy, layout, metadata and assistant response contract remain stable unless a change is necessary to preserve security or correctness.

## Required end state

Use one clear feature-first structure outside `app`.

The following shape is the intended direction. Exact file grouping may be simplified further when several tiny files have one responsibility. Do not copy the tree mechanically or create empty folders.

```text
src/
├── app/
│   ├── api/
│   │   ├── blob/[...pathname]/route.ts
│   │   ├── chat/route.ts
│   │   └── internal/search-index-worker/route.ts
│   ├── about/page.tsx
│   ├── work/page.tsx
│   ├── error.tsx
│   ├── layout.tsx
│   ├── loading.tsx
│   └── page.tsx
│
├── components/
│   ├── layout/
│   └── ui/
│
├── features/
│   ├── portfolio/
│   │   ├── components/
│   │   ├── server/
│   │   ├── schemas.ts
│   │   └── types.ts
│   │
│   ├── assistant/
│   │   ├── components/
│   │   ├── server/
│   │   ├── client.ts
│   │   ├── constants.ts
│   │   ├── schema.ts
│   │   ├── types.ts
│   │   └── use-assistant.ts
│   │
│   └── search-index/
│       ├── server/
│       │   └── builders/
│       └── types.ts
│
├── generated/
│   └── prisma/
│
└── lib/
    ├── db.ts
    ├── env.ts
    ├── openai.ts
    └── utils.ts

prisma/
├── migrations/
├── seed-data/
└── seed.ts

scripts/
tests/
├── assistant/
├── portfolio/
└── search-index/
```

### Important interpretation

- `features/assistant` replaces the ambiguous `features/chat` implementation structure. The public endpoint may remain `/api/chat`.
- `features/search-index` owns search-index building, persistence, worker and retrieval data operations that are not UI concerns.
- If keeping retrieval under `assistant/server` is materially simpler than a cross-feature dependency, that is acceptable. Do not keep duplicate retrieval implementations.
- `features/portfolio/server` owns server-only portfolio reads and safe page data creation.
- `src/lib` contains only small shared infrastructure. It must not contain portfolio, assistant or search-index business rules.
- Do not introduce top-level `application`, `domain`, `infrastructure`, `services`, `repositories`, `managers`, `common`, `helpers` or `types` layers.
- Do not create a folder that contains one tiny file unless the folder itself enforces a meaningful boundary such as `server` or `components`.

## Required behaviour

### 1. Establish one dependency direction

The final dependency direction must be:

```text
src/app
  -> src/features
    -> src/lib
      -> generated clients and external packages
```

Additional rules:

- features must not import from `src/app`
- shared UI and shared libraries must not import feature implementations
- client files must not import `server` files
- server files must not import React UI
- generated Prisma records must not be exported as browser contracts
- feature-to-feature imports must be explicit and one-directional
- circular imports must be removed

Add simple ESLint `no-restricted-imports` rules or equivalent built-in restrictions where they can enforce these boundaries without another architecture framework.

Do not add a dependency graph framework or custom compiler plugin.

### 2. Keep `src/app` as framework entry points

Pages and layouts may:

- compose components
- load page data through one clear feature server function
- define metadata
- declare route-level loading and error UI

Pages and layouts must not:

- query Prisma directly
- call OpenAI
- call the application's own Route Handlers
- contain indexing logic
- contain reusable mapping or validation logic

Route Handlers may:

- read the Web `Request`
- validate transport input
- apply endpoint-level authentication, authorization and rate-limit checks
- call one feature server operation
- translate safe results into a `Response`

Route Handlers must not:

- contain reusable OpenAI event orchestration
- contain SQL or Prisma queries
- contain search algorithms
- contain large private `_lib` feature trees
- expose internal provider or database errors

Remove `src/app/api/chat/_lib` after its real responsibilities have moved to their owning feature.

### 3. Simplify the portfolio feature

The current portfolio implementation has many small query, mapper, loader, schema and type files.

Refactor it so the path from page to data is easy to follow:

```text
page
  -> get...PageData()
    -> focused portfolio data access
      -> Prisma
```

Requirements:

- keep all portfolio database access server-only
- retain Zod validation for stored `ContentBlock.content` and project links
- return deliberate page/view types rather than Prisma records
- keep `getHomePageData`, `getWorkPageData` and `getAboutPageData`, or equivalently clear behaviour-named operations
- consolidate tiny query, mapper and schema files when they exist only to support the same responsibility
- do not merge unrelated schemas or behaviour merely to reduce the file count
- move portfolio-specific components such as project, experience and principle cards into the portfolio feature
- keep generic layout and UI primitives shared
- keep the App Router pages readable as page composition

Do not add repository interfaces, page service classes or DTO classes.

### 4. Simplify the assistant feature

Rename the feature from the generic `chat` name to the product capability `assistant`, unless implementation evidence proves the rename creates a worse result. Do not retain both names or compatibility wrappers.

The feature must have four obvious concerns:

1. assistant UI components
2. one client stream transport
3. assistant state/interaction logic
4. server-side response and retrieval logic

#### Public transport contract

Create one runtime schema for the public chat request.

At minimum it must validate:

- trimmed non-empty message
- current maximum message length
- optional nullable previous response ID

Infer the TypeScript request type from the schema.

Define and validate the NDJSON stream event union at the transport boundary. Do not rely on `JSON.parse(...) as ChatStreamEvent` as the only runtime protection.

The stream event contract must preserve the current externally observable event behaviour:

- text delta
- sources
- response ID
- done
- safe error

Client-facing error messages must be safe. Internal OpenAI and database errors must be logged with context but not streamed verbatim.

#### Server operation

Move OpenAI response creation, provider-event translation, fallback handling and context retrieval out of `route.ts` into a server-only assistant operation.

The operation should accept ordinary inputs such as:

- message
- previous response ID
- abort signal

It must not require a Next.js-specific request object except where the Web `AbortSignal` is the actual dependency.

The route must remain an HTTP adapter around that operation.

#### Retrieval

- define the pgvector result type locally from the selected columns
- remove dependency on generated Supabase RPC types
- keep raw vector SQL isolated
- preserve current embedding length, threshold, count, ordering and diversity behaviour unless a bug is proven
- remove debug logging
- use behaviour names such as `retrieve-assistant-context.ts` and `match-site-chunks.ts`
- do not place server retrieval code in a generic `application` folder

#### Client stream

- keep browser fetch and NDJSON parsing in one clearly client-owned module
- restore or remove the currently orphaned error parsing helper; do not leave unexported dead helpers
- release/cancel stream readers correctly when completing or failing
- handle malformed stream events predictably
- keep the client module independent from React state updates

#### Assistant state

Refactor the current oversized hook so assistant session transitions are clear.

The implementation may use either:

- one focused hook with a local reducer, or
- at most two focused hooks separating assistant session state from floating-shell/browser behaviour

Choose the option that produces less code and clearer transitions after inspecting the component tree.

Do not create separate reducer, action, selector and state-machine folders merely to imitate Redux architecture.

The final implementation must clearly handle:

- opening and closing
- composer and conversation states
- submitting a message
- appending streamed deltas
- attaching sources
- storing the previous response ID
- loading and failure state
- focus, Escape and outside-click behaviour
- automatic scrolling
- reduced-motion behaviour

Avoid repeated full-array update logic where one named helper or reducer case makes the intent clearer.

#### Assistant rendering

Replace the custom Markdown parser/renderer with a small maintained renderer such as `react-markdown` unless repository evidence shows the dependency cannot preserve current rendering safely.

Requirements:

- raw HTML must not be enabled
- external links must use safe target/rel attributes
- internal links must continue to work
- current headings, paragraphs, lists, emphasis, inline code and links must render
- styling may remain local to the assistant component
- do not replace the current parser with another hand-written parser

### 5. Clarify rate-limit guarantees

The current module-level Map limiter is per-process only.

The milestone must not falsely present it as a global production rate limiter.

Choose the smallest honest solution:

- keep a clearly named, bounded, best-effort per-instance limiter and document its guarantee, or
- remove it in favour of an already available deployment-level rate limit

Do not add Redis, Upstash or another paid infrastructure dependency solely for this refactor.

Add a manual task for Freeman to configure or verify host-level rate limiting if production cost protection requires a global limit.

### 6. Simplify search indexing without rewriting working algorithms

The indexing system has real complexity and is allowed more files than the UI features, but every file must represent a genuine responsibility.

Preserve:

- explicit source builders
- deterministic embedding input and hashing
- skip-unchanged behaviour
- atomic replacement safety
- durable job claiming and retry behaviour
- shared local/production worker operation
- bounded production processing
- focused tests

Refactor naming and ownership:

- rename `search-indexing` to `search-index`
- prefer behaviour-named files such as `index-source.ts`, `rebuild-index.ts`, `run-index-batch.ts`, `search-index-jobs.ts`, `site-chunks.ts` and `source-records.ts`
- do not keep `.repository`, `.service`, `.use-case` or `.manager` suffixes when they add no useful distinction
- keep raw SQL inside the focused data operation that requires it
- keep builders pure
- keep OpenAI outside database transactions
- keep scripts and the production Route Handler as adapters around the same server operation

Function-parameter dependency injection may remain where it materially enables the existing deterministic worker and indexing tests. Do not introduce a DI container or interfaces for every dependency.

Do not rewrite the proven indexing algorithm solely to match the new directory structure.

### 7. Remove ambiguous shared folders and duplicate paths

Refactor component ownership:

- generic primitives -> `src/components/ui`
- site shell/navigation/footer/container -> `src/components/layout`
- portfolio components -> portfolio feature
- assistant components -> assistant feature

Rename the generic root `Layout` component to a specific name such as `SiteLayout` or `AppShell`.

Delete:

- feature compatibility re-export files in root components
- duplicate canonical import paths
- dead generic helper modules
- unused constants and types
- obsolete files left behind by moves

Do not keep a wrapper merely to avoid updating imports.

### 8. Move seed-only data out of runtime source

The TypeScript portfolio records under `src/data` are seed input, not runtime application state.

Move them to a clear database-owned location such as:

```text
prisma/seed-data/
```

Requirements:

- pages and assistant indexing must continue to use database records as runtime truth
- the seed remains repeatable
- seed mappings and tests remain typed
- no runtime feature imports from the seed-data directory
- remove the root `src/data` directory when migration is complete

### 9. Remove the root types dumping ground

Move types to their owner:

- portfolio render types -> portfolio feature
- assistant transport and UI types -> assistant feature
- search-index contracts -> search-index feature
- generated Prisma types -> generated directory and server-only consumers

Delete root `src/types` when no genuinely cross-feature hand-written type remains.

Remove generated Supabase types and the `supabase:types` package script if they have no active consumer after retrieval is corrected.

### 10. Audit dependencies and infrastructure modules

Keep only active runtime dependencies.

Expected review targets include:

- `@supabase/ssr`
- `@supabase/supabase-js`
- generated Supabase types
- the server Supabase client
- stale blob, UI or helper dependencies

Supabase may remain the PostgreSQL hosting/local-development platform without requiring its JavaScript client in the application.

Consolidate shared infrastructure into behaviour-specific modules:

- `src/lib/db.ts`
- `src/lib/env.ts`
- `src/lib/openai.ts`
- `src/lib/utils.ts` only for truly generic utilities such as `cn`

Requirements:

- environment access must be centralized
- `DATABASE_URL`, OpenAI configuration, cron secret and optional public variables must have clear ownership
- avoid requiring unrelated environment variables when constructing one client
- remove the current coupling where creating an OpenAI client requires Supabase variables
- do not add provider interfaces when only one provider exists

### 11. Correct documentation and operational truth

Update `README.md` to match the implementation after the refactor.

It must accurately describe:

- the project is a Next.js portfolio with server-rendered database content, an assistant and a search-index worker
- Prisma migrations are the active migration source of truth if that remains the current repository state
- Supabase's actual remaining role
- local development prerequisites
- environment variables
- seed workflow
- indexing commands
- worker and cron behaviour
- production safety commands
- validation commands

Remove stale instructions that contradict package scripts or the active migration history.

Do not document commands that were not verified to exist.

### 12. Add sustainable guardrails

Add or update:

- one aggregate `npm test` script
- one focused assistant test command if useful
- ESLint import restrictions for the agreed dependency boundaries
- tests grouped by feature
- documentation that explains where a new component, type, schema, server operation, Route Handler and script belongs

Do not add an architecture framework, code generator or monorepo tool.

## File and abstraction rules for this milestone

- Prefer fewer cohesive files over many one-function files.
- Do not create files solely because a conceptual layer can be named.
- Do not keep unrelated behaviour in one file solely to reduce file count.
- A `types.ts`, `schema.ts` or `constants.ts` file is preferred for a small feature before creating a directory of tiny files.
- Keep one-consumer private helpers beside their consumer.
- Split only for separate responsibility, reuse, independent testing or material readability.
- Avoid generic `utils`, `helpers`, `common`, `manager`, `factory`, `base` and `service` names.
- Do not introduce Clean Architecture rings, domain entities, ports/adapters folders, CQRS, DDD or repository interfaces.
- Do not introduce Redux, Zustand or another global state library.
- Do not add a generic API client framework for one endpoint.
- Do not add controllers inside a Next.js codebase solely to mimic Express.
- Do not create a feature barrel file unless several consumers need one deliberate public surface.
- Delete superseded files in the same change. Transitional duplicates are not an accepted end state.

## Implementation sequence

The implementation agent must use this sequence to reduce accidental behaviour changes.

### Step 1: Baseline and inventory

Before moving files:

1. inspect all current source, script, Prisma, test and documentation files
2. inspect the latest work-in-progress commits
3. run the currently available validation commands
4. record current failures rather than silently attributing them to the refactor
5. map every current file to one of:
   - framework entry point
   - shared UI/layout
   - portfolio
   - assistant
   - search index
   - shared infrastructure
   - seed/operations
   - generated
   - dead/obsolete
6. identify all public behaviour and package commands that must remain

Do not start by creating the proposed folder tree.

### Step 2: Establish shared boundaries

1. update imports and shared component ownership
2. establish central environment, database and OpenAI modules
3. add import-boundary lint rules
4. remove unused Supabase runtime integration if proven unused

### Step 3: Simplify portfolio

1. consolidate server reads, safe mapping and schemas
2. move portfolio components
3. update pages
4. keep portfolio tests green
5. remove old query/loader/mapper/type paths only after imports are migrated

### Step 4: Simplify assistant

1. define runtime request and stream contracts
2. move server orchestration out of the Route Handler
3. correct retrieval ownership and types
4. simplify client stream parsing
5. simplify state and shell behaviour
6. replace the custom Markdown parser
7. remove old chat paths and wrappers
8. add assistant tests

### Step 5: Simplify search index

1. rename the feature
2. preserve builders and worker semantics
3. simplify naming and file grouping where justified
4. update scripts and cron imports
5. keep indexing tests green

### Step 6: Seed, docs and cleanup

1. move seed-only content
2. update seed imports and tests
3. update README and package scripts
4. delete every obsolete source path
5. run dead-code and dependency audit
6. run full validation

## Required tests

Required automated coverage includes:

1. Home, work and about page data still return the expected safe view shapes.
2. Stored JSON content is validated before rendering or indexing.
3. App Router pages render the current portfolio sections without client-side database fetching.
4. The public assistant request rejects malformed JSON, missing messages and oversized messages.
5. The public assistant request accepts the current valid payload.
6. Assistant stream event parsing accepts every valid event type.
7. Assistant stream event parsing rejects malformed and unknown events safely.
8. The assistant client reports non-2xx errors safely.
9. The assistant client handles a stream that ends with a buffered final event.
10. The assistant client handles provider error events and malformed stream lines.
11. Assistant session state appends deltas to the correct message.
12. Sources attach to the correct assistant message.
13. Response IDs update conversation continuity.
14. Failed requests replace or mark the pending assistant response predictably.
15. Open/close, Escape and outside-click behaviour remain intact.
16. The maintained Markdown renderer covers headings, paragraphs, lists, emphasis, inline code and links without raw HTML.
17. Retrieval preserves embedding dimensions, threshold, ordering, count and source mapping.
18. Retrieval no longer imports generated Supabase RPC types.
19. The public assistant Route Handler contains no direct Prisma or OpenAI implementation.
20. Search source builders remain deterministic and pure.
21. Unchanged search documents still avoid embedding calls.
22. Failed indexing does not partially replace valid indexed state.
23. Job claiming, completion, retry and terminal failure behaviour remain intact.
24. The local worker and production endpoint call the same batch operation.
25. Production worker requests still reject missing or invalid secrets.
26. Portfolio seed data remains complete and repeatable after moving out of `src/data`.
27. No runtime module imports seed-data files.
28. ESLint rejects a representative client-to-server import.
29. ESLint rejects a representative feature-to-`app` import.
30. Existing blob route behaviour remains intact.
31. Existing focused tests remain green or are replaced by equivalent stronger coverage.
32. Prisma validation, generation, lint, typecheck, aggregate tests and production build pass.

Tests must verify behaviour rather than exact internal filenames except where a boundary is itself an acceptance requirement.

## Required validation

After implementation, run the exact scripts that exist in the final package file.

At minimum:

```bash
npm install
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run build
```

Also run the focused commands retained or introduced for:

```bash
npm run test:portfolio
npm run test:assistant
npm run test:search-indexing
```

Run representative dry-run operational commands that do not require private credentials or network access.

Where local database and OpenAI access are unavailable, use existing deterministic fakes and report the limitation honestly.

The implementation report must include:

- before/after top-level source tree
- files deleted
- dependencies removed and added
- exact validation commands and results
- any behaviour that could not be verified without credentials
- any remaining architecture compromise and why it is necessary

## Constraints

- Preserve public UI, copy, routes, metadata and responsive behaviour.
- Preserve assistant endpoint URL and externally visible stream contract.
- Preserve search-index correctness, durable queue behaviour and production cron protection.
- Preserve current database schema and production data.
- Do not reset, wipe or reseed production.
- Do not generate a migration solely for file reorganization.
- Do not change embedding models, dimensions, thresholds or prompts unless correcting a proven current defect requires it.
- Do not replace Prisma.
- Do not replace PostgreSQL or Supabase hosting.
- Do not create a separate backend service.
- Do not add a monorepo.
- Do not add Docker solely for this refactor.
- Do not add auth, an admin panel or a CMS.
- Do not add speculative extensibility.
- Do not add interfaces, classes or factories without a demonstrated need.
- Do not create more files than the current code requires to express clear responsibilities.
- Do not retain dead compatibility paths.
- Do not silence type, lint or test failures.
- Do not merge the pull request.

## Explicitly out of scope

- New portfolio sections or content
- New assistant features, tools or actions
- Conversation persistence
- Authentication or user accounts
- A portfolio administration interface
- A separate Node.js API repository
- A new queue product
- Distributed tracing or a monitoring platform
- New search algorithms, reranking or hybrid search
- New embedding providers or model abstraction
- Redesigning the UI
- Changing hosting providers
- Container orchestration
- Microservices
- DDD, CQRS or event sourcing
- Generic plugin systems
- Unrelated performance optimization

## Acceptance criteria

- [ ] The repository follows one feature-first modular structure rather than a mixture of route-local, global and layered structures.
- [ ] `src/app` contains framework entry points and page composition rather than reusable backend implementation.
- [ ] The assistant Route Handler no longer owns OpenAI orchestration, retrieval implementation or stream translation logic.
- [ ] No `src/app/api/chat/_lib` implementation tree remains.
- [ ] Client code cannot import server-only feature modules.
- [ ] Features do not import from `src/app`.
- [ ] Server-only modules are marked and secrets cannot enter the client graph.
- [ ] Portfolio, assistant and search-index responsibilities have one canonical location each.
- [ ] `features/chat/application` and the current mixed application folder no longer remain.
- [ ] There is no duplicate assistant component import path or compatibility re-export wrapper.
- [ ] Portfolio-specific components no longer live in the shared components root.
- [ ] Shared components contain only generic UI and site layout.
- [ ] The portfolio data path remains server-only, validated and easy to trace.
- [ ] Stored JSON and public assistant input use runtime schemas.
- [ ] Client and server transport types come from one deliberate contract rather than implementation imports.
- [ ] Retrieval types no longer depend on generated Supabase RPC types.
- [ ] The custom Markdown parser has been removed in favour of a maintained safe renderer.
- [ ] Assistant state and browser-shell behaviour are clear without introducing a global state library or state architecture ceremony.
- [ ] The current rate-limit guarantee is honest and documented.
- [ ] Search-index algorithms, queue safety and shared worker behaviour are preserved.
- [ ] Scripts and cron endpoints remain adapters around shared server operations.
- [ ] Static seed content no longer lives under runtime `src/data`.
- [ ] Root `src/types` is removed unless a genuinely cross-feature hand-written contract remains and is justified.
- [ ] Unused Supabase runtime clients, generated types, scripts and dependencies are removed when proven unused.
- [ ] Environment access is centralized and constructing one integration does not require unrelated variables.
- [ ] Prisma migrations and README documentation agree on one migration source of truth.
- [ ] No temporary debug logging, dead files, orphan helpers or stale imports remain.
- [ ] No unnecessary Clean Architecture, DDD, repository-interface or dependency-injection framework was introduced.
- [ ] ESLint enforces the critical dependency boundaries.
- [ ] One aggregate `npm test` command runs the final focused suites.
- [ ] Required repository validation commands pass.
- [ ] The implementation report includes the required before/after tree and cleanup evidence.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual tasks

These tasks require local credentials, production configuration or human judgement. They do not block the workflow from reaching `ready_for_human`.

1. Run the refactored application locally with the intended development database and verify `/`, `/work` and `/about` visually.
2. Open the floating assistant from every current trigger and verify composer, conversation, closing and source-link behaviour.
3. Ask representative questions about Freeman's profile, projects, services, principles and experience using a valid OpenAI key.
4. Verify conversation continuation across at least three messages.
5. Run one real index dry-run and one real bounded worker batch against the intended development database.
6. Confirm the production Vercel cron still invokes the protected worker endpoint after deployment.
7. Configure or verify deployment-level chat rate limiting if a global cost-control guarantee is required.
8. Inspect the final repository tree manually and confirm a new engineer can identify where frontend feature code, server feature code, types, constants, schemas, database logic and scripts belong without consulting implementation history.

## Manual acceptance criteria

- [ ] The public portfolio pages look and behave the same after the refactor.
- [ ] The assistant opens, streams, continues conversations and renders safe formatted content and source links.
- [ ] Real retrieval still returns relevant portfolio context.
- [ ] A real indexing job can be processed without changing valid indexed data unexpectedly.
- [ ] The production cron path remains protected and operational.
- [ ] Production chat cost protection matches the guarantee documented by the application.
- [ ] The final codebase is materially easier for Freeman to navigate and extend than the pre-milestone repository.
