import type { MediaOwner } from "../models/portfolio-administration";

export type ReplacePortfolioMediaInput = {
  owner: MediaOwner;
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
