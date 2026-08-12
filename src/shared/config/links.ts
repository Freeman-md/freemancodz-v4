export const envLinks = {
  linkedin:
    process.env.NEXT_PUBLIC_LINKEDIN_URL ||
    "https://www.linkedin.com/in/freeman-madudili-9864101a2?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
  github: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/Freeman-md",
};

const LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";

const PORTFOLIO_MEDIA_PUBLIC_PATH = "/storage/v1/object/public/portfolio-media";

function getPublicSupabaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL;

  try {
    const url = new URL(configuredUrl);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.origin;
    }
  } catch {
    // Use the local Supabase URL when public configuration is absent or invalid.
  }

  return LOCAL_SUPABASE_URL;
}

function getPortfolioMediaUrl(objectPath: string) {
  return `${getPublicSupabaseUrl()}${PORTFOLIO_MEDIA_PUBLIC_PATH}/${objectPath}`;
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
