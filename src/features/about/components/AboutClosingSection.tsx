import { ArrowRight, BriefcaseBusiness, MessageCircle, ShieldCheck } from "lucide-react";
import { Allura } from "next/font/google";
import Link from "next/link";

import { Container } from "@/shared/components/layout/Container";
import { MarketingCtaLink } from "@/shared/components/marketing/MarketingCtaLink";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";

const signatureFont = Allura({ subsets: ["latin"], weight: "400" });

export function AboutClosingSection() {
  return (
    <section aria-labelledby="about-closing-heading" className="pb-20 pt-16 sm:pb-28 sm:pt-20">
      <Container>
        <div className="overflow-hidden rounded-3xl border border-line bg-white px-6 py-14 text-center shadow-soft sm:px-10 sm:py-20 lg:px-20">
          <MarketingSectionHeading
            copy={
              <p>
                Let&apos;s take a look together. I&apos;ll audit one journey or workflow and show you what
                would make the biggest difference.
              </p>
            }
            eyebrow="What's next?"
            id="about-closing-heading"
            title="Have a customer journey or workflow that isn't running as smoothly as it should?"
          />

          <MarketingCtaLink href="/audit">
            <MessageCircle aria-hidden="true" className="size-7 stroke-[1.7]" />
            <span>Start My Free Audit</span>
            <ArrowRight aria-hidden="true" className="size-6 stroke-[1.7]" />
          </MarketingCtaLink>
          <p className="mt-6 flex items-center justify-center gap-3 text-sm text-slate-500 sm:text-base">
            <ShieldCheck aria-hidden="true" className="size-5 text-slate-500" />
            Free. No obligation. Your information is never shared.
          </p>

          <div className="mx-auto mt-16 grid max-w-4xl gap-10 border-t border-line pt-10 text-left md:grid-cols-2 md:items-center">
            <Link
              className="group flex items-center gap-5 rounded-2xl border border-line p-5 transition hover:border-signal-200 hover:bg-signal-50/30"
              href="/work"
            >
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-signal-50 text-signal-700">
                <BriefcaseBusiness aria-hidden="true" className="size-7 stroke-[1.6]" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Want to see more of my work?</p>
                <p className="mt-2 flex items-center gap-2 font-medium text-signal-700">
                  View relevant work
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition group-hover:translate-x-1"
                  />
                </p>
              </div>
            </Link>

            <div className="text-center md:text-left">
              <p className={`${signatureFont.className} text-5xl leading-none text-slate-950 sm:text-6xl`}>
                Freeman Madudili
              </p>
              <p className="mt-4 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Software engineer
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Customer-Facing Products · Reliable Workflows
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
