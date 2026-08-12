# Portfolio Content System

## 1. What Milestone 15 Built

Milestone 15 established PostgreSQL as the canonical runtime content source. Prisma migrations define Profile, ContentBlock, reusable Icon/Action/Media blocks, Projects, Experiences and their ordered relationships. `prisma/portfolio-seed-data.ts` is the one-time canonical seed input; repositories and four page services compose runtime reads. A guarded bootstrap uploads the approved public assets to Supabase Storage, seeds only an empty portfolio domain, and leaves existing search data intact. Legacy portfolio-source indexing fails closed pending a dedicated redesign.

## 2. What Milestone 16 Built

Milestone 16 connects `/`, `/work`, `/about` and `/audit` to those page services through presentation adapters and Cache Components. It adds the Freeman-only `/admin`, validated repository-owned writes, dependency tags and targeted invalidation, Supabase passwordless authentication, and protected media replacement with compensating cleanup. Static Notion mapping exceptions and the existing visual language remain frontend-owned.

## 3. Architecture Overview

```text
Public page
→ cached composed page data (`use cache`)
→ page service
→ repositories
→ Prisma
→ PostgreSQL
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

Provider errors are normalized before reaching a client. Request correctness does not depend on module-level memory.

## 4. Important Folders / Files

- `src/app/_portfolio/portfolio-page-cache.ts`: four cached public reads.
- `src/features/portfolio/models/presentation-adapters.ts`: deterministic backend-to-view adapters.
- `src/contracts/portfolio-presentation.contract.ts`: closed icon and project-visual identifiers.
- `src/contracts/portfolio-admin.contract.ts`: admin trust-boundary schemas and inferred types.
- `src/app/admin`: login, protected semantic editors and Server Actions.
- `src/app/api/admin/media/route.ts`: protected upload boundary.
- `src/server/modules/admin-auth`: auth provider and authorization service.
- `src/server/modules/portfolio`: read/write repositories, administration/media services and cache tags.
- `prisma/migrations` and `prisma/portfolio-seed-data.ts`: migration and bootstrap sources of truth.

## 5. Domain Model Summary

There is one Profile. ContentBlocks form URL-identified page trees and relate explicitly to reusable IconBlocks, ActionBlocks and MediaBlocks. ActionBlock and MediaBlock are typed extensions of IconBlock. Projects and Experiences are independent ordered collections; Experience has ordered icon relations and Project may point to one MediaBlock cover.

Key invariants: no generic page builder, no executable JSX stored in content, no arbitrary visual identifiers, no duplicate page-specific Profiles, no unsafe reusable-block deletion, and no deletion of the three canonical project slugs used by curated public selectors. Creating a Project does not automatically add it to Home or Audit.

The approved sources define no colour token palette, so the admin preserves the default `null` colour only. Profile deletion is deliberately absent.

## 6. Public Rendering & Cache Flow

`cacheComponents: true` enables Cache Components. Each public route is a Server Component that obtains one cached, composed page payload and converts it into semantic presentation data. A cache miss or invalidation performs the Prisma reads; a normal cache hit does not issue a fresh page-service query for each visitor.

`next build` may execute database-backed cached reads while prerendering public routes, so the build environment requires a reachable migrated and bootstrapped `DATABASE_URL`. After deployment, cached entries serve static-like output until their dependency tags are invalidated; they are not build-only content requiring redeployment. Admin/auth data is outside these cached functions and is private and dynamic.

## 7. Cache Tags / Revalidation

`PortfolioCacheTag` centrally names page, profile, projects/project slug, experiences/experience ID, content-block, icon-block, media-block and action-block tags. Each cached page registers its page tag plus every entity dependency discovered in its composed result. A shared Pay4Me Project therefore registers on Home, Work and Audit without broad site invalidation.

Server Actions call `updateTag()` only after a successful database write for immediate read-your-own-write behaviour. The media Route Handler calls `revalidateTag(tag, "max")` after storage and metadata succeed. Profile and collection changes invalidate `portfolio:profile`; Project collection changes invalidate `portfolio:projects`; reusable and section edits invalidate their entity tag. Failed writes do not invalidate caches.

## 8. Admin

Open `/admin`. The information architecture is Overview, Pages, Profile, Projects, Experience, Media and Reusable blocks. Editors expose domain fields, controlled icon/visual selectors, explicit relation selection/order, guarded deletion and confirmation. Projects and Experiences support create/update/delete; reusable records refuse deletion while referenced; the Profile is update-only.

The admin is intentionally not a schema editor, arbitrary component builder, CSS editor, generic database console or indexing console. Public selection rules and static mapping exceptions remain application-defined.

## 9. Authentication

The login form requests a Supabase email OTP with `shouldCreateUser: false`. The approved user must already exist. Supabase emails a PKCE magic link to `/auth/confirm`; the route verifies `token_hash`, and the server checks verified claims with `getClaims()`. Authentication establishes identity; `AdminAuthService` separately requires the normalized email to equal `ADMIN_EMAIL` (expected `freemanmadudili@gmail.com`). Every write and admin data read repeats authorization server-side. Proxy refresh is limited to `/admin` and `/auth`; protected layouts remain authoritative. Auth responses use private/no-store semantics.

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

Replacement order is upload new object → update database source → delete the previous managed object. If the database write fails, the new object is removed. If old-object cleanup fails after a successful database write, the new source remains canonical and the UI reports a cleanup warning. Only public URLs from the managed bucket are interpreted as removable object paths. `SUPABASE_SERVICE_ROLE_KEY` is server-only.

The CV remains the fixed `documents/cv` bucket object established by Milestone 15; replace it through the guarded bootstrap/storage operation. No CV database model was added.

## 11. Local Development

Do not commit environment files. Configure the documented variables in the local environment, then run:

```bash
npm install
npm run prisma:validate
npm run prisma:generate
npm run portfolio:bootstrap:local
npm run dev
```

The app requires `DATABASE_URL`. Admin/auth requires the public Supabase URL and publishable key plus `ADMIN_EMAIL`; Storage writes require `SUPABASE_SERVICE_ROLE_KEY`. Bootstrap additionally requires `PORTFOLIO_MEDIA_SOURCE_DIR` with the six approved files. Assistant functionality separately requires `OPENAI_API_KEY`.

Focused verification:

```bash
npm run test:portfolio:admin
PORTFOLIO_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54332/postgres npm run test:portfolio:database
```

## 12. Database / Initial Bootstrap

Apply `prisma/migrations` first. `npm run portfolio:bootstrap:local` recreates only the local portfolio domain, uploads missing approved assets and seeds the canonical payload transactionally. Production is deliberately separate: apply migrations, then run `npm run portfolio:bootstrap:production -- --confirm-production`. The production bootstrap prints its targets and refuses any independently initialized portfolio table; it does not overwrite content.

## 13. Production Setup

These are human-only operations:

1. Provision the approved Supabase Auth user without enabling public self-registration.
2. Configure Auth Site URL, production/local confirmation redirects and the documented token-hash email template.
3. Configure `DATABASE_URL`, public Supabase URL/publishable key, server-only Storage service-role key and `ADMIN_EMAIL` in the deployment environment.
4. Confirm the public `portfolio-media` bucket and bootstrap inputs.
5. Apply the production migration and guarded bootstrap commands above.
6. Deploy with database access available during `next build` and at runtime for cache misses/invalidation.
7. Exercise the manual verification checklist before treating admin operations as live.

No production Auth, Storage or deployment configuration is changed by repository code.

## 14. Manual Verification Checklist

- Request a real magic link for the approved address; confirm delivery and `/admin` access.
- Confirm an unknown address cannot self-register or reach protected data/writes.
- Edit Home Hero copy and confirm Home updates without redeployment.
- Edit a shared Pay4Me field and confirm the relevant Home, Work and Audit consumers refresh.
- Edit an About-only Experience and confirm unrelated Work/Audit content is unchanged.
- Reorder a relation and verify its public semantic order.
- Attempt to delete a referenced reusable record and confirm the reason is shown.
- Upload an allowed image/video; verify preview, source change and old-object cleanup behaviour.
- Try an unsupported or oversized file and confirm the prior source remains unchanged.
- Visually compare all public pages at mobile and desktop widths.

## 15. Known Limitations

Real magic-link delivery depends on external Supabase email configuration and cannot be proven by unit tests. Production redirect, cookie and deployment behaviour requires the intended environment. The default Cache Components runtime cache can have platform-specific persistence characteristics; deployment verification must confirm the host’s cache behaviour. The approved content source defines only the default colour. The CV has no semantic admin editor. Project selection for Home/Audit remains curated code by design.

## 16. Deferred Work

Portfolio-domain indexing redesign, embedding regeneration, assistant knowledge migration and any full re-index remain deferred to their dedicated future milestone. Admin writes deliberately do not create indexing jobs in this milestone.
