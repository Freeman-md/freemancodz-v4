"use client";

import {
  ArrowRight,
  Code2,
  Layers3,
  MessageCircleMore,
  UserRound,
  UsersRound,
} from "lucide-react";

import { assistantTriggerEvent } from "@/contracts/assistant.contract";
import { Container } from "@/shared/components/layout/Container";
import { Button } from "@/shared/components/ui/Button";

const conversationTopics = [
  { icon: Layers3, label: "Projects" },
  { icon: UserRound, label: "Roles" },
  { icon: UsersRound, label: "Collaborations" },
  { icon: Code2, label: "Product & engineering enquiries" },
];

export function WorkCtaSection() {
  function startConversation() {
    window.dispatchEvent(
      new CustomEvent(assistantTriggerEvent, {
        detail: {
          message:
            "I saw something in your work that maps to what I am building, hiring for, or trying to improve.",
        },
      }),
    );
  }

  return (
    <section className="bg-white py-10 sm:py-16" id="work-cta">
      <Container className="max-w-[1440px]">
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
            <p className="text-lg font-semibold uppercase tracking-[0.03em] text-signal-700 sm:text-xl">
              What&apos;s next?
            </p>
            <span aria-hidden="true" className="mx-auto mt-6 block h-1 w-16 rounded-full bg-signal-600" />
            <h2 className="mt-8 text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
              Seen something here that maps to what you&apos;re working on?
            </h2>
            <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-slate-700 sm:text-xl lg:text-2xl lg:leading-9">
              Tell me what you&apos;re building, hiring for or trying to improve. My assistant will help get
              the right context across.
            </p>

            <Button
              className="mt-10 h-20 w-full max-w-[36rem] rounded-xl bg-signal-600 px-6 text-xl font-semibold text-white shadow-[0_18px_36px_-18px_rgba(55,48,163,0.9)] hover:bg-signal-700 sm:text-2xl"
              onClick={startConversation}
            >
              <MessageCircleMore aria-hidden="true" className="size-7 sm:size-8" />
              Start a Conversation
              <ArrowRight aria-hidden="true" className="ml-auto size-7 sm:size-8" />
            </Button>

            <ul className="mx-auto mt-12 max-w-4xl divide-y divide-line text-left sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
              {conversationTopics.map(({ icon: Icon, label }) => (
                <li className="flex items-center gap-4 px-4 py-5 text-base font-medium text-slate-900 sm:justify-center sm:px-6 sm:text-center" key={label}>
                  <Icon aria-hidden="true" className="size-6 shrink-0 text-signal-600" />
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
            <path d="M0 190C190 20 360 70 560 130C780 196 1010 210 1400 25" opacity=".75" stroke="currentColor" />
            <path d="M0 210C210 46 400 92 590 148C825 218 1050 221 1400 58" opacity=".45" stroke="currentColor" />
            <path d="M0 230C235 78 430 112 625 166C875 234 1100 230 1400 91" opacity=".25" stroke="currentColor" />
            <circle cx="90" cy="132" fill="#2563eb" r="7" />
          </svg>
        </div>
      </Container>
    </section>
  );
}
