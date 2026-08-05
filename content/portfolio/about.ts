import type { PortfolioContentBlock } from "./types";

export const about: PortfolioContentBlock[] = [
  {
    key: "about.header",
    page: "ABOUT",
    section: "ABOUT_HEADER",
    position: 0,
    content: { aboutHeadline: "How I think, work, and approach engineering." },
  },
  {
    key: "about.education",
    page: "ABOUT",
    section: "EDUCATION",
    position: 0,
    content: {
      current: "Currently studying MSc Computer Science.",
      previous: "BSc Information Technology, Middlesex University. First Class.",
      research:
        "Designing an AI-powered self-healing backend operations agent that helps production systems detect, diagnose, and recover from failures while keeping engineers in control.",
      support:
        "The research explores how AI can improve reliability, observability, and operational resilience without sacrificing engineering judgement.",
    },
  },
  {
    key: "about.intro.0",
    page: "ABOUT",
    section: "ABOUT_INTRO",
    position: 0,
    content: { body: "I care about building software that is clear, useful and dependable." },
  },
  {
    key: "about.intro.1",
    page: "ABOUT",
    section: "ABOUT_INTRO",
    position: 1,
    content: {
      body: "My current work focuses on customer-facing assistants and the operational workflows behind them, combining frontend engineering, backend systems and practical AI.",
    },
  },
  {
    key: "about.work-process.0",
    page: "ABOUT",
    section: "WORK_PROCESS",
    position: 0,
    content: { body: "Understand the real problem." },
  },
  {
    key: "about.outside-engineering.0",
    page: "ABOUT",
    section: "OUTSIDE_ENGINEERING",
    position: 0,
    content: {
      title: "Strength",
      description: "Strength training keeps me disciplined and grounded.",
    },
  },
];
