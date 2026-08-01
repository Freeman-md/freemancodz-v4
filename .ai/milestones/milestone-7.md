# Milestone 7: Class-Based Backend Composition

**Status:** Frozen
**Version:** 1.0.0  
**Last Updated:** 2026-07-31  
**Depends On:** Milestone 6  
**Target Pull Request:** —  
**Target Branch:** `feat/milestone-7-class-based-backend`  
**Superseded By:** —

## Goal

Refactor the Milestone 6 backend modules to the class-based service, repository, provider, interface and composition-root standard defined in `.agents/skills/nextjs-architecture/SKILL.md`, without changing application behaviour.

## Required behaviour

- Add `src/server/composition-root.ts` as the only production composition root. It must instantiate repositories, providers and services, inject their dependencies through constructors, export configured service instances typed by their interfaces, and contain no business logic.
- Replace operation-specific assistant service files with `src/server/modules/assistant/services/assistant.service.ts` and `src/server/modules/assistant/interfaces/assistant.service.interface.ts`. `AssistantService` must implement `IAssistantService` and expose `createResponse(...)` and `checkRateLimit(...)` as its public methods.
- Keep assistant operations used only by `AssistantService`, including context retrieval, retrieval-query expansion and rate-limit counter maintenance, private to the class. Keep pure stream/context transformations as mapper functions when they remain independently meaningful.
- Replace the current OpenAI response and embedding adapters with one shared `OpenAIProvider` implementing `IOpenAIProvider`. Use `src/server/infrastructure/openai/openai.provider.ts` and `src/server/infrastructure/openai/interfaces/openai.provider.interface.ts`. The provider must support response streaming, single and batch embeddings, and access to the configured embedding model. The composition root must create one provider instance and inject it into both assistant and search-index services.
- Remove `openai-response.provider.ts`, `openai-query-embedding.provider.ts` and `openai-embedding.provider.ts` after all consumers use `OpenAIProvider`. Do not retain compatibility exports.
- Replace the portfolio operation-specific services with `PortfolioService implements IPortfolioService`. It must expose `getHomePageData()`, `getWorkPageData()`, `getAboutPageData()` and `getAsset(pathname)`. Keep portfolio seeding separate as `PortfolioSeedService implements IPortfolioSeedService` with a public `seed(data)` method because it is a destructive maintenance workflow with a separate lifecycle.
- Convert every portfolio repository into a class implementing its matching interface and receiving Prisma through its constructor. Preserve focused repositories for content blocks, experiences, principles, projects, portfolio services and seed replacement. Rename the ambiguous `service.repository.ts` to `portfolio-service.repository.ts` with `PortfolioServiceRepository` and `IPortfolioServiceRepository`.
- Replace the search-index operation-specific services with `SearchIndexService implements ISearchIndexService`. It must expose `search(...)`, `indexSource(...)`, `removeSource(...)`, `preview(...)`, `rebuild()` and `getJobStatus()`.
- Create `SearchIndexWorkerService implements ISearchIndexWorkerService` with public `runBatch(limit)` behaviour. Keep single-use worker helpers such as job processing and job-detail construction private to the class.
- Move HTTP authorization and HTTP status translation for the protected search-index worker back to `src/app/api/internal/search-index-worker/route.ts`. Keep batch-limit parsing as a private route helper when it has no other consumer. Preserve the current `200`, `401` and safe `500` responses and bounded batch behaviour.
- Convert search-index repositories into classes implementing matching interfaces and receiving Prisma through their constructors. `SiteChunkRepository` must own source lookup, replacement, deletion and vector matching. Merge the operation-specific `match-site-chunks.repository.ts` into `site-chunk.repository.ts` and remove the old file.
- Keep `IndexingSourceRepository` and `SearchIndexJobRepository` as separate persistence boundaries. Their public methods must cover the existing source lookup/enumeration and job claim/complete/fail/status behaviour without changing persistence semantics.
- Convert `vercel-blob.provider.ts` into `VercelBlobProvider implements IVercelBlobProvider`, injected into `PortfolioService` through its constructor.
- Add module-owned interface files using the required dot naming convention, including `assistant.service.interface.ts`, `portfolio.service.interface.ts`, `portfolio-seed.service.interface.ts`, `search-index.service.interface.ts`, `search-index-worker.service.interface.ts`, `<subject>.repository.interface.ts` and `vercel-blob.provider.interface.ts`. Interface symbols must use the `I` prefix.
- Update each module's `public.ts` to expose only supported service interfaces, public models, contracts and errors. It must not construct dependencies or export repositories, providers, private helpers or operation-specific service functions.
- Update Route Handlers, Server Components and server entrypoints to import configured service instances from `src/server/composition-root.ts`. Backend modules must not import the composition root.
- Preserve pure mappers, factories and schemas as functions. Do not convert them into classes. Keep a helper in its owning file or class when it has one consumer; extract it only when it is reused or represents a separate responsibility.
- Remove all replaced operation-specific service files, factory-style dependency constructors, module-level configured service exports and stale imports after the class-based replacements are in use.
- Remove the stale `test:architecture` package script and remove it from the aggregate `test` command because `tests/architecture/nextjs-architecture.test.ts` has already been deleted. Do not create a replacement architecture test.
- Update focused tests and test imports so service behaviour is tested by constructing classes with fake interface implementations rather than using production composition or function-factory dependency objects.

## Constraints

- Preserve assistant streaming order, fallback behaviour, citations, follow-up response IDs, safe errors, abort handling and current best-effort per-instance rate-limit semantics.
- Preserve portfolio page data, asset streaming and seed behaviour.
- Preserve search ranking, embedding dimensions and models, chunk preparation, skip-unchanged behaviour, atomic replacement, job retry transitions, worker limits and operational command behaviour.
- Follow `.agents/skills/nextjs-architecture/SKILL.md` and `AGENTS.md`. Do not modify either document in this milestone.
- Use manual constructor injection. Do not add a dependency-injection framework, service locator, generic base service or generic base repository.
- Keep classes stateless across requests except for the existing explicitly best-effort in-process rate-limit counters.
- Do not create one class per operation and do not create a God service. Split only the portfolio seed and search-index worker services because their responsibilities and execution lifecycles are distinct.
- Only repositories may perform application persistence or raw SQL. Only `OpenAIProvider` may call the OpenAI SDK. Only `VercelBlobProvider` may call the Vercel Blob SDK.
- Keep existing runtime contracts and public URLs unchanged. Change callers only as required to consume the composed services.
- Implement the smallest complete migration and delete old paths once their replacements pass focused validation.

## Explicitly out of scope

- New product features, routes, UI, copy or visual changes
- Database schema, migration or seed-data changes
- Search, embedding, streaming, rate-limit or worker algorithm changes
- New external infrastructure, queues, caches or global rate limiting
- Frontend Hook, component, state or API-client refactors unrelated to required imports
- Changes to the architectural skill, `AGENTS.md` or Milestone 6
- A replacement architecture test or file-layout test suite
- Unrelated refactoring or future work

## Required tests

1. Assistant service tests cover direct portfolio questions, follow-ups, sources, empty retrieval fallback, retrieval/provider failures, aborts and rate limiting using injected fakes.
2. Portfolio service and seed-service tests preserve current page data, missing-data failures, asset outcomes and seed success/failure behaviour using injected repository/provider interfaces.
3. Search-index service tests preserve retrieval diversity, index/create/update/unchanged/delete planning, preview, rebuild, removal and status behaviour using injected fakes.
4. Search-index worker tests preserve completed, retried, failed and unsettled job outcomes, while Route Handler tests preserve authorization, configuration failure, safe worker failure and bounded success responses.
5. Repository and provider tests retain meaningful persistence/provider boundary coverage without testing private methods or class wiring.
6. Existing tests remain green, and `npm run prisma:validate`, `npm run prisma:generate`, `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.

## Acceptance criteria

Include only criteria the implementation and review agents can verify from repository evidence, automated tests, CI or accessible runtime behaviour.

- [ ] `src/server/composition-root.ts` is the only production dependency-composition location.
- [ ] Assistant, portfolio, portfolio-seed, search-index and search-index-worker services are cohesive classes implementing their matching `I`-prefixed interfaces.
- [ ] Repositories and providers are classes implementing matching interfaces and receive their dependencies through constructors.
- [ ] One shared `OpenAIProvider` supplies both response and embedding operations; the three operation-specific OpenAI provider files no longer exist.
- [ ] Operation-specific service files and factory-style configured exports have been removed without compatibility wrappers.
- [ ] `match-site-chunks.repository.ts` has been absorbed into `SiteChunkRepository`.
- [ ] Route Handlers, Server Components and server entrypoints use configured services from the composition root, while backend modules do not import it.
- [ ] Private one-use helpers remain private, and pure mappers, factories and schemas remain functions.
- [ ] Public module APIs expose supported interfaces and models without exposing repositories, providers or private implementation details.
- [ ] The stale architecture test package command has been removed and no replacement architecture test was added.
- [ ] Relevant existing behaviour remains intact.
- [ ] Explicitly excluded work was not introduced.
- [ ] Focused tests pass.
- [ ] Repository validation commands pass.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual tasks

None.

## Manual acceptance criteria

None.
