import { experiences } from "@/data/experience";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";

export type SiteChunkInput = {
  id: string;
  title: string;
  category: string;
  url: string;
  content: string;
  keywords: string[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dedupeKeywords(values: string[]) {
  return Array.from(
    new Set(
      values
        .flatMap((value) =>
          value
            .split(/[\/,]| and /gi)
            .map((part) => part.trim().toLowerCase()),
        )
        .filter(Boolean),
    ),
  );
}

function toSentenceList(label: string, items: string[]) {
  return `${label}: ${items.join("; ")}`;
}

function buildProfileChunks(): SiteChunkInput[] {
  return [
    {
      id: "profile-overview",
      title: "Profile Overview",
      category: "Profile",
      url: "/about",
      content: [
        "Profile information.",
        `Name: ${profile.name}.`,
        `Headline: ${profile.headline}`,
        `Introduction: ${profile.intro}`,
        `Focus statement: ${profile.heroNote}`,
      ].join(" "),
      keywords: dedupeKeywords([
        profile.name,
        "software engineer",
        "ai-assisted engineering",
        "reliability",
        "scalability",
        "automation",
      ]),
    },
    {
      id: "profile-current-direction",
      title: "Current Direction",
      category: "Profile",
      url: "/about",
      content: [
        "Current direction.",
        `Current direction summary: ${profile.currentDirection}`,
        `Current direction detail: ${profile.currentDirectionSupport}`,
      ].join(" "),
      keywords: dedupeKeywords([
        "current direction",
        "ai systems",
        "engineering workflows",
        "reliable software operations",
        "self-healing systems",
      ]),
    },
    {
      id: "profile-education",
      title: "Education and Research",
      category: "Profile",
      url: "/about",
      content: [
        "Education.",
        `Current education: ${profile.education.current}`,
        `Previous education: ${profile.education.previous}`,
        `Research topic: ${profile.education.research}`,
        `Research support: ${profile.education.support}`,
      ].join(" "),
      keywords: dedupeKeywords([
        "msc computer science",
        "bsc information technology",
        "research",
        "ai-assisted reliability",
        "observability",
        "self-healing backend operations",
      ]),
    },
    {
      id: "profile-services",
      title: "Services and Support",
      category: "Profile",
      url: "/about",
      content: [
        "Skills/services.",
        toSentenceList(
          "What I do",
          profile.services.map(([title, copy]) => `${title}: ${copy}`),
        ),
      ].join(" "),
      keywords: dedupeKeywords([
        "build products",
        "improve systems",
        "automate workflows",
        "design for growth",
        "product engineering",
        "automation",
      ]),
    },
    {
      id: "profile-principles",
      title: "Engineering Principles",
      category: "Profile",
      url: "/about",
      content: [
        "Profile information.",
        "Engineering philosophy.",
        profile.philosophyQuestion,
        toSentenceList(
          "Principles",
          profile.principles.map(
            (principle) => `${principle.title}: ${principle.body}`,
          ),
        ),
      ].join(" "),
      keywords: dedupeKeywords([
        "engineering philosophy",
        "reliability",
        "simplicity",
        "observability",
        "engineering judgement",
        "long-term systems",
      ]),
    },
  ];
}

function buildExperienceChunks(): SiteChunkInput[] {
  return experiences.map((experience) => ({
    id: `experience-${slugify(experience.title)}`,
    title: experience.title,
    category: experience.category,
    url: "/about",
    content: [
      experience.category === "Academic" ? "Education." : "Experience.",
      `Title: ${experience.title}.`,
      `Organization: ${experience.company}.`,
      `Dates: ${experience.dates}.`,
      experience.location ? `Location: ${experience.location}.` : "",
      `Focus: ${experience.focus}`,
    ]
      .filter(Boolean)
      .join(" "),
    keywords: dedupeKeywords([
      experience.title,
      experience.company,
      experience.category,
      experience.focus,
    ]),
  }));
}

function buildProjectChunks(): SiteChunkInput[] {
  return projects.map((project) => ({
    id: `project-${slugify(project.title)}`,
    title: project.title,
    category: project.category,
    url: "/work",
    content: [
      "Portfolio project.",
      "Freeman worked on this project.",
      `Project title: ${project.title}.`,
      `Category: ${project.category}.`,
      `Summary: ${project.summary}`,
      `Role: ${project.role}`,
      `Stack: ${project.stack.join(", ")}.`,
      `Outcome: ${project.outcome}`,
      `Detail: ${project.detail}`,
      project.positioning ? `Positioning: ${project.positioning}` : "",
      project.collaboration ? `Collaboration: ${project.collaboration}` : "",
      project.future ? `Future direction: ${project.future}` : "",
      project.links.length
        ? `Links: ${project.links.map((link) => `${link.label} (${link.href})`).join(", ")}.`
        : "",
    ]
      .filter(Boolean)
      .join(" "),
    keywords: dedupeKeywords([
      project.title,
      project.category,
      project.role,
      ...project.stack,
      ...project.links.map((link) => link.label),
    ]),
  }));
}

export function buildSiteChunks(): SiteChunkInput[] {
  return [
    ...buildProfileChunks(),
    ...buildExperienceChunks(),
    ...buildProjectChunks(),
  ];
}

export function chunkToEmbeddingInput(chunk: SiteChunkInput) {
  return [
    `Title: ${chunk.title}`,
    `Category: ${chunk.category}`,
    `URL: ${chunk.url}`,
    `Keywords: ${chunk.keywords.join(", ")}`,
    `Content: ${chunk.content}`,
  ].join("\n");
}
