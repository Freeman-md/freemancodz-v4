---
name: nextjs-architecture
description: Authoritative architectural standard for planning, implementing, reviewing, or refactoring Next.js applications. Use before choosing file locations, names, interfaces, dependencies, service boundaries, runtime boundaries, Route Handlers, Server Actions, frontend features, backend modules, repositories, providers, composition, contracts, infrastructure, workers, or shared code, and use again before declaring Next.js work complete.
---

# Next.js Architectural Standard

## Authority and required posture

Apply this skill as the default authority for all Next.js implementation, milestone, review, and refactor work.

- Build a modular monolith with a feature-based frontend and a module-centred, layered backend.
- Treat Next.js as the application host, rendering/routing framework, and HTTP adapter, not as the internal organization of backend business logic.
- Design from the owning capability and runtime responsibility. Do not infer the standard from an existing repository layout.
- Inspect the installed Next.js version and read its bundled official documentation before a framework-specific decision. Use current official Next.js documentation only as a fallback or supplement.
- Treat official framework behavior as authoritative and all non-framework organization below as project convention.
- Use official React rules for component and Hook semantics.

## Required source layout

```text
src/
├── app/
├── features/
├── server/
│   ├── modules/
│   ├── infrastructure/
│   ├── entrypoints/
│   └── composition-root.ts
├── contracts/
├── shared/
└── generated/
```

Create only folders that own real code. Never generate empty role folders mechanically.

| Location                         | Owns                                                                                                                  | Must not own                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/app`                        | Next.js routes, pages, layouts, metadata, boundaries, Route Handlers, appropriate Server Actions, and framework files | Persistence, provider construction, reusable business rules, or workflows         |
| `src/features`                   | Browser-facing product features                                                                                       | Backend logic, Prisma, server infrastructure, secrets, or provider SDKs           |
| `src/server/modules`             | Backend business capabilities and their behavioural interfaces                                                        | React UI, HTTP parsing/responses, composition, or generic technical configuration |
| `src/server/infrastructure`      | Configured server clients and reusable technical setup                                                                | Product business policy                                                           |
| `src/server/entrypoints`         | Thin non-HTTP process adapters                                                                                        | Reusable business logic or dependency construction                                |
| `src/server/composition-root.ts` | Manual dependency assembly and configured service instances                                                           | Business rules                                                                    |
| `src/contracts`                  | Runtime-validated trust/runtime-boundary data                                                                         | Business logic, persistence, or private models                                    |
| `src/shared`                     | Stable, domain-free frontend-safe code shared by unrelated features                                                   | Feature logic or backend infrastructure                                           |
| `src/generated`                  | Generated code only                                                                                                   | Hand-authored or manually edited code                                             |

## `src/app`: framework adapters

Keep `src/app` thin. Treat Route Handlers as public HTTP controllers. They may parse and validate transport input, authenticate and authorize, apply transport rate limits, select a configured service from the composition root, call service methods, and translate results into HTTP or streaming responses.

Route Handlers and Server Actions must not contain raw persistence, provider calls/construction, reusable business rules, substantial transformations, or application workflows. Validate and authorize Server Actions as public endpoints.

Let Server Components import configured service instances from the composition root and call them directly when no HTTP boundary is required. Never call the application's own Route Handler from a Server Component when direct service access is available.

Use Server Actions for UI-triggered mutations, not as a general read layer or background-job mechanism. Keep request work bounded and send long-running or retryable work through durable entrypoints.

## `src/features`: browser-facing product features

Create roles only as needed:

```text
features/<feature>/
├── components/
├── hooks/
├── api/
├── state/
├── models/
└── <feature>.constants.ts
```

| Role         | Responsibility                                                               |
| ------------ | ---------------------------------------------------------------------------- |
| `components` | Render and compose feature UI                                                |
| `hooks`      | Coordinate React state, effects, and browser behavior                        |
| `api`        | Perform browser-side HTTP or streaming communication                         |
| `state`      | Define pure frontend transitions or stores                                   |
| `models`     | Describe browser-owned state, derived presentation data, or UI-only concepts |
| constants    | Define frontend constants owned by the feature                               |

Frontend features must not import `server`, Prisma, secrets, Node-only dependencies, or provider SDKs. A capability may have both `features/<capability>` and `server/modules/<capability>`; never merge the runtimes into one folder.

## `src/server/modules`: class-based backend capabilities

Represent each backend capability as a module:

```text
server/modules/<module>/
├── services/
├── repositories/
├── providers/
├── interfaces/
├── mappers/
├── factories/
├── models/
├── schemas/
├── prompts/
├── <module>.constants.ts
└── public.ts
```

### Role rules

| Role         | Default form                                     | Responsibility                                                                                                 |
| ------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Services     | Cohesive class implementing a service interface  | Business rules, use cases, workflows, fallbacks, retry/outcome decisions, and coordination                     |
| Repositories | Class implementing a repository interface        | Persistence for one entity, aggregate, or persistence boundary                                                 |
| Providers    | Cohesive class implementing a provider interface | External provider/SDK operations and normalization                                                             |
| Interfaces   | TypeScript interfaces                            | Meaningful behavioural contracts for services, repositories, providers, and replaceable technical dependencies |
| Mappers      | Pure functions                                   | Representation conversion without I/O or decisions                                                             |
| Factories    | Pure functions by default                        | Deterministic construction of non-trivial objects/aggregates                                                   |
| Models       | Types, interfaces, or classes as appropriate     | Data structures and invariants owned by the backend module                                                     |
| Schemas      | Runtime schemas                                  | Validation of external or untrusted data owned only by the module                                              |
| Prompts      | Version-controlled values/functions              | Purpose-named AI application behavior                                                                          |
| Constants    | Values                                           | Related backend constants owned by the module                                                                  |
| `public.ts`  | Type/export surface                              | Deliberate cross-module service API                                                                            |

### Cohesive service classes

Create one primary service class per cohesive module capability by default:

```text
services/user.service.ts
services/assistant.service.ts
services/portfolio.service.ts
services/search-index.service.ts
```

Use matching class/interface pairs:

```text
services/portfolio.service.ts
interfaces/portfolio.service.interface.ts
```

```ts
export interface IPortfolioService {
  getHomePageData(): Promise<HomePageData>;
  getWorkPageData(): Promise<WorkPageData>;
  getAboutPageData(): Promise<AboutPageData>;
}

export class PortfolioService implements IPortfolioService {
  constructor(private readonly contentRepository: IContentRepository) {}

  getHomePageData() {}
  getWorkPageData() {}
  getAboutPageData() {}
}
```

Keep public methods action-oriented: `userService.createUser()`, `assistantService.createResponse()`, `portfolioService.getHomePageData()`, `searchIndexService.rebuildIndex()`.

Split services by cohesive responsibility, not by individual operation and not by arbitrary file length. Discourage `create-user.service.ts`, `get-home-page-data.service.ts`, `retrieve-assistant-context.service.ts`, and similar operation-specific services.

Allow multiple service classes only for genuinely separate responsibilities, dependency sets, or execution lifecycles, such as:

```text
services/user.service.ts
services/user-authentication.service.ts

services/search-index.service.ts
services/search-index-worker.service.ts
```

Do not create a God service. Do not combine unrelated workflows merely to preserve the one-primary-service default. File length alone is neither a reason to split nor a reason to keep unrelated behavior together.

Every public service class must implement one corresponding service interface. Keep one cohesive service interface per file and prefix its symbol with `I`, for example `IUserService`, `IAssistantService`, `IPortfolioService`, or `ISearchIndexWorkerService`.

### Class-based repositories

Make every repository a class implementing a corresponding interface:

```text
repositories/user.repository.ts
interfaces/user.repository.interface.ts
```

```ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserRecord): Promise<User>;
  update(id: string, input: UpdateUserRecord): Promise<User>;
  delete(id: string): Promise<void>;
}

export class UserRepository implements IUserRepository {
  constructor(private readonly database: PrismaClient) {}
}
```

Group related persistence methods by subject. Use `user.repository.ts`, `site-chunk.repository.ts`, `search-index-job.repository.ts`, or `indexing-source.repository.ts`, not `find-user.repository.ts` or `claim-search-index-job.repository.ts`.

Only repositories may execute application persistence operations or raw SQL; infrastructure may construct the database client. Do not create generic/base repositories or combine unrelated entities to reduce file count.

### Class-based providers

Make providers cohesive classes implementing corresponding interfaces. Model the external provider, not each SDK operation:

```text
providers/openai.provider.ts
interfaces/openai.provider.interface.ts
```

```ts
export interface IOpenAIProvider {
  streamResponse(input: AssistantResponseInput): AsyncIterable<AssistantStreamEvent>;
  createEmbedding(input: string): Promise<number[]>;
  createEmbeddings(inputs: string[]): Promise<number[][]>;
}

export class OpenAIProvider implements IOpenAIProvider {
  constructor(private readonly client: OpenAI) {}
}
```

Use one `OpenAIProvider` and one `IOpenAIProvider` by default for responses, streaming, embeddings, structured output, transcription, moderation, and other OpenAI operations used by the application. Do not standardize `openai-response.provider.ts`, `openai-embedding.provider.ts`, or operation-specific provider interfaces.

Apply the same rule to Resend, Stripe, Vercel Blob, and other external providers. Split a provider only for demonstrated separate clients, credentials, deployment/runtime boundaries, incompatible environments, unrelated lifecycles, or loss of cohesion. SDK operation count or file length alone is insufficient.

Provider classes may translate application input into provider input, map provider output to internal structures, and normalize provider errors. They must not decide application workflows, fallbacks, or business outcomes.

When unrelated modules need one provider, assign the provider integration one clear backend owner and expose business capabilities to other modules through public service interfaces. Do not duplicate provider classes across modules.

### Interfaces directory

Keep behavioural contracts in the owning module's `interfaces` directory:

```text
interfaces/user.service.interface.ts
interfaces/user.repository.interface.ts
interfaces/openai.provider.interface.ts
interfaces/logger.interface.ts
```

- Make service classes implement service interfaces.
- Make repository classes implement repository interfaces.
- Make provider classes implement provider interfaces.
- Make services depend on interfaces, never concrete repositories/providers/services.
- Make cross-module service dependencies use the other module's public service interface.
- Prefix interface symbols with `I`: `IUserService`, `IUserRepository`, `IOpenAIProvider`, `ILogger`.
- Do not create interfaces for pure functions, mappers, simple data objects, or pattern compliance alone.
- Do not put unrelated behavioural interfaces in one file.
- Do not use a `ports` directory, `*.port.ts`, or `Port` terminology.

### Constructor dependency injection

Pass dependencies explicitly through constructors:

```ts
export class AssistantService implements IAssistantService {
  constructor(
    private readonly openAIProvider: IOpenAIProvider,
    private readonly searchIndexService: ISearchIndexService,
    private readonly logger: ILogger,
  ) {}
}
```

- Do not construct repositories/providers inside services.
- Do not import globally configured service instances into another service.
- Do not use static service methods, service locators, dependency containers, DI frameworks, or module-level mutable dependency state.
- Do not inject an entire container.
- Keep classes stateless across requests; pass request-specific state through method parameters.
- Keep constructor dependencies minimal and capability-oriented.
- Inject database clients into repository constructors and SDK clients into provider constructors.
- Type replaceable constructor dependencies with interfaces.

### Classes versus functions

Use classes by default for services, repositories, providers, and stateful technical adapters. Require meaningful interfaces for services, repositories, and providers.

Use pure functions by default for mappers, factories, validation helpers, formatting, deterministic transformations, generic utilities, and frontend state transitions. Do not convert stateless transformations into classes merely for consistency.

Use types, interfaces, or classes for models according to whether they own behavior and invariants.

### Models, schemas, prompts, and constants

Keep generated database types in `generated`, persistence records at repository boundaries, backend models in module `models`, frontend models in feature `models`, and runtime-boundary contracts in `contracts`. Generated types must not automatically become business models or public contracts.

Keep server-only results in the owning module. Never import or return a feature-owned model from a server module. Use contracts when data crosses into a Client Component, API consumer, stream, Server Action, or another runtime/trust boundary. Passing props only between Server Components does not create a contract boundary.

Use module schemas for provider responses, persisted unstructured data, or other untrusted data consumed only by the module. Use `src/contracts` for shared runtime boundaries. Do not duplicate trusted internal TypeScript types as schemas.

Keep prompts in the module owning AI behavior and separate from provider construction/controllers. Place constants with the code owning their meaning; prohibit generic constants dumping grounds and duplication.

### Public module API

Give every backend module a `public.ts` that exposes only capabilities intentionally available to other backend modules:

```ts
export type { IAssistantService } from "./interfaces/assistant.service.interface";
export type { AssistantResponse, CreateAssistantResponseInput } from "./models/assistant-response";
```

`public.ts` may export public service interfaces, public input/output models, public errors, and intentionally shared business types.

It must not construct dependencies, export configured instances, expose concrete service classes without an explicit reason, or export repositories, providers, mappers, private schemas, prompts, or internal models.

When one module depends on another, import the other module's public service interface from `public.ts`, inject it through the constructor, and never import the concrete service, repositories/providers, internals, or composition root.

## `src/server/infrastructure`: configured technical clients

Use focused areas such as `database`, `openai`, `logging`, `config`, `cache`, or `queue`. Infrastructure may construct/configure shared clients, load environment configuration, and provide technical setup. It must not contain product business rules or depend on business modules.

Repository classes receive configured database clients through constructors. Provider classes receive configured SDK clients through constructors. Infrastructure does not construct business services.

## Manual composition root

Assemble backend dependencies in `src/server/composition-root.ts`:

```ts
const openAIProvider: IOpenAIProvider = new OpenAIProvider(openAIClient);

const siteChunkRepository: ISiteChunkRepository = new SiteChunkRepository(prisma);

export const searchIndexService: ISearchIndexService = new SearchIndexService(
  openAIProvider,
  siteChunkRepository,
);

export const assistantService: IAssistantService = new AssistantService(
  openAIProvider,
  searchIndexService,
  logger,
);
```

The composition root may obtain infrastructure clients, instantiate repositories/providers/services, inject dependencies, and export configured service instances for outer adapters. It must contain no business rules.

Only the composition root, composition helpers, and tests normally instantiate services, repositories, or providers. Backend modules must never import the composition root. Route Handlers, Server Components, Server Actions, CLI adapters, jobs, and maintenance entrypoints may import configured services from it and must not construct their dependencies.

If the root becomes too large, split it into `server/composition/<capability>.composition.ts` plus `server/composition/index.ts`. Composition files obey the same rules and are not business modules.

## Runtime dependency flow

```text
Route Handler / Server Component / Server Action / Entrypoint
                              ↓
                    Composition root
                              ↓
                  Configured service instance
                              ↓
                     Service interface
                              ↓
                   Concrete service class
                              ↓
       Repository, provider, and service interfaces
                              ↓
             Concrete repositories and providers
                              ↓
           Database clients and external SDK clients
```

Examples:

```text
app/api/chat/route.ts
        ↓
assistantService.createResponse()
        ↓
searchIndexService.search()
openAIProvider.streamResponse()

server/entrypoints/jobs/run-search-index-worker.ts
        ↓
searchIndexWorkerService.run()
        ↓
searchIndexJobRepository.claimNext()
searchIndexService.indexSource()
```

Controllers and entrypoints select configured services; they never build dependency graphs.

## `src/server/entrypoints`: non-HTTP adapters

Use:

```text
server/entrypoints/
├── cli/
├── jobs/
└── maintenance/
```

Entrypoints may parse arguments/runtime input, load execution-specific configuration, select configured services, call service methods, format terminal output, handle adapter errors, and set exit/job results.

They must not contain persistence, SDK calls, construction of repositories/providers/services, reusable transformations, indexing algorithms, or workflow decisions. Keep reusable logic in modules. Keep only entrypoint-private argument parsing, terminal formatting, and help text beside an entrypoint.

Let package commands execute `src/server/entrypoints/**` directly. Do not require a root `scripts` directory.

## Backend-only capability classification

Put backend-only capabilities such as indexing, ingestion, background processing, email delivery, analytics, webhooks, notification delivery, assistant memory, and scheduled jobs in `server/modules/<capability>`. Keep HTTP, cron, queue, or CLI surfaces as thin adapters.

## Contracts, shared code, and generated code

Keep runtime-validated API request/response, stream, webhook, public action, and other shared trust/runtime-boundary shapes in `src/contracts`. Keep private types with their feature/module. Contracts must not contain business logic or persistence.

Use `shared/components`, `shared/hooks`, `shared/config`, or `shared/utils` only for stable, domain-free frontend-safe code genuinely shared by unrelated features. Do not move code merely because it is used twice. Put backend technical code in infrastructure. Prohibit dumping grounds named `common`, `helpers`, `misc`, `general`, `managers`, or `shared/services`; allow `utils` only for pure domain-free utilities.

Keep `src/generated` generated-only and never edit generated files manually.

## Naming standard

Official React requires capitalized component symbols and Hook names beginning with `use` followed by a capital letter. Official Next.js reserves framework filenames/route syntax but does not prescribe ordinary project filenames. Adopt:

| Item                                      | Convention                                | Examples                                                         |
| ----------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| Project-authored folders                  | kebab-case                                | `search-index/`, `customer-profile/`                             |
| React component files                     | PascalCase matching primary export        | `ChatComposer.tsx`                                               |
| Custom Hook files                         | `useSomething.ts` matching primary export | `useAssistant.ts`                                                |
| Models/state files                        | kebab-case without redundant role suffix  | `models/chat-message.ts`, `state/assistant-conversation.ts`      |
| Architectural role files                  | `<subject>.<role>.ts`                     | `assistant.service.ts`, `site-chunk.repository.ts`               |
| Behavioural interface files               | `<subject>.<role>.interface.ts`           | `assistant.service.interface.ts`, `openai.provider.interface.ts` |
| Components, types, classes, schema values | PascalCase symbols                        | `AssistantService`, `AssistantRequestSchema`                     |
| Behavioural interface symbols             | `I` + PascalCase                          | `IAssistantService`, `IOpenAIProvider`                           |
| Functions, variables, properties          | camelCase                                 | `createAssistantResponse`                                        |
| Genuine immutable constants               | SCREAMING_SNAKE_CASE                      | `MAX_STREAM_BYTES`                                               |

Use kebab-case for multi-word subjects, then append the role with a dot:

```text
search-index.service.ts
search-index.service.interface.ts
site-chunk.repository.ts
search-index-job.repository.interface.ts
assistant-response.mapper.ts
assistant-request.schema.ts
assistant.constants.ts
assistant.contract.ts
```

Do not use `search-index-service.interface.ts`, `user-repository.interface.ts`, camelCase filenames, or operation-specific service/repository filenames.

Only actual Hooks may use the `use` prefix. Follow React's Hook rules and split Hooks by coherent behavior, not line count.

Keep Next.js route syntax and exact special filenames unchanged, including `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`, `default.tsx`, and `proxy.ts`, plus any version-specific official filename.

## Dependency and data-flow rules

```text
app and server/entrypoints
├── contracts
├── features (app rendering only)
└── server composition root

server composition root
├── server infrastructure
├── module concrete classes
└── module interfaces

server modules
├── own interfaces/models
├── other modules through public service interfaces
├── contracts
└── runtime-neutral shared utilities

features
├── contracts
└── shared
```

Prohibit:

```text
features → server
server modules → features
server modules → composition root
module A → module B internals
services → concrete repositories/providers/services
repositories/providers → services
infrastructure → business modules
outer adapters → dependency construction
```

Use these runtime paths:

```text
Server page or Server Component
→ configured service from composition root
→ feature component

Client Component
→ features/<feature>/api
→ app/api/.../route.ts
→ configured service from composition root
```

Pages/Server Components may compose feature UI. Client Components must never import `server`; use feature API adapters and explicit boundaries. Route Handlers call configured services from the composition root. Cross-module backend dependencies use injected public service interfaces.

Keep server-only results in owning modules. Never import/return feature models from server modules. Use contracts for Client Component, API, stream, Server Action, or other runtime/trust boundaries. Server Component-only props do not create contracts. Do not create placeholder contracts/models.

## Client and server boundaries

- Use Server Components by default.
- Add `"use client"` only at the smallest entry module needing state, effects, events, or browser APIs.
- Never let browser graphs include backend modules, secrets, Prisma, provider SDKs, Node-only dependencies, or infrastructure.
- Add `import "server-only"` at appropriate module/infrastructure/composition boundaries.
- Keep credentials and non-public environment values server-only.
- Pass minimal serializable data to Client Components.
- Treat Server Actions as validated/authorized adapters that call configured services.

## Mandatory placement decision

Before creating or moving a file, determine:

1. The owning product/backend capability.
2. Browser, server, or runtime/trust-boundary execution.
3. Its role: framework, UI, state, transport, business capability, persistence, provider, interface, mapping, construction, validation, infrastructure, composition, or entrypoint.
4. Whether the behavior belongs to an existing cohesive service class or genuinely separate service.
5. Whether persistence/provider behavior belongs as a method on an existing subject/provider class.
6. Which meaningful behavioural interfaces it implements or depends on.
7. Which constructor dependencies it needs and where they are composed.
8. Whether its data is server-owned, feature-owned, or a boundary contract.
9. Whether an existing owner already exists.
10. Whether its dot-based name follows this standard.
11. Whether placement creates a forbidden dependency or God service.

| Classification                            | Placement                                           |
| ----------------------------------------- | --------------------------------------------------- |
| Browser UI/Hook/API/state/model           | Matching `features/<feature>` role                  |
| Cohesive backend capability               | `<module>/services/<capability>.service.ts`         |
| Separate backend lifecycle/responsibility | A justified second cohesive service class           |
| Persistence subject/aggregate             | `<module>/repositories/<subject>.repository.ts`     |
| External provider integration             | `<module>/providers/<provider>.provider.ts`         |
| Behavioural class contract                | `<module>/interfaces/<subject>.<role>.interface.ts` |
| Pure conversion/construction              | Module mapper/factory function                      |
| Server business structure/result          | Module `models`                                     |
| Shared runtime/trust boundary             | `contracts`                                         |
| Shared technical client/config            | `server/infrastructure`                             |
| Dependency assembly                       | `server/composition-root.ts` or composition helper  |
| Non-HTTP adapter                          | `server/entrypoints`                                |
| HTTP/framework concern                    | `app`                                               |
| Generic frontend utility                  | `shared` only when domain-free and genuinely shared |

If no outcome fits, stop; do not invent a vague folder.

## Testing guidance

Test services, repositories, and providers through constructor injection. Use small interface-conforming fakes:

```ts
const userRepository: IUserRepository = {
  findById: async () => null,
  findByEmail: async () => null,
  create: async (input) => createTestUser(input),
  update: async () => testUser,
  delete: async () => undefined,
};

const service: IUserService = new UserService(userRepository);
```

Service tests verify public behavior, not private methods, constructor details, file layout, or incidental calls. Repository integration tests may use a test database; provider tests may inject fake SDK clients. Tests must not require the production composition root.

Do not create automated tests that inspect folder/file names, import paths, architectural conventions, formatting, class names, or interface names. Use this skill and the mandatory review checklist as the architectural source of truth.

## Planning and implementation workflow

Before implementation/refactoring:

1. Classify every proposed file by capability, runtime, role, owner, and name.
2. Define cohesive service/repository/provider classes and their meaningful interfaces.
3. List constructor dependencies and composition-root changes.
4. Trace runtime data flow and cross-module public service interfaces.
5. Classify models/contracts and identify explicit boundaries.
6. List intended paths and exceptions requiring approval.

During implementation/refactoring, keep adapters thin, dependency assembly in composition, classes stateless, services cohesive, persistence/providers isolated, interfaces meaningful, pure roles functional, boundaries intact, and old paths removed with their replacements.

## Mandatory architecture validation checklist

Before completing any implementation, review, or refactor, confirm manually:

1. Each backend capability has a clear owning module.
2. Services are cohesive capabilities, not individual operations.
3. Every public service class implements its service interface.
4. Every repository class implements its repository interface.
5. Every provider class implements its provider interface.
6. Interface symbols use the `I` prefix.
7. Interface filenames use dot-based role suffixes.
8. Interfaces live in the owning module's `interfaces` directory.
9. No `ports` directory, `*.port.ts`, or `Port` terminology exists.
10. Services receive dependencies through constructors.
11. Services depend on interfaces, not concrete repositories/providers/services.
12. Repositories receive database clients through constructors.
13. Providers receive SDK clients through constructors.
14. The composition root assembles application dependencies.
15. Backend modules do not import the composition root.
16. Routes, Server Components, Server Actions, and entrypoints do not construct dependencies.
17. Classes store no request-specific mutable state.
18. Mappers, factories, state transitions, and utilities remain functions unless stateful behavior justifies a class.
19. No God service exists.
20. No operation-specific service/repository file exists without an approved, demonstrated reason.
21. One cohesive class owns each external provider by default.
22. One `OpenAIProvider`/`IOpenAIProvider` owns OpenAI operations unless an approved demonstrated reason requires a split.
23. Entrypoints remain thin and delegate reusable work to services.
24. Cross-module dependencies use public service interfaces.
25. No implementation silently violates this skill.
26. Client/server and server/feature import boundaries remain intact.
27. Runtime-boundary data uses contracts; server-only results remain module-owned.
28. Prisma/raw SQL and provider SDK imports remain in their permitted roles.
29. Next.js special files and framework behavior match installed-version documentation.
30. Tests verify behavior rather than architectural file layout.

Report architecture completion using only:

```text
Architecture validation: passed
```

or:

```text
Architecture validation: exception found
Reason: ...
Required decision: ...
```

## Exceptions

- Treat this standard as authoritative; existing inconsistencies do not override it.
- Let verified framework requirements override project naming/placement conventions.
- Never introduce an exception silently; obtain explicit user approval.
- Document temporary exceptions with their reason and objective removal condition.
- Split a service, repository, or provider only for a demonstrated architectural reason.
- Do not use file length or personal preference as sufficient justification for a split/deviation.
- Let repository requirements extend this standard but never weaken it without approval.
