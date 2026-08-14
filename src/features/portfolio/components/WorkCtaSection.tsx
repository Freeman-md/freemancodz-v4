import { Sparkles } from "lucide-react";

import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import type { WorkPresentationData } from "../models/portfolio-presentation";
import { PortfolioAction } from "./PortfolioAction";
import { PortfolioIcon } from "./PortfolioIcon";

export function WorkCtaSection({ closing }: Pick<WorkPresentationData, "closing">) {
  return (
    <section className="bg-white py-10 sm:py-16" id="work-cta">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-signal-100 bg-[linear-gradient(145deg,#ffffff_0%,#ffffff_52%,#f5f7ff_100%)] px-6 py-20 shadow-soft sm:px-10 lg:min-h-[780px] lg:px-16 lg:py-24">
          <div
            aria-hidden="true"
            className="absolute left-10 top-10 h-28 w-36 opacity-40 [background-image:radial-gradient(circle,#a5b4fc_2px,transparent_2px)] [background-size:24px_24px]"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-12 right-10 h-28 w-36 opacity-45 [background-image:radial-gradient(circle,#a5b4fc_2px,transparent_2px)] [background-size:24px_24px] lg:hidden"
          />

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <MarketingSectionHeading
              copy={<p>{closing.copy}</p>}
              eyebrow={closing.eyebrow}
              id="work-cta-heading"
              title={closing.title}
            />

            {closing.actions.map((action) => (
              <PortfolioAction
                action={action}
                className="mx-auto mt-9 max-w-lg"
                key={action.label}
              />
            ))}

            <ul className="mx-auto mt-12 max-w-4xl divide-y divide-line text-left sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
              {closing.icons.map(({ iconName, label }) => (
                <li
                  className="flex items-center gap-4 px-4 py-5 text-base font-medium text-slate-900 sm:justify-center sm:px-6 sm:text-center"
                  key={label}
                >
                  <PortfolioIcon
                    aria-hidden="true"
                    className="size-6 shrink-0 text-signal-600"
                    name={iconName}
                  />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <svg
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[30%] w-full text-signal-200"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 1400 260"
          >
            <path
              d="M0 190C190 20 360 70 560 130C780 196 1010 210 1400 25"
              opacity=".75"
              stroke="currentColor"
            />
            <path
              d="M0 210C210 46 400 92 590 148C825 218 1050 221 1400 58"
              opacity=".45"
              stroke="currentColor"
            />
            <path
              d="M0 230C235 78 430 112 625 166C875 234 1100 230 1400 91"
              opacity=".25"
              stroke="currentColor"
            />
            <circle cx="90" cy="132" fill="#2563eb" r="7" />
          </svg>
        </div>
      </Container>
    </section>
  );
}
