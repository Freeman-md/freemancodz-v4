# Portfolio Content System

## 1. What Milestone 15 Built

Milestone 15 established PostgreSQL as the canonical runtime content source. Prisma migrations define Profile, ContentBlock, reusable Icon/Action/Media blocks, Projects, Experiences and their ordered relationships. `prisma/portfolio-seed-data.ts` is the one-time canonical seed input; repositories and four page services compose runtime reads. A guarded bootstrap creates the public Storage bucket and seeds only an empty portfolio domain. The current database-driven search index consumes those same page services and no longer depends on the retired source-specific portfolio schema.

## 2. What Milestone 16 Built

Milestone 16 connects `/`, `/work`, `/about` and `/audit` to those page services through presentation adapters and Cache Components. It adds the Freeman-only `/admin`, validated repository-owned writes, dependency tags and targeted invalidation, Supabase passwordless authentication, and protected media replacement with compensating cleanup. Static Notion mapping exceptions and the existing visual language remain frontend-owned.

## 3. Architecture Overview

```text
Public homepage → route-owned presentation copy, artwork and browser interactions
Assistant and admin → managed portfolio records in PostgreSQL
```

```text
Admin
→ Server Action / protected media Route Handler
→ verified Supabase identity + Freeman-only authorization
→ Zod trust-boundary validation
→ portfolio administration/media service
→ repository or Storage provider
→ PostgreSQL / portfolio-media bucket
→ targeted cache invalidation after success
```

```text
Committed portfolio mutation
→ PostgreSQL statement trigger
→ one coalesced portfolio rebuild job
→ one-shot daily or manual worker
→ Home + Work + About + Audit snapshot
→ deterministic chunks + OpenAI embeddings
→ atomic replacement of site_chunks
→ existing assistant retrieval
```

Provider errors are normalized before reaching a client. Request correctness does not depend on module-level memory.

## 4. Important Folders / Files

- `src/app/_portfolio`: homepage presentation, interaction and styles.
- `src/contracts/portfolio-presentation.contract.ts`: closed icon and project-visual identifiers.
- `src/contracts/portfolio-admin.contract.ts`: admin trust-boundary schemas and inferred types.
- `src/app/admin`: login, protected semantic editors and Server Actions.
- `src/app/api/admin/media/route.ts`: protected upload boundary.
- `src/modules/admin-auth`: authorization service; Supabase implementation remains in infrastructure.
- `src/modules/portfolio`: read/write repositories, administration/media services and cache tags.
- `src/modules/search-index`: singleton job lifecycle, current-portfolio mapping, deterministic chunking and whole-snapshot replacement.
- `src/app/api/internal/search-index-worker/route.ts`: `CRON_SECRET`-protected one-shot scheduled adapter.
- `src/entrypoints/jobs/run-search-index-worker.ts`: shared local/production one-shot command.
- `prisma/migrations` and `prisma/portfolio-seed-data.ts`: migration and bootstrap sources of truth.

## 5. Domain Model Summary

There is one Profile. ContentBlocks form URL-identified page trees and relate explicitly to reusable IconBlocks, ActionBlocks and MediaBlocks. ActionBlock and MediaBlock are typed extensions of IconBlock. Projects and Experiences are independent ordered collections; Experience has ordered icon relations and Project may point to one MediaBlock cover.

Key invariants: no generic page builder, no executable JSX stored in content, no arbitrary visual identifiers, no duplicate page-specific Profiles, no unsafe reusable-block deletion, and no deletion of the canonical project slugs required by public presentation. Project slugs are immutable after creation because selectors and cache identity depend on them. Creating a Project does not automatically add it to Home or Audit.

The approved sources define no colour token palette, so the admin preserves the default `null` colour only. Profile deletion is deliberately absent.

`SearchIndexJob` is one internal singleton row keyed by `portfolio`. It records only current operational state: `pending`, `processing`, `completed`, or `failed`, whether a rerun arrived during processing, attempts and safe timestamps/error summary. It is protected with Row Level Security and revoked from public, anonymous and authenticated roles. `SiteChunk` remains the assistant knowledge store and is replaced only by one short transaction after every new embedding has been prepared and validated.

## 6. Public portfolio and assistant sources

The homepage, Work catalogue and case studies read validated records through `publicPortfolioService`. The server-only repository loads `src/modules/portfolio/data/projects.json` and `experience-stops.json`. Public routes render without a database connection. The checked-in catalogue is the source for project URLs, sitemap entries, features, technology labels and artwork provenance.

The proxy serves `/work` and its case-study routes. Retired `/about` and `/audit` routes redirect to the homepage. The assistant index continues to use the managed portfolio in PostgreSQL. Admin writes update those records and enqueue indexing. Homepage citations remain anchored to the homepage, including when the assistant is open from Work.

Approved artwork originates in [Paper's assembled Landing Page](https://app.paper.design/file/01M5VJC7VWD8F9QYARYR43X33M/p-8-0). The new files under `public/images/homepage` come from its Hero, Selected Work and Contact fills. WithRadius reuses the checked-in V4 cover. Strength, Endurance and Good company reuse the checked-in photographs, which match the Paper assets byte for byte and preserve their existing privacy edits. The two approved testimonials retain the wording and attributions from [Paper's testimonial storyboard](https://app.paper.design/file/01M5VJC7VWD8F9QYARYR43X33M/p-6-0).

## 7. Cache Tags / Revalidation

Admin write and invalidation behavior is unchanged. Database triggers enqueue indexing on committed mutations independently of cache invalidation. The public portfolio does not consume the managed read caches.

## 8. Admin

Open `/admin`. The information architecture is Overview, Pages, Profile, Projects, Experience, Media and Reusable blocks. Editors expose domain fields, controlled icon/visual selectors, child/reusable relation ordering, Project markdown, guarded deletion and confirmation. Action destinations accept site-relative paths; use current anchors such as `/#work` and `/#experience`, or safe HTTP(S) URLs. Projects and Experiences support create/update/delete; reusable records refuse deletion while referenced; the Profile is update-only.

The admin is intentionally not a schema editor, arbitrary component builder, CSS editor, generic database console or indexing console. It performs ordinary portfolio CRUD and never calls the search-index service. Public selection rules and static mapping exceptions remain application-defined.

## 9. Authentication

The login form requests a Supabase magic link with `shouldCreateUser: false`. Provision the approved user first with `npm run admin-auth:provision:local`. The local email template links directly to `/auth/confirm?token_hash=...&type=email`; the Route Handler verifies the hash, writes SSR session cookies, and redirects to `/admin` only after `AdminAuthService` checks the normalized approved email. Restart local Supabase after changing `supabase/config.toml` or `supabase/templates/magic-link.html`: `npx supabase stop && npx supabase start`. For production, run `npm run admin-auth:provision:production -- --confirm-production`, then configure the hosted Site URL and exact `https://<production-domain>/auth/confirm` redirect in Supabase Dashboard → Authentication → URL Configuration. In Email Templates → Magic Link, use `<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Sign in to the portfolio admin</a>`; configure SMTP as needed and disable tracking that rewrites authentication links. Verify by requesting a new link, opening it once, reaching `/admin`, refreshing, then signing out and confirming `/admin` is protected again.

Required Auth configuration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- server-only `ADMIN_EMAIL=freemanmadudili@gmail.com`
- Supabase Auth Site URL for the deployed site
- redirect allow-list entries for `https://<production-host>/auth/confirm` and local `http://localhost:3000/auth/confirm`
- a magic-link email template that directs to `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`, matching the token-hash confirmation route
- a deliberately pre-provisioned `freemanmadudili@gmail.com` Auth user

## 10. Supabase Storage

The public `portfolio-media` bucket remains the managed asset store. Bootstrap paths remain stable; admin replacements use unique versioned paths under `images/profile/<uuid>.<ext>` or `media/<uuid>.<ext>`. Allowed uploads are JPEG, PNG, WebP, GIF, MP4 and WebM, from 1 byte through 8 MB.

Replacement order is upload new object → update database source → check remaining ownership → delete the previous managed object only when no Profile, MediaBlock or Project cover still references its source. If the database write fails, the new object is removed. If reference checking or old-object cleanup fails after a successful database write, the new source remains canonical, the old object is preserved and the UI reports a cleanup warning. Existing Project covers are selectable as owned upload targets; Projects without covers are not given invented ones. Only public URLs from the managed bucket are interpreted as removable object paths. `SUPABASE_SERVICE_ROLE_KEY` is server-only.

The 8 MB rule is enforced before unbounded multipart parsing. Requests with a declared `Content-Length` above 8 MB plus 64 KiB of multipart overhead are rejected with `413`; requests without a trustworthy length are read incrementally and cancelled at that same hard raw-request bound before `formData()` is called. The decoded file is independently limited to exactly 8 MB by the media service. Next.js Proxy cloning is also capped with the supported `experimental.proxyClientMaxBodySize: "9mb"`; that platform setting bounds Proxy buffering, while the Route Handler provides the authoritative rejection.

No CV database model is managed by the portfolio content system.

## 11. Local Development

Do not commit environment files. Configure the documented variables in the local environment, then run:

```bash
npm install
npm run prisma:validate
npm run prisma:generate
npx prisma migrate deploy
npm run portfolio:bootstrap:local
npm run index:run
npm run dev
```

The app requires `DATABASE_URL`. Admin/auth requires the public Supabase URL and publishable key plus `ADMIN_EMAIL`; Storage writes require the server-only Supabase secret documented in `.env.example`. Bootstrap creates or verifies the public `portfolio-media` bucket but does not require local media files or pre-upload objects. Media can be uploaded or replaced later through the protected admin. Assistant and indexing functionality requires `OPENAI_API_KEY` and `OPENAI_EMBEDDING_MODEL`. The deployed cron route requires `CRON_SECRET`.

During this sequence, the database trigger coalesces the bootstrap writes into one pending job and `index:run` processes it once before exiting.

Use `npm run index:rebuild` when an explicit full refresh or recovery is required. It requests the same singleton work and then runs the same one-shot processing path; it never clears the current chunks first.

Focused verification:

```bash
npm run test:portfolio:admin
PORTFOLIO_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54332/postgres npm run test:portfolio:database
PORTFOLIO_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54332/postgres npm run test:search-index
```

## 12. Database / Initial Bootstrap

Apply `prisma/migrations` first. `npm run portfolio:bootstrap:local` recreates only the local portfolio domain, creates or verifies the public media bucket, and seeds the canonical payload transactionally. Its ordinary inserts request one pending rebuild through the database triggers; bootstrap contains no indexing hook. It does not require or upload media binaries. For a new empty production environment, apply migrations and then run `npm run portfolio:bootstrap:production -- --confirm-production`. The production bootstrap prints its targets and refuses any independently initialized portfolio table; it does not overwrite content. Objects referenced by seeded media URLs may remain absent from Storage until their files are uploaded through the admin.

## 13. Production Setup

These are human-only operations:

1. Provision the approved Supabase Auth user without enabling public self-registration.
2. Configure Auth Site URL, production/local confirmation redirects and the documented token-hash email template.
3. Configure `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_EMBEDDING_MODEL`, `CRON_SECRET`, public Supabase URL/publishable key, the server-only Storage secret and `ADMIN_EMAIL` in the deployment environment.
4. Confirm the public `portfolio-media` bucket; no local media source directory is required.
5. Apply migrations and use the guarded bootstrap only when the portfolio domain is genuinely empty.
6. Deploy with database access available during `next build` and at runtime for cache misses/invalidation.
7. Exercise the manual verification checklist before treating admin operations as live.

No production Auth, Storage or deployment configuration is changed by repository code.

For the database-driven indexing rollout on an existing deployment:

1. Pause the Vercel search-index cron.
2. Deploy the reviewed application while the cron remains paused.
3. Apply the forward Prisma migration and confirm the singleton `portfolio` row is `pending`.
4. Run `npm run index:run:production -- --confirm-production`.
5. Confirm the job completed, current portfolio chunks are searchable and legacy chunks are gone.
6. Re-enable the cron and confirm its schedule remains `0 8 * * *`.

The operator-supplied confirmation flag is deliberately absent from `package.json`. The production rebuild command has the same guard: `npm run index:rebuild:production -- --confirm-production`.

## 14. Manual Verification Checklist

- Request a real magic link for the approved address; confirm delivery and `/admin` access.
- Confirm an unknown address cannot self-register or reach protected data/writes.
- Edit Home Hero copy and confirm Home updates without redeployment.
- Edit a shared Pay4Me field and confirm the relevant Home, Work and Audit consumers refresh.
- Edit an About-only Experience and confirm unrelated Work/Audit content is unchanged.
- Confirm the edit moves the singleton search-index job to `pending` without an application indexing call.
- Run `npm run index:run`, then confirm the assistant can retrieve the updated content.
- Delete an optional test record, rebuild successfully and confirm its content is no longer searchable.
- Reorder a relation and verify its order in the managed data.
- Attempt to delete a referenced reusable record and confirm the reason is shown.
- Upload an allowed image/video; verify preview, source change and old-object cleanup behaviour.
- Try an unsupported or oversized file and confirm the prior source remains unchanged.
- Visually compare all public pages at mobile and desktop widths.

## 15. Known Limitations

Real magic-link delivery depends on external Supabase email configuration and cannot be proven by unit tests. Production redirect, cookie and deployment behaviour requires the intended environment. The default Cache Components runtime cache can have platform-specific persistence characteristics; deployment verification must confirm the host’s cache behaviour. The approved content source defines only the default colour. The CV has no semantic admin editor. Project selection for Home/Audit remains curated code by design. Production indexing is intentionally daily rather than real time, so a committed content change waits until the next cron run unless an operator invokes a manual one-shot command.

## 16. Search-Index Operations and Recovery

The approved operational surface is exactly:

```bash
npm run index:run
npm run index:run:production -- --confirm-production
npm run index:rebuild
npm run index:rebuild:production -- --confirm-production
```

One invocation claims at most one job and exits; no command polls or sleeps. Every rebuild embeds the complete small portfolio. A failed attempt below three returns to immediately available pending state for a later one-shot invocation; the third failed attempt becomes terminal. With only the daily cron, retries therefore wait for later scheduled runs unless an operator runs a manual command. Processing older than ten minutes is recovered while still obeying the same attempt limit. A later portfolio mutation or explicit rebuild resets terminal failure to fresh pending work. A request arriving during processing sets `rerun_requested`, so settlement preserves it as a new pending run.

The old searchable snapshot remains available until a fully prepared replacement commits. Mapping, chunking, OpenAI, validation, deletion, insertion, or commit failure must therefore leave the previous snapshot intact.

Inspect the singleton safely with a read-only query:

```sql
SELECT job_key, status, rerun_requested, attempts, available_at, requested_at,
       claimed_at, processed_at, last_error
FROM public.search_index_jobs
WHERE job_key = 'portfolio';
```

Vercel Runtime Logs record `search_index.worker_started`, `search_index.worker_skipped`, `search_index.worker_completed`, `search_index.worker_failed`, and `search_index.stale_job_recovered`. Safe context includes attempt, duration, document/chunk counts, model name, and final state. Credentials, embeddings, raw provider responses, content bodies, and stack traces are excluded.
