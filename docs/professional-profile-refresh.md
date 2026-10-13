# Professional profile refresh — October 2026

Source: [approved Master CV](https://docs.google.com/document/d/1toIhZxORIL5qNbGm8Z_L2OtthRhIZbynX7YTx3S4qaY). Freeman confirmed that JPScents and Debby Arts were Novier Labs employment work.

The website now attributes only two professional employment entries: Novier Labs (August 2023–July 2025) and Pay4Me (January 2022–February 2023). It preserves the distinct project stories and attributes commercial results to the products/businesses, not to one engineer alone.

Debby Arts is described as an assessment and proposed customer journey: the CV supports that, but does not confirm the previous website's launch claim. No completion/award claim was added for the MSc. The approved CV itself was not modified. No downloadable CV is currently offered by the site.

## Existing database content

Seed changes do not overwrite an initialized database. The narrowly scoped refresh updates the profile, four existing content blocks, four projects and the employment entries without replacing media, actions or unrelated content. It aborts on ambiguous records or ordering conflicts. Before production execution, preserve the affected public records for recovery.

```sh
NODE_OPTIONS='--conditions=react-server' npx tsx --env-file=.env src/entrypoints/maintenance/refresh-professional-profile.ts
NODE_OPTIONS='--conditions=react-server' npx tsx --env-file=.env.production.local src/entrypoints/maintenance/refresh-professional-profile.ts --production --confirm-production
npm run index:rebuild:production -- --confirm-production
```

These use already configured environment files; do not print their contents. Deploy the application after the content refresh to replace the old page-cache build. This task needs no schema migration and must not run a destructive bootstrap.

## LinkedIn copy — prepared, not published

Browser editing was blocked by unrelated private messaging overlays. No LinkedIn changes have been saved. Use this copy when editing can safely resume; verify the existing entries before changing dates or deleting anything.

### Headline

The existing headline already supports the positioning and can remain:

Software Engineer | Customer-Facing AI Products & Reliable Operational Workflows | Helping Businesses Convert Enquiries and Reduce Repetitive Work

### About

I’m a London-based software engineer working on customer-facing products, AI applications and the operational workflows behind them.

I started at Pay4Me implementing requirements alongside senior engineers, designers and product teams. I contributed to payment workflows supporting over US$500,000 in transactions, delivered Clear Assessment’s administration experience within a 30-day project deadline, and worked on Birbur and AcrossTheHorizon. Those projects taught me to connect implementation decisions with what a business actually needs to deliver.

At Novier Labs, I started TruTech.app as its first developer, adapted to an unfamiliar mobile environment and helped keep the scope achievable as the team and stakeholder demands grew. On BARSS, I became technical lead, managing a mobile engineer and product designer and helping executives and engineers agree the first release’s priorities.

That responsibility extended into understanding client problems before deciding what to build. For JPScents, I investigated the owner’s WhatsApp-dependent sales process and built a storefront so customers could choose fragrances independently. For Debby Arts, I assessed artwork, printing and custom orders before proposing a clearer portfolio and enquiry journey.

Today, I bring that same approach to AI applications and reliable workflows: understand the situation, make the trade-offs explicit and build a practical solution. My portfolio assistant is one example—combining retrieval, tool calling and saved workflow state with a conversational interface.

Explore my work at freemanmadudili.com.

### Software Engineer · Novier Labs

August 2023–July 2025

- Started TruTech.app as its first developer, learning an unfamiliar mobile environment and building request, application, portfolio, payment and administration journeys across three user roles. As two engineers and a delivery manager joined, helped establish achievable scope despite changing stakeholder demands.
- Became technical lead on BARSS, an app connecting artists with studios and producers. Managed a mobile engineer and product designer, coordinated with the delivery manager and executive officer, and helped reconcile feasibility and delivery constraints to agree the first release’s priorities.
- Assessed JPScents’ WhatsApp-dependent sales process and proposed, built and launched a storefront that lets customers discover products and choose fragrances before contacting the owner for payment and delivery.
- Assessed Debby Arts’ artwork, printing and custom-order process and proposed a portfolio, clearer service information and custom-order guidance around a more useful enquiry journey.

### Frontend Developer · Pay4Me

January 2022–February 2023

- Contributed to Pay4Me.Pay after third-party gateway verification and support delays disrupted large student payments. Helped build the payment experience around the company’s microfinance bank partnership; the workflows supported over US$500,000 in transactions.
- Delivered Clear Assessment’s administration experience within a 30-day project deadline, working from product requirements and designs through to launch.
- Built Birbur’s host-facing car-booking experience alongside a senior engineer, presented progress to stakeholders and helped defer integrations until after the first release. The work finished ahead of schedule.
- Rebuilt key customer experiences in AcrossTheHorizon’s existing Laravel application with backend engineers. The business generated over US$60,000 in its first week after launch.

### Skills and Featured

Align skills with TypeScript, React, Next.js, Node.js, PostgreSQL, REST APIs, OpenAI API, RAG, Tool Calling, Workflow Automation, Azure, Docker and CI/CD, using LinkedIn’s available equivalent labels.

Keep the verified portfolio destination https://freemanmadudili.com. Prefer a Featured title such as “Freeman Madudili — Projects, AI assistant & engineering work” over representing the whole portfolio as only a free audit. Do not create unsupported project/launch claims. Remove Hippodrome from professional Experience only after checking the exact entry and confirming deletion in the interface.

## Search

The homepage uses Software Engineer metadata and database-backed Person structured data. The canonical URL and sitemap point to the public root. The sitemap no longer invents a new modification date on every request. Structured data does not guarantee a Knowledge Panel or indexing. The authenticated Search Console session opened its “Add a website” welcome screen, with no existing property available. No verification settings were changed and no indexing request was submitted.
