import type { LucideIcon } from "lucide-react";
import { BookOpen, Dumbbell, Mountain, PersonStanding, Users } from "lucide-react";

import { Container } from "@/shared/components/layout/Container";
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
            <div className="flex items-center gap-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                About me
              </p>
              <span aria-hidden="true" className="h-px w-10 bg-slate-400" />
            </div>
            <h2
              className="mt-8 font-display text-5xl leading-[0.96] tracking-[-0.04em] text-signal-900 sm:text-6xl"
              id="outside-engineering-heading"
            >
              Outside Engineering
            </h2>
            <p className="mt-7 max-w-sm text-lg leading-8 text-slate-600">
              A few things that keep me grounded outside the work.
            </p>
            <Mountain aria-hidden="true" className="mt-16 hidden size-16 stroke-[1.2] text-signal-400 lg:block" />
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
