export type PortfolioIndexSourceType = "profile" | "content_block" | "project" | "experience";

export type IndexDocument = {
  sourceType: PortfolioIndexSourceType;
  sourceId: string;
  title: string;
  category: string;
  url: string;
  keywords: string[];
  paragraphs: string[];
};
