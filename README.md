# Freeman Madudili portfolio

This is a Next.js App Router portfolio. The current pages remain component-driven while the portfolio content backend is stored in PostgreSQL through Prisma. The floating assistant streams answers from OpenAI with existing search-index context.

See [Portfolio Content System](docs/portfolio-content-system.md) for the completed content architecture, admin, authentication, caching, media and operations guide.

## Structure

- `src/app` contains routes, pages, layouts, and thin HTTP adapters.
- `src/features` owns browser-facing assistant and portfolio UI; client interactions use feature API adapters.
- `src/server/modules` owns portfolio, assistant, and search-index use cases. Pages, routes, and other modules import only a module's `public.ts` API.
- `src/server/infrastructure` owns Prisma, environment, OpenAI, and logging configuration; `src/server/entrypoints` owns CLI, worker, and maintenance adapters.
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

Provide `DATABASE_URL` for Prisma. Portfolio storage requires `NEXT_PUBLIC_SUPABASE_URL` and server-only `SUPABASE_SERVICE_ROLE_KEY`. Bootstrap creates or verifies the public `portfolio-media` bucket but does not require or upload local media files; media can be added later through the protected admin. `NEXT_PUBLIC_SUPABASE_URL` must be a valid HTTP(S) project URL outside local development; only an explicit development runtime may fall back to local Supabase at `127.0.0.1:54321`. Assistant operations additionally require `OPENAI_API_KEY`.

Prisma migrations in `prisma/migrations` are the only migration source of truth. The Supabase JavaScript client is server-only and used solely for the public `portfolio-media` Object Storage bucket.

## Operations

Apply local migrations, then recreate only the portfolio domain and verify it with:

```bash
npm run portfolio:bootstrap:local
```

The disposable PostgreSQL regression suite requires an admin connection to a non-production local/test server so it can create and drop one randomly named database:

```bash
PORTFOLIO_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54332/postgres npm run test:portfolio:database
```

Production is deliberately two guarded operations: `npm run prisma:migrate:production`, then `npm run portfolio:bootstrap:production -- --confirm-production`. The confirmation argument must be supplied by the operator; it is not built into the package script. The production bootstrap prints database/storage targets, creates or verifies the public media bucket, and refuses to overwrite any initialized portfolio-domain table. It does not require or upload media objects.

Managed Profile and Outside Engineering values are stored as environment-correct public Supabase URLs. Repo-public Project covers remain `/images/work/*` paths.

Search-index adapters are:

```bash
npm run index:source -- <sourceType> <sourceId>
npm run index:rebuild
npm run index:worker
npm run index:status
npm run index:preview -- <sourceType> <sourceId>
```

Existing SiteChunks remain searchable. Legacy portfolio source indexing, clean rebuild, preview, direct removal, and pending legacy jobs fail closed or remain unclaimed until the dedicated new-domain indexing milestone; no full re-index is part of this bootstrap.

## Validation

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run build
```

## Testing

Automate critical flows, agreed failures, and regressions that have occurred; use manual checks when they are clearer, and do not pursue a coverage percentage target. `npm run test:unit` runs focused deterministic units, `npm run test:integration` runs deterministic assistant flows using fakes, and `npm test` runs both. `npm run eval:assistant` is an explicit live OpenAI evaluation with the stable fixture and rubric in `tests/evals/assistant`; it is intentionally excluded from normal tests and CI.
