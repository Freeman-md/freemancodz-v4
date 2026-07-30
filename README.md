# Freeman Madudili portfolio

This is a Next.js App Router portfolio. Pages render validated portfolio records from PostgreSQL through Prisma, the floating assistant streams answers from OpenAI with search-index context, and a durable search-index worker maintains embeddings.

## Structure

- `src/app` contains routes, pages, layouts, and thin HTTP adapters.
- `src/features` owns browser-facing assistant and portfolio UI; client interactions use feature API adapters.
- `src/server/modules` owns portfolio, assistant, and search-index use cases. Pages, routes, and other modules import only a module's `public.ts` API.
- `src/server/infrastructure` owns Prisma, environment, OpenAI, and logging configuration; `src/server/entrypoints` owns CLI, worker, and maintenance adapters.
- `src/shared` contains domain-free layout, UI primitives, configuration, and utilities. `src/contracts` owns runtime-validated HTTP and stream shapes.
- `prisma/seed-data` is seed input only; runtime content comes from the database.
New UI belongs in its feature; backend use cases, persistence, and providers belong in the owning server module. Server Components call module `public.ts` directly, while browser code flows through feature API → Route Handler → module `public.ts`. Process entrypoints are thin adapters over the same public services. See `.agents/skills/nextjs-architecture/SKILL.md` for the authoritative standard.

## Local development

Install dependencies and generate Prisma's client:

```bash
npm install
npm run prisma:validate
npm run prisma:generate
npm run dev
```

Provide `DATABASE_URL` for Prisma. Assistant and indexing operations additionally require `OPENAI_API_KEY`; optional `OPENAI_MODEL` and `OPENAI_EMBEDDING_MODEL` select the existing defaults. `SEARCH_INDEX_WORKER_SECRET` protects the production worker route. Public site and social-link settings use the documented `NEXT_PUBLIC_` variables in `src/shared/config/links.ts` and `src/shared/config/site-metadata.ts`.

Prisma migrations in `prisma/migrations` are the migration source of truth. Supabase remains the PostgreSQL host and optional local database tooling; the application does not use a Supabase JavaScript client.

## Operations

Seed the repeatable portfolio records with `npm run seed:portfolio`. Search-index adapters are:

```bash
npm run index:source -- <sourceType> <sourceId>
npm run index:rebuild
npm run index:worker
npm run index:status
npm run index:preview -- <sourceType> <sourceId>
```

The local worker and protected `/api/internal/search-index-worker` endpoint call the same bounded batch operation. Production administration commands require their existing production confirmation arguments. Configure the host cron with `SEARCH_INDEX_WORKER_SECRET`. The in-process assistant limiter is bounded best-effort per instance only; configure host-level rate limiting when global cost protection is required.

## Validation

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run build
```
