export const envLinks = {
  linkedin:
    process.env.NEXT_PUBLIC_LINKEDIN_URL ||
    "https://www.linkedin.com/in/freeman-madudili-9864101a2?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
  github: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/Freeman-md",
};

export const siteAssetLinks = {
  cv: "/api/blob/pdfs/cv",
  heroImage: "/api/blob/images/me",
  outsideImages: {
    Strength: "/api/blob/images/strength-training",
    Endurance: "/api/blob/images/running",
    Community: "/api/blob/images/community",
    "Continuous Learning": "/api/blob/images/learning",
  },
};
