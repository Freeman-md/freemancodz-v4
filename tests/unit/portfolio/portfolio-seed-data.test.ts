import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  actionSeeds,
  contentSeeds,
  experienceSeeds,
  iconSeeds,
  mediaSeeds,
  profileCollections,
  profileSeed,
  projectSeeds,
} from "../../../prisma/portfolio-seed-data";

test("the complete approved canonical seed payload remains exact", () => {
  const fingerprints = Object.fromEntries(
    Object.entries({
      profileSeed,
      profileCollections,
      contentSeeds,
      actionSeeds,
      mediaSeeds,
      projectSeeds,
      experienceSeeds,
    }).map(([name, value]) => [
      name,
      createHash("sha256").update(JSON.stringify(value)).digest("hex"),
    ]),
  );

  assert.deepEqual(fingerprints, {
    profileSeed: "063fd7ad9614ccc9b60890cda85a952aeff0b4231e23acccd71e0afb3ba667e4",
    profileCollections: "e1317ceb833726db55175b442b6703fa28c9180d51c5d2b2c8eb374447d83278",
    contentSeeds: "128afe74628cde43d31d292758807b87d89db62b3ab75f5a4207e31d747a6c49",
    actionSeeds: "3ddaf27d71f9af15490e9825ccc872606b29070c165484cfdfa8022881c6478a",
    mediaSeeds: "2ea4f3704fd1a3912aeeb8949fcd30ed4912fcab790bd395904aa2395d059cb6",
    projectSeeds: "e2b536903b5d94caf5d20b6e1112f50e143a4ad333fe087f9a6b5170de15cc64",
    experienceSeeds: "ea7b1592d006f5e6a0caadd3849613eda66cca20afb8e072fe9b651ab7f95c17",
  });
});

test("profile seed and all six ordered reusable collections are exact", () => {
  assert.deepEqual(profileSeed, {
    id: "global",
    name: "Freeman Madudili",
    title: "Software engineer",
    positioning: "Customer-Facing Products · AI Applications · Reliable Workflows",
    email: "freemanmadudili@outlook.com",
    linkedInUrl: "https://www.linkedin.com/in/freeman-madudili-9864101a2/",
    githubUrl: "https://github.com/Freeman-md",
  });
  assert.deepEqual(
    Object.fromEntries(
      profileCollections.map(({ collection, items }) => [
        collection,
        items.map(({ key, label }) => [key, label]),
      ]),
    ),
    {
      AUDIENCE: [
        ["profile.audience.founders", "Founders"],
        ["profile.audience.hiring", "Hiring Managers"],
        ["profile.audience.leaders", "Engineering Leaders"],
        ["profile.audience.teams", "Technical Teams"],
        ["profile.audience.collab", "Collaborators"],
      ],
      PRINCIPLES: [
        ["profile.principles.outcomes", "User outcomes"],
        ["profile.principles.systems", "Systems thinking"],
        ["profile.principles.reliability", "Reliability by design"],
        ["profile.principles.integration", "Practical integration"],
      ],
      THINKING_PRINCIPLES: [
        ["profile.thinking.problem", "Understand the real problem first"],
        ["profile.thinking.automate", "Automate the routine, keep judgement where it matters"],
        ["profile.thinking.reliability", "Reliability is part of the product"],
      ],
      PROCESS_PRINCIPLES: [
        ["profile.process.problem", "Problem before technology"],
        ["profile.process.useful", "Useful before complex"],
        ["profile.process.verified", "Verified before complete"],
      ],
      CONTROL_PRINCIPLES: [
        ["profile.control.boundaries", "Clear boundaries"],
        ["profile.control.guardrails", "Deterministic guardrails"],
        ["profile.control.observable", "Observable state"],
        ["profile.control.human", "Human in control"],
      ],
      OUTCOMES: [
        ["profile.outcomes.actions", "Make actions easier to take"],
        ["profile.outcomes.next", "Connect what happens next"],
        ["profile.outcomes.work", "Reduce unnecessary work"],
        ["profile.outcomes.hold", "Build systems that hold up"],
      ],
    },
  );
});

test("page allocation, hierarchy, and ordered reusable relationships are exact", () => {
  assert.deepEqual(
    Object.fromEntries(
      ["home", "work", "about", "audit"].map((page) => [
        page,
        contentSeeds
          .filter(({ key, parent }) => key.startsWith(`${page}.`) && !parent)
          .sort((left, right) => left.order - right.order)
          .map(({ key }) => key),
      ]),
    ),
    {
      home: ["home.hero", "home.improve", "home.work", "home.audit", "home.cta"],
      work: ["work.hero", "work.relevant", "work.additional", "work.connects", "work.cta"],
      about: [
        "about.hero",
        "about.journey",
        "about.thinking",
        "about.work",
        "about.explore",
        "about.outside",
        "about.cta",
      ],
      audit: ["audit.hero", "audit.process", "audit.why", "audit.proof", "audit.cta"],
    },
  );
  assert.deepEqual(
    contentSeeds
      .filter(({ parent }) => parent)
      .map(({ key, parent, order }) => `${parent}:${order}:${key}`),
    [
      "home.improve:1:home.improve.journey",
      "home.improve:2:home.improve.workflow",
      "home.audit:1:home.audit.problem",
      "home.audit:2:home.audit.improve",
      "work.hero:1:work.hero.focus",
      "work.hero:2:work.hero.approach",
      "work.connects:1:work.connects.products",
      "work.connects:2:work.connects.experiences",
      "work.connects:3:work.connects.workflows",
      "about.hero:1:about.hero.customer",
      "about.hero:2:about.hero.system",
      "about.thinking:1:about.thinking.customer",
      "about.thinking:2:about.thinking.workflow",
      "about.cta:1:about.cta.work",
      "audit.process:1:audit.process.context",
      "audit.process:2:audit.process.inspect",
      "audit.process:3:audit.process.prioritise",
      "audit.process:4:audit.process.action",
    ],
  );

  const relationships = Object.fromEntries(
    contentSeeds
      .filter(({ icons, media, actions }) => icons || media || actions)
      .map(({ key, icons = [], media = [], actions = [] }) => [key, { icons, media, actions }]),
  );

  assert.deepEqual(relationships, {
    "home.hero": { icons: [], media: [], actions: ["action.home.audit", "action.home.relevant"] },
    "home.improve.journey": {
      icons: ["journey.find", "journey.understand", "journey.decide", "journey.act"],
      media: [],
      actions: [],
    },
    "home.improve.workflow": {
      icons: ["workflow.capture", "workflow.route", "journey.decide", "workflow.complete"],
      media: [],
      actions: [],
    },
    "home.work": { icons: [], media: [], actions: ["action.home.all"] },
    "home.audit": {
      icons: ["home.audit.identify", "home.audit.view", "home.audit.reviewed"],
      media: [],
      actions: ["action.home.audit"],
    },
    "home.audit.problem": {
      icons: [
        "audit-flow.submit",
        "home.problem.inbox",
        "home.problem.check",
        "home.problem.copy",
        "home.problem.follow",
      ],
      media: [],
      actions: [],
    },
    "home.audit.improve": {
      icons: [
        "audit-flow.submit",
        "home.improve.capture",
        "home.improve.route",
        "home.improve.follow",
      ],
      media: [],
      actions: [],
    },
    "home.cta": { icons: [], media: [], actions: ["action.home.start"] },
    "work.cta": {
      icons: ["work.cta.projects", "work.cta.roles", "work.cta.collab", "work.cta.enquiries"],
      media: [],
      actions: ["action.work.conversation"],
    },
    "about.hero.customer": {
      icons: ["journey.find", "journey.understand", "journey.act"],
      media: [],
      actions: [],
    },
    "about.hero.system": {
      icons: ["workflow.capture", "workflow.route", "workflow.complete"],
      media: [],
      actions: [],
    },
    "about.thinking.customer": {
      icons: ["journey.find", "journey.understand", "journey.decide", "journey.act"],
      media: [],
      actions: [],
    },
    "about.thinking.workflow": {
      icons: ["workflow.capture", "workflow.route", "journey.decide", "workflow.complete"],
      media: [],
      actions: [],
    },
    "about.work": {
      icons: [
        "process.understand",
        "process.map",
        "process.build",
        "process.connect",
        "process.verify",
      ],
      media: [],
      actions: [],
    },
    "about.explore": {
      icons: [
        "explore.control",
        "explore.observe",
        "explore.detect",
        "explore.diagnose",
        "explore.recover",
        "explore.verify",
      ],
      media: [],
      actions: [],
    },
    "about.outside": {
      icons: [],
      media: ["outside.strength", "outside.endurance", "outside.community", "outside.learning"],
      actions: [],
    },
    "about.cta": { icons: [], media: [], actions: ["action.about.message"] },
    "about.cta.work": { icons: [], media: [], actions: ["action.about.work"] },
    "audit.hero": { icons: [], media: [], actions: ["action.audit.claim"] },
    "audit.why": {
      icons: [
        "audit.symptom.questions",
        "audit.symptom.slow",
        "audit.symptom.follow",
        "audit.symptom.copy",
        "audit.symptom.handoff",
        "audit.symptom.remember",
      ],
      media: [],
      actions: [],
    },
    "audit.cta": { icons: [], media: [], actions: ["action.audit.start"] },
  });

  assert.equal(
    contentSeeds.some(({ key }) => key.startsWith("audit.before")),
    false,
  );
  assert.equal(
    contentSeeds.some(({ key }) => key.startsWith("audit.after")),
    false,
  );
  assert.equal(
    iconSeeds.some(({ key }) => key.startsWith("audit.before")),
    false,
  );
  assert.equal(
    iconSeeds.some(({ key }) => key.startsWith("audit.after")),
    false,
  );
});

test("content URLs use each top-level seed key as the public section anchor", () => {
  const seedsByKey = new Map(contentSeeds.map((seed) => [seed.key, seed]));

  const rootFor = (seed: (typeof contentSeeds)[number]) => {
    let current = seed;

    while (current.parent) {
      const parent = seedsByKey.get(current.parent);

      assert.ok(parent, `Expected parent seed ${current.parent}.`);
      current = parent;
    }

    return current;
  };

  assert.equal(contentSeeds.length, 40);

  for (const seed of contentSeeds) {
    const root = rootFor(seed);

    const page = root.key.split(".")[0]!;

    const pageUrl = page === "home" ? "/" : `/${page}`;

    const expectedUrl = root.key.endsWith(".hero")
      ? pageUrl
      : `${pageUrl}#${root.key.replaceAll(".", "-")}`;

    assert.equal(seed.url, expectedUrl, seed.key);
  }
});

test("all action labels, destinations, and assistant messages are exact", () => {
  assert.deepEqual(
    actionSeeds.map(({ key, label, variant, url, assistantMessage }) => ({
      key,
      label,
      variant,
      url,
      assistantMessage,
    })),
    [
      {
        key: "action.home.audit",
        label: "Get a Free Audit",
        variant: "PRIMARY",
        url: "/audit",
        assistantMessage: undefined,
      },
      {
        key: "action.home.relevant",
        label: "View Relevant Work",
        variant: "SECONDARY",
        url: "/work",
        assistantMessage: undefined,
      },
      {
        key: "action.home.all",
        label: "View All Work",
        variant: "LINK",
        url: "/work",
        assistantMessage: undefined,
      },
      {
        key: "action.home.start",
        label: "Start My Free Audit",
        variant: "PRIMARY",
        url: "/audit",
        assistantMessage: undefined,
      },
      {
        key: "action.work.conversation",
        label: "Start a Conversation",
        variant: "PRIMARY",
        url: undefined,
        assistantMessage:
          "I’ve been looking through your work and I’d like to talk about something I’m working on.",
      },
      {
        key: "action.about.message",
        label: "Send Me a Message",
        variant: "PRIMARY",
        url: undefined,
        assistantMessage: "I’d like to get in touch about something and share a bit of context.",
      },
      {
        key: "action.about.work",
        label: "View relevant work",
        variant: "LINK",
        url: "/work",
        assistantMessage: undefined,
      },
      {
        key: "action.audit.claim",
        label: "Claim My Free Audit",
        variant: "PRIMARY",
        url: undefined,
        assistantMessage: "I would like to claim my free customer journey and workflow audit.",
      },
      {
        key: "action.audit.start",
        label: "Start My Free Audit",
        variant: "PRIMARY",
        url: undefined,
        assistantMessage: "I would like to claim my free customer journey and workflow audit.",
      },
    ],
  );
});

test("all project and experience identities, ordering, and related icons are exact", () => {
  assert.deepEqual(projectSeeds, [
    {
      slug: "jpscents",
      title: "JPScents",
      category: "Novier Labs · Fragrance commerce",
      problem:
        "The owner relied on WhatsApp conversations to explain the catalogue and help each customer choose a fragrance before taking payment.",
      solution:
        "After understanding how the business sold, Freeman proposed and built a storefront where customers can explore products and choose fragrances independently, then continue to WhatsApp for payment and delivery. Catalogue, inventory and order administration support the owner behind the scenes.",
      outcome:
        "Customers reach WhatsApp with their choices already made, so the owner can handle payment instead of walking each person through the catalogue.",
      cover: "cover.jpscents",
      externalLinks: ["https://jpscents.shop"],
      featured: true,
      order: 1,
      visualText: "From scent discovery to a clear next step.",
      markdown:
        "### Product decisions\nGuided fragrance discovery, size-aware availability and a saved-order handoff keep the customer journey clear without replacing the business’s WhatsApp payment and delivery workflow.\n\n### Engineering\nThe implementation includes atomic stock deduction with order creation, duplicate-submission protection and single stock restoration on cancellation. These safeguards have source and test coverage; live transaction behaviour has not been independently verified.",
    },
    {
      slug: "debby-arts",
      title: "Debby Art & Prints",
      category: "Novier Labs · Art and creative services",
      problem:
        "Customers needed an easier way to explore artwork, printing and personalisation services and share a useful brief before the conversation began.",
      solution:
        "Freeman assessed how the business handled artwork, printing and custom orders, then proposed a portfolio with clearer service information and custom-order guidance to make customer enquiries more useful.",
      outcome: "Defined a concrete website scope and plan around the business’s enquiry process.",
      cover: "cover.debby-arts",
      externalLinks: ["https://debbyartprints.com.ng"],
      featured: true,
      order: 2,
      visualText: "Creative work, without the vague enquiry.",
      markdown:
        "### Understanding the business\nAssessed artwork sales, printing services and custom orders before choosing what the website should do.\n\n### Proposed customer journey\nA portfolio, clear service information and custom-order guidance would help visitors explore the work and arrive with a more useful brief.",
    },
    {
      slug: "pay4me-withradius",
      title: "Pay4Me / WithRadius",
      category: "Customer-facing product · Fintech",
      problem:
        "Additional verification and slow support from third-party payment gateways delayed large payments for students studying abroad. Account restrictions could not be solved by code alone.",
      solution:
        "At Pay4Me, Freeman contributed to engineering discussions about growing transaction volume. When the company partnered with a microfinance bank, he helped build the payment experience around that partnership, collaborating with senior engineers and product teams.",
      outcome: "Contributed to payment workflows supporting more than US$500,000 in transactions.",
      cover: "cover.pay4me",
      externalLinks: ["https://withradius.com", "https://pay4me.app"],
      featured: false,
      order: 3,
      visualText: "Payment experiences supporting complex international journeys.",
      visualBlock: "Pay4MeVisual",
    },
    {
      slug: "portfolio-assistant",
      title: "Portfolio Assistant",
      category: "Customer guidance · AI product",
      problem:
        "Different visitors need different information and next steps, but traditional navigation requires everyone to find those answers manually.",
      solution:
        "An AI assistant that retrieves relevant portfolio information, surfaces supporting evidence and guides visitors towards the right next step.",
      externalLinks: ["https://github.com/Freeman-md/freemancodz-v4"],
      featured: false,
      order: 4,
      visualText: "Guided answers that help visitors find clarity and take the next step.",
      visualBlock: "PortfolioAssistantVisual",
    },
    {
      slug: "email-pa",
      title: "Email PA",
      category: "Operational workflow",
      problem:
        "Important information can get buried in email, creating repetitive checking, triage and follow-up work.",
      solution:
        "A background workflow that triages incoming email and helps route the right next action, reducing repetitive inbox handling.",
      externalLinks: ["https://github.com/Freeman-md/email-pa"],
      featured: false,
      order: 5,
      visualText: "Workflow system that reduces repetitive inbox handling.",
      visualBlock: "EmailWorkflowVisual",
    },
    {
      slug: "across-the-horizon",
      title: "AcrossTheHorizon",
      category: "Customer-facing product · Study abroad",
      problem:
        "An existing Laravel application needed key customer experiences rebuilt and integrated before launch.",
      solution:
        "At Pay4Me, Freeman rebuilt customer-facing experiences in collaboration with backend engineers, connecting the frontend and backend before launch.",
      outcome:
        "The business generated more than US$60,000 in revenue in its first week after launch.",
      cover: "cover.horizon",
      externalLinks: ["https://acrossthehorizon.net"],
      featured: false,
      order: 6,
    },
    {
      slug: "shifty",
      title: "Shifty",
      category: "Hackathon · Voice AI",
      problem:
        "Finding cover for a shift can become a manual, time-sensitive process of contacting people and coordinating responses.",
      solution:
        "A voice-agent prototype that helps coordinate shift-cover requests and move the process towards finding a replacement.",
      externalLinks: ["https://github.com/Freeman-md"],
      featured: false,
      order: 7,
    },
    {
      slug: "self-healing-backend-operations-system",
      title: "Self-Healing Backend Operations System",
      category: "MSc Research · Systems",
      problem:
        "Backend incidents often depend on manual detection, diagnosis and recovery, increasing downtime and operational effort.",
      solution:
        "A guarded self-healing backend system that observes incidents, diagnoses likely causes, performs allowed recovery actions and verifies that the system recovered as expected.",
      externalLinks: ["https://github.com/Freeman-md"],
      featured: false,
      order: 8,
    },
  ]);
  assert.deepEqual(
    experienceSeeds.map(({ title, tag, copy, insight, order, icons }) => ({
      title,
      tag,
      copy,
      insight,
      order,
      icons: icons.map(({ label }) => label),
    })),
    [
      {
        title: "Software Engineer · Novier Labs",
        tag: "August 2023 – July 2025",
        copy: "I started TruTech.app as its first developer, learning an unfamiliar mobile environment while building task requests, applications, portfolios, payments and administration across three user roles. As two engineers and a delivery manager joined, I explained feature implications and helped keep the first release achievable despite changing stakeholder demands.\n\nOn BARSS, an app connecting artists with studios and producers, I became technical lead. I managed a mobile engineer and product designer, worked with the delivery manager and executive officer, and bridged disagreements about feasibility and delivery time to agree the first release’s priorities.\n\nFor JPScents, I investigated the owner’s WhatsApp-dependent sales process and proposed and built a storefront that lets customers choose fragrances before contacting the owner. For Debby Arts, I assessed artwork, printing and custom orders and proposed a clearer portfolio and enquiry journey.",
        insight:
          "Progressed from implementing features to guiding scope, technical decisions and delivery across a team.",
        order: 1,
        icons: [],
      },
      {
        title: "Frontend Developer · Pay4Me",
        tag: "January 2022 – February 2023",
        copy: "I began by implementing requirements with product teams, designers and senior engineers. For Pay4Me.Pay, I helped build the payment experience around a microfinance bank partnership after third-party gateway verification and support delays disrupted large student payments. Those workflows supported over US$500,000 in transactions.\n\nI delivered Clear Assessment’s administration experience within a 30-day project deadline, working from the project manager’s requirements and designer’s screens through to launch. On Birbur, I built the host-facing car-booking experience alongside a senior engineer, presented progress to stakeholders and helped defer integrations until after the first release; the work finished ahead of schedule.\n\nFor AcrossTheHorizon, I rebuilt key customer experiences in an existing Laravel application with backend engineers. The business generated over US$60,000 in its first week after launch.",
        insight:
          "Started close to the customer experience, while already working beyond the interface.",
        order: 2,
        icons: ["Interfaces", "APIs", "Production"],
      },
    ],
  );
});
