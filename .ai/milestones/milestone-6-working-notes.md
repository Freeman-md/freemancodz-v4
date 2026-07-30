# Milestone 6 implementation working notes

## Phase 0 baseline — 2026-07-30

- Next.js `16.2.10`; read bundled App Router documentation for Server/Client Components, Route Handlers, and `proxy.ts`.
- Passed: `npm run prisma:validate`, `npm run prisma:generate`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- Existing failure preserved: `npm test` fails in `tests/assistant/render.test.tsx` because its expectation is `h3` while the existing Markdown input renders `h1`; no assertion was weakened.
- No source imports `scripts/` other than test/tooling references. Prisma output is generated only by its command and will not be hand-edited.

## Ledger / type classification

| Current area | Final disposition | Ownership |
| --- | --- | --- |
| `src/lib/{db,openai,env}` | server infrastructure | server-only infrastructure |
| `src/lib/{utils,links,navigation,site-metadata}`, `src/components` | `src/shared` | domain-free frontend/shared code |
| Portfolio loaders/queries/mappers | portfolio module services/repositories/mappers | server page-data models; no Server Component-only contract |
| Search indexing | search-index module | server models; worker HTTP payload contract |
| Assistant browser state | feature api/hooks/state/models | browser-owned `ChatMessage` |
| Assistant HTTP/stream/trigger shapes | `assistant.contract.ts` | runtime/trust-boundary contract |
| Blob path and worker HTTP results | dedicated contracts | runtime/trust-boundary contracts |
| Scripts and Prisma seed adapter | server entrypoints | process adapters; workflows stay in modules |

Contracts are required only at real HTTP/stream/client trust boundaries. Server Component-only prop passing uses server-owned module results and creates no placeholder contract.
