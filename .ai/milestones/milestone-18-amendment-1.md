# Milestone 18 Amendment 1: Simplify the Workflow Foundation

**Status:** Archived
**Version:** 1.0.0
**Last Updated:** 2026-08-20
**Parent Milestone:** `.ai/milestones/milestone-18.md`
**Target Pull Request:** `#20`
**Target Branch:** `feat/milestone-18-workflow-foundation`
**Cycle Scope:** `milestone-18-amendment-1`
**Maximum Amendment Cycles:** `3`

## Goal

Simplify the completed Milestone 18 implementation before Milestone 19 builds on it.

Preserve the workflow foundation and current meeting-booking behaviour, but remove unnecessary types, mappers, wrappers, files, validation layers and tests. The target is the minimum clean code required to keep the behaviour correct, understandable and extensible.

The governing question for every Milestone 18 addition is:

> Does this code need to exist?

If not, remove it.

---

## Core rule

Prefer existing code and generated types over new abstractions.

Before keeping or adding a type, helper, mapper, wrapper, interface or file, verify that it has a concrete responsibility that cannot be represented more simply by something already present.

Do not optimise for architectural ceremony, hypothetical reuse or test volume.

Optimise for:

```text
simple
→ readable
→ maintainable
→ reliable
→ minimal
```

Add a concise repository-wide version of this principle to `AGENTS.md` so later milestones inherit it. Keep it short; do not duplicate the architecture skill.

---

## Changed requirements

### 1. Reuse Prisma-generated persistence types

Review the workflow module's duplicate `WorkflowInstance` model, mapper and JSON conversion layer.

- Prefer Prisma's generated `WorkflowInstance` type directly when it already represents the persisted entity the service/repository needs.
- Do not keep a second full `WorkflowInstance` type merely to avoid importing a generated persistence type.
- Keep a narrower local type only when there is a real semantic or trust-boundary difference that the Prisma type cannot express usefully.
- If a narrow status union, create/update input or public transport projection is genuinely useful, keep only that narrow type rather than recreating the whole model.
- Workflow definition schemas remain authoritative for workflow-specific `state`; parse persisted JSON through the exact definition schema when loading/executing it.
- Prefer Prisma's JSON input/output types where they are sufficient. Remove the hand-written recursive workflow JSON type/conversion layer if it is not materially protecting an invariant that Zod/Prisma already protect.
- Remove the workflow-instance mapper if its only purpose is copying Prisma fields into an equivalent application object.

Do not weaken runtime validation of workflow-specific state or public transport contracts merely to reduce line count.

### 2. Remove misleading or unnecessary module categories

Review `src/server/modules/workflow/models/` and every file it contains.

A directory should exist only when it groups real responsibilities. If no genuine workflow-domain models remain after Prisma reuse, remove the `models` directory.

Supporting workflow types may live in one obvious module-level file such as `workflow.types.ts` when that is simpler than several one-purpose files. Do not create a `types/` directory for only one or two small files.

Keep service and repository behavioural interfaces in `interfaces/` where they remain meaningful under the repository architecture standard.

Do not create a new directory merely to give one file a category.

### 3. Keep the definition registry explicit but lightweight

`WorkflowDefinitionRegistry` remains a code-level definition/version resolver. It is not persistence.

- Keep it as one small, obvious workflow-module file.
- Do not place it in `models/`.
- Do not place it in `repositories/` merely because that directory exists; repositories remain persistence boundaries.
- Preserve only the behaviour required by active workflow definitions: exact version lookup, latest-version lookup and routable definitions.
- Remove defensive ceremony that protects impossible states already guaranteed by construction/types unless it provides meaningful runtime safety.

Do not introduce a registry interface, registry repository, registry directory or database-backed definition store.

### 4. Simplify `WorkflowService`

Keep `WorkflowService` as the generic orchestration boundary, but reduce it to the logic the foundation actually requires.

It must continue to own:

- start/cancel lifecycle;
- exact definition resolution for persisted instances;
- workflow-state schema validation;
- active-tool availability enforcement;
- dynamic assistant instructions/tools;
- persistence of resulting state/lifecycle; and
- safe application-level errors.

Remove duplicated parsing, validation, wrapping or conversion where an existing Zod schema, repository guarantee, Prisma type or simple language construct already provides the same protection.

Do not split `WorkflowService` into more services to make the file smaller. Extract only a responsibility that becomes clearer and independently meaningful.

### 5. Clarify Meeting Booking responsibilities

The current meeting-booking definition is carrying workflow identity, instructions, tool selection, tool dispatch, capability execution and many helper functions in one file. Simplify that boundary without creating a file explosion.

The preferred shape is approximately:

```text
definitions/meeting-booking/
  meeting-booking.definition.ts
  meeting-booking.schema.ts
  meeting-booking.tools.ts
  meeting-booking.tool-handlers.ts
  meeting-slot.mapper.ts        # only if mapping remains useful
```

Use a helper/constants file only when enough shared behaviour exists to justify it. Do not create empty or trivial files just to match this example.

Responsibilities:

- `meeting-booking.definition.ts`: workflow identity/version, state creation, instructions, active-tool selection and thin dispatch/orchestration;
- `meeting-booking.tools.ts`: model-facing tool declarations/contracts;
- `meeting-booking.tool-handlers.ts`: actual tool/capability behaviour such as availability, preparation, confirmation, booking and reconciliation;
- `meeting-booking.schema.ts`: Zod schemas and inferred workflow-specific types;
- `meeting-slot.mapper.ts`: only real slot presentation mapping if still warranted.

Keep small helpers next to their single consumer instead of automatically creating `helpers.ts` or `constants.ts`.

Preserve all existing meeting safety behaviour, especially explicit later-message confirmation, slot recheck and provider/persistence reconciliation.

### 6. Reduce test weight to critical regression coverage

Review every test introduced or substantially expanded by Milestone 18.

The goal is not maximum coverage. Keep tests that protect behaviour where a regression would materially matter.

At minimum preserve focused evidence for:

- workflow-instance database migration/security and the important terminal-update invariant;
- exact/latest definition version resolution;
- starting a workflow and exposing its tools/instructions on the next assistant iteration;
- rejecting unavailable workflow tools/terminal execution;
- meeting-booking explicit-confirmation boundary;
- meeting booking/reconciliation failure behaviour; and
- browser transport carrying only safe workflow-instance metadata rather than private state.

Aggressively remove or consolidate tests that:

- mirror implementation details;
- repeat the same invariant at multiple layers;
- assert trivial getters/mappers/helpers;
- exhaustively test impossible configuration variants with little regression value; or
- exist mainly to increase test count.

`tests/integration/workflow/workflow-database.test.ts` should be materially reduced if the same critical database guarantees can be proven with fewer cases and less setup.

Do not replace removed tests with snapshots or a new testing abstraction.

### 7. Keep filenames honest

After simplification, filenames and directories must describe their actual responsibility.

- Prisma owns persisted models where its generated type is sufficient.
- Types are named as types, not models.
- Helpers exist only for real shared helper behaviour.
- Constants files contain genuinely shared constants.
- Definitions contain definitions.
- Tool declarations and tool execution behaviour are distinguishable where that separation improves readability.
- Repositories remain persistence boundaries.
- Mappers remain only where a real representation conversion exists.

Do not preserve obsolete folders simply to avoid moving imports.

---

## Behaviour that must not change

This is a simplification amendment, not a workflow redesign.

Preserve the parent milestone's externally observable behaviour, including:

- durable PostgreSQL workflow instances;
- code-defined versioned workflow definitions;
- exact-version execution for existing instances and latest-version selection for new instances;
- one active workflow at a time;
- dynamic global + active-workflow assistant tool composition on every iteration;
- private workflow state remaining server-side;
- generic workflow-instance web transport;
- current portfolio search behaviour;
- current meeting-booking behaviour and safety boundaries;
- RLS/revoked public access for workflow instances; and
- safe client-facing errors.

Do not change the WorkflowInstance database schema unless simplification reveals a concrete unnecessary field or constraint and changing it is clearly lower complexity than keeping it. Do not redesign the persistence model for style.

---

## Explicitly out of scope

- Audit Workflow or any Milestone 19 behaviour
- Project, Hiring, Role, Collaboration or General Contact workflows
- analytics or event history
- conversation persistence
- Telegram or another channel
- Generative UI
- dynamic/database-authored workflow definitions
- nested workflows or parallel workflows
- a generic workflow DSL
- new architectural layers created during the refactor
- unrelated application cleanup

---

## Required validation

Run the existing relevant repository gates after simplification:

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run test:workflow
npm run build
git diff --check
```

Run the workflow database suite with the documented disposable PostgreSQL URL where required by `test:workflow`.

Do not add new validation commands or permanent test infrastructure unless the simplification itself genuinely requires them.

---

## Agent-verifiable acceptance criteria

Checklist boxes remain unchecked. The independent reviewer records `PASS`, `FAIL` or `NOT VERIFIED` with concise evidence.

- [ ] Amendment work stays on `feat/milestone-18-workflow-foundation` and PR #20; no replacement branch or PR is created.
- [ ] `AGENTS.md` contains a concise repository-wide minimal-code rule without duplicating the architecture skill.
- [ ] Every Milestone 18 workflow file was reviewed for necessity; dead/duplicated wrappers, types, helpers and mappings are removed.
- [ ] The workflow module does not maintain a full duplicate `WorkflowInstance` model when the generated Prisma type is sufficient.
- [ ] Any remaining local WorkflowInstance-related type exists only for a concrete narrower boundary or invariant.
- [ ] The custom workflow JSON conversion/type layer is removed or clearly justified by a concrete invariant not already handled by Prisma/Zod.
- [ ] `WorkflowDefinitionRegistry` no longer lives under `models/` and remains one small code-level resolver rather than a repository or new abstraction family.
- [ ] The workflow module has no misleading `models/` directory unless genuine non-Prisma domain models still justify it.
- [ ] `WorkflowService` preserves required lifecycle/tool/state behaviour with fewer unnecessary validation/conversion layers and without being split into speculative services.
- [ ] Meeting Booking definition responsibilities are clearer; capability/tool implementation no longer turns the definition file into a general dumping ground.
- [ ] No unnecessary helper/constants/directory proliferation was introduced while splitting Meeting Booking responsibilities.
- [ ] Workflow test code is materially reduced or consolidated while retaining critical database, orchestration, transport and meeting safety regression coverage.
- [ ] No important test assertion was weakened merely to make refactoring pass.
- [ ] Parent Milestone 18 behaviour remains intact and existing assistant/meeting/portfolio regressions remain green.
- [ ] No Milestone 19 workflow behaviour or unrelated infrastructure was introduced.
- [ ] Final diff is simpler than the pre-amendment implementation and contains no stale imports, obsolete files or duplicate canonical paths.

---

## Manual tasks

No new manual task is introduced by this amendment.

The parent Milestone 18 live OpenAI, Google Calendar, hosted Supabase and production verification tasks remain the only human checks before merge.

## Manual acceptance criteria

No new manual acceptance criterion is introduced by this amendment. Parent Milestone 18 manual acceptance criteria still apply.
