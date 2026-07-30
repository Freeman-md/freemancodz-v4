---
name: nextjs-architecture
description: Authoritative architectural standard for planning, implementing, reviewing, or refactoring any Next.js application code. Use before choosing file locations, names, dependencies, runtime boundaries, Route Handlers, Server Actions, frontend features, backend modules, repositories, providers, contracts, infrastructure, workers, or shared code, and use again before declaring Next.js work complete.
---

# Next.js Architectural Standard

## Authority and required posture

Apply this skill as the default authority for all Next.js implementation, milestone, review, and refactor work.

- Build a modular monolith with a feature-based frontend and a layered backend.
- Treat Next.js as the application host, routing framework, rendering framework, and HTTP adapter. Do not let it determine the internal organization of backend business logic.
- Design from the owning capability and runtime responsibility. Do not infer the standard from an existing repository layout.
- Before a framework-specific decision, inspect the installed Next.js version and read the version-matched official documentation bundled with the installed package when available. Use current official Next.js documentation only as a fallback or supplement.
- Treat official framework behavior as authoritative. Treat all organization beyond framework requirements as the project convention defined here.
- Use official React rules for component and Hook semantics.

## Required source layout

```text
src/
├── app/
├── features/
├── server/
│   ├── modules/
│   ├── infrastructure/
│   └── entrypoints/
├── contracts/
├── shared/
└── generated/
```

Create only folders that own real code. Never generate empty role folders mechanically.

| Location | Owns | Must not own |
|---|---|---|
| `src/app` | Next.js routes, pages, layouts, route groups, metadata, loading/error boundaries, Route Handlers, appropriate Server Actions, and framework files | Persistence, provider orchestration, reusable business rules, substantial transformation, or application workflows |
| `src/features` | Browser-facing product features | Backend business logic, Prisma, server infrastructure, secrets, or provider SDKs |
| `src/server/modules` | Backend business capabilities | React UI, HTTP parsing/responses, or generic technical configuration |
| `src/server/infrastructure` | Reusable server-side technical configuration and shared clients | Product-specific business policy |
| `src/server/entrypoints` | Thin non-HTTP adapters | Reusable business logic |
| `src/contracts` | Runtime-validated data crossing trust or runtime boundaries | Business logic, persistence, or private feature/module types |
| `src/shared` | Stable, domain-free code genuinely shared across unrelated frontend features | Feature logic or backend infrastructure |
| `src/generated` | Generated code only | Hand-authored or manually edited code |

## `src/app`: framework and HTTP adapters

Keep `src/app` thin. It owns pages, layouts, route groups, loading and error boundaries, metadata, Route Handlers, appropriate Server Actions, and other Next.js framework files.

Treat Route Handlers as public HTTP controllers. They may:

- parse requests;
- validate transport input;
- authenticate and authorize;
- apply transport-level rate limiting;
- call the appropriate backend module service;
- convert service results into HTTP or streaming responses.

Route Handlers and Server Actions must not contain raw Prisma queries, provider orchestration, reusable business rules, substantial data transformation, or application workflow logic. Authenticate, authorize, and validate Server Action input as if the action were a public endpoint.

Keep HTTP entrypoints in `src/app/api`. A Server Component may call a backend module's supported service directly when no HTTP boundary is needed. Never make a Server Component call the application's own Route Handler when it can call the backend operation directly.

Use Server Actions for UI-triggered mutations, not as a general read layer or background-job mechanism. Keep request-time work bounded; route long-running or retryable operations through a durable backend entrypoint.

## `src/features`: browser-facing product features

Use this shape only as responsibilities arise:

```text
features/<feature>/
├── components/
├── hooks/
├── api/
├── state/
├── models/
└── <feature>.constants.ts
```

| Role | Responsibility |
|---|---|
| `components` | Render and compose the feature UI |
| `hooks` | Coordinate React state, effects, and browser behavior |
| `api` | Perform browser-side HTTP or streaming communication |
| `state` | Define pure frontend state transitions or stores |
| `models` | Describe browser and presentation data |
| `<feature>.constants.ts` | Define frontend constants owned by the feature |

Frontend features must not import backend modules, Prisma, server-only infrastructure, secrets, Node-only dependencies, or provider SDKs.

A capability may have both `src/features/<capability>` and `src/server/modules/<capability>`. These represent different runtimes and responsibilities. Never merge them into one mixed frontend/backend folder.

## `src/server/modules`: backend business capabilities

Represent every backend capability as a module:

```text
server/modules/<module>/
├── services/
├── repositories/
├── providers/
├── mappers/
├── factories/
├── models/
├── schemas/
├── prompts/
├── <module>.constants.ts
└── public.ts
```

### Role rules

| Role | Must do | Must not do |
|---|---|---|
| Services | Implement clear use cases, business rules, workflows, fallbacks, retry decisions, validation decisions, outcomes, and repository/provider coordination | Parse HTTP, return framework responses, execute SQL, construct infrastructure clients, or contain React logic |
| Repositories | Read/write persistent application data and map queries to persistence results | Call external providers, handle HTTP, choose application fallbacks, orchestrate complete workflows, or expose Prisma structures as frontend contracts |
| Providers | Isolate how the capability uses external services such as OpenAI, embeddings, email, object storage, payments, or analytics | Leak provider events, errors, or response shapes into services without intentional mapping |
| Mappers | Perform pure representation conversion, such as persistence record to backend model, backend model to contract, provider event to internal event, or source record to search document | Perform I/O, retrieve data, or make business decisions |
| Factories | Deterministically construct non-trivial objects or aggregates and centralize duplicated construction rules | Perform I/O or wrap simple object literals |
| Models | Define backend data structures owned by the module using types, interfaces, or classes as appropriate | Automatically equate generated database types with business models or public contracts |
| Schemas | Validate untrusted or external runtime data | Duplicate trusted internal TypeScript types without a runtime boundary |
| Prompts | Define version-controlled, purpose-named AI behavior owned by the module | Construct provider clients or live in transport controllers |
| Constants | Define backend constants owned by the module | Collect unrelated or duplicated values |
| `public.ts` | Export the module's deliberate cross-module API | Re-export repositories, providers, or private implementation details without an explicit supported reason |

### Service rules

Name each service after one use case. Keep boundary implementations replaceable: express needed repository/provider behavior through module-owned functions or types, and compose concrete implementations without moving business decisions out of services.

### Repository rules

Except for Prisma client construction in `server/infrastructure/database`, only module repositories may import Prisma or Prisma-specific types. Only repositories may execute Prisma queries, raw SQL, or other persistent application data operations. Do not create generic base repositories.

### Provider rules

Let infrastructure create and configure shared clients. Let module providers define capability-specific use of those clients. Map provider-specific failures and results into intentional internal models before services depend on them.

### Model distinctions

Keep these representations deliberate and separate when their responsibilities differ:

| Representation | Owner |
|---|---|
| Generated database model/type | `src/generated` |
| Persistence record/query result | Module repository boundary |
| Backend business model | Module `models` |
| Frontend/presentation model | Feature `models` |
| Boundary contract | `src/contracts` |

Generated Prisma types must not automatically become business models or public contracts.

### Schema boundaries

Use runtime schemas for HTTP input, client/server streams, webhook payloads, provider responses, environment configuration, and persisted unstructured data. Keep a schema in `src/contracts` when it defines a shared runtime boundary; keep it in a module's `schemas` when only that backend module owns and consumes the boundary.

### Prompt ownership

Store each AI prompt in the backend module that owns the AI behavior. Give it a purpose-specific name, version-control it, and treat prompt changes as application behavior changes.

### Constants ownership

Place constants with the code that owns their meaning:

- frontend display values → frontend feature;
- backend fallback messages → owning backend module;
- retrieval thresholds → service or module owning retrieval policy;
- transport limits shared by client and server → contract;
- environment values → infrastructure configuration.

Prohibit generic constants dumping grounds, duplicated constants, and grouping unrelated values merely because they are constants.

### Module API boundary

Every backend module must provide `public.ts`. Another module may import only from that file. It must not reach into the other module's repositories, providers, mappers, internal models, schemas, or private services.

## Backend-only capability classification

A capability does not become a frontend feature merely because it exists in a Next.js repository. Put backend-only capabilities such as search indexing, document ingestion, background processing, email delivery, analytics processing, webhook handling, notification delivery, assistant memory, and scheduled jobs in:

```text
src/server/modules/<capability>
```

Keep their HTTP, cron, queue, or script entrypoints as thin adapters.

## `src/server/infrastructure`: shared server technology

Use focused technical areas such as:

```text
server/infrastructure/
├── database/
├── openai/
├── logging/
├── config/
├── cache/
└── queue/
```

Infrastructure may construct Prisma and provider clients, load environment configuration, configure logging, and provide queue, cache, or other technical adapters shared by multiple modules. It must not contain product-specific business rules or act as a general backend dumping ground.

Infrastructure may depend on generated code and external packages. It must not depend on business modules.

## `src/server/entrypoints`: non-HTTP adapters

Use entrypoints for queue consumers, scheduled workers, command-line adapters, background process startup, and cron adapters. Validate input, establish entrypoint concerns, and call a module service. Keep all reusable business logic in `server/modules`.

## `src/contracts`: runtime boundaries

Store runtime-validated API request/response contracts, streaming event contracts, shared client/server validation, webhook contracts, and public action inputs here. Contracts must not contain business logic or database access. Keep a type inside its feature or module when it is not actually shared across a trust or runtime boundary.

## `src/shared`: genuinely generic frontend code

Use `shared/components`, `shared/hooks`, `shared/config`, or `shared/utils` only for code that is domain-free, safe for its intended runtime, stable, and genuinely shared across unrelated frontend features.

- Do not move code to `shared` merely because it is used twice.
- Keep feature-specific code in its feature.
- Put backend-specific technical code in `server/infrastructure`.
- Allow `utils` only for pure, generic, domain-free utilities.
- Prohibit dumping grounds named `common`, `helpers`, `misc`, `general`, `managers`, or `shared/services`.

## Naming standard

Official React requires capitalized component symbols and Hook names beginning with `use` followed by a capital letter. Official Next.js reserves exact framework filenames and route syntax but does not prescribe casing for ordinary project files. Therefore adopt the conventions below as the single project standard; framework-required names override them.

| Item | Convention | Examples |
|---|---|---|
| Project-authored folders | kebab-case | `search-index/`, `conversation-history/`, `customer-profile/` |
| React component files | PascalCase matching the primary export | `ChatComposer.tsx`, `PortfolioCard.tsx` |
| Custom Hook files | `useSomething.ts` matching the primary export | `useAssistant.ts`, `useFloatingPanel.ts` |
| All other authored source files | kebab-case | `assistant-context.ts`, `stream-assistant-response.ts` |
| Components, types, interfaces, classes, schema values | PascalCase symbols | `ChatComposer`, `AssistantRequestSchema` |
| Functions, variables, object properties | camelCase | `createAssistantResponse` |
| Genuine immutable constants | SCREAMING_SNAKE_CASE | `MAX_STREAM_BYTES` |

Keep Next.js route syntax unchanged: `[slug]/`, `[...pathname]/`, `[[...pathname]]/`, `(marketing)/`, `_private/`, `@slot/`, and intercepting route syntax.

Only actual Hooks may use the `use` prefix. A function that does not call Hooks and is not itself a Hook must not use it. Call Hooks only at the top level of React components or other Hooks. Give each Hook one coherent React behavior; split only for separate reasons to change, never for an arbitrary line limit.

Use exact Next.js framework filenames, including:

```text
page.tsx
layout.tsx
route.ts
loading.tsx
error.tsx
not-found.tsx
template.tsx
default.tsx
proxy.ts
```

Also preserve any other exact special filename required by the installed Next.js version. Place `proxy.ts` where that version's official documentation requires.

### Architectural role suffixes

Use a clear dot suffix when a file belongs to an architectural role:

```text
create-assistant-response.service.ts
site-chunk.repository.ts
openai-response.provider.ts
assistant-source.mapper.ts
chat-message.factory.ts
assistant-request.schema.ts
assistant.constants.ts
assistant.contract.ts
assistant.test.ts
```

Do not add a redundant suffix when the folder already communicates the role:

```text
models/chat-message.ts
models/assistant-context.ts
state/assistant-conversation.ts
```

Do not use `chat-message.model.ts` inside `models` or `assistant-conversation.state.ts` inside `state`. Do not use camelCase filenames such as `chatMessage.ts`.

Use descriptive verbs for operations and descriptive nouns for data structures.

## Dependency direction

```text
app
├── features
├── contracts
└── server/modules

features
├── contracts
└── shared

server/modules
├── contracts
├── other modules through public.ts
├── server/infrastructure
└── runtime-neutral shared utilities

server/infrastructure
├── generated
└── external packages
```

Prohibit:

```text
features → server
server → features
shared → features
shared → server
module A → module B internal files
repositories → services
providers → services
infrastructure → business modules
```

Make dependencies point toward stable business abstractions. Keep controllers, repositories, and providers as replaceable boundary implementations. Prevent circular dependencies rather than hiding them behind a global abstraction.

## Data flow and model ownership

Use these standard paths:

```text
Server page or Server Component
→ server/modules/<module>/public.ts
→ feature component

Client Component
→ features/<feature>/api
→ app/api/.../route.ts
→ server/modules/<module>/public.ts
```

- Server pages and Server Components may import backend services through the owning module's `public.ts`.
- Pages and Server Components may import UI components from `features/<feature>/components`.
- Client Components must never import from `server/`; browser requests and streams must use a feature-owned `api` adapter.
- Route Handlers must call backend services through the owning module's `public.ts`, never through module internals.
- Shared request, response, stream, Server Action, and other runtime-boundary shapes belong in `src/contracts`.

The arrows describe data flow and allowed imports; they do not transfer model ownership:

- A server module must never import or return a model owned by `features/`.
- Keep server-only results in the owning server module's models or service-owned types.
- Use a runtime-validated contract in `src/contracts` when data crosses into a Client Component, API consumer, stream, Server Action, or another runtime or trust boundary.
- Use feature models only for browser-owned state, derived presentation data, and UI-only concepts.
- Passing props between Server Components does not by itself create a client or runtime boundary. Do not create a contract for server-only composition solely because props are involved.
- Do not create contracts or feature models as architectural placeholders. Create them only when the data has the ownership or boundary described above.

## Client and server boundaries

- Use Server Components by default.
- Add `"use client"` only to the smallest entry module that needs state, effects, event handlers, or browser APIs. Remember that its imports join the client module graph.
- Never let browser modules import backend modules, secrets, Prisma, database clients, provider SDKs, Node-only dependencies, or server infrastructure.
- Add `import "server-only"` at appropriate backend module and infrastructure boundaries to prevent accidental client imports.
- Keep all credentials and non-public environment values server-only.
- Pass minimal, deliberate, serializable data from Server Components to Client Components.
- Let Server Components call backend services directly when no HTTP boundary is required.
- Let browser interactions cross through Route Handlers, Server Actions, or another explicit boundary.
- Treat Server Actions as transport adapters: validate and authorize, then call module services.

## Mandatory placement decision tree

Apply these questions in order before creating or moving a file:

1. What product or backend capability owns this behavior?
2. Does it run in the browser, on the server, or across a boundary?
3. Is it framework routing, UI, state, transport, business logic, persistence, provider integration, transformation, construction, validation, or infrastructure?
4. Which module owns the underlying business meaning?
5. Does its data remain server-only, pass only between Server Components, or cross into a Client Component, API consumer, stream, Server Action, or another runtime/trust boundary?
6. Does each model remain with its server module, feature, or boundary contract owner without a server module importing or returning a feature model?
7. Does the caller use the required path: Server Component → module `public.ts`, or Client Component → feature `api` → Route Handler → module `public.ts`?
8. What dependencies does it require?
9. Does an existing module already own the responsibility?
10. Is the proposed name compliant with the naming standard?
11. Would the placement create a forbidden dependency?

Choose the deterministic outcome:

| Classification | Placement |
|---|---|
| Browser UI, Hook, API adapter, model, or state | `features/<feature>` in its matching role |
| Backend use case or workflow | `server/modules/<module>/services` |
| Database operation | `server/modules/<module>/repositories` |
| External API operation | `server/modules/<module>/providers` |
| Pure representation conversion | `server/modules/<module>/mappers` |
| Non-trivial object construction | `server/modules/<module>/factories` |
| Module business structure | `server/modules/<module>/models` |
| Shared boundary validation | `contracts` |
| Module-private external/untrusted validation | module `schemas` |
| Server-only service result | Owning server module model or service-owned type |
| Browser-owned state, derived presentation data, or UI-only concept | Feature `models` |
| Data crossing into a Client Component, API consumer, stream, Server Action, or other runtime/trust boundary | Runtime-validated `contracts` |
| Props passed only between Server Components | Keep the server-owned shape; no contract solely for prop passing |
| Browser request or stream operation | Feature `api`, then Route Handler, then module `public.ts` |
| Server page or Server Component backend call | Owning module `public.ts` |
| Shared backend technical setup | `server/infrastructure` |
| Non-HTTP worker/CLI/cron adapter | `server/entrypoints` |
| Generic frontend utility | `shared`, only when domain-free and genuinely shared |
| HTTP controller or framework concern | `app` |

If no outcome fits, stop. Do not invent a vague folder.

## Planning, implementation, review, and refactor validation

Apply this workflow when planning, implementing, reviewing, or refactoring Next.js code. A review must verify the same rules from the resulting code and imports rather than relying on the implementation plan.

### Before implementation or refactoring

Before writing or moving code:

1. Identify the owning capability.
2. Classify every proposed file by runtime and architectural role.
3. List intended file locations.
4. Check dependency direction.
5. Check every file and folder name.
6. Identify existing `public.ts` APIs to use.
7. Trace each server and client data flow through the required import path.
8. Classify each proposed model as server-owned, feature-owned, or a runtime-boundary contract; do not create placeholder models or contracts.
9. Verify that no server module will import or return a feature model.
10. Identify rules that can be enforced mechanically through ESLint, TypeScript, tests, or repository checks.

### During implementation or refactoring

Ensure controllers remain thin; services own business decisions; repositories own persistence; providers own SDK interactions; mappers and factories remain pure; client/server imports do not cross; Server Components and Route Handlers call modules through `public.ts`; Client Components use feature `api` adapters; server modules neither import nor return feature models; runtime-boundary data uses contracts; server-only props do not gain placeholder contracts; cross-module imports use `public.ts`; constants, schemas, and models are not duplicated; and no vague shared or utility folders appear.

### After implementation, refactoring, or review

Validate:

1. Every new file has one clear owner.
2. Every new file has one clear architectural role.
3. Every file and folder name follows this standard.
4. Client/server boundaries remain intact.
5. Prisma imports exist only in database infrastructure construction and module repositories.
6. Provider SDK imports exist only in infrastructure client construction or module providers.
7. Route Handlers, Server Actions, and entrypoints contain no reusable business logic.
8. Cross-module imports use `public.ts`.
9. Shared code is genuinely generic.
10. Tests verify behavior rather than internal layout.
11. Lint or architecture checks are updated when a rule can be automated.
12. No unexplained exception exists.
13. Server pages and Server Components call backend services only through module `public.ts` and may compose feature components without importing module internals.
14. Client Components reach backend behavior only through feature-owned browser API adapters and explicit framework boundaries.
15. Route Handlers call backend services only through module `public.ts`.
16. Server modules do not import or return feature-owned models.
17. Server-only results remain server-owned; runtime-boundary data uses contracts; feature models contain only browser-owned or UI-only concepts.
18. No contract or feature model exists merely as an architectural placeholder.

Report architecture completion using only one of:

```text
Architecture validation: passed
```

```text
Architecture validation: exception found
Reason: ...
Required decision: ...
```

Do not repeat this standard in routine completion reports.

## Exceptions

- Treat this standard as authoritative by default. Existing repository inconsistencies do not override it.
- Let a verified framework requirement override a project naming or placement rule.
- Never introduce an architectural exception silently.
- Obtain explicit user approval before creating any intentional exception.
- Document a temporary exception with its reason and objective removal condition.
- Allow repository-specific requirements to extend this standard, but never weaken it without explicit approval.
