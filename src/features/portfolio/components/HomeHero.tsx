import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Code2,
  Database,
  Handshake,
  LineChart,
  ListChecks,
  MessageCircleMore,
  Users,
  UsersRound,
} from "lucide-react";

import { buttonVariants } from "@/shared/components/ui/Button";
import { siteAssetLinks } from "@/shared/config/links";
import { cn } from "@/shared/utils/class-names";

const audiences = [
  { icon: Users, label: "Founders" },
  { icon: BriefcaseBusiness, label: "Hiring Managers" },
  { icon: Code2, label: "Engineering Leaders" },
  { icon: UsersRound, label: "Technical Teams" },
  { icon: Handshake, label: "Collaborators" },
];

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

export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-[#fbf9f9]">
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-[1440px] lg:grid-cols-[minmax(0,1.02fr)_minmax(32rem,0.98fr)]">
        <div className="relative z-20 flex flex-col px-6 pb-10 pt-12 text-center sm:px-10 lg:justify-center lg:px-20 lg:pb-20 lg:pt-16 lg:text-left">
          <div className="mx-auto max-w-3xl lg:mx-0">
            <p className="flex items-center justify-center gap-4 text-xs font-semibold uppercase tracking-[-0.01em] text-signal-700 lg:justify-start lg:text-sm">
              <span aria-hidden="true" className="h-0.5 w-9 bg-signal-600" />
              Customer-facing products + reliable workflows
            </p>
            <h1 className="mt-7 text-[clamp(1.9rem,8.4vw,2.2rem)] font-semibold leading-[1.08] tracking-[-0.05em] text-slate-950 lg:mt-8 lg:text-[clamp(3.25rem,3.8vw,3.75rem)] lg:leading-[1.04] lg:tracking-[-0.06em]">
              Building customer-facing products and reliable operational workflows<span className="text-signal-600">.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-800 lg:mx-0 lg:mt-8 lg:text-xl lg:leading-9">
              I help businesses improve how customers find information, understand their options and take
              action, while reducing the repetitive work happening behind the scenes.
            </p>
          </div>

          <div className="mx-auto mt-7 grid w-full max-w-2xl gap-3 sm:grid-cols-2 lg:mx-0 lg:mt-9">
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "signal" }), "w-full gap-5")}
              href="/audit"
            >
              <MessageCircleMore aria-hidden="true" className="size-5 sm:hidden" />
              Get a Free Audit
              <ArrowRight aria-hidden="true" className="ml-auto size-5" />
            </Link>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "light" }), "w-full gap-5")}
              href="/work"
            >
              View Relevant Work
              <ArrowRight aria-hidden="true" className="ml-auto size-5" />
            </Link>
          </div>

          <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-x-6 gap-y-5 text-sm text-slate-800 lg:mx-0 lg:mt-9 lg:justify-start">
            {audiences.map(({ icon: Icon, label }) => (
              <li className="flex items-center gap-2.5" key={label}>
                <Icon aria-hidden="true" className="size-5 text-signal-600" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative min-h-[30rem] lg:min-h-full">
          <svg aria-hidden="true" className="absolute inset-0 size-full text-signal-300" fill="none" viewBox="0 0 720 760" preserveAspectRatio="none">
            <path d="M0 760C115 690 108 586 212 526C324 462 320 329 451 264C557 211 570 101 720 62" stroke="currentColor" strokeWidth="1.5" />
            <path d="M0 760C143 704 169 626 257 576C365 515 391 405 492 354C605 297 601 207 720 171" stroke="currentColor" strokeOpacity=".35" />
            <circle cx="213" cy="525" fill="currentColor" r="5" />
          </svg>
          <HeroSignalCards />
          <div className="absolute inset-x-0 bottom-0 top-[8%] z-10 lg:top-[6%]">
            <Image
              alt="Freeman Madudili"
              className="object-contain object-bottom [mask-image:linear-gradient(to_bottom,black_84%,transparent_100%)]"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              src={siteAssetLinks.heroImage}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
