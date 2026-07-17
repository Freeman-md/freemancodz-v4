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

## Portfolio rendering

The public `/`, `/work`, and `/about` pages read seeded portfolio content through the server-only Prisma client during the production build. They are pre-rendered as static HTML; there is no browser-side portfolio fetch or static-data fallback when database content is missing or invalid. The files in `src/data/` remain available for the seed and RAG workflows.

### Source of truth

`supabase/migrations/` is the only migration history. Do not run `prisma migrate`; Prisma is used for its schema model and generated client only. Create future schema changes with `supabase migration new <descriptive_name>`, edit the generated SQL file, and verify it with a local reset.

### Environment

`DATABASE_URL` is required when constructing the Prisma client and for Prisma commands that connect to Postgres. Keep it in an uncommitted local environment file or deployment secret store. Use a direct PostgreSQL connection URL for database operations, not a browser publishable key.

For local Supabase, after `supabase start`, the default connection format is:

```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54332/postgres?schema=public"
```

For a hosted project, copy the direct Postgres connection string from the Supabase dashboard, keep its password secret, and set it as `DATABASE_URL` only in your local shell or secret store.

`DATABASE_URL` must also be available to the production build environment. Before deploying, apply migrations and run `npm run seed:portfolio` against the selected database, then run `npm run build` with the same environment. The build intentionally fails if required portfolio content is unavailable or malformed, preventing an incomplete static deployment.

### Local workflow

Docker or another Docker-compatible runtime must be available for the local Supabase stack.

```bash
npm install
supabase start
supabase db reset --local
npm run prisma:validate
npm run prisma:generate
supabase migration list --local
npm run seed:portfolio
```

`supabase db reset --local` recreates the local database from the committed SQL migrations and is the clean-setup check. Running it again should produce the same schema; it does not create migration files. `supabase migration list --local` confirms the migration history recorded by the local database matches the committed files.

### Portfolio seed

Run the repeatable portfolio seed against the database selected by `DATABASE_URL`:

```bash
npm run seed:portfolio
```

Apply the current Supabase migrations before running the seed. The amendment migration intentionally changes the schema without embedding portfolio data, so `npm run seed:portfolio` repopulates `content_blocks`, `principles`, `services`, `experiences`, and `projects` from the static TypeScript source in a single transaction. It does not seed `site_chunks`, change the static files, or run automatically during deployment. A connection or write failure is reported with a non-zero exit status; Prisma disconnects before the command finishes.

For a hosted Supabase database, set `DATABASE_URL` in the shell or secret store to that project's direct Postgres connection string, then run the same command. Confirm the selected database is the intended project before executing it. Do not put `DATABASE_URL` in a committed file.

### Hosted workflow

Authenticate and link the intended project without committing a project reference or database password:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push --dry-run --linked
supabase db push --linked
supabase migration list --linked
```

`supabase db push` applies only pending files from `supabase/migrations/`, so re-running it is safe when the migration history is in sync. Do not use `supabase db reset --linked` on a production project: it is destructive. This project does not use automatic deployment seeding; use `npm run seed:portfolio` deliberately after selecting the intended database.
