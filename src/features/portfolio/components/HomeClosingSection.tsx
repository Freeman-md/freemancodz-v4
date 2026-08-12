import { Check, CircleAlert } from "lucide-react";

import { MarketingVisualCta } from "@/shared/components/marketing/MarketingVisualCta";
import type { HomePresentationData } from "../models/portfolio-presentation";
import { PortfolioAction } from "./PortfolioAction";

function FrictionResolutionVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-[1.05/1] w-full max-w-2xl">
      <div className="absolute right-[3%] top-[3%] size-[34%] rounded-full bg-signal-100/60 blur-3xl" />
      <div className="absolute bottom-[8%] left-[1%] size-[34%] rounded-full bg-red-50/70 blur-3xl" />
      <svg className="absolute inset-0 size-full overflow-visible" fill="none" viewBox="0 0 680 640">
        <g opacity=".25" stroke="#818cf8" strokeWidth="1.5">
          <ellipse cx="155" cy="470" rx="104" ry="66" transform="rotate(12 155 470)" />
          <ellipse cx="154" cy="470" rx="88" ry="105" transform="rotate(56 154 470)" />
          <ellipse cx="154" cy="470" rx="74" ry="111" transform="rotate(105 154 470)" />
          <ellipse cx="155" cy="470" rx="52" ry="112" transform="rotate(147 155 470)" />
          <ellipse cx="155" cy="470" rx="101" ry="45" transform="rotate(-28 155 470)" />
          <ellipse cx="155" cy="470" rx="68" ry="93" transform="rotate(-66 155 470)" />
        </g>
        <path
          d="M194 474C245 520 278 529 310 485C340 445 325 397 367 369"
          stroke="#ef4444"
          strokeDasharray="7 7"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <path
          d="M367 369C433 368 448 344 452 291C457 226 500 218 542 187C573 164 588 132 612 111"
          stroke="#2563eb"
          strokeLinecap="round"
          strokeWidth="4"
        />
        <circle cx="194" cy="474" fill="#ef4444" r="5" />
        <circle cx="367" cy="369" fill="#4f46e5" r="5" />
        <circle cx="612" cy="111" fill="#2563eb" r="5" />
      </svg>

      <div className="absolute bottom-[17%] left-[17%] flex size-16 items-center justify-center rounded-full border border-red-300 bg-white text-red-600 shadow-[0_0_35px_rgba(239,68,68,0.22)] sm:size-20">
        <CircleAlert className="size-8" strokeWidth={1.8} />
      </div>
      <div className="absolute right-[3%] top-[5%] flex size-20 items-center justify-center rounded-full border border-signal-100 bg-white text-signal-600 shadow-[0_0_0_20px_rgba(224,231,255,0.55),0_0_55px_rgba(79,70,229,0.25)] sm:size-24">
        <Check className="size-10" strokeWidth={2} />
      </div>
    </div>
  );
}

export function HomeClosingSection({ closing }: Pick<HomePresentationData, "closing">) {
  return (
    <MarketingVisualCta
      action={
        closing.actions.map((action) => (
          <PortfolioAction action={action} className="mx-0 mt-0 max-w-md" key={action.label} />
        ))
      }
      align="left"
      className="border-t border-line bg-[#fbf9f9]"
      copy={
        <p>
          {closing.copy}
        </p>
      }
      eyebrow={closing.eyebrow}
      helper={
        <p className="mt-6 flex items-center gap-3 text-sm leading-6 text-slate-700 sm:text-base">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-signal-50 text-signal-700">
            <Check aria-hidden="true" className="size-5" />
          </span>
          Free · Personally reviewed · Delivered within 48 hours
        </p>
      }
      id="home-closing-heading"
      title={closing.title}
      visual={<FrictionResolutionVisual />}
    />
  );
}
