# Portfolio data and release procedure

Home, Work, every published project page, its metadata, and the sitemap are built from PostgreSQL. Server Components call `publicPortfolioService` for ordering and featured selection. The repository alone reads portfolio records with Prisma. Published pages use the built content until the next successful deployment. The project and service keys are permanent because they identify URLs, case studies and relationships.

## Edit and seed

| File in `prisma/seed-data` | Editable records |
|---|---|
| `profile.json` | Name, headline, intro and philosophy |
| `projects.json` | Covers, links, featured excerpts, questions and ordered service keys |
| `project-case-studies.json` | Story, features, technologies, evidence and optional Before and After clips |
| `experience.json` | Timeline stops and questions |
| `services.json` | Offers, examples, questions and editable request drafts |

Use a checked-in image under `public/images` for each project cover. Both clip URLs must be present to display a comparison. Each can be an HTTPS URL without credentials or an MP4 or WebM under `public/videos`.

| Environment | Preview | Apply |
|---|---|---|
| Development | `npm run portfolio:seed:local` | `npm run portfolio:seed:local -- --apply` |
| Production | `npm run portfolio:seed:production` | `npm run portfolio:seed:production -- --apply` |

The development command loads `.env`. The production command loads `.env.production.local`. In each file, set `DATABASE_URL`, `PORTFOLIO_SEED_ENVIRONMENT` (`development` or `production`), `PORTFOLIO_SEED_DATABASE` (the expected `host:port/database`), and `PORTFOLIO_SEED_USER` (the expected connection username). Use one host with an explicit port in the connection URL and expected database identity. Leave the host, username and database name unescaped and percent-encode the password. For a pooler, include any project suffix in the username. Enter the expected values from the intended database settings. A conflicting inherited `DATABASE_URL` causes the command to fail before connecting. The commands report the environment label, changed record keys and totals.

Apply recalculates the plan in a transaction. Omitted rows and service links stay in place. A retained link can block a requested position, so include every link being moved when reordering. A failed batch leaves the previous data intact. Keep seed writes separate from builds and migrations. To publish an edit, preview and apply the seed, then rebuild and deploy with access to the seeded database. The old deployment continues to show its built content until the new one succeeds.

## M24 rollout

1. Check out the preparation SHA recorded in the PR. This revision includes `20261109130000_add_public_portfolio` and the seed command. Apply migrations with `npm run prisma:migrate:production`, then preview and apply the production seed. The production migration command uses the same target check as the seed. It refuses missing or mismatched production configuration before starting Prisma. The old app can still serve its legacy tables during this step.
2. Build the reviewed final app with read access to the seeded database, then deploy it. Verify Home, Work, a case study, the sitemap, a missing slug and the assistant notice. The previous release can still be restored while the legacy tables exist.
3. Take a recoverable backup. Run `npm run prisma:migrate:production` from the final SHA to apply the cleanup. The cleanup refuses a target without the required seed. Verify the retired tables and search functions are gone and existing workflow, request, meeting and rate-limit rows remain.

Repeat this sequence on an isolated Preview database before production. Set its `DATABASE_URL` and the three development target identifiers above on the M24 Vercel Preview branch. A Preview build without matching target identifiers refuses the database connection. For the public portfolio, Preview needs the database during the build only. Its chat and visitor workflows still need a database at runtime. Use the target-specific configuration when applying migrations and seed data outside Vercel.

For a new empty database, run `npm run prisma:migrate`, then preview and apply the local seed. The historical audit presentation migration and portfolio cleanup migration were adjusted to allow replay on an empty database; the cleanup still requires the seed when legacy portfolio data exists. Their migration names remain unchanged. Existing databases can use `prisma migrate deploy`; Prisma may flag changed checksums with `prisma migrate dev`, which can request a destructive reset. Do not reset a database containing data you need.

The forward audit removal migration deletes audit requests and audit workflow instances. Existing contact, meeting and other workflow data remain. Deploy code that no longer serves audits before applying it. If a previous local migration attempt failed, use `npx prisma migrate resolve --rolled-back 20260901090000_simplify_audit_presentation` before `npm run prisma:migrate`; check the reported failed migration name first. Never resolve a production failure without inspecting its state.
