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

## Database foundation

The site continues to render the static content in `src/data/` during this milestone. The database schema represents that content for a later migration, but no static data is seeded and no page reads from Supabase yet.

### Source of truth

`supabase/migrations/` is the only migration history. Do not run `prisma migrate`; Prisma is used for its schema model and generated client only. Create future schema changes with `supabase migration new <descriptive_name>`, edit the generated SQL file, and verify it with a local reset.

### Environment

`DATABASE_URL` is required when constructing the Prisma client and for Prisma commands that connect to Postgres. Keep it in an uncommitted local environment file or deployment secret store. Use a direct PostgreSQL connection URL for database operations, not a browser publishable key.

For local Supabase, after `supabase start`, the default connection format is:

```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54332/postgres?schema=public"
```

For a hosted project, copy the direct Postgres connection string from the Supabase dashboard, keep its password secret, and set it as `DATABASE_URL` only in your local shell or secret store.

### Local workflow

Docker or another Docker-compatible runtime must be available for the local Supabase stack.

```bash
npm install
supabase start
supabase db reset --local
npm run prisma:validate
npm run prisma:generate
supabase migration list --local
```

`supabase db reset --local` recreates the local database from the committed SQL migrations and is the clean-setup check. Running it again should produce the same schema; it does not create migration files. `supabase migration list --local` confirms the migration history recorded by the local database matches the committed files.

### Hosted workflow

Authenticate and link the intended project without committing a project reference or database password:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push --dry-run --linked
supabase db push --linked
supabase migration list --linked
```

`supabase db push` applies only pending files from `supabase/migrations/`, so re-running it is safe when the migration history is in sync. Do not use `supabase db reset --linked` on a production project: it is destructive. Run `supabase db push --include-seed` only for disposable environments; this project intentionally has no content seed data in this milestone.
