import { resolvePublicSupabaseUrl } from "./public-supabase-url";

export const envLinks = {
  linkedin:
    process.env.NEXT_PUBLIC_LINKEDIN_URL ||
    "https://www.linkedin.com/in/freeman-madudili-9864101a2?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
  github: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/Freeman-md",
};

const PORTFOLIO_MEDIA_PUBLIC_PATH = "/storage/v1/object/public/portfolio-media";

function getPortfolioMediaUrl(objectPath: string) {
  return `${resolvePublicSupabaseUrl()}${PORTFOLIO_MEDIA_PUBLIC_PATH}/${objectPath}`;
}

export const siteAssetLinks = {
  cv: getPortfolioMediaUrl("documents/cv"),
  heroImage: getPortfolioMediaUrl("images/me"),
  outsideImages: {
    Strength: getPortfolioMediaUrl("images/strength-training"),
    Endurance: getPortfolioMediaUrl("images/running"),
    Community: getPortfolioMediaUrl("images/community"),
    "Continuous Learning": getPortfolioMediaUrl("images/learning"),
  },
};

export const externalLinks = envLinks;
