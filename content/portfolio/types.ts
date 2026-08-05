export type PortfolioContentBlock = {
  key: string;
  page: "HOME" | "ABOUT" | "AUDIT";
  section: string;
  position: number;
  content: Record<string, unknown>;
};
export type PortfolioServiceContent = {
  key: string;
  title: string;
  lead: string;
  description: string;
  cta: string;
  assistantPrompt?: string;
  position: number;
};
export type PortfolioProjectContent = {
  key: string;
  title: string;
  summary: string;
  category: string;
  role: string;
  outcome: string;
  detail: string;
  future?: string;
  collaboration?: string;
  positioning?: string;
  featured: boolean;
  position: number;
  stacks: string[];
  links: { label: string; href: string }[];
};
export type PortfolioExperienceContent = {
  key: string;
  title: string;
  company: string;
  dates: string;
  location?: string;
  category: string;
  focus: string;
  position: number;
};
export type PortfolioPrincipleContent = {
  key: string;
  section: string;
  title: string;
  body: string;
  position: number;
};
