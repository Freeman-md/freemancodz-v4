# Engineering controls audit — Freemancodz V4

Assessment date: **2026-11-13 (Europe/London)**. Repository revision: `f6ea50c13fbf245d4f0403c697c98f27cbd4f3f5`, branch `main`, with the pre-existing edit to `src/app/api/chat/constants.ts`. This is the Task 03 descriptive audit, not a new standard, exception approval or remediation. The execution agent changed only this document.

Inputs: [Codebase Intelligence](../CODEBASE_INTELLIGENCE.md), [Task 03 prompt](setup/prompts/task-03.md), root `AGENTS.md`, the architecture skill, actual source/configuration/tests, host milestone skills and [orchestrator-observed hosted evidence](setup/evidence/hosted-audit.json). The intelligence report remains a historical Task 01 assessment; this audit adds executed checks and more precise hosted findings.

## A. Executive summary

The repository has useful manual checks and substantive behavioral tests. ESLint, TypeScript, Prisma schema validation and all **39 unit tests** passed in this audit. After an authorised rerun outside the sandbox's loopback restriction, integration execution reported **40 passed, 6 skipped, 0 failed**. Those six skips are database verification gaps, not passes. The separate portfolio database suite failed four prerequisite assertions with its database URL deliberately unset. A bounded Prettier check found **11 existing files** with formatting drift.

Deterministic architecture enforcement is partial. In-memory probes showed that configured alias restrictions reject a module-to-app import and a browser-to-composition import, while relative module-to-app imports, direct app imports of singular repository files and infrastructure-to-business imports pass. The checks do not establish semantic responsibility, transaction correctness or full dependency-graph compliance.

No installed local Git hook, tracked CI workflow or canonical verification command was found. Hosted `main` has an active deletion/non-fast-forward ruleset, but no observed required quality-status or PR-review rule. GitHub Actions returned `total_count: 0`. A Vercel success status exists for the inspected commit; it does not establish the application verification or merge gates requested by the catalogue.

Existing global milestone skills already contain architecture approval, independent review and separate human merge checkpoints. Reuse them. Their repository-specific examples mention JPScents; Freemancodz V4 still lacks the canonical approved contracts/ADR linkage and demonstrated trials required for this catalogue's handoff. No milestone readiness is claimed.

## B. Existing controls matrix

Status vocabulary: **Verified** means the stated, bounded observation was checked; **Partially Enforced** means some documented coverage is mechanical but gaps remain; **Advisory Only** means compliance depends on human/agent conduct; **Missing** means no control was found within the inspected boundary; **Unverified** means execution, activation or required evidence is unavailable. A verified manual check can still be omitted by a developer and is not a merge gate.

| Control                              | Location                                                                                     | Purpose                                                                                           | Trigger                                        | Enforcement type                           | Verification status                                                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Repository working agreements        | `AGENTS.md`                                                                                  | Scope, safety, architecture routing, checks and milestone ownership                               | Agent loads repository instructions            | Advisory / review                          | **Advisory Only**; read in this session, not a deterministic restriction                                                 |
| Architecture skill                   | `.agents/skills/nextjs-architecture/SKILL.md`                                                | Ownership, dependency direction, server/client boundaries, composition                            | Required by `AGENTS.md` before Next work       | Advisory / review                          | **Partially Enforced** through limited ESLint rules; responsibility remains review-required                              |
| Supabase skill                       | `.agents/skills/supabase/SKILL.md`                                                           | Supabase APIs, RLS and database workflow guidance                                                 | Skill description/routing                      | Advisory                                   | **Advisory Only**; migration workflow conflicts with repository authority, discussed below                               |
| Postgres best-practices skill        | `.agents/skills/supabase-postgres-best-practices/SKILL.md`                                   | SQL/performance/security guidance by topic                                                        | Relevant query/schema work                     | Advisory                                   | **Advisory Only**; no automatic query-plan or database check invocation found                                            |
| Milestone authoring/execution/review | Host skills `milestone-authoring`, `milestone-workflow`; root `AGENTS.md` Milestones section | Approved scope, architecture screening, independent correction loop, human merge                  | Explicit milestone commands                    | Agent workflow / review                    | **Advisory Only** for written checkpoints; Freemancodz operational trials **Unverified**                                 |
| Other client instruction files       | No `CLAUDE.md`, `.cursorrules`, Copilot instruction or `.codex` configuration found          | Cross-client consistency                                                                          | None observed                                  | None                                       | **Missing** within repository inventory; do not create clients the repository does not support                           |
| ESLint baseline                      | `eslint.config.mjs`; `package.json:10`                                                       | Next core-web-vitals, braces, statement/class spacing                                             | `npm run lint` manually                        | Deterministic                              | **Verified** exit 0 on this working tree; no automatic trigger found                                                     |
| Architectural import restrictions    | `eslint.config.mjs:72–132`                                                                   | Selected app/module/browser import directions                                                     | Same lint command                              | Deterministic subset                       | **Partially Enforced**; six in-memory probes below reveal three uncovered relationships                                  |
| Formatting                           | `.prettierrc.json`, `.prettierignore`; `package.json:12–13`                                  | Semicolons, quotes, indentation, trailing commas, line width                                      | Manual formatter/check                         | Deterministic                              | **Verified** bounded check exits 1 and identifies 11 files; full broad `format:check` intentionally not executed         |
| TypeScript                           | `tsconfig.json`; `package.json:14`                                                           | Strict typing, no emitted application JS                                                          | Manual typecheck                               | Deterministic                              | **Verified** `--incremental false` exits 0 using existing generated clients/types                                        |
| Prisma schema validation             | `prisma.config.ts`, `prisma/schema.prisma`                                                   | Schema syntactic/relational validity                                                              | Manual `prisma:validate`                       | Deterministic                              | **Verified** exit 0 with a synthetic URL; no database connection or migration verification                               |
| Prisma generation                    | `package.json:7`, `:16`                                                                      | Generate ORM client                                                                               | `postinstall` or manual                        | Deterministic generation                   | **Unverified** in this audit; would write generated files                                                                |
| Unit tests                           | `tests/unit/{assistant,portfolio,workflow}`                                                  | Stream parsing, proxy routes, input/target validation, provider adapters, workflow initialization | `npm run test:unit`, first stage of `npm test` | Behavioral with injected fakes             | **Verified** 39 passed, no skips                                                                                         |
| Assistant integration                | `tests/integration/assistant/chat.test.ts`, `chat.fixture.ts`                                | Request/stream/tool/ownership behavior, one real loopback HTTP disconnect boundary                | `npm run test:integration`                     | Behavioral; providers/repos generally fake | **Verified** non-database cases pass after loopback-capable rerun; not live-provider proof                               |
| Database integration                 | `tests/integration/{rate-limit,workflow,portfolio}`                                          | Migrations, privacy, concurrency, persisted outcomes, recovery                                    | Integration scripts + database URLs            | Real DB tests when enabled                 | **Unverified** real boundary; six tests skipped, separate portfolio command failed its four missing-target prerequisites |
| Browser tests                        | `tests/e2e/*.test.ts`, `*.mjs`, `browser.config.mjs`                                         | UI/focus/responsiveness/workflow restoration and fixture variants                                 | Explicit manual commands in docs               | Browser/controlled integration             | **Unverified**; not in default scripts, requires external Playwright/browser availability and prepared fixture app       |
| Coverage / complexity / graph checks | No configured coverage gate, complexity threshold or resolved graph checker found            | Coverage measurement, structural risk                                                             | None found                                     | None                                       | **Missing**; catalogue examples are not approved thresholds for this repository                                          |
| Local Git hooks                      | `core.hooksPath` unset; `.git/hooks` has only 14 `.sample` files; no `.husky`/`.githooks`    | Pre-commit/pre-push feedback                                                                      | None active observed                           | None                                       | **Missing** in this checkout; sample executable bits do not activate samples                                             |
| Canonical verification               | No `verify` script in `package.json`                                                         | One complete observable gate                                                                      | None                                           | None                                       | **Missing**; documented list of commands is not an executable combined gate                                              |
| Repository CI                        | No `.github` directory; hosted Actions listing count 0                                       | Mandatory automated checks                                                                        | No observed workflow                           | None observed                              | **Missing** at inspected source/hosted boundary                                                                          |
| Vercel commit status                 | Hosted evidence for inspected SHA                                                            | Hosting deployment status                                                                         | Existing hosting integration                   | External status                            | **Verified** successful status observation only; underlying checks/settings not audited                                  |
| Hosted branch preservation           | Active ruleset 19097664 for default branch/main                                              | Reject deletion and non-fast-forward updates                                                      | Hosted Git updates                             | Hosted rules                               | **Verified** settings observation; no destructive rejection trial performed                                              |
| Hosted quality/PR merge protection   | Same ruleset, legacy-protection endpoint                                                     | Require quality or reviewed PR before merge                                                       | No applicable rule observed                    | None observed                              | **Missing** in inspected hosted rules; owner approval required before changes                                            |
| Security automation                  | Package/scripts/CI inventory                                                                 | Dependency audit, secret detection, security scanners                                             | No configured invocation found                 | None observed                              | **Missing** in repository automation; vulnerability/host security posture **Unverified**                                 |
| Database privacy constraints         | Committed SQL migrations; DB suites                                                          | RLS, grants, uniqueness and private workflow/meeting tables                                       | Migration apply + DB tests                     | Database enforcement when applied          | **Unverified** on a real target in this audit; SQL and tests inspected                                                   |
| Release/promotion gate and scheduler | `docs/integrations.md`, `docs/workflow-foundation.md:15`                                     | Deploy/recover approved work                                                                      | Operator/hosting setup                         | Operational                                | **Unverified** activation and release authorization; no changes made                                                     |

All executed commands expose exit status and diagnostics. No observed local control forces a contributor to run the full application obligations. Type/lint can fail deterministically when invoked, while a developer can omit invocation; hosted source-preservation rules do not fill that gap.

### Agent instructions, skills and precedence

Only root `AGENTS.md` was found among repository agent instruction entry points. Its architecture skill is discoverable in the current session and was read; universal discovery across other clients is unverified. The repository also contains the two Supabase skills above and `skills-lock.json`. External plugin availability is not repository enforcement.

The host files inspected for existing milestone behavior were:

- `~/.agents/skills/milestone-authoring/SKILL.md` and `references/contract-template.md`.
- `~/.agents/skills/milestone-workflow/SKILL.md` and `references/review-template.md`.

These host-relative references identify existing shared skills, not new repository-local copies. Authoring has an architecture-approval table and propagation/execution-acknowledgement fields. Execution independently escalates unforeseen decisions and blocks affected work. Review checks accepted ADRs, scope/version and explicit owner evidence before approval. Review history is preserved, with a three-pass default budget. Only the human merges. The current setup uses separate executor/reviewer contexts, but that is not a trial of the final milestone integration.

The Supabase skill's direct-schema iteration and `supabase migration new`/pull instructions conflict with `AGENTS.md`'s requirement that **Prisma migrations are the schema source of truth**. Repository/user instructions take precedence. The audit did not invoke that lower-priority migration workflow, create a competing migration history or change the skill. Task 04 should make this existing precedence explicit; Task 08 can align navigation under its approved scope.

## C. Architectural consistency findings

### Representative flows and legitimate variation

1. **Public pages:** `src/app/page.tsx:19` and `src/app/work/[slug]/page.tsx:18` use configured services directly from Server Components. `src/modules/portfolio/services/public-portfolio.service.ts` owns ordering/completeness policy; its repository owns reads. This is consistent with avoiding calls from Server Components to the app's own HTTP API. Static public pages and dynamic assistant routes are legitimate different execution modes.
2. **Assistant:** `src/app/_assistant/hooks/useAssistant.ts` owns local UI state, colocated API adapters validate streamed contracts, and `src/app/api/chat/post.ts` parses/limits/translates requests through configured/injected services. `src/modules/assistant/service.ts` owns model/tool flow; provider operations are implemented in infrastructure. Route handler factory functions are useful test seams, not evidence of a second production composition root.
3. **Workflow:** `src/modules/composition.ts:103` constructs definitions/providers and injects them. `src/modules/workflow/repository.ts:49` owns optimistic updates; `src/modules/workflow/run-repository.ts:15` owns transactional claims/fencing. Tests inspect outcomes rather than only class layout. A database-backed runner is justified by persisted approvals and retryable side effects already implemented; this audit does not propose a new queue or worker service.
4. **UI and private types:** app private areas hold components/hooks/API adapters; public schemas live in `src/contracts`. Services use constructor injection and small `Pick` seams. Different file layouts between a single-service module and portfolio's multiple repositories/services are not automatically defects.

### Concrete rule tension and ownership gaps

| ID          | Classification         | Evidence and consequence                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ARCH-AUD-01 | **Partially Enforced** | Alias restrictions in `eslint.config.mjs:72–132` do not resolve all dependency forms; relative imports and singular repository files bypass them. Executed probes below confirm the gap.                                                                                                                                                                                                                                                                                       |
| ARCH-AUD-02 | **Advisory Only**      | The skill restricts cross-module use to public types/injected dependencies, but `src/modules/workflow/definitions/meeting-booking/tool-handlers.ts:2–3` directly imports Meeting config/time functions and `actions.ts:11` imports matching helpers from Meeting service. These are runtime imports, not type-only relationships. Treat this as existing architectural tension requiring Task 04 resolution; do not silently accept it as an exception.                        |
| ARCH-AUD-03 | **Advisory Only**      | Modules also import infrastructure runtime error classes: `tool-handlers.ts:1` uses `CalendarAvailabilityError`; `actions.ts:4–9` uses Calendar/Resend errors. This is distinct from type-only transport dependencies (`src/modules/assistant/service.ts:12`, `src/modules/workflow/types.ts:4`). The skill's terse dependency direction does not explicitly describe this technical error boundary. Task 04 must classify it without assuming implementation equals approval. |
| ARCH-AUD-04 | **Advisory Only**      | Central runtime configuration is required, but `src/app/api/chat/post.ts:13` reads `process.env.VERCEL` directly and `src/app/api/chat/constants.ts` reads the runtime environment for cookie naming/security. Whether transport/platform metadata is permitted outside the central module needs an explicit bounded contract. The user-edited constants file is preserved.                                                                                                    |
| ARCH-AUD-05 | **Unverified**         | SQL expresses privacy/concurrency invariants, but no real DB suite ran. For example, `prisma/migrations/20261111130000_add_workflow_approval_and_runs/migration.sql:45–51` enables RLS and revokes role access; `run-repository.ts` uses claim tokens and transactions. Neither lint nor schema validation proves actual applied privileges or concurrency behavior.                                                                                                           |
| ARCH-AUD-06 | **Advisory Only**      | No static check establishes whether a route contains product policy or a service contains excessive responsibilities. Existing syntax/import checks and a green typecheck cannot replace independent semantic review.                                                                                                                                                                                                                                                          |

These findings identify current evidence and questions; they do not grant an exception, rewrite the canonical skill or approve broader dependencies.

## D. Enforcement gaps, ranked

| ID       | Priority | Status                 | Gap and impact                                                                                                                                                                                                                                           | Evidence / next owner                                                                                                                                                                                                          |
| -------- | -------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CTRL-001 | High     | **Partially Enforced** | Integration command exits 0 even when six DB cases skip. Required persistence evidence can be absent behind green test output. Portfolio DB suite is outside `npm test`.                                                                                 | Commands C04–C06; `package.json:18–21`; later verification contract must account for executed/skipped stages                                                                                                                   |
| CTRL-002 | High     | **Missing**            | No canonical verification, installed Git hook, hosted quality workflow or required quality/PR review rule. Ordinary merging does not require the intended evidence.                                                                                      | Matrix; hosted evidence; Tasks 11–12 after approval                                                                                                                                                                            |
| CTRL-003 | High     | **Partially Enforced** | Database test isolation checks vary. Portfolio/rate-limit/contact tests create a random database on the supplied server; some workflow tests use the supplied migrated database directly. Approval test checks localhost, but this guard is not uniform. | `tests/integration/portfolio/portfolio-database.test.ts:54`; `tests/integration/rate-limit/rate-limit-database.test.ts:58`; `tests/integration/workflow/workflow-database.test.ts:17`; `workflow-approval.test.ts:89`; Task 10 |
| CTRL-004 | High     | **Unverified**         | Live recovery scheduling, deployed schema, backup/restore and release-promotion obligations are unverified. A Vercel success status is insufficient.                                                                                                     | `docs/workflow-foundation.md:15`; hosting record; separate authorised operational verification                                                                                                                                 |
| CTRL-005 | Medium   | **Partially Enforced** | Documented import/ownership rules are broader than mechanical coverage; no cycle/relative-resolution enforcement found.                                                                                                                                  | Six probes and ARCH-AUD-01; Task 09 after contract approval                                                                                                                                                                    |
| CTRL-006 | Medium   | **Advisory Only**      | Runtime cross-module/infrastructure edges and platform env reads need explicit classification against the skill; Supabase migration guidance conflicts with higher-priority Prisma authority.                                                            | ARCH-AUD-02–04; agent-skill section; Task 04 decision                                                                                                                                                                          |
| CTRL-007 | Medium   | **Verified**           | Bounded formatting check detects 11 existing nonconforming files; lint passes despite this drift because formatting is separately invoked.                                                                                                               | C07; no files reformatted by this audit                                                                                                                                                                                        |
| CTRL-008 | Medium   | **Unverified**         | Browser suites require separately supplied Playwright/browser and prepared apps, are outside default package test scripts, and were not exercised.                                                                                                       | `tests/e2e/browser.config.mjs`, `tests/e2e/workflow.test.ts:13`; Task 10                                                                                                                                                       |
| CTRL-009 | Medium   | **Advisory Only**      | Host milestone ADR checkpoints exist, but Freemancodz canonical registry/change-control references and mandatory authoring/execution/review/handoff trials are not established.                                                                          | Existing host skills; no task-15 completion claimed                                                                                                                                                                            |
| CTRL-010 | Medium   | **Missing**            | No configured security/dependency/secret scanning gate or coverage gate found in scripts/CI. No current vulnerability-free claim is possible.                                                                                                            | `package.json`, absent CI; future risk-based scope decision, not permission to scan secret files                                                                                                                               |
| CTRL-011 | Low      | **Unverified**         | Fresh-clone reproducibility is not proved: typecheck/tests use existing generated Prisma and Next types; no install/generation/build/browser rehearsal occurred.                                                                                         | C02 and omitted commands; new runner proof needed later                                                                                                                                                                        |

The executed test output contained no unexpected `TypeError`. Meaningful observed assertions include malformed-stream rejection, no provider/tool execution before validation, exact saved workflow ownership, abort behavior and safe provider error translation. This is bounded evidence for executed cases, not a conclusion that all tests are sufficient or all failures are observable.

### Executed local checks

Commands ran from the repository root on Node `v22.17.0`, Next `16.2.12`. Database URLs were **explicitly set empty** for test invocations; they were not read or copied from secret files. The Prisma URL is a synthetic local, password-free value used only to bypass conditional dotenv loading and validate schema. No command connected to a database or real external provider.

| ID  | Exact command                                                                                            | Exit / result                                                                                        | Meaning                                                                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C01 | `npm run lint`                                                                                           | **0**; no diagnostics                                                                                | Existing ESLint rules pass on current files, not comprehensive architecture proof                                                                                                                 |
| C02 | `npm run typecheck -- --incremental false`                                                               | **0**; no diagnostics                                                                                | No cache written; uses pre-existing generated Prisma/Next artifacts                                                                                                                               |
| C03 | `DATABASE_URL=postgresql://setup@127.0.0.1:5432/setup_audit npm run prisma:validate`                     | **0**; schema valid                                                                                  | Prisma config loaded; `.env` conditional was bypassed; no migration or DB behavior tested                                                                                                         |
| C04 | `PORTFOLIO_TEST_DATABASE_URL= WORKFLOW_TEST_DATABASE_URL= DATABASE_URL= npm test`                        | **1** in sandbox. Unit: 39 pass / 0 fail / 0 skip. Integration: 39 pass / 1 fail / 6 skip, 46 total. | Sole failure: HTTP disconnect test could not bind loopback (`listen EPERM: operation not permitted 127.0.0.1`), an environment restriction                                                        |
| C05 | `PORTFOLIO_TEST_DATABASE_URL= WORKFLOW_TEST_DATABASE_URL= DATABASE_URL= npm run test:integration`        | **0** after approved execution escalation. 40 pass / 0 fail / 6 skip, 46 total.                      | HTTP disconnect case passed with real loopback; fake providers/repos remain fake; DB cases remain unverified                                                                                      |
| C06 | `PORTFOLIO_TEST_DATABASE_URL= WORKFLOW_TEST_DATABASE_URL= DATABASE_URL= npm run test:portfolio:database` | **1**. 0 pass / 4 fail / 0 skip.                                                                     | Each fails before connection with “Set PORTFOLIO_TEST_DATABASE_URL to a disposable PostgreSQL server with pgvector.” This proves prerequisite rejection, not an application defect or DB behavior |
| C07 | Bounded Prettier command below                                                                           | **1**; 11 files reported                                                                             | Existing formatting drift, no automatic correction                                                                                                                                                |
| C08 | In-memory ESLint probe below                                                                             | **0** for probe harness; diagnostics per case below                                                  | Two expected imports produce error-severity diagnostics; three forbidden relationships escape configured rules; no fixture files written                                                          |
| C09 | `git config --get core.hooksPath`                                                                        | **1**, no output                                                                                     | No effective hooksPath override observed                                                                                                                                                          |
| C10 | Metadata-only directory inspection                                                                       | **0**                                                                                                | `.git/hooks`: 14 sample files only; no `.github`, `.husky`, `.githooks`, `.codex`; `.agents/milestones` directory exists with no files returned by inventory                                      |
| C11 | `git diff --check`                                                                                       | **0**                                                                                                | No tracked diff whitespace errors; final document separately formatted                                                                                                                            |

C04's failure remains part of the record. C05 resolves that one infrastructure limitation; it does not turn the skipped database stages into green integration verification. The full `npm test` command was not rerun after C05 because its already-passing unit stage had not changed.

Bounded C07 command (deliberately avoids an unrestricted scan that could read secret files):

```sh
node_modules/.bin/prettier --check 'src/**/*.{ts,tsx,css}' 'tests/**/*.{ts,mjs}' 'prisma/seed-data/*.json' package.json tsconfig.json next.config.ts prisma.config.ts eslint.config.mjs tailwind.config.ts postcss.config.mjs .prettierrc.json README.md docs/assistant.md docs/rag.md docs/workflow-foundation.md docs/integrations.md docs/portfolio-content-system.md
```

Reported paths:

1. `src/app/_assistant/assistant.css`
2. `src/app/_portfolio/components/SectionReveal.tsx`
3. `src/modules/assistant/errors.ts`
4. `src/modules/rate-limit/repository.ts`
5. `src/modules/rate-limit/service.ts`
6. `tests/e2e/fixtures/request-services.ts`
7. `tests/e2e/stage-workflow-variant.mjs`
8. `tests/integration/workflow/workflow-migration.test.ts`
9. `README.md`
10. `docs/integrations.md`
11. `docs/portfolio-content-system.md`

The six C05 skipped cases are rate-limit migration/concurrency/privacy, Contact migration/idempotency, workflow approval/fencing/reconciliation, concurrent workflow start/version pinning, draft discard ownership/revision, and workflow migration preservation. Their parent `test(...)` blocks did not run; nested assertions within them are not counted as executed evidence.

### In-memory architecture coverage probes

C08 called the installed ESLint API against the actual configuration, using virtual filenames only. The harness itself exits 0 because it reports observations; this is not a demonstration of separate CLI rejection exit codes, hook rejection or hosted merge rejection.

```js
import { ESLint } from "eslint";
const eslint = new ESLint();
const cases = [
  ["allowed-module", "src/modules/audit-fixture.ts", "export const auditFixture = 1;\n"],
  [
    "module-alias-app",
    "src/modules/audit-fixture.ts",
    'import value from "@/app/page";\n\nexport { value };\n',
  ],
  [
    "module-relative-app",
    "src/modules/audit-fixture.ts",
    'import value from "../app/page";\n\nexport { value };\n',
  ],
  [
    "app-singular-repository",
    "src/app/api/audit-fixture/route.ts",
    'import { WorkflowRepository } from "@/modules/workflow/repository";\n\nexport { WorkflowRepository };\n',
  ],
  [
    "infrastructure-business",
    "src/infrastructure/audit-fixture.ts",
    'import { WorkflowService } from "@/modules/workflow/service";\n\nexport { WorkflowService };\n',
  ],
  [
    "browser-composition",
    "src/app/_assistant/audit-fixture.ts",
    'import { workflowService } from "@/modules/composition";\n\nexport { workflowService };\n',
  ],
];
for (const [name, filePath, text] of cases) {
  const [r] = await eslint.lintText(text, { filePath });
  console.log(
    JSON.stringify({
      name,
      filePath,
      errors: r.errorCount,
      warnings: r.warningCount,
      messages: r.messages.map(({ ruleId, severity, message }) => ({ ruleId, severity, message })),
    }),
  );
}
```

Executed using `node --input-type=module` with that program on stdin. Outcomes:

| Case                    | Errors / warnings | Observed diagnostic                                                |
| ----------------------- | ----------------- | ------------------------------------------------------------------ |
| allowed-module          | 0 / 0             | None                                                               |
| module-alias-app        | 1 / 0             | `no-restricted-imports`, severity 2: alias app import restricted   |
| module-relative-app     | 0 / 0             | None — uncovered dependency form                                   |
| app-singular-repository | 0 / 0             | None — uncovered repository path                                   |
| infrastructure-business | 0 / 0             | None — no infrastructure direction rule                            |
| browser-composition     | 1 / 0             | `no-restricted-imports`, severity 2: composition import restricted |

These probes audit existing controls. No new checker, baseline, suppression, fixture file or rule was introduced.

### Hosted evidence and bounded interpretation

The orchestrator's read-only commands, exact exits and results are preserved in [hosted-audit.json](setup/evidence/hosted-audit.json). They are mutable settings observed on the assessment date, not a perpetual guarantee:

- Initial sandbox GitHub request failed network access; the authorised retry succeeded.
- `branches/main` reported `protected: true`.
- The legacy `branches/main/protection` endpoint returned HTTP 404, but an active repository ruleset exists. Do not interpret the legacy response as no protection of any kind.
- Ruleset `19097664` applies to the default branch and `refs/heads/main`, has no bypass actors or exclusions, and contains only `deletion` and `non_fast_forward` rules.
- No `required_status_checks` or `pull_request` rule was observed.
- The general Actions run listing reported `total_count: 0`; this is stronger than the earlier connector's empty PR-only page, but still an observation at query time.
- The current commit has a successful Vercel status. Its internal build command, promotion policy, runtime behavior and recovery scheduler were not verified.

No hosted setting, workflow, branch, PR, deployment or release was changed by this audit.

### Snapshot identity and limitations

- Head: `f6ea50c13fbf245d4f0403c697c98f27cbd4f3f5`.
- Pre-existing constants file Git object hash: `e9e2e1fc3bf6d4055a0ee13547624aca7e785f3b`, preserved before/after checks.
- Intelligence report SHA-256: `f273511240a5c97d7a7c84fb4d5c93a3499999c9a19d4c37c392986b05dfd2d4`.
- A sorted, tracked source/configuration inventory of **217 files** produced SHA-256 `0463b5bb8b1cb69b9500a3abe8324709f357a1580bb6ce107121099e98ff4e83`. Inventory roots: `src`, `tests`, `prisma`, `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `prisma.config.ts`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `AGENTS.md`, and `.agents/skills/nextjs-architecture/SKILL.md`. Included suffixes: `.ts`, `.tsx`, `.mjs`, `.js`, `.json`, `.prisma`, `.sql`, `.toml`, `.css`, `.md`, plus `.prettierignore`; excluded any path component beginning `.env` or containing `secret`/`credential`. Digest input is each sorted path, NUL, the file SHA-256 hex, then newline. This records content identity, not exhaustive semantic inspection.
- Only representative source and assertions were semantically inspected. Tests used existing generated Prisma/Next types; fresh generation was not verified.
- `npm run prisma:generate`, install, dev/build, seed/index, migrations, live providers, real database tests, browser suites and dependency/security scans were not executed. Generation/build write artifacts; normal Next/maintenance paths can load secret files; database/provider targets were not authorised disposable fixtures in this audit. These remain **Unverified**, not waived.
- The global host skills are external to this repository and can change separately. This audit records their inspected contract, not a version-pinned installation or operational invocation guarantee.

## E. Controls worth preserving

- Keep the modular monolith, current composition root and small injected test seams; do not replace them with a new framework.
- Retain strict TypeScript, Next ESLint integration and the existing useful syntax rules. Strengthen precise import coverage only after approved rule clarification.
- Retain the existing meaningful unit and route tests. Reuse real database suites with a proven disposable environment instead of replacing them with mocks or merely increasing coverage counts.
- Preserve committed migrations, seed inputs, target validation and transactional SQL constraints. Document and resolve test target inconsistencies without weakening assertions.
- Reuse browser fixtures/controlled providers and the existing workflow fault scenarios; improve invocation reproducibility under later authorised tasks.
- Preserve milestone authoring, execution acknowledgement, independent review, review history and human merge boundaries. Add repository linkage/trials, not a second delivery system.
- Keep the existing main deletion/force-update protection. Any additional hosted merge/release rules require a separate owner decision.

## F. Recommendations for Task 04

Task 04 should propose a small, explicit contract grounded in the current system; this audit approves none of these decisions.

1. **Retain the present modular monolith and ownership boundaries.** Formalise the existing composition root, route-owned UI, contracts and persistence responsibilities with stable IDs. Do not introduce additional infrastructure simply to make the diagram uniform.
2. **Resolve actual dependency tensions narrowly.** Separate type-only provider ports, runtime provider error classes and cross-module Meeting helpers. Recommend retaining the strict default boundary and recording a precise owner decision for each necessary exposed/injected relationship; alternatives include moving the public boundary or injecting the operation. Do not blanket-approve all current imports or require a speculative rewrite.
3. **Clarify configuration and schema authority.** Define whether bounded transport/platform metadata may be read outside the central environment module. Preserve Prisma migration authority over conflicting generic Supabase workflow guidance.
4. **State verification invariants without pretending enforcement exists.** Database invariants need disposable real-boundary evidence; skipped mandatory suites cannot count as passed. Static checks establish only their actual coverage; semantic responsibility and approval history need independent review. Tooling/hook/CI implementation remains Tasks 09–14.
5. **Use the catalogue's single ADR approval authority and existing milestone workflow.** Record authoring/planning impact classification, execution discovery, dependent-work pause, explicit owner decision and propagation, independent approval verification, and separate merge authorization. Establish the canonical registry and change-control navigation through the catalogue sequence; do not infer historical ADR acceptance from current implementation.

**Task 03 audit readiness:** evidence is available for independent review. Existing engineering enforcement is incomplete; architecture adoption, real-database verification, milestone handoff, protected quality merging and release readiness are not declared complete.
