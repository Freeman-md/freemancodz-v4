import type {
  ActionVariant,
  MediaType,
  ProfileIconCollection,
} from "../src/generated/prisma/client";

export type IconSeed = { key: string; iconName: string | null; label: string; copy?: string };
export type ContentSeed = {
  key: string;
  parent?: string;
  order: number;
  url: string;
  eyebrow?: string;
  title?: string;
  copy?: string;
  icons?: string[];
  media?: string[];
  actions?: string[];
};

export const profileSeed = {
  id: "global",
  name: "Freeman Madudili",
  title: "Software engineer",
  positioning: "Customer-Facing Products · AI Applications · Reliable Workflows",
  email: "freemanmadudili@outlook.com",
  linkedInUrl: "https://www.linkedin.com/in/freeman-madudili-9864101a2/",
  githubUrl: "https://github.com/Freeman-md",
};

const icon = (key: string, iconName: string, label: string, copy?: string): IconSeed => ({
  key,
  iconName,
  label,
  copy,
});

export const iconSeeds: IconSeed[] = [
  icon("journey.find", "Search", "Find"),
  icon("journey.understand", "Lightbulb", "Understand"),
  icon("journey.decide", "Scale", "Decide"),
  icon("journey.act", "MousePointer2", "Act"),
  icon("workflow.capture", "Download", "Capture"),
  icon("workflow.route", "GitBranch", "Route"),
  icon("workflow.complete", "CircleCheck", "Complete"),
  icon(
    "home.audit.identify",
    "Search",
    "We identify the gaps and friction",
    "in the customer experience and the work behind it.",
  ),
  icon(
    "home.audit.view",
    "Sparkles",
    "You receive a clear, actionable view",
    "of what to fix first and why.",
  ),
  icon("home.audit.reviewed", "Zap", "It’s free and personally reviewed", "by Freeman."),
  icon("audit-flow.submit", "UserRound", "Customer submits enquiry"),
  icon("home.problem.inbox", "Mail", "Enquiry reaches inbox"),
  icon("home.problem.check", "Search", "Manual check"),
  icon("home.problem.copy", "FileText", "Information copied elsewhere"),
  icon("home.problem.follow", "Send", "Follow-up happens"),
  icon("home.improve.capture", "Mail", "Information captured automatically"),
  icon("home.improve.route", "Share2", "Routed to the right person or system"),
  icon("home.improve.follow", "CheckCircle2", "Follow-up happens faster"),
  icon("work.cta.projects", "Layers3", "Projects"),
  icon("work.cta.roles", "UserRound", "Roles"),
  icon("work.cta.collab", "UsersRound", "Collaborations"),
  icon("work.cta.enquiries", "Code2", "Product & engineering enquiries"),
  icon("process.understand", "Search", "Understand", "Real problem"),
  icon("process.map", "Map", "Map", "Whole journey"),
  icon("process.build", "Box", "Build", "Smallest useful solution"),
  icon("process.connect", "Puzzle", "Connect", "Systems, tools, people"),
  icon("process.verify", "ShieldCheck", "Verify", "Journeys, edge cases, failures"),
  icon("explore.control", "ShieldCheck", "Human control", "Boundaries. Guardrails. Oversight."),
  icon("explore.observe", "Search", "Observe", "Collect logs, metrics and traces."),
  icon("explore.detect", "BellRing", "Detect", "Identify that something is wrong."),
  icon("explore.diagnose", "ClipboardList", "Diagnose", "Determine the likely cause."),
  icon(
    "explore.recover",
    "SquareTerminal",
    "Recover",
    "Take an allowed action within defined boundaries.",
  ),
  icon("explore.verify", "ShieldCheck", "Verify", "Check the system recovered as expected."),
  icon("audit.symptom.questions", "MessageCircleQuestion", "Repeated questions"),
  icon("audit.symptom.slow", "Clock3", "Slow responses"),
  icon("audit.symptom.follow", "Repeat2", "Repeated follow-up"),
  icon("audit.symptom.copy", "Copy", "Copying info"),
  icon("audit.symptom.handoff", "ArrowLeftRight", "Lost handoffs"),
  icon("audit.symptom.remember", "Brain", "Someone has to remember the next step"),
];

export const profileCollections: Array<{ collection: ProfileIconCollection; items: IconSeed[] }> = [
  {
    collection: "AUDIENCE",
    items: [
      icon("profile.audience.founders", "Users", "Founders"),
      icon("profile.audience.hiring", "BriefcaseBusiness", "Hiring Managers"),
      icon("profile.audience.leaders", "Code2", "Engineering Leaders"),
      icon("profile.audience.teams", "UsersRound", "Technical Teams"),
      icon("profile.audience.collab", "Handshake", "Collaborators"),
    ],
  },
  {
    collection: "PRINCIPLES",
    items: [
      icon("profile.principles.outcomes", "Users", "User outcomes"),
      icon("profile.principles.systems", "Network", "Systems thinking"),
      icon("profile.principles.reliability", "ShieldCheck", "Reliability by design"),
      icon("profile.principles.integration", "Puzzle", "Practical integration"),
    ],
  },
  {
    collection: "THINKING_PRINCIPLES",
    items: [
      icon("profile.thinking.problem", "Target", "Understand the real problem first"),
      icon(
        "profile.thinking.automate",
        "SlidersHorizontal",
        "Automate the routine, keep judgement where it matters",
      ),
      icon("profile.thinking.reliability", "ShieldCheck", "Reliability is part of the product"),
    ],
  },
  {
    collection: "PROCESS_PRINCIPLES",
    items: [
      icon("profile.process.problem", "CircleCheck", "Problem before technology"),
      icon("profile.process.useful", "CircleCheck", "Useful before complex"),
      icon("profile.process.verified", "CircleCheck", "Verified before complete"),
    ],
  },
  {
    collection: "CONTROL_PRINCIPLES",
    items: [
      icon(
        "profile.control.boundaries",
        "LockKeyhole",
        "Clear boundaries",
        "Only specific systems and actions.",
      ),
      icon(
        "profile.control.guardrails",
        "SlidersHorizontal",
        "Deterministic guardrails",
        "Allowlisted actions with defined preconditions.",
      ),
      icon(
        "profile.control.observable",
        "Eye",
        "Observable state",
        "Everything is logged, measured and traceable.",
      ),
      icon(
        "profile.control.human",
        "UserRound",
        "Human in control",
        "Escalate when unsure. People make the call.",
      ),
    ],
  },
  {
    collection: "OUTCOMES",
    items: [
      icon("profile.outcomes.actions", "CheckCircle2", "Make actions easier to take"),
      icon("profile.outcomes.next", "CheckCircle2", "Connect what happens next"),
      icon("profile.outcomes.work", "CheckCircle2", "Reduce unnecessary work"),
      icon("profile.outcomes.hold", "CheckCircle2", "Build systems that hold up"),
    ],
  },
];

export const actionSeeds: Array<
  IconSeed & { variant: ActionVariant; url?: string; assistantMessage?: string }
> = [
  {
    key: "action.home.audit",
    iconName: null,
    label: "Get a Free Audit",
    variant: "PRIMARY",
    url: "/audit",
  },
  {
    key: "action.home.relevant",
    iconName: null,
    label: "View Relevant Work",
    variant: "SECONDARY",
    url: "/work",
  },
  { key: "action.home.all", iconName: null, label: "View All Work", variant: "LINK", url: "/work" },
  {
    key: "action.home.start",
    iconName: null,
    label: "Start My Free Audit",
    variant: "PRIMARY",
    url: "/audit",
  },
  {
    key: "action.work.conversation",
    iconName: null,
    label: "Start a Conversation",
    variant: "PRIMARY",
    assistantMessage:
      "I’ve been looking through your work and I’d like to talk about something I’m working on.",
  },
  {
    key: "action.about.message",
    iconName: null,
    label: "Send Me a Message",
    variant: "PRIMARY",
    assistantMessage: "I’d like to get in touch about something and share a bit of context.",
  },
  {
    key: "action.about.work",
    iconName: null,
    label: "View relevant work",
    variant: "LINK",
    url: "/work",
  },
  {
    key: "action.audit.claim",
    iconName: null,
    label: "Claim My Free Audit",
    variant: "PRIMARY",
    assistantMessage: "I would like to claim my free customer journey and workflow audit.",
  },
  {
    key: "action.audit.start",
    iconName: null,
    label: "Start My Free Audit",
    variant: "PRIMARY",
    assistantMessage: "I would like to claim my free customer journey and workflow audit.",
  },
];

export const mediaSeeds: Array<
  IconSeed & { type: MediaType; objectPath?: string; source?: string; altText: string }
> = [
  {
    key: "cover.jpscents",
    iconName: null,
    label: "JPScents cover",
    type: "IMAGE",
    source: "/images/projects/jpscents.webp",
    altText: "JPScents live perfume website",
  },
  {
    key: "cover.debby-arts",
    iconName: null,
    label: "Debby Art & Prints cover",
    type: "IMAGE",
    source: "/images/projects/debby-arts.webp",
    altText: "Debby Art & Prints live artwork and creative-services website",
  },
  {
    key: "outside.strength",
    iconName: "Dumbbell",
    label: "Strength",
    type: "IMAGE",
    objectPath: "images/strength-training",
    altText: "Strength",
  },
  {
    key: "outside.endurance",
    iconName: "PersonStanding",
    label: "Endurance",
    type: "IMAGE",
    objectPath: "images/running",
    altText: "Endurance",
  },
  {
    key: "outside.community",
    iconName: "Users",
    label: "Community",
    type: "IMAGE",
    objectPath: "images/community",
    altText: "Community",
  },
  {
    key: "outside.learning",
    iconName: "BookOpen",
    label: "Always Learning",
    type: "IMAGE",
    objectPath: "images/learning",
    altText: "Always Learning",
  },
  {
    key: "cover.pay4me",
    iconName: null,
    label: "Pay4Me / WithRadius cover",
    type: "IMAGE",
    source: "/images/work/withradius-hero.jpg",
    altText: "WithRadius homepage showing its international payment experience",
  },
  {
    key: "cover.horizon",
    iconName: null,
    label: "AcrossTheHorizon cover",
    type: "IMAGE",
    source: "/images/work/across-the-horizon.jpg",
    altText: "AcrossTheHorizon study-abroad platform",
  },
];

export const projectSeeds = [
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
];

export const experienceSeeds = [
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
    icons: [
      icon("experience.pay4me.interfaces", "Smartphone", "Interfaces"),
      icon("experience.pay4me.apis", "Braces", "APIs"),
      icon("experience.pay4me.production", "Cloud", "Production"),
    ],
  },
];

const content = (
  key: string,
  order: number,
  url: string,
  fields: Omit<ContentSeed, "key" | "order" | "url">,
): ContentSeed => ({ key, order, url, ...fields });

export const contentSeeds: ContentSeed[] = [
  content("home.hero", 1, "/", {
    title: "Customer-facing products. AI applications. Reliable workflows.",
    copy: "I understand how a business works, find where people get stuck, and build practical software that connects the customer experience to the work behind it.",
    actions: ["action.home.audit", "action.home.relevant"],
  }),
  content("home.improve", 2, "/#home-improve", {
    eyebrow: "Customer journeys + workflows",
    title: "What I Help Improve.",
    copy: "The customer experience in front, and the workflow that keeps it moving behind the scenes.",
  }),
  content("home.improve.journey", 1, "/#home-improve", {
    parent: "home.improve",
    title: "Customer Journeys",
    copy: "Help customers understand what to do and take the next step.",
    icons: ["journey.find", "journey.understand", "journey.decide", "journey.act"],
  }),
  content("home.improve.workflow", 2, "/#home-improve", {
    parent: "home.improve",
    title: "Operational Workflows",
    copy: "Reduce the repetitive work required to keep the process moving.",
    icons: ["workflow.capture", "workflow.route", "journey.decide", "workflow.complete"],
  }),
  content("home.work", 3, "/#home-work", {
    eyebrow: "Proof of work",
    title: "Relevant Work",
    copy: "A few examples of customer-facing products and operational systems built around real problems.",
    actions: ["action.home.all"],
  }),
  content("home.audit", 4, "/#home-audit", {
    eyebrow: "Free customer journey & workflow audit",
    title: "Find where customers get stuck or work falls back to manual effort.",
    icons: ["home.audit.identify", "home.audit.view", "home.audit.reviewed"],
    actions: ["action.home.audit"],
  }),
  content("home.audit.problem", 1, "/#home-audit", {
    parent: "home.audit",
    eyebrow: "The problem",
    title: "Unnecessary friction in the current process",
    copy: "Follow-up depends on someone noticing and manually moving the information.",
    icons: [
      "audit-flow.submit",
      "home.problem.inbox",
      "home.problem.check",
      "home.problem.copy",
      "home.problem.follow",
    ],
  }),
  content("home.audit.improve", 2, "/#home-audit", {
    parent: "home.audit",
    eyebrow: "The improvement",
    title: "A smoother handoff and faster follow-up",
    copy: "Capture the information once and route it directly to the correct next step.",
    icons: [
      "audit-flow.submit",
      "home.improve.capture",
      "home.improve.route",
      "home.improve.follow",
    ],
  }),
  content("home.cta", 5, "/#home-cta", {
    eyebrow: "Not sure where the friction is?",
    title: "Show me one part of the journey that isn’t working as smoothly as it should.",
    copy: "You don’t need to know whether the answer is software, automation or AI. Start with what is happening now.",
    actions: ["action.home.start"],
  }),

  content("work.hero", 1, "/work", {
    title: "Products and workflows built around real problems.",
    copy: "Relevant work across customer-facing products, operational systems and practical AI.",
  }),
  content("work.hero.focus", 1, "/work", {
    parent: "work.hero",
    title: "Focus",
    copy: "Product · Systems · AI",
  }),
  content("work.hero.approach", 2, "/work", {
    parent: "work.hero",
    title: "Approach",
    copy: "User value, operational impact, technical rigor.",
  }),
  content("work.relevant", 2, "/work#work-relevant", {
    eyebrow: "Relevant work",
    title: "Relevant Work. Real Problems. Meaningful Impact",
    copy: "Selected case studies across customer-facing products, operational systems and practical AI.",
  }),
  content("work.additional", 3, "/work#work-additional", {
    eyebrow: "Supporting work",
    title: "Additional Work & Experiments",
  }),
  content("work.connects", 4, "/work#work-connects", {
    eyebrow: "How the work connects",
    title:
      "Different problems. The same focus: make the experience clearer and the system behind it work better.",
  }),
  content("work.connects.products", 1, "/work#work-connects", {
    parent: "work.connects",
    title: "Customer-Facing Products",
    copy: "Helping people understand their options and complete important actions with confidence.",
  }),
  content("work.connects.experiences", 2, "/work#work-connects", {
    parent: "work.connects",
    title: "Connected Experiences",
    copy: "Bridging the moment a customer acts with what happens next.",
  }),
  content("work.connects.workflows", 3, "/work#work-connects", {
    parent: "work.connects",
    title: "Reliable Operational Workflows",
    copy: "Reducing manual work and ensuring the right things happen, every time.",
  }),
  content("work.cta", 5, "/work#work-cta", {
    eyebrow: "What's next?",
    title: "Seen something here that maps to what you're working on?",
    copy: "Tell me what you're building, hiring for or trying to improve. My assistant will help get the right context across.",
    icons: ["work.cta.projects", "work.cta.roles", "work.cta.collab", "work.cta.enquiries"],
    actions: ["action.work.conversation"],
  }),

  content("about.hero", 1, "/about", {
    eyebrow: "Software engineer",
    title: "I build software around the moments where people need something to happen.",
    copy: "I started at Pay4Me implementing requirements alongside senior engineers, designers and product teams. At Novier Labs, I grew into shaping scope, making technical decisions and leading delivery across engineering and design.\n\nMy client work now starts before implementation: understanding how the business operates, questioning the initial request and proposing what would actually help. For JPScents, that meant moving product discovery out of repetitive WhatsApp conversations. For Debby Arts, it meant assessing artwork, printing and custom orders before proposing a clearer enquiry journey.",
  }),
  content("about.hero.customer", 1, "/about", {
    parent: "about.hero",
    title: "Customer / User",
    icons: ["journey.find", "journey.understand", "journey.act"],
  }),
  content("about.hero.system", 2, "/about", {
    parent: "about.hero",
    title: "System / Workflow",
    icons: ["workflow.capture", "workflow.route", "workflow.complete"],
  }),
  content("about.journey", 2, "/about#about-journey", {
    eyebrow: "How I got here",
    title: "From implementing requirements to shaping the solution",
    copy: "I’m a software engineer whose work has grown from implementing product requirements to leading delivery and helping clients decide what is worth building. I connect the people, technical decisions and operational details that make a product work.",
  }),
  content("about.thinking", 3, "/about#about-thinking", {
    eyebrow: "How I think about products",
    title: "The interface is only half the product",
    copy: "A product only works when the customer-facing experience and the operational workflow behind it work together.",
  }),
  content("about.thinking.customer", 1, "/about#about-thinking", {
    parent: "about.thinking",
    title: "Customer-Facing Experience",
    icons: ["journey.find", "journey.understand", "journey.decide", "journey.act"],
  }),
  content("about.thinking.workflow", 2, "/about#about-thinking", {
    parent: "about.thinking",
    title: "Operational Workflow",
    icons: ["workflow.capture", "workflow.route", "journey.decide", "workflow.complete"],
  }),
  content("about.work", 4, "/about#about-work", {
    eyebrow: "How I work",
    title: "From problem to working system",
    copy: "I start by understanding what should happen, then map the journey, build what matters, connect the right pieces and verify the result.",
    icons: [
      "process.understand",
      "process.map",
      "process.build",
      "process.connect",
      "process.verify",
    ],
  }),
  content("about.explore", 5, "/about#about-explore", {
    eyebrow: "Current exploration",
    title: "Exploring software that can recover without losing control.",
    copy: "My Computer Science MSc work at Middlesex focuses on backend operations that detect incidents, investigate causes, attempt guarded recovery and escalate what they cannot resolve.\n\nCurrent toolkit: TypeScript, React, Next.js, Node.js, PostgreSQL, REST APIs, OpenAI API, RAG, Tool Calling, Workflow Automation, Azure, Docker and CI/CD.",
    icons: [
      "explore.control",
      "explore.observe",
      "explore.detect",
      "explore.diagnose",
      "explore.recover",
      "explore.verify",
    ],
  }),
  content("about.outside", 6, "/about#about-outside", {
    eyebrow: "About me",
    title: "Outside Engineering",
    copy: "A few things that keep me grounded outside the work.",
    media: ["outside.strength", "outside.endurance", "outside.community", "outside.learning"],
  }),
  content("about.cta", 7, "/about#about-cta", {
    eyebrow: "Let's talk",
    title: "Got a role, project, collaboration or event in mind?",
    copy: "Send me the context. My assistant will gather what I need and make sure it reaches me properly.",
    actions: ["action.about.message"],
  }),
  content("about.cta.work", 1, "/about#about-cta", {
    parent: "about.cta",
    title: "Want to see more of my work?",
    actions: ["action.about.work"],
  }),

  content("audit.hero", 1, "/audit", {
    eyebrow: "Free customer journey & workflow audit",
    title: "Find where customers get stuck or work slows down.",
    copy: "A focused review of one important customer journey or operational workflow. Personally reviewed by Freeman, delivered within 48 hours.",
    actions: ["action.audit.claim"],
  }),
  content("audit.process", 2, "/audit#audit-process", {
    eyebrow: "What happens",
    title: "From unclear friction to a prioritised next action.",
    copy: "A focused review of one important customer journey or operational workflow.",
  }),
  content("audit.process.context", 1, "/audit#audit-process", {
    parent: "audit.process",
    title: "You provide context",
    copy: "One important journey or workflow.",
  }),
  content("audit.process.inspect", 2, "/audit#audit-process", {
    parent: "audit.process",
    title: "The path is inspected",
    copy: "Customer steps and operational handoffs.",
  }),
  content("audit.process.prioritise", 3, "/audit#audit-process", {
    parent: "audit.process",
    title: "Findings are prioritised",
    copy: "The points with the clearest friction.",
  }),
  content("audit.process.action", 4, "/audit#audit-process", {
    parent: "audit.process",
    title: "A next action becomes clear",
    copy: "You choose what happens after review.",
  }),
  content("audit.why", 3, "/audit#audit-why", {
    eyebrow: "Why this audit exists",
    title: "You usually notice the symptoms first",
    copy: "Small issues often point to deeper friction between the customer journey and the workflow behind it.",
    icons: [
      "audit.symptom.questions",
      "audit.symptom.slow",
      "audit.symptom.follow",
      "audit.symptom.copy",
      "audit.symptom.handoff",
      "audit.symptom.remember",
    ],
  }),
  content("audit.proof", 4, "/audit#audit-proof", {
    eyebrow: "Proof",
    title: "Customer-Facing. Operationally Sound.",
    copy: "Real work across customer-facing journeys and operational workflows.",
  }),
  content("audit.cta", 5, "/audit#audit-cta", {
    eyebrow: "Let's fix what's getting in the way",
    title: "Show me one part of your business that isn't running as smoothly as it should.",
    copy: "Share one customer journey or operational workflow. My assistant will help you provide the relevant context.",
    actions: ["action.audit.start"],
  }),
];
