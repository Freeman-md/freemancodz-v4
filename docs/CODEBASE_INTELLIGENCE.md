# Codebase Intelligence Report — Freemancodz V4

**Descriptive baseline, not an approved architectural specification.** Task 01's read-only report was independently reviewed before persistence under Task 02. This document does not approve architectural changes or authorise remediation.

## 1. Executive summary

Freemancodz V4 is Freeman Madudili's public engineering portfolio and services website. It presents projects, case studies, experience, and services; provides a portfolio-grounded conversational assistant; and lets visitors prepare and explicitly confirm meeting bookings.

The implementation is a Next.js modular monolith. Public portfolio pages read published PostgreSQL data during static generation. Interactive assistant and booking requests use server-side services assembled in one composition root. PostgreSQL stores workflow drafts, immutable reviews, execution runs, step claims, booking records, and rate-limit counters. OpenAI, Google Calendar, and Resend provide external capabilities.

The strongest existing engineering work is around booking reliability: browser ownership, revision checks, explicit confirmation, durable execution, claim fencing, retries, and uncertain-outcome reconciliation. The principal setup gap is trustworthy enforcement and operational evidence. Tests and lint rules exist, but the default test command can omit database verification, architecture restrictions cover only part of the documented contract, and no canonical verification command or tracked CI workflow was found.

**Assessment scope:** read-only source assessment on 2026-11-13 (Europe/London), against commit `f6ea50c13fbf245d4f0403c697c98f27cbd4f3f5`, branch `main`, plus the existing working-tree change in `src/app/api/chat/constants.ts`. No files were changed by the Task 01 execution agent. No application tests, build, database writes, provider requests, or secret-file reads were performed. Task 02 only persists this report.

“Implemented” below means a source path exists and was inspected; it does **not** mean current runtime behavior was verified. File references are repository-relative; line references describe the inspected snapshot.

## 2. Feature matrix

| Feature                                                      | Source status                                                                         | Frontend ownership                                                                                         | Backend/data ownership                                                                                                   | Verification limitation                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Homepage, experience, services, selected work                | Implemented                                                                           | `src/app/page.tsx:18`, `src/app/_portfolio/components/`                                                    | `PublicPortfolioService` in `src/modules/portfolio/services/public-portfolio.service.ts`; published portfolio repository | Not rendered or built in this assessment                                       |
| Work catalogue and filters                                   | Implemented                                                                           | `src/app/work/page.tsx:15`, `src/app/work/_components/ProjectFilters.tsx`                                  | `PublicPortfolioService.listProjects`                                                                                    | Browser behavior unexecuted                                                    |
| Project case studies, media, metadata                        | Implemented                                                                           | `src/app/work/[slug]/page.tsx:18`, `src/app/work/[slug]/_components/ProjectMedia.tsx`                      | Published project, case-study, and service relations                                                                     | Missing slugs deliberately return 404; deployment content unverified           |
| Portfolio assistant, streamed replies, options and citations | Implemented                                                                           | `src/app/_assistant/hooks/useAssistant.ts:46`, `src/app/_assistant/api/`, `src/app/_assistant/components/` | `src/app/api/chat/route.ts`, `src/modules/assistant/service.ts`, OpenAI transport                                        | HTTP/provider tests exist; not run here                                        |
| Semantic portfolio search                                    | Implemented                                                                           | Assistant citations and source navigation                                                                  | `src/modules/portfolio/services/portfolio-search.service.ts`, pgvector repository, OpenAI embeddings                     | Index freshness, retrieval quality and live results unverified                 |
| Meeting draft, review, explicit approval and discard         | Implemented                                                                           | Assistant workflow confirmation/progress UI                                                                | `src/modules/workflow/service.ts`, workflow repository, meeting definition, approval/discard routes                      | Database and browser coverage exists; not executed                             |
| Booking, notification, retry and reconciliation              | Implemented; scheduling is an operational prerequisite                                | Saved status and polling                                                                                   | `src/modules/workflow/runner.ts`, persisted steps, Calendar, Meeting repository, Resend                                  | Hosted scheduler activation and current provider behavior unverified           |
| Homepage contact link                                        | Implemented                                                                           | `src/app/_portfolio/components/Contact.tsx:38` uses a mail link                                            | No application backend involved                                                                                          | Mail-client behavior untested                                                  |
| Case-study “Request …” CTA                                   | Deliberately disabled in source; incomplete user path                                 | `src/app/_portfolio/components/Contact.tsx:31`, called from `src/app/work/[slug]/page.tsx:169`             | No action attached                                                                                                       | Product intent for disabling it is unknown                                     |
| Standalone contact-request service                           | Backend implementation present; not exposed through inspected production entry points | No current public form/route found                                                                         | `src/modules/contact/service.ts:7`, repository, notification service                                                     | `contactService` is constructed/exported but has no production caller in `src` |
| Administration/authentication UI                             | Absent from current public application                                                | `src/proxy.ts:25` returns 404 for `/admin` and `/auth`                                                     | Content publication uses maintenance commands                                                                            | Do not infer a missing admin feature from historical migrations                |
| Future workflow definitions                                  | Extensibility exists; not a shipped feature                                           | Generic assistant workflow UI                                                                              | Registry currently installs only Meeting in `src/modules/composition.ts:103`                                             | Test-only Request Services definition is not production functionality          |

## 3. Architecture map

```text
Published JSON seed inputs
  → maintenance seed command
  → portfolio seed service/repository
  → PostgreSQL published portfolio
      → Next Server Components → built public pages
      → index command → OpenAI embeddings → pgvector search documents

Browser assistant UI
  → colocated browser API adapters
  → Next Route Handlers
  → modules/composition.ts
      → AssistantService → OpenAI + portfolio search
      → WorkflowService → drafts/reviews/runs in PostgreSQL
      → WorkflowRunner → Meeting actions → Calendar / booking DB / Resend

Scheduled authenticated HTTP request
  → /api/internal/workflow-runner
  → same WorkflowRunner → recover due persisted work
```

### Stack and ownership

- **Runtime/framework:** installed Node `v22.17.0`; installed Next.js `16.2.12`. `package.json` declares Next `^16.2.10`, React `^19.2.7`, TypeScript `^6.0.3`.
- **UI:** App Router, React Server/Client Components, Tailwind CSS 3, authored CSS, Base UI, Framer Motion, Lucide.
- **Persistence:** Prisma 7 through `@prisma/adapter-pg`, PostgreSQL and pgvector.
- **Contracts:** Zod schemas with inferred types under `src/contracts`.
- **Providers:** OpenAI SDK; Google Calendar through `googleapis`; custom Resend HTTP client.
- **Hosting intent:** Vercel; Supabase PostgreSQL and optional Cron/Vault/`pg_net` scheduling are documented.

| Area                                              | Observed responsibility                                                          |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/app`                                         | Pages, route adapters, route-owned UI, browser API adapters                      |
| `src/modules/composition.ts`                      | Concrete dependency assembly and configured service exports                      |
| `src/modules/assistant`                           | Model conversation and tool dispatch                                             |
| `src/modules/portfolio`                           | Published reads, seed validation/application, semantic index/search              |
| `src/modules/workflow`                            | Draft/review lifecycle, durable execution and registered workflow definitions    |
| `src/modules/meeting`                             | Availability, booking validation/persistence and owner-notice policy             |
| `src/modules/rate-limit`                          | HMAC identifiers and transactional counter consumption                           |
| `src/modules/contact`, `src/modules/notification` | Standalone contact persistence and notification behavior                         |
| `src/infrastructure`                              | Environment access, Prisma, provider clients and logging                         |
| `src/entrypoints/maintenance`                     | Seed, index and production migration command adapters                            |
| `prisma/migrations`                               | Committed database evolution; includes SQL constraints/security beyond ORM types |

`src/modules/composition.ts:42` assembles providers lazily through configuration getters, then services and repositories. The Prisma singleton is lazy (`src/infrastructure/database/prisma.ts:23`), allowing deterministic code to be imported without immediately opening a database connection.

Relevant persisted entities are visible in `prisma/schema.prisma:10`: Meeting, WorkflowInstance, WorkflowReview, WorkflowRun, WorkflowStep, ContactRequest, RateLimit, published portfolio entities, and PortfolioSearchDocument.

## 4. Execution flows

### Public portfolio and publishing

1. `src/app/page.tsx:19` calls the configured portfolio service directly from a Server Component.
2. `PublicPortfolioService.getHomepage` reads profile/projects/experience/services, applies deterministic ordering, and rejects incomplete required content (`src/modules/portfolio/services/public-portfolio.service.ts:22`).
3. `/work` lists projects; `/work/[slug]` generates known static parameters and disables unlisted parameters (`src/app/work/[slug]/page.tsx:18`).
4. Page components render database-derived content. Testimonials, social links, and some presentation copy remain authored UI content.
5. Maintenance seed inputs live in `prisma/seed-data/`. The seed command validates arguments, verifies the configured target, loads the five inputs, previews/applies changes, and disconnects (`src/entrypoints/maintenance/seed-portfolio.ts:9`).
6. Published content changes require the documented rebuild/index workflow. Database writes do not automatically establish that deployed static pages and search records match.

### Assistant and grounded search

1. `FloatingPortfolioChat` owns the surface; `useAssistant` owns transient messages, current workflow, submission state, and previous OpenAI response ID (`src/app/_assistant/components/FloatingPortfolioChat.tsx:14`, `src/app/_assistant/hooks/useAssistant.ts:46`).
2. `streamAssistant` posts to `/api/chat`; it retries once on HTTP 428 to establish the browser session (`src/app/_assistant/api/stream-assistant-response.ts:11`).
3. The route validates body size/JSON/schema and creates a secure browser session when needed (`src/app/api/chat/helpers.ts:20`, `:80`).
4. Rate limiting consumes PostgreSQL counters through a hashed identifier. Failure is closed with HTTP 503; exhausted limits return HTTP 429 (`src/app/api/chat/helpers.ts:112`).
5. `AssistantService` retrieves the current server-owned workflow snapshot, exposes applicable tools, and streams model output (`src/modules/assistant/service.ts:159`).
6. Tool calls are dispatched explicitly. Search embeds the query and performs pgvector similarity lookup; results become citations to approved portfolio destinations (`src/modules/assistant/tools/execute.ts:59`, `src/modules/portfolio/services/portfolio-search.service.ts:37`).
7. Browser stream decoding validates every event with Zod and rejects malformed/interrupted streams (`src/app/_assistant/api/stream-assistant-response.ts:3`, `:38`).

Conversation messages are browser component state. Workflow state is persisted. OpenAI continuation uses `previous_response_id` and provider-side storage (`src/infrastructure/openai/client.ts:28`); retention and privacy policy were not established by this assessment.

### Meeting confirmation and durable execution

1. The composition root registers `MeetingBookingWorkflowDefinition` only (`src/modules/composition.ts:103`).
2. Definition-owned tools collect and validate details; repository writes compare the observed revision and invalidate pending reviews after edits (`src/modules/workflow/repository.ts:49`).
3. A ready proposal becomes a persisted review. The UI sends the review ID and expected revision to the approval route.
4. The route verifies same origin and browser ownership before accepting the review (`src/app/api/workflow/approve/post.ts:23`).
5. Approval validates the definition/version/payload and creates the persisted run through the repository (`src/modules/workflow/service.ts:198`).
6. The approval route invokes a bounded execution pass; its configured maximum duration is 30 seconds (`src/app/api/workflow/approve/route.ts:4`).
7. `WorkflowRunner.runDue` uses a 20-second signal and four-step batch (`src/modules/workflow/runner.ts:20`). Claims use PostgreSQL row locking with `SKIP LOCKED`, lease expiry, claim tokens and fenced writes (`src/modules/workflow/run-repository.ts:15`).
8. Meeting actions reserve the slot, create/reconcile a stable Calendar event, persist the booking, and send a separately recoverable owner notification (`src/modules/workflow/definitions/meeting-booking/actions.ts`, `createMeetingBookingAction`). Notification failure does not erase an already confirmed appointment.
9. Scheduled POSTs to the authenticated internal runner recover due work. The repository documents installation instructions, but live scheduler activation was not verified.
10. The browser polls saved workflow status while pending (`src/app/_assistant/components/FloatingPortfolioChat.tsx:43`); approval and discard remain explicit revision-checked requests.

## 5. Engineering conventions

| Convention                                            | Documented/observed position                                                          | Enforcement reality from source                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Modular monolith and single composition root          | Explicit in architecture skill; representative flows follow it                        | Some imports restricted by ESLint; semantic ownership still needs review             |
| Server Components by default; small client boundaries | Public pages are server-owned; stateful assistant/filter UI is client-owned           | Next checks and selected lint rules exist; complete client-graph audit not performed |
| Constructor injection                                 | Consistent in major services/repositories                                             | Primarily convention/review                                                          |
| Runtime validation at boundaries                      | Zod request/event/workflow schemas; inferred public types                             | Observable in source and test assertions; tests unexecuted                           |
| Safe transport errors                                 | Explicit public messages and status codes around inspected routes                     | No blanket proof of all log/client error paths                                       |
| Stable identity and concurrency control               | Workflow revisions, review identity, step claims, stable provider IDs                 | SQL and integration-test dependent                                                   |
| Naming                                                | PascalCase components, `use…` hooks, mostly kebab-case authored modules               | Documented; not mechanically comprehensive                                           |
| Formatting/lint                                       | Prettier configuration, Next core-web-vitals, braces and spacing rules                | Commands exist; no execution claimed                                                 |
| Strict typing                                         | `strict: true`, `noEmit`, bundler resolution                                          | `npm run typecheck`; not run here                                                    |
| Tests                                                 | Node test runner through `tsx`; small injected providers; database and browser suites | Default command does not cover every required boundary                               |

The architecture skill (`.agents/skills/nextjs-architecture/SKILL.md`) dependency diagram needs careful reconciliation with actual technical type dependencies: for example, modules consume infrastructure-defined transport types (`src/modules/assistant/service.ts:12`, `src/modules/workflow/types.ts:4`). This is a contract-clarity question for Task 04, not a reason to silently relocate working boundaries.

ESLint's restrictions are incomplete relative to the written architecture:

- They match selected alias patterns rather than a fully resolved dependency graph.
- App restrictions enumerate plural subdirectories such as `services/*`; singular `service.ts` and `repository.ts` paths are not equivalently covered.
- Selected browser folders/components are listed explicitly.
- No infrastructure import restriction or cycle detector appears in the inspected configuration.

Evidence: `eslint.config.mjs:72–132`. Negative-fixture verification belongs to later tasks.

## 6. Technical health

### Strengths supported by inspected source

- One composition root and injectable dependencies make focused verification practical.
- Boundary schemas validate both requests and streamed responses.
- Workflow approval is distinct from model-generated proposals.
- Revision comparisons, transactions and claim fencing address real concurrency/retry requirements.
- Rate-limit counters are locked in deterministic order inside a transaction (`src/modules/rate-limit/repository.ts:23`, `:46`).
- Portfolio search validates embedding shape and replaces the index transactionally (`src/modules/portfolio/services/portfolio-search.service.ts:174`, `src/modules/portfolio/repositories/portfolio-search.repository.ts:13`).
- Maintenance target verification checks configured environment and effective endpoint interpretation (`src/infrastructure/config/portfolio-database.ts:67`).
- Existing tests assert meaningful outcomes, including malformed streams, ownership, stale edits, concurrency, migrations and uncertain provider effects.

### Findings

| ID      | Priority / classification                   | Finding and impact                                                                                                                                                                                                                                                                           | Evidence                                                                                                                                                                                                                                    |
| ------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| INT-001 | High — confirmed verification gap           | A successful default `npm test` is insufficient evidence of database correctness. Multiple DB tests skip without their URLs; the portfolio DB suite is a separate command.                                                                                                                   | `package.json:18–21`; `tests/integration/workflow/workflow-database.test.ts:22`; `tests/integration/rate-limit/rate-limit-database.test.ts:58`; `tests/integration/workflow/contact-database.test.ts:37`                                    |
| INT-002 | High — confirmed isolation gap              | Database target safety is inconsistent. Some suites create/drop a fresh database on whatever server the test URL identifies; workflow approval tests enforce localhost, while other suites lack an equivalent host/disposable-target check. Execution must not inherit an unverified target. | `tests/integration/portfolio/portfolio-database.test.ts:54`; `tests/integration/workflow/contact-database.test.ts:39`; `tests/integration/workflow/workflow-database.test.ts:17`; `tests/integration/workflow/workflow-approval.test.ts:89` |
| INT-003 | High — operationally unverified             | Durable recovery depends on an authenticated scheduled runner. Source and installation instructions exist, but actual scheduling, credentials, results and alerting are unverified.                                                                                                          | `docs/workflow-foundation.md:15`; `src/app/api/internal/workflow-runner/post.ts:9`                                                                                                                                                          |
| INT-004 | Medium — confirmed enforcement gap          | The written architecture is broader than existing deterministic import rules. Local lint success would not establish full architectural compliance.                                                                                                                                          | `eslint.config.mjs:72–132`; `.agents/skills/nextjs-architecture/SKILL.md`                                                                                                                                                                   |
| INT-005 | Medium — confirmed setup gap                | No canonical `verify` script or tracked CI/hook setup was found in the inspected repository inventory. Hosted protections remain unknown.                                                                                                                                                    | `package.json:5`; repository file inventory                                                                                                                                                                                                 |
| INT-006 | Medium — confirmed incomplete product path  | Case-study service requests render a disabled CTA. The standalone Contact service has no current production caller. Whether to expose or remove these paths is a product decision.                                                                                                           | `src/app/_portfolio/components/Contact.tsx:31`; `src/app/work/[slug]/page.tsx:169`; `src/modules/composition.ts:58`; source caller search                                                                                                   |
| INT-007 | Medium — reproducibility gap                | Browser tests require a separately available Playwright module/browser executable and prepared application; they are not part of package test scripts and Playwright is not declared in the manifest.                                                                                        | `tests/e2e/browser.config.mjs:1`; `tests/e2e/workflow.test.ts:19`; `package.json`                                                                                                                                                           |
| INT-008 | Low — documented limitation, not reproduced | Ambiguous chat after dismissing a discard prompt can refer to the dismissed control. Documentation distinguishes it from actual approval/discard authority.                                                                                                                                  | `docs/workflow-foundation.md:11`                                                                                                                                                                                                            |

No numeric test coverage or performance claim is justified. Dependency vulnerability status, real provider behavior and full security posture remain unverified. No finding above authorises remediation or an exception.

## 7. Development and deployment

### Documented local setup

`README.md` specifies Node 22.13+ within 22.x, npm, Docker and Supabase CLI. The documented sequence installs locked dependencies, starts Supabase, applies migrations, seeds published content, indexes it, and starts Next.

These are setup instructions, **not commands executed during this assessment**. Under the current owner instruction, agents must not invoke paths that read secret files without first choosing a compliant execution arrangement:

- `prisma.config.ts:4` conditionally loads `.env` when `DATABASE_URL` is absent.
- `loadPortfolioTarget` explicitly loads environment files (`src/infrastructure/config/portfolio-database.ts:99`).
- The indexing entry point also loads provider configuration (`src/entrypoints/maintenance/index-portfolio.ts:22`).
- Next's bundled environment guide documents automatic `.env*` loading by its runtime.

### Configuration names

Inspected source references these principal names; no values were read:

| Purpose                    | Names                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database and target safety | `DATABASE_URL`, `PORTFOLIO_SEED_ENVIRONMENT`, `PORTFOLIO_SEED_DATABASE`, `PORTFOLIO_SEED_USER`, `PGOPTIONS`                                        |
| Assistant                  | `OPENAI_API_KEY`, `OPENAI_MODEL`, `RATE_LIMIT_HMAC_SECRET`                                                                                         |
| Calendar                   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`                                                           |
| Notifications              | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_EMAIL`                                                                                               |
| Recovery                   | `WORKFLOW_RUNNER_SECRET`                                                                                                                           |
| Hosting behavior           | `VERCEL`, `VERCEL_ENV`                                                                                                                             |
| Database verification      | `PORTFOLIO_TEST_DATABASE_URL`, `WORKFLOW_TEST_DATABASE_URL`                                                                                        |
| Browser verification       | `HOMEPAGE_URL`, `PLAYWRIGHT_MODULE`, `CHROMIUM_EXECUTABLE`, `WEBKIT_EXECUTABLE`, `WORKFLOW_E2E_URL`, `WORKFLOW_EMPTY_URL`, `WORKFLOW_SERVICES_URL` |

Names are sourced from `src/infrastructure/config/env.ts`, `src/infrastructure/config/portfolio-database.ts`, route configuration references, and the test files named above.

Public static builds require accessible, complete published portfolio data. The root layout uses Google-hosted fonts through `next/font/google`, adding a build-time network consideration (`src/app/layout.tsx:2`).

### Operations and evidence

Logs use `ConsoleLogger` (`src/infrastructure/logging/logger.ts:8`). Inspected runtime call sites favor event names, stable IDs and safe reasons. Workflow state supplies durable diagnostic fields; the runbook describes manual reconciliation of attention states. No verified monitoring, alerting, backup restoration or automatic recovery installation is claimed.

The orchestrator independently supplied this bounded hosted observation for the inspected commit, using connected GitHub tools on 2026-11-13:

- `get_repo` reported public `Freeman-md/freemancodz-v4`, default branch `main`.
- `get_commit_combined_status` returned a successful **Vercel** context, linked to [this deployment](https://vercel.com/freemanmds-projects/freemancodz-v4/7Qqn9tgdRqYSQGHD22phnothgCyy).
- `fetch_commit_workflow_runs` returned an empty first page. This tool's query covers PR-triggered workflow runs; it is not an exhaustive all-events CI history query.

These are orchestrator-provided connector observations, not verification performed by the Task 01 execution agent. They do not prove runtime behavior, absence of all CI runs, branch protection, required checks, scheduler installation or release readiness.

### Executed assessment evidence

| Command                                                         | Outcome                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `git rev-parse HEAD`                                            | Exit 0; recorded revision above                                                            |
| `node --version`                                                | Exit 0; `v22.17.0`                                                                         |
| `node -p 'require("./node_modules/next/package.json").version'` | Exit 0; `16.2.12`                                                                          |
| `git status --short`                                            | Exit 0; existing constants edit plus orchestrator-created engineering docs                 |
| `git hash-object src/app/api/chat/constants.ts`                 | Exit 0; `e9e2e1fc3bf6d4055a0ee13547624aca7e785f3b`, matching the initial preservation hash |
| Application verification commands                               | **NOT RUN**                                                                                |

The assessment consulted installed Next documentation for Server/Client Components, Route Handlers, `dynamicParams`, Proxy and environment loading:

- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/dynamicParams.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`

These supported framework interpretation; repository ownership conventions remain project policy.

## 8. Agent playbook

| Change               | Start here                                                                                      | Preserve / verify                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Public content       | `prisma/seed-data/`, portfolio schemas, seed/read services                                      | Stable keys, publication completeness, service ordering, target verification, rebuilt pages and refreshed search |
| UI behavior          | Narrowest owning `src/app` private folder                                                       | Small client boundaries, keyboard/focus behavior, reduced motion, browser regressions                            |
| Assistant protocol   | `src/contracts/assistant.contract.ts`, browser stream adapter, route handler, assistant service | Validated events, cancellation, explicit errors, allowed tools, grounded sources                                 |
| Meeting behavior     | `src/modules/workflow/definitions/meeting-booking/`, meeting service, composition               | Explicit browser approval, immutable review identity, slot availability, duplicate effect prevention             |
| Durable workflow     | `src/modules/workflow/service.ts`, repository, runner/run repository                            | Revision races, claim fencing, expired leases, uncertainty, retries, definition version compatibility            |
| Database changes     | `prisma/schema.prisma` and new migration                                                        | Applied history, SQL constraints/privacy, disposable rehearsal, older records, rollback/recovery evidence        |
| Provider integration | `src/infrastructure/` adapter and injected module boundary                                      | Bounded requests, safe errors, provider identity/idempotency, real-boundary evidence                             |
| Engineering setup    | `docs/engineering/ENGINEERING_SETUP_STATUS.md` and task-specific prompt                         | Required approvals, independent review, no invented PASS or hosted control                                       |

Read `AGENTS.md` and `.agents/skills/nextjs-architecture/SKILL.md` first. Preserve the existing constants edit. Do not turn the intelligence findings into an unsolicited refactor.

For complete application changes, the current repository obligations include Prisma validation/generation, lint, typecheck, tests and build, plus relevant database/browser verification. Record suite execution and skips; command success alone is insufficient.

For future architectural changes, use the catalogue's shared ADR contract. The orchestrator classifies impact; execution independently reassesses; unresolved proposals block affected implementation; the reviewer checks approval evidence; merge approval remains separate.

## 9. Prioritised recommendations

1. **Establish accurate verification and isolation evidence first.** Audit and execute safe checks; explicitly distinguish skipped DB suites from passing suites. Add reliable disposable-target preconditions through the later approved testing work. High impact; modest tooling work, environment-dependent execution.
2. **Reuse the existing architecture, then close its contract/enforcement gaps.** Formalise current ownership with stable rule IDs and explain intentional technical type dependencies before extending ESLint. Avoid inventing new service layers or replacing the workflow system. High impact; moderate documentation/review effort.
3. **Verify scheduled recovery and hosted merge controls independently.** Inspect actual configuration/results and seek approval for necessary hosted changes. High impact; mostly operational access and evidence.
4. **Make browser verification reproducible.** Document or approve a consistent runner/toolchain and prepared fixture setup. Medium effort; existing tests can be reused.
5. **Resolve the disabled service-request path deliberately.** Choose a working contact action or explicitly defer the feature; do not assume the unused Contact backend should become a new workflow. Small implementation potential, pending product decision.

The catalogue's JPScents-specific stock scenarios, D2–D4 failures and malformed CI parser are not established Freemancodz V4 findings.

## 10. Unknowns

- Current pass/fail status of lint, typecheck, unit, database, browser and build checks.
- Current database schema, seed completeness, index freshness, backups and restore evidence.
- Hosted required checks, branch protection, deployment promotion rules and bypass permissions.
- Whether the recovery scheduler is installed, running, monitored and pointed at the intended deployment.
- Live Calendar/Resend behavior and delivery history; documentation's previous delivery claim was not independently reproduced.
- Intended completion/removal of disabled service requests and the unexposed Contact service.
- Approval history and rationale for existing architecture beyond the owner-provided instructions; no ADR acceptance is inferred.
- Conversation/booking retention, deletion and provider-storage policy.
- Measured accessibility, load, latency, error rates and security/dependency audit results.
- Whether the existing milestone workflow has been exercised against this repository's eventual ADR registry and all mandatory approval checkpoints.

**Task 01 outcome:** descriptive report passed independent review before persistence. This does not declare engineering setup, architecture approval, milestone handoff or release readiness complete. Task 02's persisted artifact requires its own independent review.
