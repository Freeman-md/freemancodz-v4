import { BriefcaseBusiness, ShieldCheck } from "lucide-react";
import { Allura } from "next/font/google";
import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import { PortfolioAction } from "@/features/portfolio/components/PortfolioAction";
import type { AboutPresentationData } from "@/features/portfolio/models/portfolio-presentation";

const signatureFont = Allura({ subsets: ["latin"], weight: "400" });

export function AboutClosingSection({
  closing,
  profile,
}: Pick<AboutPresentationData, "closing" | "profile">) {
  return (
    <section aria-labelledby="about-closing-heading" className="pb-20 pt-16 sm:pb-28 sm:pt-20">
      <Container>
        <div className="overflow-hidden rounded-3xl border border-line bg-white px-6 py-14 text-center shadow-soft sm:px-10 sm:py-20 lg:px-20">
          <MarketingSectionHeading
            copy={<p>{closing.copy}</p>}
            eyebrow={closing.eyebrow}
            id="about-closing-heading"
            title={closing.title}
          />

          {closing.actions.map((action) => (
            <PortfolioAction action={action} className="mx-auto mt-9 max-w-lg" key={action.label} />
          ))}
          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-slate-500 sm:text-base">
            <ShieldCheck aria-hidden="true" className="size-5 text-slate-500" />
            Roles · Projects · Collaborations · Speaking · Other enquiries
          </p>

          <div className="mx-auto mt-16 grid max-w-4xl gap-10 border-t border-line pt-10 text-left md:grid-cols-2 md:items-center">
            <div className="group flex items-center gap-5 rounded-2xl border border-line p-5 transition hover:border-signal-200 hover:bg-signal-50/30">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-signal-50 text-signal-700">
                <BriefcaseBusiness aria-hidden="true" className="size-7 stroke-[1.6]" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{closing.work.title}</p>
                {closing.work.actions.map((action) => (
                  <PortfolioAction action={action} className="mt-2 h-auto p-0" key={action.label} />
                ))}
              </div>
            </div>

            <div className="text-center md:text-left">
              <p
                className={`${signatureFont.className} text-5xl leading-none text-slate-950 sm:text-6xl`}
              >
                {profile.name}
              </p>
              <p className="mt-4 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {profile.title}
              </p>
              <p className="mt-2 text-sm text-slate-600">{profile.positioning}</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
