import type { ProjectLinks } from "@/server/modules/portfolio/schemas/content-block.schema";
import type { AboutHeaderContent } from "@/server/modules/portfolio/schemas/content-block.schema";
import type { CurrentDirectionContent } from "@/server/modules/portfolio/schemas/content-block.schema";
import type { EducationContent } from "@/server/modules/portfolio/schemas/content-block.schema";
import type { HeroContent } from "@/server/modules/portfolio/schemas/content-block.schema";
import type { OutsideEngineeringContent } from "@/server/modules/portfolio/schemas/content-block.schema";
import type { PhilosophyContent } from "@/server/modules/portfolio/schemas/content-block.schema";
import type { TextBlockContent } from "@/server/modules/portfolio/schemas/content-block.schema";
import type {
  HomeAuditOfferContent,
  HomeFinalCtaContent,
  HomeProofOfWorkContent,
  HomeServicesIntroContent,
} from "@/server/modules/portfolio/schemas/content-block.schema";

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
  key: string;
  title: string;
  summary: string;
  category: string;
  stack: string[];
  role: string;
  outcome: string;
  links: ProjectLinks;
  detail: string;
  future?: string;
  collaboration?: string;
  positioning?: string;
  featured?: boolean;
};

export type Principle = {
  title: string;
  body: string;
};

export type {
  AboutHeaderContent,
  CurrentDirectionContent,
  EducationContent,
  HeroContent,
  HomeAuditOfferContent,
  HomeFinalCtaContent,
  HomeProofOfWorkContent,
  HomeServicesIntroContent,
  OutsideEngineeringContent,
  PhilosophyContent,
  TextBlockContent,
};

export type HomeProofAction = HomeProofOfWorkContent["items"][number]["action"];

export type HomeProofProject = {
  key: string;
  title: string;
  category: string;
  problem: string;
  whatIBuilt: string;
  outcome: string;
};

export type HomeProofOfWork = Omit<HomeProofOfWorkContent, "items"> & {
  items: Array<{ project: HomeProofProject; action: HomeProofAction }>;
};

export type HomeAuditOffer = HomeAuditOfferContent;

export type HomePageData = {
  hero: HeroContent;
  servicesIntro: HomeServicesIntroContent;
  proof: HomeProofOfWork;
  auditOffer: HomeAuditOffer;
  finalCta: HomeFinalCtaContent;
  services: ProfileService[];
};

export type WorkPageData = {
  featuredProjects: Project[];
  otherProjects: Project[];
};

export type AboutPageData = {
  header: AboutHeaderContent;
  education: EducationContent;
  intro: TextBlockContent[];
  workProcess: TextBlockContent[];
  outsideEngineering: OutsideEngineeringContent[];
  principles: Principle[];
};
