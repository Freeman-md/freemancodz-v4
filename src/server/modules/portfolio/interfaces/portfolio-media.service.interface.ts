import type { MediaOwnerInput } from "@/contracts/portfolio-admin.contract";

export type ReplacePortfolioMediaInput = {
  owner: MediaOwnerInput;
  body: Uint8Array;
  contentType: string;
  fileExtension: string;
};

export type ReplacePortfolioMediaResult = {
  source: string;
  cleanupWarning: boolean;
  projectSlug?: string;
};

export interface IPortfolioMediaService {
  replaceMedia(input: ReplacePortfolioMediaInput): Promise<ReplacePortfolioMediaResult>;
}
