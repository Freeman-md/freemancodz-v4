# Milestone 13: Homepage Conversion and File-Based Content Sync

**Status:** Frozen
**Version:** 1.0.0  
**Last Updated:** 2026-08-05  
**Depends On:** Milestone 12  
**Target Pull Request:** —  
**Target Branch:** `feat/milestone-13-homepage-conversion`  
**Superseded By:** —

## Goal

Turn the homepage from a general engineering portfolio into a clear client-conversion page for customer-facing products and reliable operational workflows, while introducing a simple, file-based, non-destructive content sync process that Freeman can run against local or production PostgreSQL without building an admin interface.

## Required behaviour

### Homepage conversion flow

The homepage must follow this sequence:

```text
Hero
→ What I Help Improve
→ Proof of Work
→ Free Customer Journey & Workflow Audit
→ Final audit CTA
```

The existing visual system, spacing language, typography, portrait treatment, shared layout components and floating assistant should remain recognisably consistent.

The homepage must stop presenting several equally weighted exploration paths. Its primary commercial path is the free audit, while the Work page remains the secondary path for visitors who want more evidence.

### Hero

Keep the current two-column hero layout:

- left: name, headline, supporting copy and actions;
- right: Freeman’s existing portrait and location label.

Use this exact content:

**Name**

```text
Freeman Madudili
```

**Headline**

```text
Building customer-facing products and reliable operational workflows.
```

**Supporting copy**

```text
I help businesses improve how customers find information, understand their options and take action, while reducing the repetitive work happening behind the scenes.
```

Use these actions in this order:

1. `Get a Free Audit` as the primary action;
2. `View My Work` as the secondary action.

Action destinations:

```text
Get a Free Audit → /audit
View My Work → /work
```

Remove `Talk to My Assistant` from the hero.

Do not remove the existing floating assistant trigger. The assistant must remain available as an alternative path without competing with the primary hero action.

### What I Help Improve

Rename the current `What I Build` section to:

```text
What I Help Improve
```

Use this section copy:

```text
Two connected areas: the experience customers have in front, and the workflows that keep things moving behind the scenes.
```

Retain the existing two-card visual structure, including the service icon, title, lead, description and assistant-opening action.

#### Customer Journeys card

**Title**

```text
Customer Journeys
```

**Lead**

```text
Help customers find the right information, understand their options and take the next step.
```

**Description**

```text
I improve or build customer-facing journeys that reduce confusion, guide enquiries and make it easier for people to book, enquire or complete the next action.
```

**Action label**

```text
Explore Your Customer Journey
```

The action must open the existing assistant with this initial user message:

```text
I want to improve how customers find information, understand their options and take action. Help me identify where my current customer journey may be creating confusion or missed enquiries.
```

#### Operational Workflows card

**Title**

```text
Operational Workflows
```

**Lead**

```text
Reduce the repetitive work slowing you or your team down.
```

**Description**

```text
I build reliable workflows that connect tools, move information, handle routine decisions and keep processes moving without unnecessary manual effort.
```

**Action label**

```text
Explore Your Workflow
```

The action must open the existing assistant with this initial user message:

```text
I want to reduce repetitive work in my business. Help me identify where a workflow may be relying too heavily on manual steps, disconnected tools or repeated decisions.
```

These actions must reuse the current assistant-opening mechanism.

Do not introduce a sales state machine, lead record, qualification database, new assistant tool or automated closing workflow in this milestone.

The assistant should answer using the updated indexed site content and may explain the free audit as the relevant next step.

### Proof of Work

Rename `Featured Work` to:

```text
Proof of Work
```

Use this section copy:

```text
A few examples of customer-facing products and operational systems built around real problems.
```

The homepage must show exactly these three proof items, in this order:

1. Pay4Me / WithRadius
2. Portfolio Assistant
3. Email PA

Use a homepage-specific proof presentation rather than changing the existing Work-page project presentation.

The Proof of Work section must make the commercial story easy to scan. Each proof card must show:

- category;
- project name;
- `Problem`;
- `What I built`;
- `Outcome`;
- one optional meaningful action.

Do not show these on homepage proof cards:

- technology stack chips;
- role chips;
- GitHub links;
- deployment-provider links;
- future plans;
- long technical architecture descriptions.

The existing project data and Work page must remain available. This milestone changes the homepage presentation, not the full Work-page information architecture.

#### Layout

Use one visually dominant Pay4Me / WithRadius proof card followed by Portfolio Assistant and Email PA as two secondary cards.

Equivalent responsive behaviour is acceptable:

- desktop: Pay4Me spans the available width, with the other two cards below in two columns;
- smaller screens: all three cards stack cleanly.

Do not add screenshots, galleries, diagrams, carousels or case-study media in this milestone. Rich case-study pages will be handled separately.

#### Pay4Me / WithRadius

**Stable key**

```text
pay4me-withradius
```

**Category**

```text
Customer-Facing Product · Fintech
```

**Project name**

```text
Pay4Me / WithRadius
```

**Problem**

```text
International students and relocation users needed a clearer way to complete tuition, visa, SEVIS, housing and other cross-border payments.
```

**What I built**

```text
I built and shipped customer-facing web experiences across the payment journey, working with product, design, backend and mobile teams.
```

**Outcome**

```text
The dedicated Pay4Me payment product processed more than US$500,000 in payment volume.
```

**Action**

```text
Label: View Live Product
Type: External link
Destination: https://pay4me.app
```

The external link must open safely in a new tab.

#### Portfolio Assistant

**Stable key**

```text
portfolio-assistant
```

**Category**

```text
Customer-Facing AI Product
```

**Project name**

```text
Portfolio Assistant
```

**Problem**

```text
A traditional portfolio makes visitors search across different pages to understand whether an engineer has the experience they need.
```

**What I built**

```text
I built a live assistant grounded in the site’s content that understands follow-up questions, retrieves relevant evidence, cites its sources and guides visitors towards useful next actions.
```

**Outcome**

```text
Visitors can ask directly, surface the most relevant proof and move towards a conversation without browsing the entire website.
```

**Action**

```text
Label: Try the Assistant
Type: Assistant action
```

The action must open the current assistant with this initial user message:

```text
I’m exploring Freeman’s work. Help me find the most relevant projects and understand how he could help improve my customer journey or operational workflow.
```

The Portfolio Assistant must be stored as a normal project record so it can be retrieved and referenced by the assistant like other portfolio records.

#### Email PA

**Stable key**

```text
email-pa
```

**Category**

```text
Operational Workflow · Background Automation
```

**Project name**

```text
Email PA
```

**Problem**

```text
Important job-application updates were mixed into a busy inbox, creating repeated checking and manual status tracking.
```

**What I built**

```text
I built a background assistant that retrieves messages, identifies relevant updates, classifies application statuses, prevents duplicate processing, stores state and sends concise Telegram reports.
```

**Outcome**

```text
The workflow replaced repeated manual inbox checks with one consistent and actionable reporting process.
```

No homepage action is required for Email PA in this milestone.

Do not show a GitHub or Render link on the homepage card.

### Homepage proof selection

Do not overload the existing `Project.featured` flag with homepage-specific meaning.

The homepage proof block must own the ordered project selection through stable project keys.

The content representation should be equivalent to:

```ts
type HomeProofContent = {
  title: string;
  copy: string;
  items: Array<{
    projectKey: string;
    action:
      | {
          type: "external";
          label: string;
          href: string;
        }
      | {
          type: "assistant";
          label: string;
          prompt: string;
        }
      | null;
  }>;
};
```

Equivalent naming is acceptable when it follows repository conventions.

The PortfolioService must resolve the configured projects through the portfolio repository and preserve the configured order.

Missing configured proof projects must fail clearly rather than silently rendering an incomplete proof section.

### Free audit offer

Replace the existing black `Current Focus` block with a two-column free-audit offer using the existing dark visual treatment.

#### Left side

**Label**

```text
Free Customer Journey & Workflow Audit
```

**Title**

```text
Find where customers are getting stuck and where repetitive work is slowing your business down.
```

**Supporting copy**

```text
I’ll review your customer journey and operational workflow, identify the most valuable improvement opportunities and show you what I would prioritise first. If nothing meaningful needs fixing, I’ll tell you.
```

**Action**

```text
Get a Free Audit → /audit
```

#### Right side

Render a quiet checklist containing exactly:

```text
Customer journey friction
Unclear enquiry or booking steps
Repetitive manual work
Disconnected tools or handoffs
Highest-priority improvement
Clear recommended next step
```

The checklist must support the offer rather than compete with the main title.

Use restrained check icons, spacing and contrast. Do not introduce a large illustration or another competing call to action.

The `/audit` page itself is outside this milestone. This milestone owns the homepage destination and shared audit link only.

### Remove non-conversion homepage sections

Remove these sections from the homepage render:

- Experience;
- Engineering Philosophy;
- the existing Current Focus content.

Do not delete their database records merely because they are no longer rendered on the homepage.

Experience and engineering-philosophy content must remain available for the About-page redesign and assistant retrieval where currently applicable.

The HomePageData query must stop fetching homepage data that is no longer used.

### Final CTA

Replace the current final CTA copy with:

```text
Not sure where customers are getting stuck or where your team is losing time?
```

Use these actions:

```text
Get a Free Audit → /audit
View My Work → /work
```

`Get a Free Audit` is primary.

`View My Work` is secondary.

Remove `Connect on LinkedIn` from this CTA section.

### Homepage content blocks

Do not hard-code the new homepage copy throughout `page.tsx`.

Use the existing portfolio content architecture and introduce typed content blocks for the new homepage sections.

The final content keys must be:

```text
home.hero
home.services-intro
home.proof-of-work
home.audit-offer
home.final-cta
```

`home.hero` may extend the existing hero schema rather than creating a duplicate hero record.

Add only the required `ContentSection` enum values. Equivalent enum names are acceptable when they map clearly to:

```text
SERVICES_INTRO
PROOF_OF_WORK
AUDIT_OFFER
FINAL_CTA
```

Create strict schemas and mapper functions for the new JSON content.

Invalid required content must fail clearly through the current portfolio service boundary.

Do not add a new database table for homepage sections.

### Stable content identifiers

File-based syncing must not depend on editable display titles or array positions as the primary identity of long-lived records.

Add a stable unique `key` to these portfolio models:

```text
Service
Principle
Experience
Project
```

`ContentBlock` already has an appropriate stable `key`.

Use human-readable keys such as:

```text
customer-journeys
operational-workflows
pay4me-withradius
portfolio-assistant
email-pa
```

Existing records must receive stable keys through the migration or the bounded migration-and-sync process.

Display titles, positions and copy may change without changing the stable key.

The search-index job triggers must continue using database IDs as they do currently.

### File-based portfolio content source

Replace the current destructive portfolio-seed data workflow as the normal way to maintain site content.

Create this repository-owned content structure:

```text
content/
└── portfolio/
    ├── home.ts
    ├── about.ts
    ├── services.ts
    ├── projects.ts
    ├── experience.ts
    ├── principles.ts
    ├── index.ts
    └── README.md
```

Equivalent singular or plural filenames are acceptable only when the structure remains equally clear.

These TypeScript files are the editable source of truth for portfolio content.

Each file must export fully typed records using stable keys.

The content files must contain data only. They must not:

- connect to PostgreSQL;
- import Prisma Client;
- read environment variables;
- perform writes;
- contain secrets;
- start search indexing.

`index.ts` must expose the available named scopes and their validated records.

Required scopes:

```text
home
about
services
projects
experience
principles
```

When Freeman wants to change a headline, service, project or other supported content item, the workflow must be:

```text
Edit the appropriate typed content file
→ run the local content sync command for that scope
→ verify
→ run the production content sync command for that scope
```

Do not require Freeman to create an admin interface or manually edit PostgreSQL.

### Non-destructive content sync

Create one focused maintenance entrypoint for portfolio content syncing.

Suggested location:

```text
src/server/entrypoints/maintenance/sync-portfolio-content.ts
```

Equivalent repository-compliant naming is acceptable.

The sync must:

1. load and validate the selected content scopes;
2. reject duplicate stable keys before any write;
3. compare each incoming record with its existing database record;
4. insert missing records;
5. update changed records;
6. skip unchanged records;
7. leave unmentioned records untouched;
8. run the selected operation through the existing repository and service boundaries;
9. use a transaction where required to avoid partial updates;
10. print a concise result summary.

The result summary must identify:

```text
selected scopes
inserted count
updated count
unchanged count
failed scope or record when applicable
```

Routine content sync must never use:

```text
deleteMany()
truncate
drop table
delete and recreate all portfolio data
```

Rerunning the same content scope without file changes must be safe and must report records as unchanged.

Removing a record from a content file must not delete the corresponding database record.

Deletion is intentionally not supported by the normal content-sync command in this milestone.

### Scope selection

The command must support syncing all content or one or more named scopes.

Required examples:

```bash
npm run content:sync
npm run content:sync -- home
npm run content:sync -- home services projects

npm run content:sync:production
npm run content:sync:production -- home
npm run content:sync:production -- home services projects
```

No argument means all scopes.

Unknown scopes must fail before any database write and print the allowed scope names.

Do not add file watchers, GitHub-triggered content deployment or automatic sync on application startup.

### Package scripts and environment safety

Add these scripts to `package.json`:

```json
{
  "content:sync": "NODE_OPTIONS='--conditions=react-server' tsx --env-file=.env src/server/entrypoints/maintenance/sync-portfolio-content.ts",
  "content:sync:production": "NODE_OPTIONS='--conditions=react-server' tsx --env-file=.env.production.local src/server/entrypoints/maintenance/sync-portfolio-content.ts --production"
}
```

Equivalent quoting is acceptable when cross-platform behaviour remains consistent with the current repository.

The production sync must require an explicit `--production` flag in addition to using `.env.production.local`.

The entrypoint must clearly identify that it is targeting production before writing.

Do not automatically run production content sync during:

- `npm install`;
- `postinstall`;
- `build`;
- application startup;
- Vercel deployment;
- a GitHub push.

Production content changes remain an explicit human command.

### Existing destructive seed path

The existing routine `seed:portfolio` and `seed:portfolio:production` commands currently replace all portfolio data.

They must no longer be the normal documented content-update path.

Choose the smallest safe disposition:

- remove the routine package scripts; or
- retain the destructive implementation only as an explicitly named and guarded development reset command.

If retained, it must be renamed so its destructive behaviour is unmistakable, for example:

```text
content:reset:local
```

Do not expose a destructive production reset script.

The new `content:sync` commands must never call the destructive replace repository.

Update repository documentation so Freeman is directed to content sync, not destructive seeding.

### Search-index integration

Continue using the existing PostgreSQL triggers and `SearchIndexJob` process.

Actual inserted or updated content records must enqueue the existing search-index jobs.

Unchanged records should not be written merely to force indexing.

The content sync command must not:

- rebuild the complete search index by default;
- generate embeddings directly;
- bypass the existing job table;
- duplicate the search-index worker;
- synchronously wait for every embedding job to finish.

The existing worker remains responsible for processing queued search-index jobs.

Updated homepage, service and project content must therefore become available to the assistant through the current indexing pipeline.

### UI component boundaries

Keep `src/app/page.tsx` primarily responsible for page composition.

Extract or reuse focused components where the new behaviour warrants them, including an equivalent of:

```text
ProofOfWorkSection
ProofOfWorkCard
AuditOfferSection
```

Do not put large proof-card branching logic or all section markup directly into the page component.

Do not rewrite the entire portfolio component system.

Preserve existing shared components where they still match the required behaviour.

### Metadata and navigation

Preserve the current site navigation and floating assistant.

Update homepage metadata description where required so it reflects customer-facing products, operational workflows and the business outcomes they support.

Do not update the Open Graph image in this milestone unless the current implementation generates it automatically from the updated metadata without additional design work.

A dedicated Open Graph visual update remains separate.

### Completion condition

This milestone is complete when:

- the homepage clearly presents the approved client-focused flow;
- the exact approved copy is rendered from typed database-backed content;
- the Proof of Work section shows the three approved proof items in the approved presentation;
- the service and Portfolio Assistant actions open the existing assistant with the approved prompts;
- the free-audit offer and final CTA direct visitors towards `/audit`;
- Experience and Engineering Philosophy no longer render on the homepage;
- Freeman can edit typed repository content and use explicit local or production commands to insert or update only the selected content scopes without deleting unrelated records;
- changed records continue through the existing search-index job pipeline.

## Constraints

- Preserve the current visual identity rather than redesigning the entire site.
- Preserve the existing portrait and general hero composition.
- Preserve Work and About page behaviour unless a shared type change requires a minimal compatible update.
- Preserve the existing floating assistant and assistant-opening interaction.
- Use exact approved homepage and proof copy from this contract.
- Keep portfolio content database-backed.
- Reuse the portfolio service, repository, schema, mapper and composition-root boundaries.
- Do not introduce a second content system.
- Do not add an admin panel.
- Do not add a headless CMS.
- Do not make production content updates automatic.
- Make normal content syncing non-destructive and idempotent.
- Use stable keys for content identity.
- Skip unchanged records.
- Keep homepage-specific project selection separate from the existing generic featured-project grouping.
- Implement the smallest complete migration and content-sync system.
- Avoid unrelated assistant, meeting, calendar, retrieval or infrastructure refactoring.
- Do not expose database credentials or production environment values.
- Do not merge the pull request.

## Explicitly out of scope

- Full `/audit` page implementation
- Audit submission forms
- Lead persistence
- CRM integration
- Automated audit generation
- Sales pipeline state
- Automated prospect qualification
- Email sequences
- Payment collection
- Pricing or discount logic
- A portfolio admin panel
- A headless CMS
- GitHub-triggered content sync
- File watching
- Content sync during deploy or application startup
- Automatic production writes
- Record deletion through the normal sync command
- Case-study detail routes
- Rich proof screenshots, diagrams, videos or galleries
- Shifty homepage proof
- Work-page redesign
- About-page redesign
- Open Graph artwork redesign
- Broad assistant prompt redesign
- New assistant tools
- Generative UI
- Meeting-booking changes
- Search-index architecture changes
- Unrelated refactoring or future work

## Verification strategy

- Review the homepage against each exact content block and section requirement.
- Verify desktop and mobile layouts directly.
- Verify that service and proof assistant actions use the existing assistant mechanism and send the exact configured message.
- Verify that the Work page still uses its existing project presentation.
- Verify content-sync behaviour using a temporary or test database where practical.
- Prefer focused tests around deterministic schemas, scope parsing and non-destructive sync rules.
- Do not create a broad screenshot or end-to-end testing system solely for this milestone.
- Add the smallest regression test when implementation or review uncovers a concrete failure.

## Required tests

1. Hero, services-intro, proof, audit-offer and final-CTA content schemas accept the approved records and reject malformed required content.
2. The homepage service actions open the assistant with their exact configured prompts.
3. The Portfolio Assistant proof action opens the assistant with its exact configured prompt.
4. The homepage proof selection resolves the configured project keys in the configured order.
5. A missing configured proof project fails clearly.
6. The sync command rejects an unknown scope before writing.
7. The sync command rejects duplicate stable keys before writing.
8. Syncing a missing record inserts it.
9. Syncing a changed record updates it.
10. Syncing an unchanged record skips it.
11. Syncing one scope does not modify records belonging only to another scope.
12. A record absent from the selected content file is not deleted.
13. Rerunning the same scope is idempotent.
14. Production mode requires the explicit production flag.
15. Existing relevant portfolio, assistant, search-index and route tests remain green.
16. Repository validation commands pass.

## Acceptance criteria

- [ ] The homepage renders in the approved order: Hero, What I Help Improve, Proof of Work, Free Audit and Final CTA.
- [ ] The hero uses the exact approved headline and supporting copy.
- [ ] `Get a Free Audit` is the primary hero action and targets `/audit`.
- [ ] `View My Work` is the secondary hero action and targets `/work`.
- [ ] `Talk to My Assistant` no longer appears in the hero.
- [ ] The floating assistant remains available.
- [ ] `What I Build` is replaced by `What I Help Improve`.
- [ ] The Customer Journeys card uses the exact approved copy and assistant prompt.
- [ ] The Operational Workflows card uses the exact approved copy and assistant prompt.
- [ ] `Featured Work` is replaced by `Proof of Work`.
- [ ] The Proof of Work supporting copy matches the contract.
- [ ] The homepage shows exactly Pay4Me / WithRadius, Portfolio Assistant and Email PA in that order.
- [ ] Pay4Me / WithRadius is visually dominant on desktop.
- [ ] Each proof card shows Category, Problem, What I built and Outcome.
- [ ] Homepage proof cards do not show stack chips, role chips, GitHub links or deployment-provider links.
- [ ] Pay4Me links to the live product.
- [ ] Portfolio Assistant opens the existing assistant with the configured prompt.
- [ ] Email PA has no homepage action.
- [ ] Homepage proof selection is configured through stable project keys rather than the generic `featured` flag.
- [ ] The existing Work-page project presentation remains intact.
- [ ] The Current Focus block is replaced by the approved two-column audit offer.
- [ ] The audit checklist contains exactly the six approved checks.
- [ ] The audit offer targets `/audit`.
- [ ] Experience no longer renders on the homepage.
- [ ] Engineering Philosophy no longer renders on the homepage.
- [ ] Their underlying portfolio records are not deleted merely because the homepage stops rendering them.
- [ ] The final CTA uses the exact approved question.
- [ ] The final CTA contains Get a Free Audit and View My Work in the approved order.
- [ ] Connect on LinkedIn no longer appears in the final CTA.
- [ ] The approved homepage copy is loaded through typed database-backed content rather than repeated hard-coded literals.
- [ ] Stable unique keys exist for ContentBlock, Service, Principle, Experience and Project records.
- [ ] Editable portfolio content lives under the agreed `content/portfolio` structure.
- [ ] The content files contain validated data and no database behaviour or secrets.
- [ ] `content:sync` exists for local content updates.
- [ ] `content:sync:production` exists for explicit production content updates.
- [ ] The sync command supports all scopes and selected scopes.
- [ ] The sync command inserts missing records, updates changed records and skips unchanged records.
- [ ] The sync command does not delete unmentioned records.
- [ ] Routine content sync contains no destructive replace-all behaviour.
- [ ] Unknown scopes and duplicate keys fail before writes.
- [ ] Production sync requires the explicit production flag.
- [ ] Existing database triggers continue to enqueue search-index jobs for actual inserted or updated records.
- [ ] The content sync does not rebuild or directly process the search index.
- [ ] The repository contains concise instructions for updating and syncing content.
- [ ] No admin panel, CMS, GitHub-triggered sync or automatic production write was introduced.
- [ ] Existing relevant validation commands pass.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual tasks

1. Review the final migration before applying it to any production database.
2. Apply the Prisma migration locally and regenerate Prisma Client where required.
3. Run:

   ```bash
   npm run content:sync -- home services projects
   ```

4. Run the application locally and verify the homepage visually at desktop and mobile widths.
5. Click both service actions and confirm the assistant opens with the correct initial messages.
6. Click `Try the Assistant` on Portfolio Assistant and confirm the assistant opens with the correct initial message.
7. Confirm Pay4Me opens the intended live product safely.
8. Confirm all `Get a Free Audit` actions target `/audit`.
9. Confirm the Work and About pages still load normally.
10. Confirm inserted or updated homepage records create the expected pending search-index jobs.
11. Run the existing search-index worker locally and confirm the updated content becomes retrievable by the assistant.
12. After local approval, apply the migration to production using the repository’s production migration process.
13. Run:

    ```bash
    npm run content:sync:production -- home services projects
    ```

14. Confirm the production command clearly identifies the production target before writing.
15. Verify the production homepage and assistant behaviour after the normal index worker processes the queued jobs.

## Manual acceptance criteria

These are confirmed by the human after the workflow reaches `ready_for_human`. They do not block the agent workflow from reaching that state.

- [ ] The homepage looks coherent with the existing site identity on desktop and mobile.
- [ ] The commercial path is visibly clearer than the previous portfolio-first homepage.
- [ ] The hero, service cards, proof cards, audit offer and final CTA use the approved content.
- [ ] The proof cards communicate the problem, what Freeman built and the outcome without requiring technical knowledge.
- [ ] The assistant-opening actions feel like useful alternative conversion paths rather than disconnected demos.
- [ ] The audit checklist is visible but does not compete with the audit headline.
- [ ] Experience and Engineering Philosophy are no longer present on the homepage.
- [ ] Work and About remain stable enough to continue with their dedicated milestones.
- [ ] A local file edit followed by a scoped local sync updates only the intended content.
- [ ] Rerunning the same local sync does not create duplicates or unnecessary changes.
- [ ] The explicit production sync updates the intended production content without deleting unrelated records.
- [ ] Updated production content becomes available to the assistant through the existing indexing pipeline.
