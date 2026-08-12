import assert from "node:assert/strict";
import test from "node:test";
import { isValidElement, type ReactNode } from "react";
import { AboutJourneySection } from "@/features/about/components/AboutJourneySection";
import { AboutProductThinkingSection } from "@/features/about/components/AboutProductThinkingSection";
import { AboutWorkProcessSection } from "@/features/about/components/AboutWorkProcessSection";
import { AuditFooterCta } from "@/features/audit/components/AuditFooterCta";
import { AuditHero } from "@/features/audit/components/AuditHero";
import { AuditSymptomsSection } from "@/features/audit/components/AuditSymptomsSection";
import { HomeImproveSection } from "@/features/portfolio/components/HomeImproveSection";
import { WorkConnectionSection } from "@/features/portfolio/components/WorkConnectionSection";
import type {
  AboutPresentationData,
  PortfolioProject,
  PortfolioSection,
} from "@/features/portfolio/models/portfolio-presentation";

function collectText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(collectText).join(" ");
  }

  if (!isValidElement<{ children?: ReactNode }>(node)) {
    return "";
  }

  if (typeof node.type === "function") {
    return collectText(Reflect.apply(node.type, null, [node.props]));
  }

  return collectText(node.props.children);
}

const section = (title: string): PortfolioSection => ({
  eyebrow: `${title} eyebrow`,
  title,
  copy: `${title} copy`,
  icons: [],
  media: [],
  actions: [],
});

const project = (title: string): PortfolioProject => ({
  slug: title.toLowerCase().replaceAll(" ", "-"),
  title,
  category: "Category",
  problem: "Problem",
  solution: "Solution",
  outcome: null,
  externalLinks: [],
  visualBlock: null,
  visualText: null,
  cover: null,
});

const aboutProfile: AboutPresentationData["profile"] = {
  name: "Freeman",
  title: "Engineer",
  positioning: "Products and workflows",
  coverImage: null,
  principles: [],
  thinkingPrinciples: [],
  processPrinciples: [],
  controlPrinciples: [],
};

test("Home and Work preserve their mapped static presentation beside dynamic content", () => {
  const homeText = collectText(HomeImproveSection({
    improve: {
      ...section("Dynamic improve"),
      customerJourney: section("Dynamic customer journey"),
      operationalWorkflow: section("Dynamic operational workflow"),
    },
  }));

  assert.match(homeText, /Dynamic improve/);
  assert.match(homeText, /The handoff that drives outcomes/);
  assert.match(homeText, /Right action\. Right next step\./);

  const workText = collectText(WorkConnectionSection({
    connects: {
      ...section("Dynamic connection"),
      products: section("Dynamic products"),
      experiences: section("Dynamic experiences"),
      workflows: section("Dynamic workflows"),
      outcomes: [],
    },
    projects: {
      pay4Me: project("Pay4Me"),
      portfolioAssistant: project("Portfolio Assistant"),
      emailPa: project("Email PA"),
      acrossTheHorizon: project("Across the Horizon"),
      shifty: project("Shifty"),
      selfHealing: project("Self-Healing Backend Operations System"),
    },
  }));

  assert.match(workText, /Dynamic connection/);
  assert.match(workText, /Self-Healing Backend Operations System/);
  assert.match(workText, /Different projects\. One consistent focus/);
});

test("About preserves mapped static rails and feedback beside dynamic content", () => {
  const thinkingText = collectText(AboutProductThinkingSection({
    profile: aboutProfile,
    thinking: {
      ...section("Dynamic thinking"),
      customer: section("Dynamic customer"),
      workflow: section("Dynamic workflow"),
    },
  }));

  const journeyText = collectText(AboutJourneySection({
    experiences: [],
    journey: section("Dynamic journey"),
  }));

  const processText = collectText(AboutWorkProcessSection({
    process: section("Dynamic process"),
    profile: aboutProfile,
  }));

  assert.match(thinkingText, /Dynamic thinking/);
  assert.match(thinkingText, /Customer action\s+Clear handoff\s+Reliable response/);
  assert.match(journeyText, /Product\s+→\s+Operations\s+→\s+Systems\s+→\s+Current focus/);
  assert.match(processText, /Learn from production/);
});

test("Audit public integration renders canonical dynamic content beside approved static guidance", () => {
  const text = collectText(AuditSymptomsSection({
    symptoms: {
      eyebrow: "Why this audit exists",
      title: "Dynamic symptoms heading",
      copy: "Dynamic symptoms copy",
      icons: [
        { iconName: "Search", label: "Dynamic symptom", copy: null },
      ],
      media: [],
      actions: [],
    },
  }));

  assert.match(text, /Dynamic symptoms heading/);
  assert.match(text, /Dynamic symptoms copy/);
  assert.match(text, /Dynamic symptom/);
  assert.match(text, /Customer journey/);
  assert.match(text, /Underlying disconnect/);
  assert.match(text, /Operational workflow/);
  assert.match(text, /The audit helps identify where the friction lives before deciding what should/);
});

test("Audit preserves its mapped static timing and privacy guidance", () => {
  const text = collectText([
    AuditHero({ hero: section("Dynamic audit hero") }),
    AuditFooterCta({ closing: section("Dynamic audit close") }),
  ]);

  assert.match(text, /Dynamic audit hero/);
  assert.match(text, /Takes 2 - 3 minutes/);
  assert.match(text, /Free\. No obligation\. Your information is never shared\./);
});
