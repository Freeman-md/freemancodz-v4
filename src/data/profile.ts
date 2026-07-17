export type ProfileService = {
  title: string;
  description: string;
  label: string;
  cta: string;
  assistantPrompt?: string;
};

export const profile = {
  name: "Freeman Madudili",
  headline: "Building reliable software for ambitious teams.",
  intro:
    "I build intuitive customer-facing assistants and reliable operational workflows that help people find information, take action and reduce repetitive work. My work combines frontend engineering, backend systems and practical AI to create software that works beyond the demo.",
  heroNote:
    "Building practical AI systems that make engineering workflows faster, clearer, and more reliable.",
  philosophyQuestion:
    "What does this system need to stay reliable as it grows?",
  principles: [
    {
      title: "Keep it simple",
      body: "Simple architectures fail less often and are easier to debug when they do.",
    },
    {
      title: "Reliability first",
      body: "Boring technology often yields the most exciting business outcomes when systems need to keep working.",
    },
    {
      title: "Engineering judgement",
      body: "AI accelerates execution, but human engineering judgement remains the final arbiter.",
    },
    {
      title: "Think long-term",
      body: "Designing boundaries, data models, and workflows that can survive growth without collapse.",
    },
    {
      title: "Make it observable",
      body: "If a system fails and no one can see why, reliability is only performative.",
    },
  ],
  services: [
    {
      title: "Customer-Facing Assistants",
      description:
        "Assistants that help people find the right information, understand their options and take action through connected tools and systems.",
      label: "Answers. Guidance. Actions.",
      cta: "Explore an Assistant",
      assistantPrompt:
        "I’m interested in a customer-facing assistant. Help me understand what one could do for my use case.",
    },
    {
      title: "Operational Workflows",
      description:
        "Reliable workflows that connect data, tools and people to reduce repetitive work and keep processes moving.",
      label: "Automation. Routing. Reliability.",
      cta: "Explore a Workflow",
    },
  ] satisfies ProfileService[],
  aboutHeadline: "How I think, work, and approach engineering.",
aboutIntro: [
  "The technologies I use will change over time. The principles I build around will not.",
  "I enjoy solving problems that become more interesting as systems grow, especially around software engineering, AI, automation, and long-term system reliability.",
  "I care about systems that stay dependable under pressure, teams that can reason clearly about trade-offs, and products that remain maintainable long after the first release.",
],
  aboutPrinciples: [
    {
      title: "Clarity before complexity",
      body: "Code is read far more often than it is written. Obvious logic usually wins over cleverness.",
    },
    {
      title: "Reliability before cleverness",
      body: "Systems should fail predictably. Boundaries, retries, and operational safety matter more than novelty.",
    },
    {
      title: "Systems should be observable",
      body: "If you cannot see what your system is doing, you cannot trust it. Telemetry is a feature.",
    },
    {
      title: "Engineering judgement",
      body: "Automation amplifies capabilities, but foundational engineering understanding still sets direction.",
    },
  ],
  workProcess: [
    "Understand the real problem.",
    "Map the constraints.",
    "Break the system into clear parts.",
    "Ship in small, useful increments.",
    "Make failures visible.",
    "Improve based on feedback.",
  ],
  education: {
    current: "Currently studying MSc Computer Science.",
    previous: "BSc Information Technology, Middlesex University. First Class.",
    research:
      "Designing an AI-powered self-healing backend operations agent that helps production systems detect, diagnose, and recover from failures while keeping engineers in control.",
    support:
      "The research explores how AI can improve reliability, observability, and operational resilience without sacrificing engineering judgement.",
  },
  currentDirection:
    "Customer-facing assistants and reliable operational workflows.",
  currentDirectionSupport:
    "I’m focused on building assistants that help people find the right information, understand their options and take action. Behind them, I build reliable workflows that connect tools, data and people to reduce repetitive work and keep processes moving.",
  outsideEngineering: [
    {
      title: "Strength",
      description:
        "Strength training keeps me disciplined and grounded. The progression mindset maps well to engineering work.",
    },
    {
      title: "Endurance",
      description:
        "Long-distance running gives me the mental space to think through complex systems problems away from the screen.",
    },
    {
      title: "Community",
      description:
        "I care about learning with other builders, sharing ideas, and staying connected to people doing serious work.",
    },
    {
      title: "Continuous Learning",
      description:
        "I spend time studying systems, infrastructure, AI, and the mechanics behind reliable software.",
    },
  ],
};
