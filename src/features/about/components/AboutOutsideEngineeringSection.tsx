import type { LucideIcon } from "lucide-react";
import { BookOpen, Dumbbell, PersonStanding, Users } from "lucide-react";

import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import { siteAssetLinks } from "@/shared/config/links";

type OutsideInterest = {
  icon: LucideIcon;
  label: string;
  src: string;
};

const outsideInterests: OutsideInterest[] = [
  { icon: Dumbbell, label: "Strength", src: siteAssetLinks.outsideImages.Strength },
  { icon: PersonStanding, label: "Endurance", src: siteAssetLinks.outsideImages.Endurance },
  { icon: Users, label: "Community", src: siteAssetLinks.outsideImages.Community },
  {
    icon: BookOpen,
    label: "Always Learning",
    src: siteAssetLinks.outsideImages["Continuous Learning"],
  },
];

function InterestCard({ interest }: { interest: OutsideInterest }) {
  const Icon = interest.icon;

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
      <div className="aspect-[1.18] overflow-hidden bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={interest.label}
          className="size-full object-cover transition duration-500 hover:scale-[1.025]"
          src={interest.src}
        />
      </div>
      <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
        <Icon aria-hidden="true" className="size-6 text-signal-600" />
        <h3 className="text-lg font-medium text-ink sm:text-xl">{interest.label}</h3>
      </div>
    </article>
  );
}

export function AboutOutsideEngineeringSection() {
  return (
    <section aria-labelledby="outside-engineering-heading" className="py-20 sm:py-28">
      <Container>
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-10 lg:grid lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 lg:p-16">
          <div className="flex flex-col justify-center lg:pr-4">
            <MarketingSectionHeading
              align="left"
              copy={<p>A few things that keep me grounded outside the work.</p>}
              eyebrow="About me"
              id="outside-engineering-heading"
              title="Outside Engineering"
            />
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 lg:mt-0">
            {outsideInterests.map((interest) => (
              <InterestCard interest={interest} key={interest.label} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
