import Image from "next/image";
import { Check, Database, LineChart, ListChecks } from "lucide-react";

import { siteAssetLinks } from "@/shared/config/links";
import { Container } from "@/shared/components/layout/Container";
import type { HomePresentationData } from "../models/portfolio-presentation";
import { PortfolioAction } from "./PortfolioAction";
import { PortfolioIcon } from "./PortfolioIcon";

function HeroSignalCards() {
  return (
    <div aria-hidden="true" className="absolute inset-0 text-signal-600">
      <span className="absolute left-[8%] top-[13%] flex size-16 items-center justify-center rounded-xl border border-signal-100 bg-white/90 shadow-soft lg:left-[16%] lg:top-[18%] lg:size-20">
        <LineChart className="size-8 stroke-[1.6]" />
      </span>
      <span className="absolute right-[4%] top-[23%] flex size-16 items-center justify-center rounded-xl border border-signal-100 bg-white/90 shadow-soft lg:right-[3%] lg:top-[25%] lg:size-20">
        <ListChecks className="size-8 stroke-[1.6]" />
      </span>
      <span className="absolute left-[1%] top-[54%] flex size-12 items-center justify-center rounded-xl border border-signal-100 bg-white/90 shadow-soft lg:left-[12%] lg:top-[37%] lg:size-14">
        <Check className="size-6 stroke-[1.8]" />
      </span>
      <span className="absolute bottom-[12%] right-[1%] flex size-14 items-center justify-center rounded-xl border border-signal-100 bg-white/90 shadow-soft lg:bottom-[49%] lg:right-[1%] lg:size-16">
        <Database className="size-7 stroke-[1.6]" />
      </span>
    </div>
  );
}

export function HomeHero({ hero, profile }: Pick<HomePresentationData, "hero" | "profile">) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-[#fbf9f9]">
      <Container className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-[minmax(0,1.02fr)_minmax(32rem,0.98fr)]">
        <div className="relative z-20 flex flex-col pb-10 pt-12 text-center lg:justify-center lg:pb-20 lg:pt-16 lg:text-left">
          <div className="mx-auto max-w-3xl lg:mx-0">
            <h1 className="mt-7 text-[clamp(1.9rem,8.4vw,2.2rem)] font-semibold leading-[1.08] tracking-[-0.05em] text-slate-950 lg:mt-8 lg:text-[clamp(3.25rem,3.8vw,3.75rem)] lg:leading-[1.04] lg:tracking-[-0.06em]">
              {hero.title}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-800 lg:mx-0 lg:mt-8 lg:text-xl lg:leading-9">
              {hero.copy}
            </p>
          </div>

          <div className="mx-auto mt-7 grid w-full max-w-2xl gap-3 md:grid-cols-2 lg:mx-0 lg:mt-9">
            {hero.actions.map((action) => (
              <PortfolioAction action={action} className="w-full gap-5" key={action.label} />
            ))}
          </div>

          <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-x-6 gap-y-5 text-sm text-slate-800 lg:mx-0 lg:mt-9 lg:justify-start">
            {profile.audience.map(({ iconName, label }) => (
              <li className="flex items-center gap-2.5" key={label}>
                <PortfolioIcon
                  aria-hidden="true"
                  className="size-5 text-signal-600"
                  name={iconName}
                />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative min-h-[30rem] lg:min-h-full">
          <svg
            aria-hidden="true"
            className="absolute inset-0 size-full text-signal-300"
            fill="none"
            viewBox="0 0 720 760"
            preserveAspectRatio="none"
          >
            <path
              d="M0 760C115 690 108 586 212 526C324 462 320 329 451 264C557 211 570 101 720 62"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M0 760C143 704 169 626 257 576C365 515 391 405 492 354C605 297 601 207 720 171"
              stroke="currentColor"
              strokeOpacity=".35"
            />
            <circle cx="213" cy="525" fill="currentColor" r="5" />
          </svg>
          <HeroSignalCards />
          <div className="absolute inset-x-0 bottom-0 top-[8%] z-10 lg:top-[6%]">
            <Image
              alt={profile.name}
              className="object-contain object-bottom [mask-image:linear-gradient(to_bottom,black_84%,transparent_100%)]"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              src={profile.coverImage ?? siteAssetLinks.heroImage}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
