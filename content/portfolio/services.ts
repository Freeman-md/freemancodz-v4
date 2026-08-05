import type { PortfolioServiceContent } from "./types";

export const services: PortfolioServiceContent[] = [
  {
    key: "customer-journeys",
    title: "Customer Journeys",
    lead: "Help customers find the right information, understand their options and take the next step.",
    description:
      "I improve or build customer-facing journeys that reduce confusion, guide enquiries and make it easier for people to book, enquire or complete the next action.",
    cta: "Explore Your Customer Journey",
    assistantPrompt:
      "I want to improve how customers find information, understand their options and take action. Help me identify where my current customer journey may be creating confusion or missed enquiries.",
    position: 0,
  },
  {
    key: "operational-workflows",
    title: "Operational Workflows",
    lead: "Reduce the repetitive work slowing you or your team down.",
    description:
      "I build reliable workflows that connect tools, move information, handle routine decisions and keep processes moving without unnecessary manual effort.",
    cta: "Explore Your Workflow",
    assistantPrompt:
      "I want to reduce repetitive work in my business. Help me identify where a workflow may be relying too heavily on manual steps, disconnected tools or repeated decisions.",
    position: 1,
  },
];
