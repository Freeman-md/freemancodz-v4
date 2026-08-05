import type { PortfolioProjectContent } from "./types";

export const projects: PortfolioProjectContent[] = [
  {
    key: "pay4me-withradius",
    title: "Pay4Me / WithRadius",
    summary:
      "A cross-border platform helping international students and relocation users handle education and move-abroad payments worldwide.",
    category: "Customer-Facing Product · Fintech",
    role: "Frontend Developer",
    outcome:
      "The dedicated Pay4Me payment product processed more than US$500,000 in payment volume.",
    detail:
      "I built and shipped customer-facing web experiences across the payment journey, working with product, design, backend and mobile teams.",
    positioning:
      "International students and relocation users needed a clearer way to complete tuition, visa, SEVIS, housing and other cross-border payments.",
    featured: true,
    position: 0,
    stacks: ["Nuxt.js", "Vue.js", "Tailwind CSS", "Laravel"],
    links: [{ label: "Live", href: "https://pay4me.app" }],
  },
  {
    key: "portfolio-assistant",
    title: "Portfolio Assistant",
    summary: "A live assistant grounded in portfolio content.",
    category: "Customer-Facing AI Product",
    role: "Sole developer",
    outcome:
      "Visitors can ask directly, surface the most relevant proof and move towards a conversation without browsing the entire website.",
    detail:
      "I built a live assistant grounded in the site’s content that understands follow-up questions, retrieves relevant evidence, cites its sources and guides visitors towards useful next actions.",
    positioning:
      "A traditional portfolio makes visitors search across different pages to understand whether an engineer has the experience they need.",
    featured: false,
    position: 1,
    stacks: ["Next.js", "OpenAI", "PostgreSQL"],
    links: [],
  },
  {
    key: "email-pa",
    title: "Email PA",
    summary:
      "A background AI assistant that watches job-application messages and sends concise Telegram reports.",
    category: "Operational Workflow · Background Automation",
    role: "Sole developer",
    outcome:
      "The workflow replaced repeated manual inbox checks with one consistent and actionable reporting process.",
    detail:
      "I built a background assistant that retrieves messages, identifies relevant updates, classifies application statuses, prevents duplicate processing, stores state and sends concise Telegram reports.",
    positioning:
      "Important job-application updates were mixed into a busy inbox, creating repeated checking and manual status tracking.",
    featured: true,
    position: 2,
    stacks: ["Node.js", "TypeScript", "Microsoft Graph", "Airtable", "Telegram"],
    links: [{ label: "GitHub", href: "https://github.com/Freeman-md/email-pa" }],
  },
  {
    key: "creator-lab",
    title: "Creator Lab",
    summary: "An AI feedback engine for LinkedIn creators.",
    category: "AI / Product / Content Intelligence",
    role: "Sole developer",
    outcome: "Supports a practical feedback loop from post to next-post brief.",
    detail:
      "A feedback and learning system that helps creators understand what worked and what direction to take next.",
    featured: true,
    position: 3,
    stacks: ["Next.js", "OpenAI"],
    links: [{ label: "Live", href: "https://creator-lab.online" }],
  },
  {
    key: "across-the-horizon",
    title: "AcrossTheHorizon",
    summary: "A study-abroad platform supporting education relocation journeys.",
    category: "Commercial Work / Frontend Product / Study Abroad",
    role: "Frontend Developer",
    outcome: "Delivered production-ready frontend experiences for a growing platform.",
    detail: "A Laravel monolith combining Blade templates and Vue components.",
    featured: true,
    position: 4,
    stacks: ["Laravel", "Vue.js", "Blade"],
    links: [{ label: "Live", href: "https://acrossthehorizon.net" }],
  },
  {
    key: "internal-ops-automation",
    title: "Internal Ops Automation System",
    summary: "A browser-driven internal operations automation system.",
    category: "AI / Automation / Backend Systems",
    role: "Sole developer",
    outcome: "Runs operational workflows with structured results.",
    detail:
      "Layered architecture across domain rules, adapters, workflow orchestration and a React control panel.",
    featured: false,
    position: 5,
    stacks: ["Node.js", "Playwright", "React"],
    links: [{ label: "GitHub", href: "https://github.com/Freeman-md/internal-ops-automation" }],
  },
];
