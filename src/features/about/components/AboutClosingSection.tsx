import { ArrowRight, BriefcaseBusiness, MessageCircle, ShieldCheck } from "lucide-react";
import { Allura } from "next/font/google";
import Link from "next/link";

import { Container } from "@/shared/components/layout/Container";

const signatureFont = Allura({ subsets: ["latin"], weight: "400" });

export function AboutClosingSection() {
  return (
    <section aria-labelledby="about-closing-heading" className="pb-20 pt-16 sm:pb-28 sm:pt-20">
      <Container>
        <div className="overflow-hidden rounded-3xl border border-line bg-white px-6 py-14 text-center shadow-soft sm:px-10 sm:py-20 lg:px-20">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.08em] text-signal-700">
            What&apos;s next?
          </p>
          <span aria-hidden="true" className="mx-auto mt-5 block h-1 w-14 rounded-full bg-signal-500" />
          <h2
            className="mx-auto mt-9 max-w-4xl font-display text-4xl leading-[1.04] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl"
            id="about-closing-heading"
          >
            Have a customer journey or workflow that isn&apos;t running as smoothly as it should?
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            Let&apos;s take a look together. I&apos;ll audit one journey or workflow and show you what
            would make the biggest difference.
          </p>

          <Link
            className="mx-auto mt-10 inline-flex w-full max-w-lg items-center justify-center gap-5 rounded-sm bg-signal-800 px-7 py-5 text-lg font-semibold text-white shadow-[0_12px_28px_-14px_rgba(55,48,163,0.72)] transition hover:bg-signal-900 sm:text-xl"
            href="/audit"
          >
            <MessageCircle aria-hidden="true" className="size-7 stroke-[1.7]" />
            <span>Start My Free Audit</span>
            <ArrowRight aria-hidden="true" className="size-6 stroke-[1.7]" />
          </Link>
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
                  View selected work
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
