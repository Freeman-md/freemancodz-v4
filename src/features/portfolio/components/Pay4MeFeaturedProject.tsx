import Image from "next/image";
import { ArrowUpRight, ShieldCheck, Star, TrendingUp, Wrench } from "lucide-react";

import {
  CaseBadge,
  StudyLink,
  StudyPoint,
} from "@/features/portfolio/components/PortfolioProjectElements";
import { FeaturedProject } from "@/shared/components/marketing/FeaturedProject";
import { buttonVariants } from "@/shared/components/ui/Button";

export function Pay4MeFeaturedProject() {
  return (
    <FeaturedProject
      actions={
        <>
          <a
            className={buttonVariants({ size: "lg", variant: "signal" })}
            href="https://withradius.com"
            rel="noreferrer"
            target="_blank"
          >
            View Case Study
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
          <StudyLink href="https://withradius.com" label="View Live" />
        </>
      }
      meta={
        <>
          <CaseBadge>
            <Star aria-hidden="true" className="size-3 fill-current" /> Featured
          </CaseBadge>
          <CaseBadge>Customer-facing product · Fintech</CaseBadge>
        </>
      }
      title="Pay4Me / WithRadius"
      visual={
        <Image
          alt="WithRadius homepage showing its international payment experience"
          className="object-cover object-top"
          fill
          sizes="(min-width: 1024px) 55vw, 100vw"
          src="/images/work/withradius-hero.jpg"
        />
      }
    >
      <StudyPoint icon={ShieldCheck} title="Problem">
        International users needed clear, dependable experiences for important onboarding and payment
        journeys.
      </StudyPoint>
      <StudyPoint icon={Wrench} title="Solution">
        Freeman built and supported production customer-facing functionality across interfaces, onboarding,
        payments and backend API integrations.
      </StudyPoint>
      <StudyPoint icon={TrendingUp} title="Outcome">
        More than <strong className="text-signal-700">US$500K</strong> processed through production payment
        workflows.
      </StudyPoint>
    </FeaturedProject>
  );
}
