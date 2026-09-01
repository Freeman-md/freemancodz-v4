export type PortfolioIcon = {
  iconName: string | null;
  label: string;
  copy: string | null;
};

export type PortfolioAction = PortfolioIcon & {
  variant: "PRIMARY" | "SECONDARY" | "GHOST" | "LINK";
  url: string | null;
  assistantMessage: string | null;
};

export function getPortfolioActionMode(action: PortfolioAction) {
  if (action.assistantMessage) {
    return "assistant" as const;
  }

  if (action.url) {
    return "link" as const;
  }

  return "hidden" as const;
}

export type PortfolioMedia = PortfolioIcon & {
  source: string;
  altText: string;
  type: "IMAGE" | "VIDEO";
};

export type PortfolioSection = {
  eyebrow: string;
  title: string;
  copy: string;
  icons: PortfolioIcon[];
  media: PortfolioMedia[];
  actions: PortfolioAction[];
};

export type PortfolioProject = {
  slug: string;
  title: string;
  category: string;
  problem: string;
  solution: string;
  outcome: string | null;
  externalLinks: string[];
  visualBlock: string | null;
  visualText: string | null;
  cover: { source: string; altText: string } | null;
};

export type PortfolioExperience = {
  title: string;
  tag: string | null;
  copy: string;
  insight: string | null;
  icons: PortfolioIcon[];
};

export type HomePresentationData = {
  profile: {
    name: string;
    coverImage: string | null;
    audience: PortfolioIcon[];
  };
  hero: PortfolioSection;
  improve: PortfolioSection & {
    customerJourney: PortfolioSection;
    operationalWorkflow: PortfolioSection;
  };
  relevantWork: PortfolioSection;
  projects: {
    pay4Me: PortfolioProject;
    portfolioAssistant: PortfolioProject;
    emailPa: PortfolioProject;
  };
  audit: PortfolioSection & {
    problem: PortfolioSection;
    improvement: PortfolioSection;
  };
  closing: PortfolioSection;
};

export type WorkPresentationData = {
  hero: PortfolioSection & { focus: PortfolioSection; approach: PortfolioSection };
  relevantWork: PortfolioSection;
  additionalWork: PortfolioSection;
  projects: {
    pay4Me: PortfolioProject;
    portfolioAssistant: PortfolioProject;
    emailPa: PortfolioProject;
    acrossTheHorizon: PortfolioProject;
    shifty: PortfolioProject;
    selfHealing: PortfolioProject;
  };
  connects: PortfolioSection & {
    products: PortfolioSection;
    experiences: PortfolioSection;
    workflows: PortfolioSection;
    outcomes: PortfolioIcon[];
  };
  closing: PortfolioSection;
};

export type AboutPresentationData = {
  profile: {
    name: string;
    title: string;
    positioning: string;
    coverImage: string | null;
    principles: PortfolioIcon[];
    processPrinciples: PortfolioIcon[];
    controlPrinciples: PortfolioIcon[];
  };
  hero: PortfolioSection;
  journey: PortfolioSection;
  experiences: PortfolioExperience[];
  process: PortfolioSection;
  exploration: PortfolioSection;
  outsideEngineering: PortfolioSection;
  closing: PortfolioSection & { work: PortfolioSection };
};

export type AuditPresentationData = {
  hero: PortfolioSection;
  process: PortfolioSection & { stages: PortfolioSection[] };
  symptoms: PortfolioSection;
  proof: PortfolioSection;
  projects: PortfolioProject[];
  closing: PortfolioSection;
};
