# Freeman Madudili Personal Website

A static Next.js, TypeScript, and Tailwind CSS personal website for Freeman Madudili.

## Environment variables

- `NEXT_PUBLIC_CV_URL` — optional CV link. Hidden when absent.
- `NEXT_PUBLIC_LINKEDIN_URL` — optional LinkedIn override.
- `NEXT_PUBLIC_GITHUB_URL` — optional GitHub override.
- `NEXT_PUBLIC_HERO_IMAGE_URL` — optional hero image URL. A placeholder renders when absent.
- `NEXT_PUBLIC_SITE_URL` — optional canonical site URL for metadata, sitemap, and social previews.

## Development

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Deploy

Import the repository into Vercel and set optional environment variables in Project Settings.

## Search indexing

Portfolio records are the canonical search source. Run `npm run index:rebuild` after configuring server-side `DATABASE_URL` and `OPENAI_API_KEY`, or let source-table triggers enqueue work and run `npm run index:worker`. Preview a record without writes or embeddings with `npm run index:source -- projects <id> --dry-run`.

For production, configure `SEARCH_INDEX_WORKER_SECRET` only in the server environment, then invoke `POST /api/internal/search-index` once per minute with `Authorization: Bearer <secret>`. A Supabase `pg_cron` + `pg_net` invocation is suitable; keep the deployment URL and secret in Supabase Vault/production configuration rather than this repository.

## Portfolio rendering

The public `/`, `/work`, and `/about` pages read seeded portfolio content through the server-only Prisma client during the production build. They are pre-rendered as static HTML; there is no browser-side portfolio fetch or static-data fallback when database content is missing or invalid. The files in `src/data/` remain available for the seed and RAG workflows.

### Source of truth

`prisma/migrations/` is the only application migration history. Prisma is used for the schema model, generated client, and migration deployment. PostgreSQL-specific SQL such as pgvector, RLS, and triggers lives inside the committed Prisma migration files.

### Environment

`DATABASE_URL` is required when constructing the Prisma client and for Prisma commands that connect to Postgres. Keep it in an uncommitted local environment file or deployment secret store. Use a direct PostgreSQL connection URL for database operations, not a browser publishable key.

For local Supabase, after `supabase start`, the default connection format is:

```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54332/postgres?schema=public"
```

For a hosted project, copy the direct Postgres connection string from the Supabase dashboard, keep its password secret, and set it as `DATABASE_URL` only in your local shell or secret store.

`DATABASE_URL` must also be available to the production build environment. Before deploying, apply migrations and run `npm run seed:portfolio` against the selected database, then run `npm run build` with the same environment. The build intentionally fails if required portfolio content is unavailable or malformed, preventing an incomplete static deployment.

### Local workflow

Start a local PostgreSQL or Supabase database, then provide its direct connection URL in your shell or secret store. Do not commit it.

```bash
npm install
npm run prisma:validate
npm run prisma:generate
npx prisma migrate deploy
npm run seed:portfolio
```

`prisma migrate deploy` applies the committed migration history to the selected database. For a clean local database, recreate the database with your local database tooling and then run the same command; it does not create migration files.

### Portfolio seed

Run the repeatable portfolio seed against the database selected by `DATABASE_URL`:

```bash
npm run seed:portfolio
```

Apply the current Prisma migrations before running the seed. The amendment migration intentionally changes the schema without embedding portfolio data, so `npm run seed:portfolio` repopulates `content_blocks`, `principles`, `services`, `experiences`, and `projects` from the static TypeScript source in a single transaction. It does not seed `site_chunks`, change the static files, or run automatically during deployment. A connection or write failure is reported with a non-zero exit status; Prisma disconnects before the command finishes.

For a hosted Supabase database, set `DATABASE_URL` in the shell or secret store to that project's direct Postgres connection string, then run the same command. Confirm the selected database is the intended project before executing it. Do not put `DATABASE_URL` in a committed file.

### Hosted workflow

Set the intended hosted database's direct `DATABASE_URL` in the shell or secret store, then deploy the committed Prisma migrations:

```bash
npx prisma migrate deploy
npm run seed:portfolio
```

`prisma migrate deploy` applies only pending committed migrations, so re-running it is safe when the migration history is in sync. Do not reset a production database. This project does not use automatic deployment seeding; use `npm run seed:portfolio` deliberately after selecting the intended database.
