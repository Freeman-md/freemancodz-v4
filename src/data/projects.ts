export type Project = {
  title: string;
  summary: string;
  category: string;
  stack: string[];
  role: string;
  outcome: string;
  links: { label: string; href: string }[];
  detail: string;
  future?: string;
  collaboration?: string;
  positioning?: string;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    title: "Creator Lab",
    summary:
      "An AI feedback engine for LinkedIn creators that turns published posts, metrics, and analysis into practical guidance for the next post.",
    category: "AI / Product / Content Intelligence",
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Convex",
      "Clerk",
      "OpenAI",
      "Zod",
      "React Hook Form",
      "Radix UI",
      "Vitest",
    ],
    role: "Sole developer / product builder.",
    links: [{ label: "Live", href: "https://creator-lab.online" }, {
      label: "GitHub",
      href: "https://github.com/Freeman-md/creator-lab",
    }],
    outcome:
      "Supports the core feedback loop: save a post, attach metrics, run AI analysis, extract lessons and patterns, and generate a next-post brief.",
    future:
      "Expose the system through an MCP server so its suggestions can be used from MCP clients or chatbot assistants.",
    detail:
      "Creator Lab is built around this loop: Post → Metrics → Analysis → Lessons & Patterns → Brief → Better Next Post. It is not a generic AI writing tool. It is a feedback and learning system that helps creators understand what worked, what underperformed, and what direction to take next.",
    featured: true,
  },
  {
    title: "Email PA",
    summary:
      "A background AI assistant that watches job-application messages, identifies useful updates, tracks state, and sends concise Telegram reports.",
    category: "AI / Automation / Backend Worker",
    stack: [
      "Node.js",
      "TypeScript",
      "Microsoft Graph",
      "Airtable",
      "AI classification",
      "Telegram",
      "Render Cron Job",
      "Vitest",
    ],
    role: "Sole developer / system builder.",
    links: [
      { label: "GitHub", href: "https://github.com/Freeman-md/email-pa" },
      { label: "Deployment", href: "https://render.com" },
    ],
    outcome:
      "Reduces the need to manually check job-related inbox updates. It identifies relevant updates, classifies application statuses, stores state, and sends a readable summary.",
    detail:
      "The service uses a safe retrieval window, dedupes processed messages, normalizes content, classifies relevance and status, stores state in Airtable, and reports through Telegram.",
    featured: true,
  },
  {
    title: "Pay4Me / WithRadius",
    summary:
      "A cross-border platform helping international students and relocation users handle education and move-abroad payments worldwide.",
    category: "Commercial Work / Frontend Product / Fintech",
    stack: ["Nuxt.js", "Vue.js", "Tailwind CSS", "Laravel"],
    role: "Frontend Developer / Mid-level Frontend Developer.",
    links: [{ label: "Live", href: "https://pay4me.app" }, {
      label: "Current brand",
      href: "https://withradius.com",
    }, { label: "Provider-specific product", href: "https://pay.pay4me.app" }],
    outcome:
      "The Pay4Me-specific payment provider processed over US$500,000 in payment volume.",
    collaboration:
      "Collaborated with backend engineer, mobile engineer, product designer, project manager, Head of Engineering, and the broader product team. Freeman and the frontend-inclined Head of Engineering handled the customer-facing web application.",
    positioning:
      "Radius / Pay4Me supports global education and relocation-related payment flows.",
    detail:
      "Pay4Me is a cross-border payment platform helping international students and professionals pay tuition, visa, SEVIS, housing, and other relocation-related fees worldwide. Freeman worked on the customer-facing web application using Nuxt.js, Vue.js, Tailwind CSS, while collaborating with the Laravel backend team. The team also built Pay4Me's dedicated payment provider in partnership with a microfinance bank to support payment processing.",
    featured: true,
  },
  {
    title: "AcrossTheHorizon",
    summary:
      "A study-abroad platform helping users access education relocation resources, offers, reviews, and related services.",
    category: "Commercial Work / Frontend Product / Study Abroad",
    stack: ["Laravel", "Vue.js", "Blade", "Tailwind CSS"],
    role: "Frontend Developer.",
    links: [{ label: "Live", href: "https://acrossthehorizon.net" }],
    outcome:
      "User-reported: processed over US$60,000 in payment volume during its first week and continued growing rapidly.",
    collaboration:
      "Worked within a Laravel monolith, building Vue.js features where appropriate while also developing Blade-based interfaces. Collaborated with the same cross-functional engineering and product team behind Pay4Me.",
    detail:
      "AcrossTheHorizon is a study-abroad platform supporting students through the relocation journey. Built primarily as a Laravel monolith, the project combined Blade templates with Vue.js components where richer frontend interactions were needed. Freeman's work focused on delivering production-ready frontend experiences while collaborating closely with backend, product, and design teams.",
    featured: true,
  },
  {
    title: "Internal Ops Automation System",
    summary:
      "A Playwright-driven internal operations automation system with deterministic workflows, AI intent routing, streaming results, and a React control panel.",
    category: "AI / Automation / Backend Systems",
    stack: [
      "Node.js",
      "TypeScript",
      "Playwright",
      "Express",
      "Vercel AI SDK",
      "OpenAI",
      "Vitest",
      "React",
      "Vite",
      "Tailwind CSS",
      "shadcn UI",
      "GitHub Actions",
    ],
    role: "Sole developer / system builder.",
    links: [{
      label: "GitHub",
      href: "https://github.com/Freeman-md/internal-ops-automation",
    }],
    outcome:
      "Runs browser-based operational workflows for triage queue processing, ticket lifecycle management, and session health verification with structured results.",
    detail:
      "The project uses layered architecture across domain rules, Playwright adapters, workflow orchestration, infrastructure, REST routes, AI intent routing, and a React control panel.",
    featured: false,
  },
];
export const featuredProjects = projects.filter((p) => p.featured);
export const otherProjects = projects.filter((p) => !p.featured);
