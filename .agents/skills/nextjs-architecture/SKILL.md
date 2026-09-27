---
name: nextjs-architecture
description: Authoritative architectural standard for planning, implementing, reviewing, or refactoring this Next.js application. Use before choosing file locations, dependencies, server/client boundaries, composition, runtime contracts, and entrypoints.
---

# Next.js Architectural Standard

## Authority

Apply this skill to all Next.js implementation, milestone, review, and refactor work.

- Treat Next.js as the application host and framework adapter, not as the internal organisation of product logic.
- Inspect the installed Next.js version and its bundled official documentation before making a framework-specific decision. Official framework requirements override project conventions.
- Use Server Components by default. Add `"use client"` only at the smallest browser-interactive boundary.
- Build a modular monolith. Prefer a cohesive module and direct dependency assembly to generic frameworks, compatibility layers, or a dependency-injection container.
- Create a new file only when it owns a concrete responsibility. Existing code is not evidence that an older placement remains valid.

## Canonical source layout

```text
src/
├── app/
├── modules/
│   └── composition.ts
├── infrastructure/
├── entrypoints/
├── contracts/
├── generated/
└── proxy.ts
```

Create only directories with real code. `src/server` is not a valid production source root and must not be reintroduced.

| Location | Owns | Must not own |
| --- | --- | --- |
| `src/app` | Next routes, pages, layouts, metadata, framework boundaries, thin HTTP/Server Action adapters, and route-owned UI colocated in private folders | dependency construction, persistence, provider SDK work, reusable workflows, or product policy |
| `src/modules` | Capability-owned business behaviour, persistence access, workflows, prompts, and private server types | React UI, HTTP parsing/responses, provider configuration, or framework concerns |
| `src/infrastructure` | Environment access, Prisma, logging, and configured vendor clients/adapters | product policy, feature UI, or module orchestration |
| `src/modules/composition.ts` | Server-only dependency assembly and configured module services | request handling, provider work, or business decisions |
| `src/entrypoints` | Thin jobs, maintenance commands, and their terminal adapters | reusable business logic or dependency construction |
| `src/contracts` | Runtime-validated data crossing an HTTP, stream, action, webhook, or browser/server trust boundary | private module models, persistence, or business logic |
| `src/generated` | Generated code only | hand-authored code |

`src/proxy.ts` owns the version-supported Next proxy boundary. Keep its redirect and matching behaviour externally stable unless a task explicitly changes it.

## Dependency direction

```text
app / entrypoints
        ↓
modules/composition.ts
        ↓
modules + infrastructure

route-owned app UI → contracts + app-owned UI primitives
modules            → contracts + own code
infrastructure     → technical clients and configuration
```

Enforce these restrictions:

- Route-owned browser UI in private `app` folders must not import `modules`, `infrastructure`, Prisma, server-only code, or secrets.
- `infrastructure` must not import `app` or business module implementation.
- Modules other than `modules/composition.ts` must not import `app` or composition.
- Only `app` and `entrypoints` may import `modules/composition.ts`.
- App adapters and entrypoints select configured services; they must not construct repositories, infrastructure clients, or module services.
- A module may use another module only through a deliberately exposed public type or injected dependency, never by reaching into its persistence implementation.

Use focused ESLint import restrictions to prevent these directions from regressing.

## App adapters

Keep `src/app` thin.

- Route Handlers may parse and validate transport input, authenticate and authorize, derive trusted transport information, apply transport rate limits, call configured services, and translate results to HTTP or streams.
- Server Components may import a configured service from composition when direct server access is appropriate. Do not call the app's own HTTP route from a Server Component.
- Server Actions are public adapters: validate and authorize them, then call configured services. They are not a general read layer or a substitute job system.
- Keep request work bounded. Send long-running or retryable work through a durable entrypoint when the product has one.
- Never expose raw database, provider, stack-trace, or secret-bearing errors to clients.

## Route-owned UI

Colocate browser-facing product concerns in a private folder under the narrowest owning `app` segment. A private app area may contain `components`, `hooks`, `api`, `state`, and `types` where each is needed; do not create empty role folders. Use a top-level private app folder for UI mounted by the root layout or shared by the root route.

Client code communicates with app routes or actions through a small colocated browser API adapter. Pass only serializable data to Client Components. Browser state belongs as locally as practical and must not import a server model merely for convenience.

## Modules

A module owns a cohesive capability, not a mechanical layer. Use the smallest clear file structure. Prefer direct names such as:

```text
modules/portfolio/
  services/
    read.service.ts
    administration.service.ts
    media.service.ts
  cache-tags.ts
  repository.ts
  types.ts
```

Use separate files only for distinct responsibilities or independently meaningful integrations. A nested `services` directory is appropriate when a module owns several distinct services; do not create it for a single service. Avoid ceremonial `repositories`, `providers`, `interfaces`, `models`, or `public.ts` directories and barrels when they add no boundary.

- A service owns use cases and policy for its capability.
- A repository owns database operations for a coherent persistence subject.
- A vendor-specific adapter belongs in infrastructure unless its behaviour is truly capability policy.
- Prompts live with the module owning the AI behaviour.
- Module types remain private unless another module or adapter needs an intentional public boundary.
- Interfaces are optional. Use one for a meaningful replaceable boundary, injected dependency, or a useful route test seam; do not pair every class with an interface by default.
- Constructor injection is the standard for stateful dependencies. Compose concrete dependencies in `modules/composition.ts`.
- Do not store request-specific mutable state or use module-level memory for correctness.

Suggested responsibility boundaries for the current application are: administration auth, assistant, audit, meeting, portfolio, rate limit, search index, and workflow. Do not create generic policy registries or cross-capability abstraction layers without a demonstrated need.

### Composition

`src/modules/composition.ts` is the single production composition root. It is server-only, obtains configured infrastructure dependencies, constructs concrete repositories/adapters/services, injects dependencies, and exports configured services for app adapters and entrypoints.

It contains no business rules, request parsing, database queries, provider calls, or workflow decisions. Tests construct a focused module directly with small fakes rather than importing production composition.

## Infrastructure

Place technical concerns in focused areas, for example:

```text
infrastructure/config/env.ts
infrastructure/database/prisma.ts
infrastructure/logging/logger.ts
infrastructure/openai/client.ts
infrastructure/supabase/clients.ts
infrastructure/google-calendar/client.ts
```

Infrastructure configures technical clients, accesses central environment configuration, and performs vendor-specific operations. It must not decide product policy or construct module services. Keep secrets server-only and use `NEXT_PUBLIC_` only for intentionally public values. Separate privileged client construction and keep it lazy where its credentials are optional.

## Entrypoints

`src/entrypoints` contains non-HTTP process adapters such as jobs and maintenance tasks. It may parse execution input, call a configured service from composition, render terminal output, and set process results. Reusable algorithms, persistence, provider calls, and dependency construction belong elsewhere. Package scripts may execute entrypoints directly.

## Contracts, types, and validation

Use `src/contracts` only for runtime-validated data that crosses a trust or runtime boundary. Infer TypeScript types from a runtime schema when that schema is the source of truth. Do not cast parsed JSON directly to trusted application types.

Keep private server types in their owning module and frontend presentation types in their owning private app area. Do not create a schema for trusted server-only data. Generated Prisma types remain generated and are not automatically domain or public API models.

## Naming

- Use kebab-case for authored directories and ordinary TypeScript files.
- Use PascalCase for React component filenames and primary component symbols.
- Name custom Hooks `useSomething`.
- Keep Next special filenames and route syntax exactly as required by the installed Next version.
- Prefer direct responsibility names: `service.ts`, `repository.ts`, `search.ts`, `config.ts`, `types.ts`, `prompt.ts`, and `client.ts` within an owning module/area.
- Avoid vague dumping grounds such as `common`, `helpers`, `misc`, `general`, and `manager`. Use `utils` only for pure, domain-free utilities.

## Testing and review

Test public behaviour and important boundaries. Use small fakes through public constructor or route seams; do not test private helpers, file layout, or framework-generated behaviour. Use real integration tests when correctness depends on database transaction, constraint, or concurrency behaviour.

Before completion, verify:

1. Every file has a clear owner and runtime boundary.
2. `src/server`, `src/features`, and all old import paths are gone without compatibility wrappers.
3. App adapters and entrypoints are thin; composition is the only production construction point.
4. App-owned UI, modules, infrastructure, and contracts follow the dependency direction above.
5. Client graphs contain no server-only dependencies or secrets.
6. Raw provider/database errors and secrets are not exposed or logged.
7. Tests protect observable behaviour rather than architecture trivia.
8. The installed Next.js documentation was consulted for framework-specific choices.

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
