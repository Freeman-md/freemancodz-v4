export type HomeProofAction =
  | { type: "assistant"; label: string; prompt: string }
  | { type: "external"; label: string; href: string }
  | null;

export type HomeProofProject = {
  key: string;
  title: string;
  category: string;
  problem: string;
  whatIBuilt: string;
  outcome: string;
};

export type HomeProofOfWork = {
  title: string;
  copy: string;
  items: Array<{ project: HomeProofProject; action: HomeProofAction }>;
};

export type HomeAuditOffer = {
  label: string;
  title: string;
  copy: string;
  actionLabel: string;
  actionHref: string;
  checklist: string[];
};
