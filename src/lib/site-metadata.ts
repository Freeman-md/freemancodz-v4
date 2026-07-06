import { profile } from "@/data/profile";
import { externalLinks } from "@/data/navigation";

const fallbackSiteUrl = "https://freemancodz.com";

function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL || fallbackSiteUrl;

  try {
    return new URL(url);
  } catch {
    return new URL(fallbackSiteUrl);
  }
}

export const siteConfig = {
  name: `${profile.name} | Software Engineer`,
  shortName: profile.name,
  title: `${profile.name} | Software Engineer`,
  description:
    "Software Engineer helping founders and teams translate ideas into reliable and scalable systems.",
  url: getSiteUrl(),
  ogImage: "/opengraph-image",
  links: {
    linkedin: externalLinks.linkedin,
    github: externalLinks.github,
  },
  keywords: [
    "Freeman Madudili",
    "Software Engineer",
    "AI-assisted engineering",
    "systems engineering",
    "reliable software",
    "scalable systems",
    "workflow automation",
    "frontend engineering",
    "backend operations",
    "production systems",
  ],
};
