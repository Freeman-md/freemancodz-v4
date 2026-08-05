import type { PortfolioContentBlock } from "./types";

export const home: PortfolioContentBlock[] = [
  {
    key: "home.hero",
    page: "HOME",
    section: "HERO",
    position: 0,
    content: {
      name: "Freeman Madudili",
      headline: "Building customer-facing products and reliable operational workflows.",
      intro:
        "I help businesses improve how customers find information, understand their options and take action, while reducing the repetitive work happening behind the scenes.",
      heroNote: "",
      primaryLabel: "Get a Free Audit",
      primaryHref: "/audit",
      secondaryLabel: "View My Work",
      secondaryHref: "/work",
    },
  },
  {
    key: "home.services-intro",
    page: "HOME",
    section: "SERVICES_INTRO",
    position: 0,
    content: {
      title: "What I Help Improve",
      copy: "Two connected areas: the experience customers have in front, and the workflows that keep things moving behind the scenes.",
    },
  },
  {
    key: "home.proof-of-work",
    page: "HOME",
    section: "PROOF_OF_WORK",
    position: 0,
    content: {
      title: "Proof of Work",
      copy: "A few examples of customer-facing products and operational systems built around real problems.",
      items: [
        {
          projectKey: "pay4me-withradius",
          action: { type: "external", label: "View Live Product", href: "https://pay4me.app" },
        },
        {
          projectKey: "portfolio-assistant",
          action: {
            type: "assistant",
            label: "Try the Assistant",
            prompt:
              "I’m exploring Freeman’s work. Help me find the most relevant projects and understand how he could help improve my customer journey or operational workflow.",
          },
        },
        { projectKey: "email-pa", action: null },
      ],
    },
  },
  {
    key: "home.audit-offer",
    page: "HOME",
    section: "AUDIT_OFFER",
    position: 0,
    content: {
      label: "Free Customer Journey & Workflow Audit",
      title:
        "Find where customers are getting stuck and where repetitive work is slowing your business down.",
      copy: "I’ll review your customer journey and operational workflow, identify the most valuable improvement opportunities and show you what I would prioritise first. If nothing meaningful needs fixing, I’ll tell you.",
      actionLabel: "Get a Free Audit",
      actionHref: "/audit",
      checklist: [
        "Customer journey friction",
        "Unclear enquiry or booking steps",
        "Repetitive manual work",
        "Disconnected tools or handoffs",
        "Highest-priority improvement",
        "Clear recommended next step",
      ],
    },
  },
  {
    key: "home.final-cta",
    page: "HOME",
    section: "FINAL_CTA",
    position: 0,
    content: {
      title: "Not sure where customers are getting stuck or where your team is losing time?",
      primaryLabel: "Get a Free Audit",
      primaryHref: "/audit",
      secondaryLabel: "View My Work",
      secondaryHref: "/work",
    },
  },
];
