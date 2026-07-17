export type ProfileService = {
  title: string;
  lead: string;
  description: string;
  cta: string;
  assistantPrompt?: string;
};

export type Experience = {
  title: string;
  company: string;
  dates: string;
  location?: string;
  focus: string;
  category: string;
};

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
