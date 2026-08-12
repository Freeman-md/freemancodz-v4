import { z } from "zod";

export const portfolioIconNames = [
  "ArrowLeftRight", "Bell", "BellRing", "BookOpen", "Box", "Braces", "Brain",
  "BriefcaseBusiness", "CheckCircle2", "CircleCheck", "ClipboardCheck", "ClipboardList",
  "Clock3", "Cloud", "Code2", "Copy", "Download", "Dumbbell", "Eye", "FileText",
  "Folder", "GitBranch", "Handshake", "Inbox", "Layers3", "Lightbulb", "Link2",
  "LockKeyhole", "Mail", "Map", "MessageCircleQuestion", "MessageSquareCheck",
  "MousePointer2", "Network", "NotebookPen", "PersonStanding", "Puzzle", "Repeat2",
  "Scale", "Search", "Send", "Share2", "ShieldCheck", "SlidersHorizontal", "Smartphone",
  "Sparkles", "SquareTerminal", "Target", "UserRound", "Users", "UsersRound", "Zap",
] as const;

export const portfolioIconNameSchema = z.enum(portfolioIconNames);
export type PortfolioIconName = z.infer<typeof portfolioIconNameSchema>;

export const projectVisualNames = [
  "Pay4MeVisual",
  "PortfolioAssistantVisual",
  "EmailWorkflowVisual",
] as const;

export const projectVisualNameSchema = z.enum(projectVisualNames);
export type ProjectVisualName = z.infer<typeof projectVisualNameSchema>;

export const requiredPortfolioProjectSlugs = [
  "pay4me-withradius",
  "portfolio-assistant",
  "email-pa",
  "across-the-horizon",
  "shifty",
  "self-healing-backend-operations-system",
] as const;

export type RequiredPortfolioProjectSlug = typeof requiredPortfolioProjectSlugs[number];
