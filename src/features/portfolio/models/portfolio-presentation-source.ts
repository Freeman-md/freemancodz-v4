type SourceIcon = { iconName: string | null; label: string; copy: string | null };

type OrderedIcon = { order: number; iconBlock: SourceIcon };

type SourceAction = {
  variant: "PRIMARY" | "SECONDARY" | "GHOST" | "LINK";
  url: string | null;
  assistantMessage: string | null;
  iconBlock: SourceIcon;
};

type SourceMedia = {
  type: "IMAGE" | "VIDEO";
  source: string;
  altText: string;
  iconBlock: SourceIcon;
};

export type PortfolioContentSource = {
  url: string;
  order: number | null;
  eyebrow: string | null;
  title: string | null;
  copy: string | null;
  iconBlocks: OrderedIcon[];
  mediaBlocks: Array<{ order: number; mediaBlock: SourceMedia }>;
  actionBlocks: Array<{ order: number; actionBlock: SourceAction }>;
  children: Array<{ order: number; child: PortfolioContentSource }>;
};

export type PortfolioProjectSource = {
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

export type PortfolioProfileSource = {
  name: string;
  title: string;
  positioning: string;
  coverImage: string | null;
  iconCollections: Array<{
    collection:
      | "AUDIENCE"
      | "PRINCIPLES"
      | "THINKING_PRINCIPLES"
      | "PROCESS_PRINCIPLES"
      | "CONTROL_PRINCIPLES"
      | "OUTCOMES";
    order: number;
    iconBlock: SourceIcon;
  }>;
};

export type PortfolioExperienceSource = {
  title: string;
  tag: string | null;
  copy: string;
  insight: string | null;
  order: number;
  iconBlocks: OrderedIcon[];
};
