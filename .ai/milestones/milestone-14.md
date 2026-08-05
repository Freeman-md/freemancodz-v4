# Milestone 14: Visual-First Audit Conversion Page

**Status:** Frozen  
**Version:** 1.0.0  
**Last Updated:** 2026-08-05  
**Depends On:** Milestone 13  
**Target Pull Request:** —  
**Target Branch:** `feat/milestone-14-audit-page`  
**Superseded By:** —

## Goal

Implement a conversion-focused `/audit` page that helps a business owner recognise one customer-journey or operational-workflow problem, understand the specific value of the free audit and take one obvious next action.

The page must make the problem and deliverable tangible through visual communication rather than relying on long explanatory copy.

The page is not a generic services page, a contact page or a disguised meeting-booking page.

The primary conversion action is:

```text
Start My Free Audit
```

Every primary CTA on the page must open the existing portfolio assistant with the approved audit starter message.

This milestone owns the Audit page, its copy, its visual presentation, its database-backed content and its entry into the existing assistant.

It does not implement audit-request persistence, an admin interface, a complete generative audit-intake workflow or automated client closing.

---

## Product and research decisions

### Lead-magnet principle

The audit must diagnose one narrow and valuable problem rather than promising a complete business review.

It must:

- focus on one customer journey or operational workflow;
- identify the most consequential friction, delay or unnecessary manual work;
- explain why that point matters;
- recommend what should be improved first;
- provide standalone value even when Freeman is not hired;
- create a natural path towards paid implementation only when implementation is warranted.

The page must demonstrate useful thinking before asking the visitor to buy implementation.

### Conversion principle

The page must move a suitable visitor through one decision:

```text
This sounds relevant to me.
The audit appears useful.
Starting it feels easy and worthwhile.
```

Use:

- a clear problem-and-outcome value proposition above the fold;
- one repeated primary action;
- specific, recognisable business symptoms;
- a tangible preview of the audit deliverable;
- clear boundaries around what the free audit covers;
- a short explanation of what happens next;
- relevant existing proof only;
- no fabricated urgency, scarcity, scores, savings or performance claims.

### Form and intake principle

Do not add an interim multi-field HTML form in this milestone.

The approved product direction is assistant-led intake. Adding a separate page form now would create a second intake system that would later need to be removed when the structured assistant workflow is implemented.

For this milestone:

```text
Audit page CTA
→ existing assistant opens
→ approved audit starter message is inserted
→ visitor begins describing one situation
```

A later milestone will implement:

- generative audit-intake UI;
- required contact fields;
- validation;
- audit-request persistence;
- submission confirmation;
- admin review;
- notifications;
- follow-up status;
- client-closing behaviour.

Until then, the Audit page must not claim that a request has been saved, that Freeman has been notified or that an audit will be returned by a specific deadline.

### Sources informing the strategy

The page strategy is informed by:

- Alex Hormozi’s *$100M Leads*, especially the lead-magnet principle of delivering real value and using the free material to demonstrate the value of the paid implementation;
- Acquisition.com’s Lead Magnet Mastery and First 5 Clients material;
- CXL guidance on clear value propositions, singular landing-page goals, customer language, necessary form friction and hypothesis-led optimisation;
- Baymard form-usability research on reducing unnecessary fields, using clear persistent labels, explicitly marking optional fields and avoiding complex multi-column form layouts;
- the existing `freemancodz-v4` positioning, portfolio proof, content architecture and visual system.

These principles guide the first implementation. Claims about conversion performance remain hypotheses until the live page has sufficient traffic and behaviour data.

---

## Existing repository baseline

Milestone 13 is merged into the default branch.

The current repository already provides:

- a light site visual system;
- `ink`, `muted`, `line`, `surface` and indigo `accent` colour tokens;
- Inter, JetBrains Mono and Playfair Display font configuration;
- shared layout primitives;
- existing button styles;
- Lucide icons;
- shadcn configuration;
- Framer Motion;
- a floating assistant;
- `AssistantTriggerButton`, which can open the assistant with an initial message;
- database-backed portfolio content;
- typed content schemas and mappers;
- file-based content definitions;
- non-destructive content sync;
- homepage audit links that already target `/audit`.

Milestone 14 must extend these systems rather than create a parallel landing-page framework.

The generated dark reference image supplied by Freeman is a composition and hierarchy reference only.

The implementation must not copy its dark theme, fake metrics, invented scores, brand name or exact layout.

---

## Required page flow

The page must follow this order:

```text
Hero with visual audit example
→ Recognisable problem signals
→ Tangible audit deliverable and process
→ Relevant proof
→ Final audit CTA
```

Do not add extra sections merely to make the page appear substantial.

The page should feel complete without becoming a long educational article.

---

# Required page copy and behaviour

## 1. Hero

### Purpose

The first viewport must communicate:

- the recognisable problem;
- the narrow scope of the audit;
- the tangible value returned;
- who the offer is for;
- one primary action;
- why starting feels safe and manageable.

### Layout

Use a responsive two-column hero.

Desktop:

```text
Left: conversion copy and CTA
Right: animated example audit visual
```

Mobile:

```text
Copy
CTA
Example audit visual
```

The right-hand visual must be substantial enough to communicate the offer without requiring the visitor to read a long explanation.

### Exact copy

**Eyebrow**

```text
Free Customer Journey & Workflow Audit
```

**Headline**

```text
Find the point where customers get stuck or work slows down.
```

**Supporting copy**

```text
Show me one customer journey or operational workflow that is not running as smoothly as it should. I’ll identify the most consequential friction, explain why it matters and show you what to improve first.
```

**Audience line**

```text
For business owners dealing with confusing customer steps, missed enquiries or repetitive manual work.
```

**Compact deliverable labels**

```text
One clear diagnosis
One visual breakdown
One recommended next step
```

**Primary CTA**

```text
Start My Free Audit
```

**CTA reassurance**

```text
You only need to describe one situation. No call is required to begin.
```

### CTA behaviour

The CTA must use the existing assistant-opening mechanism.

Use this exact starter message:

```text
I want a free audit of one customer journey or operational workflow. Help me describe what should happen, what is going wrong and the business or website involved. Do not ask me to choose between AI, automation or software.
```

The message must be defined once in typed Audit-page content and reused by every Audit-page CTA.

Do not duplicate it as unrelated hard-coded strings across components.

### Hero visual: exact content

Render a labelled illustrative panel:

```text
Example audit preview
```

Show this current-state flow:

```text
Enquiry submitted
→ Details checked manually
→ Copied into spreadsheet
→ Follow-up sent
```

Visually emphasise these two connected steps:

```text
Details checked manually
Copied into spreadsheet
```

Show the diagnosis card:

**Label**

```text
Main friction
```

**Copy**

```text
The same information is handled twice, and follow-up depends on someone noticing it.
```

Show the recommendation card:

**Label**

```text
Recommended improvement
```

**Copy**

```text
Capture the right details once and route the enquiry to the correct next step automatically.
```

The example must be clearly presented as an illustration.

Do not present it as a real client result.

Do not include:

- a health score;
- a score out of 100;
- percentage improvements;
- estimated revenue;
- fabricated conversion potential;
- a download control;
- fake analytics;
- fake client data.

---

## 2. Recognisable problem signals

### Purpose

Help the visitor decide whether the audit is relevant without requiring them to understand Freeman’s service categories or diagnose the technical solution.

### Exact copy

**Eyebrow**

```text
Start with the symptom
```

**Headline**

```text
You do not need to know what the solution is.
```

**Supporting copy**

```text
Show me the point where customers hesitate, enquiries lose momentum or work keeps falling back to manual follow-up.
```

### Signal items

Render exactly four visual signal items.

#### Signal 1

**Title**

```text
Customers get stuck
```

**Copy**

```text
People are unsure what to do next or fail to complete an important action.
```

#### Signal 2

**Title**

```text
Enquiries lose momentum
```

**Copy**

```text
Requests are missed, delayed or followed up differently each time.
```

#### Signal 3

**Title**

```text
Work is repeated
```

**Copy**

```text
The same information is copied, checked or entered into multiple tools.
```

#### Signal 4

**Title**

```text
The process depends on memory
```

**Copy**

```text
Progress relies on one person noticing, remembering or chasing the next step.
```

**Closing line**

```text
One clear example is enough.
```

### Visual treatment

Each signal must use:

- one meaningful Lucide icon;
- one short title;
- one short explanation;
- a visible connection to a shared journey or workflow line.

Do not render a decorative icon grid with no relationship between the items.

The composition should visually communicate that these are different symptoms of friction within a journey or workflow.

---

## 3. Tangible audit deliverable and process

### Purpose

Make the free deliverable concrete and set a clear boundary so the offer feels valuable without promising unpaid full-business consultancy.

### Layout

Use one dominant visual audit-output preview with a compact three-step process beside or below it.

Desktop may use two columns.

Mobile must stack in reading order.

### Exact copy

**Eyebrow**

```text
What comes back
```

**Headline**

```text
A focused visual diagnosis, not a generic list of ideas.
```

**Supporting copy**

```text
I’ll review one journey or workflow and return a concise audit you can understand without technical knowledge.
```

### Deliverable preview

Render a visual document or interface preview labelled:

```text
Your audit
```

It must contain exactly these four sections:

#### Current path

```text
The important steps, decisions and handoffs happening now.
```

#### Main friction

```text
The point creating the most confusion, delay or unnecessary manual work.
```

#### Why it matters

```text
The practical effect on customers, enquiries or the people doing the work.
```

#### Recommended next step

```text
The first improvement I would prioritise and why.
```

### Scope boundary

```text
The audit identifies what to improve first. It does not include a full implementation or a review of the entire business.
```

### Process

Render exactly three connected steps.

#### Step 1

**Title**

```text
Show me the situation
```

**Copy**

```text
Describe what should happen and what is currently going wrong.
```

#### Step 2

**Title**

```text
I trace the friction
```

**Copy**

```text
I review the steps, handoffs and decisions around that situation.
```

#### Step 3

**Title**

```text
You receive the diagnosis
```

**Copy**

```text
I return the visual breakdown and the first improvement I recommend.
```

### Reassurance

```text
If nothing meaningful needs fixing, I’ll say so. If implementation would help, I’ll explain that separately.
```

### Repeated CTA

Use the same:

```text
Start My Free Audit
```

It must open the assistant using the exact approved starter message.

Do not introduce:

- `Book a call`;
- `Contact me`;
- `View my work`;
- `Talk to my assistant`;
- a newsletter;
- a services link;
- a second lead magnet.

---

## 4. Relevant proof

### Purpose

Establish that Freeman has relevant experience across both the customer-facing experience and the operational workflow behind it.

Do not turn this into another full portfolio section.

### Exact copy

**Eyebrow**

```text
Relevant proof
```

**Headline**

```text
I build the customer-facing experience and the workflow behind it.
```

**Supporting copy**

```text
The strongest improvements often require understanding both what the customer sees and what must happen behind the scenes.
```

### Required proof items

Resolve the proof items through their existing stable project keys:

```text
pay4me-withradius
portfolio-assistant
email-pa
```

Preserve that order.

Do not duplicate the project records inside Audit-page content.

#### Pay4Me / WithRadius presentation

**Label**

```text
Customer-facing product
```

Use the existing project title and supported outcome.

The visible proof must communicate:

```text
Customer-facing fintech experiences across complex international payment journeys. The dedicated Pay4Me product processed more than US$500,000 in payment volume.
```

#### Portfolio Assistant presentation

**Label**

```text
Customer guidance
```

The visible proof must communicate:

```text
A customer-facing assistant that helps visitors find relevant information, understand their options and take the next step.
```

#### Email PA presentation

**Label**

```text
Operational workflow
```

The visible proof must communicate:

```text
A background workflow that replaces repeated inbox checking with consistent status tracking and reporting.
```

### Proof constraints

Do not add:

- unsupported testimonials;
- invented client logos;
- invented client counts;
- fake conversion figures;
- fabricated time savings;
- technology-stack chips;
- GitHub links;
- deployment links;
- secondary actions.

The proof section must support the audit CTA, not create another browsing path.

---

## 5. Final CTA

### Exact copy

**Headline**

```text
Show me the part of your business that is not working as smoothly as it should.
```

**Supporting copy**

```text
Start with one customer journey or operational workflow. You do not need to diagnose the cause first.
```

**Primary CTA**

```text
Start My Free Audit
```

**Microcopy**

```text
Describe one situation and the assistant will help you clarify it.
```

The CTA must open the assistant using the exact approved starter message.

Do not include a secondary CTA.

---

# Visual direction

## Overall theme

Use the current light site theme.

The page should use:

- white and `surface` backgrounds;
- `ink` text;
- `muted` supporting text;
- `line` borders;
- indigo `accent`;
- restrained blue, violet or cyan supporting gradients where they improve visual hierarchy;
- the existing typography and spacing language.

The page must not become a dark-theme page merely because the reference image is dark.

A dark or deep-ink panel may be used for one contained visual section only when it materially strengthens contrast and remains consistent with the existing site.

## Visual-first requirement

The implementation must favour:

- process diagrams;
- connected nodes;
- highlighted bottlenecks;
- annotated interface cards;
- visual before/current/recommended states;
- meaningful icons;
- compact labels;
- whitespace;
- clear hierarchy.

It must avoid:

- long uninterrupted paragraphs;
- generic feature grids;
- decorative illustrations unrelated to the offer;
- stock photography;
- AI robot imagery;
- fake dashboards;
- fake charts;
- fake scores;
- visually impressive but meaningless animation.

## Reference-image use

When Freeman supplies the generated reference image to the implementation agent, use it only for:

- visual hierarchy;
- density;
- premium presentation;
- connected diagnostic cards;
- prominent CTA treatment;
- strong audit-preview composition.

Do not copy:

- the dark page background;
- the fictitious `editable` brand;
- the `62/100` score;
- the five-category grid;
- fabricated performance metrics;
- exact gradients or exact composition;
- any wording from the image.

## Icons

Use Lucide icons already installed in the repository.

Icons must communicate the meaning of:

- customer action;
- enquiry;
- repeated work;
- delay or memory dependency;
- diagnosis;
- recommendation;
- current path;
- next step.

Do not install another icon library.

## Motion

Use restrained motion to explain sequence and focus.

Required motion behaviour:

- the hero flow nodes may reveal in sequence once;
- the diagnosed friction may receive a subtle emphasis;
- connectors may draw or fade into place;
- major sections may enter with a restrained opacity and vertical movement;
- hover states may add small elevation or border emphasis.

Do not use:

- constant looping movement;
- large parallax;
- bouncing CTA buttons;
- auto-playing decorative animation;
- motion that delays reading or interaction.

Respect `prefers-reduced-motion`.

When reduced motion is enabled, the complete content must remain visible and understandable without animation.

Use existing Framer Motion or CSS motion. Do not add another animation dependency.

## Responsive behaviour

The page must work from small mobile screens through large desktop screens.

On mobile:

- content order must remain logical;
- diagrams must stack rather than shrink into unreadable layouts;
- connected flows may become vertical;
- all text must remain legible;
- no horizontal scrolling;
- CTA buttons must remain easy to tap;
- visual cards must not become dense miniature dashboards.

---

# Navigation and conversion discipline

Add:

```text
Audit → /audit
```

to the current navigation for desktop and mobile.

On the `/audit` route, the header’s right-side action must not remain a competing LinkedIn CTA.

Use the same primary Audit action or remove the right-side action on this route.

Do not change the header behaviour on other routes unless the smallest implementation requires a shared compatible refactor.

The floating assistant remains available.

The page must not show any other primary or secondary conversion action.

---

# Content architecture

## Database-backed Audit content

Do not hard-code the approved page copy throughout `src/app/audit/page.tsx`.

Extend the existing portfolio content architecture.

Add an `AUDIT` value to `ContentPage`.

Reuse existing content-section enum values only where their meaning is genuinely correct. Add the smallest number of new `ContentSection` values required for the page.

Use these stable content keys:

```text
audit.hero
audit.problem-signals
audit.deliverable
audit.proof
audit.final-cta
```

The three-step process may be contained within `audit.deliverable` because it directly explains delivery of the audit and does not need an independent long-lived content identity.

Create strict schemas and mapper functions for every new content shape.

Invalid required Audit content must fail clearly through the portfolio service boundary.

## Suggested content shapes

Equivalent naming is acceptable when it follows repository conventions.

```ts
type AuditActionContent = {
  label: string;
  prompt: string;
};

type AuditHeroContent = {
  eyebrow: string;
  headline: string;
  copy: string;
  audience: string;
  deliverables: string[];
  reassurance: string;
  action: AuditActionContent;
  example: {
    label: string;
    steps: Array<{
      label: string;
      emphasis: boolean;
    }>;
    frictionLabel: string;
    frictionCopy: string;
    recommendationLabel: string;
    recommendationCopy: string;
  };
};

type AuditProblemSignalsContent = {
  eyebrow: string;
  headline: string;
  copy: string;
  items: Array<{
    key: string;
    title: string;
    copy: string;
  }>;
  closing: string;
};

type AuditDeliverableContent = {
  eyebrow: string;
  headline: string;
  copy: string;
  previewLabel: string;
  items: Array<{
    key: string;
    title: string;
    copy: string;
  }>;
  boundary: string;
  process: Array<{
    title: string;
    copy: string;
  }>;
  reassurance: string;
  action: AuditActionContent;
};

type AuditProofContent = {
  eyebrow: string;
  headline: string;
  copy: string;
  items: Array<{
    projectKey: string;
    label: string;
  }>;
};

type AuditFinalCtaContent = {
  headline: string;
  copy: string;
  microcopy: string;
  action: AuditActionContent;
};
```

The action prompt must be validated against the current assistant trigger message limit.

## File-based content source

Add:

```text
content/portfolio/audit.ts
```

The file must contain the approved Audit-page data only.

Update:

```text
content/portfolio/index.ts
content/portfolio/README.md
```

Add `audit` as a supported content-sync scope.

Required commands must support:

```bash
npm run content:sync -- audit
npm run content:sync:production -- audit
```

The existing non-destructive, idempotent and production-confirmation rules remain unchanged.

Actual Audit content inserts or updates must continue through the existing search-index job path.

Do not build a second content-sync system.

---

# Portfolio service and page data

Extend `IPortfolioService` and `PortfolioService` with:

```ts
getAuditPageData(): Promise<AuditPageData>
```

Equivalent action-oriented naming is acceptable.

The service must:

1. load all required Audit content blocks;
2. parse them through strict schemas and mappers;
3. resolve the three configured proof projects through the existing project repository;
4. preserve the configured project order;
5. fail clearly when a required block or proof project is missing;
6. return one coherent server-owned Audit page model.

Do not perform database access inside React components.

Do not fetch the application’s own Route Handler from the page.

---

# UI component boundaries

Create:

```text
src/app/audit/page.tsx
```

Keep the page responsible for:

- metadata;
- requesting `AuditPageData` from the configured portfolio service;
- composing focused feature components.

Use the owning frontend feature:

```text
src/features/audit/
```

Suggested components:

```text
components/AuditHero.tsx
components/AuditExample.tsx
components/AuditProblemSignals.tsx
components/AuditDeliverable.tsx
components/AuditProcess.tsx
components/AuditProof.tsx
components/AuditFinalCta.tsx
```

Equivalent grouping is acceptable when each file owns a coherent visual responsibility.

Do not create empty folders or split tiny fragments merely to match this list.

Reuse:

- `Container`;
- current button styling;
- `AssistantTriggerButton`;
- existing typography;
- current colour tokens;
- suitable shadcn primitives;
- Lucide icons;
- existing motion dependency.

Do not create:

- another button design system;
- another card primitive merely for this page;
- a generic landing-page builder;
- a schema-driven page renderer;
- a new global animation framework;
- an audit backend module in this milestone.

---

# Metadata and indexing

Add route metadata.

**Title**

```text
Free Customer Journey & Workflow Audit | Freeman Madudili
```

**Description**

```text
Identify where customers are getting stuck or repetitive work is slowing your business down. Start with one journey or workflow and get a focused visual diagnosis.
```

Add `/audit` to the sitemap.

Use an appropriate sitemap priority consistent with its role as the primary commercial conversion page.

Do not redesign the global Open Graph artwork in this milestone.

Do not add structured data claims that cannot be supported.

---

# Accessibility

The page must:

- use semantic heading order;
- use buttons for assistant actions;
- provide accessible labels for diagrams and icon-only elements;
- avoid conveying the diagnosis through colour alone;
- preserve sufficient colour contrast;
- provide visible keyboard focus;
- keep interactive elements keyboard accessible;
- respect reduced-motion preferences;
- keep visual content understandable to screen-reader users through concise supporting text;
- avoid hiding essential information inside hover-only states.

Decorative connectors and visual effects must be hidden from assistive technology.

---

# Completion condition

This milestone is complete when:

- `/audit` exists and renders the approved visual-first conversion page;
- the page uses the exact approved copy;
- the hero makes the problem, deliverable, audience and next action clear without scrolling;
- the example audit visually shows a current flow, diagnosed friction and recommended improvement;
- the page uses one repeated primary action only;
- every Audit CTA opens the existing assistant with the exact approved starter message;
- the page does not claim that an audit request has been persisted or that Freeman has been notified;
- the proof section resolves supported existing projects by stable key;
- the page uses the existing light visual system and current component foundations;
- motion is restrained and accessible;
- Audit content is typed, database-backed, file-maintained and syncable through the existing non-destructive content workflow;
- `/audit` is discoverable through navigation and sitemap;
- existing homepage, Work, About, assistant, meeting and content-sync behaviour remains intact.

---

# Constraints

- Preserve Freeman’s positioning around customer-facing products and reliable operational workflows.
- Write to a business owner or decision-maker experiencing a visible symptom.
- Lead with the visitor’s problem, not AI, automation or software terminology.
- Use the exact approved page copy from this contract.
- Use one primary action.
- Keep paragraphs short.
- Prioritise visual explanation over text.
- Use meaningful visuals rather than decoration.
- Use only supported proof.
- Use the current light theme.
- Reuse repository design tokens and component patterns.
- Reuse the existing assistant-opening mechanism.
- Reuse the portfolio service and content-sync architecture.
- Keep the route thin.
- Keep browser-facing UI under `src/features/audit`.
- Keep backend page composition in the portfolio module.
- Do not introduce raw database access into UI or routes.
- Do not introduce a second content source.
- Do not install unnecessary visual, form, icon or animation dependencies.
- Do not merge the pull request.

---

# Explicitly out of scope

- Audit-request database model
- Audit-request persistence
- Audit-request repository
- Audit backend service
- Audit submission API
- Inline HTML audit form
- Generative audit-intake UI
- Assistant audit workflow state
- Assistant audit tools
- Assistant audit confirmation events
- Email collection for audit requests
- Audit submission confirmation
- Freeman notification
- Follow-up email
- Admin dashboard
- Admin authentication changes
- Audit review status
- Audit delivery system
- Audit PDF generation
- Recorded audit delivery
- Payment collection
- Pricing
- Founding-client discounts
- Automated qualification
- Automated proposal generation
- Automated client closing
- Meeting-booking changes
- Homepage redesign
- Work-page redesign
- About-page redesign
- Broad Navbar redesign
- Full-site dark mode
- Open Graph artwork redesign
- New testimonials
- New case studies
- Analytics-event architecture
- A/B testing infrastructure
- Search-index architecture changes
- Unrelated refactoring

---

# Verification strategy

- Review the page against the exact copy and section order.
- Verify the first desktop viewport communicates the problem, offer, deliverable, audience, CTA and reassurance.
- Verify mobile and desktop layouts in a real browser.
- Verify all CTA instances open the assistant with the exact configured message.
- Verify the example audit is clearly illustrative and contains no fabricated metrics.
- Verify motion with normal and reduced-motion settings.
- Verify keyboard interaction and visible focus.
- Verify Audit content schemas and service mapping through focused tests.
- Verify Audit content sync locally using the existing sync path where the test environment permits.
- Verify existing routes and tests remain green.
- Do not create a broad screenshot-diff system solely for this milestone.
- Add a focused regression test when implementation or review uncovers a concrete failure.

---

# Required tests

1. Audit hero content accepts the approved record and rejects missing required copy.
2. The hero action prompt rejects values beyond the assistant trigger limit.
3. Problem-signal content requires the four approved signal items.
4. Deliverable content requires the four approved deliverable sections and three process steps.
5. Audit proof content preserves the configured project order.
6. A missing required proof project fails clearly.
7. Final CTA content accepts the approved action and rejects malformed content.
8. `getAuditPageData()` loads and maps all required content.
9. Audit CTAs use the exact configured assistant message.
10. The assistant trigger is invoked instead of route navigation for the primary action.
11. `audit` is accepted as a content-sync scope.
12. An unknown content scope still fails before writing.
13. Syncing unchanged Audit content remains idempotent.
14. Existing homepage, Work, About, assistant and content-sync tests remain green.
15. Repository validation commands pass.

---

# Acceptance criteria

- [ ] Milestone 13 is confirmed merged before the new milestone branch is created.
- [ ] The milestone branch is created from the latest remote default branch.
- [ ] `/audit` renders successfully.
- [ ] The page follows the approved order: Hero, Problem Signals, Deliverable and Process, Relevant Proof, Final CTA.
- [ ] The hero uses the exact approved eyebrow, headline, copy, audience line, deliverable labels, CTA and reassurance.
- [ ] The hero visual is labelled `Example audit preview`.
- [ ] The hero visual uses the exact approved four-step illustrative flow.
- [ ] The hero visual highlights the approved manual-check and spreadsheet-copy steps.
- [ ] The hero visual displays the exact approved friction diagnosis.
- [ ] The hero visual displays the exact approved recommendation.
- [ ] The page contains no fake score, percentage, revenue estimate, analytics result or performance claim.
- [ ] The problem-signals section contains the four exact approved signals.
- [ ] The signals are connected visually as symptoms within a journey or workflow.
- [ ] The deliverable section uses the exact approved copy.
- [ ] The audit-output preview contains Current path, Main friction, Why it matters and Recommended next step.
- [ ] The scope boundary is visible and uses the exact approved wording.
- [ ] The process contains exactly the three approved steps.
- [ ] The reassurance uses the exact approved wording.
- [ ] The proof section resolves Pay4Me / WithRadius, Portfolio Assistant and Email PA through stable project keys.
- [ ] The proof items appear in the approved order.
- [ ] The proof section contains no unsupported testimonials, client logos or invented outcomes.
- [ ] The final CTA uses the exact approved copy.
- [ ] Every primary CTA label is `Start My Free Audit`.
- [ ] Every primary CTA opens the existing assistant.
- [ ] Every primary CTA uses the exact approved starter message.
- [ ] No competing page CTA is rendered.
- [ ] The `/audit` header does not present LinkedIn as a competing right-side action.
- [ ] `Audit` appears in desktop and mobile navigation.
- [ ] The floating assistant remains available.
- [ ] The page uses the current light theme and existing colour tokens.
- [ ] Blue, violet or cyan accent effects remain restrained and readable.
- [ ] Lucide remains the only icon library.
- [ ] Existing Framer Motion or CSS motion is used without adding another animation dependency.
- [ ] Reduced-motion users receive a complete static experience.
- [ ] Mobile layouts do not create horizontal scrolling or unreadable diagrams.
- [ ] The route page remains thin.
- [ ] Browser-facing Audit components live under `src/features/audit`.
- [ ] Audit content is loaded through the portfolio service.
- [ ] Audit content is strictly validated.
- [ ] Audit content is database-backed.
- [ ] `content/portfolio/audit.ts` is the editable source for the Audit page.
- [ ] `audit` is available as a content-sync scope.
- [ ] Audit content sync remains non-destructive and idempotent.
- [ ] Updated Audit content continues through the existing search-index job path.
- [ ] `/audit` is included in the sitemap.
- [ ] Route metadata uses the approved title and description.
- [ ] No audit-request persistence, admin or complete assistant-intake workflow is introduced.
- [ ] Existing relevant tests remain green.
- [ ] Required repository validation passes.
- [ ] No pull request is merged by the agent.

---

# Manual tasks

1. Freeman supplies the approved generated Audit-page reference image to the implementation agent when running the milestone.
2. Freeman reviews the completed page at desktop and mobile sizes.
3. Freeman confirms that the page feels visually substantial, premium and consistent with the existing light website.
4. Freeman confirms that the page communicates the offer faster through the visual audit example than through explanatory text.
5. Freeman starts the audit from each CTA and checks the live assistant conversation manually.
6. Freeman confirms that the current assistant interaction is acceptable as the temporary intake path until the structured audit workflow milestone.

---

# Manual acceptance criteria

- [ ] The page feels like a natural continuation of the current portfolio rather than a generic template.
- [ ] The reference image influenced hierarchy and visual communication without being copied literally.
- [ ] The first viewport clearly communicates the problem, deliverable, audience and action.
- [ ] The page feels persuasive without sounding exaggerated, corporate or aggressively sales-driven.
- [ ] The visual audit example is immediately understandable.
- [ ] The page contains less explanatory text than the previous proposal while communicating more clearly.
- [ ] The page makes the free audit feel genuinely useful rather than like a disguised sales call.
- [ ] Starting the audit through the existing assistant feels coherent enough for the current milestone.
