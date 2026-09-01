# Freeman Madudili portfolio

This is a Next.js App Router portfolio. The current pages remain component-driven while the portfolio content backend is stored in PostgreSQL through Prisma. The floating assistant streams answers from OpenAI and retrieves evidence from a database-driven snapshot of the current portfolio.

See [Portfolio Content System](docs/portfolio-content-system.md) for the completed content architecture, admin, authentication, caching, media and operations guide.
See [Workflow Foundation](docs/workflow-foundation.md) for versioned workflow definitions, durable private instances, assistant integration, the meeting-booking migration, and extension guidance.

## Structure

- `src/app` contains routes, pages, layouts, and thin HTTP adapters.
- `src/features` owns browser-facing assistant and portfolio UI; client interactions use feature API adapters.
- `src/server/modules` owns portfolio, assistant, workflow, Meeting, and search-index capabilities. Pages, routes, and other modules import only a module's `public.ts` API.
- `src/server/infrastructure` owns Prisma, environment, OpenAI, and logging configuration; `src/server/entrypoints` owns one-shot job and maintenance adapters.
- `src/shared` contains domain-free layout, UI primitives, configuration, and utilities. `src/contracts` owns runtime-validated HTTP and stream shapes.
- `prisma/portfolio-seed-data.ts` is the canonical one-time bootstrap input transcribed from the approved Notion artifacts; runtime content comes from the database.
  New UI belongs in its feature; backend use cases, persistence, and providers belong in the owning server module. Server Components call module `public.ts` directly, while browser code flows through feature API → Route Handler → module `public.ts`. Process entrypoints are thin adapters over the same public services. See `.agents/skills/nextjs-architecture/SKILL.md` for the authoritative standard.

## Local development

Install dependencies and generate Prisma's client:

```bash
npm install
npm run prisma:validate
npm run prisma:generate
npm run dev
```

Provide `DATABASE_URL` for Prisma. Portfolio storage requires `NEXT_PUBLIC_SUPABASE_URL` and the server-only Supabase secret documented in `.env.example`. Bootstrap creates or verifies the public `portfolio-media` bucket but does not require or upload local media files; media can be added later through the protected admin. `NEXT_PUBLIC_SUPABASE_URL` must be a valid HTTP(S) project URL outside local development; only an explicit development runtime may fall back to local Supabase. Assistant and indexing operations additionally require `OPENAI_API_KEY` and `OPENAI_EMBEDDING_MODEL`; chat rate limiting requires `RATE_LIMIT_HMAC_SECRET` and is durable in PostgreSQL; meeting booking requires the documented Google Calendar configuration. Workflow state is durable in PostgreSQL and needs no browser-state encryption configuration. The deployed daily worker requires `CRON_SECRET`.

Prisma migrations in `prisma/migrations` are the only migration source of truth. The Supabase JavaScript client is server-only and used solely for the public `portfolio-media` Object Storage bucket.

## Operations

Apply local migrations, then recreate only the portfolio domain and verify it with:

```bash
npx prisma migrate deploy
npm run portfolio:bootstrap:local
npm run index:run
```

The disposable PostgreSQL regression suite requires an admin connection to a non-production local/test server so it can create and drop one randomly named database:

```bash
PORTFOLIO_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54332/postgres npm run test:portfolio:database
```

For a new empty production environment, database migration and the one-time portfolio bootstrap remain separate guarded operations: `npm run prisma:migrate:production`, then `npm run portfolio:bootstrap:production -- --confirm-production`. The confirmation argument must be supplied by the operator; it is not built into the package script. The bootstrap refuses to overwrite an initialized portfolio domain.

Managed Profile, Project-cover, and reusable media are uploaded through the protected admin. Administrators never enter Supabase public URLs: the server stores the canonical URL returned by Supabase Storage after validating the file and ownership. In local development, Next.js image optimization permits a loopback Storage origin only when the configured Supabase hostname is `localhost` or `127.0.0.1`; production private-IP optimization remains disabled. Repo-public Project covers may remain `/images/work/*` paths until replaced through the managed upload flow.

### Search indexing

Every committed portfolio mutation requests one coalesced `portfolio` rebuild through PostgreSQL statement triggers. The admin, bootstrap, cache invalidation, and other writers perform ordinary portfolio writes and never call indexing code. A worker reads the current Home, Work, About, and Audit data, embeds the complete small snapshot, and atomically replaces `site_chunks` only after preparation succeeds. The previous searchable snapshot therefore survives mapping, OpenAI, or database failures.

The four operational commands are:

```bash
# Process one pending local job and exit
npm run index:run

# Process one pending production job and exit
npm run index:run:production -- --confirm-production

# Request and process one full local rebuild
npm run index:rebuild

# Request and process one full production rebuild
npm run index:rebuild:production -- --confirm-production
```

The operator must supply `--confirm-production`; it is deliberately not built into either production script. Normal production processing runs once daily at `0 8 * * *` through Vercel Cron. A content change can therefore wait until the next daily run unless an operator invokes `index:run`; `index:rebuild` is for an explicit full refresh or recovery.

The singleton job moves through `pending`, `processing`, `completed`, and `failed`. A claim counts as an attempt. A failure below three attempts makes the row immediately eligible for a later one-shot invocation; the third failure is terminal. With only the daily cron, those later attempts occur on later scheduled runs unless an operator invokes a manual command. A claim older than ten minutes is recovered without bypassing the limit, and a later portfolio mutation or explicit rebuild resets terminal work to a fresh pending request. A mutation that arrives during processing sets `rerun_requested`, so completion returns the job to pending instead of losing newer work.

Inspect current operational state with a read-only query in a trusted database console:

```sql
SELECT job_key, status, rerun_requested, attempts, available_at, requested_at,
       claimed_at, processed_at, last_error
FROM public.search_index_jobs
WHERE job_key = 'portfolio';
```

Vercel Runtime Logs expose the safe `search_index.worker_started`, `search_index.worker_skipped`, `search_index.worker_completed`, `search_index.worker_failed`, and `search_index.stale_job_recovered` events. They must not contain credentials, embeddings, raw provider payloads, or portfolio content bodies.

For the Milestone 17 production rollout, pause the cron, deploy the reviewed application, apply the forward Prisma migration, confirm the migration-created singleton is pending, run `npm run index:run:production -- --confirm-production`, verify current chunks are searchable, and then re-enable the daily cron. Do not run the one-time portfolio bootstrap against an already initialized production portfolio.

## Validation

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run test:workflow
npm run test:portfolio:database
npm run test:search-index
npm run build
```

## Testing

Automate critical flows, agreed failures, and regressions that have occurred; use manual checks when they are clearer, and do not pursue a coverage percentage target. `npm run test:unit` runs focused deterministic units, `npm run test:integration` runs deterministic assistant flows using fakes plus conditionally configured database suites, and `npm test` runs both. `npm run test:workflow` covers definition, registry, lifecycle, adapter, meeting, migration, security, and repository behaviour; its disposable PostgreSQL case runs only when `PORTFOLIO_TEST_DATABASE_URL` is configured. `npm run test:search-index` uses the same disposable-server setting for its database suite. A skipped database suite is not evidence of database correctness. `npm run eval:assistant` is an explicit live OpenAI evaluation with the stable fixture and rubric in `tests/evals/assistant`; it is intentionally excluded from normal tests and CI.
