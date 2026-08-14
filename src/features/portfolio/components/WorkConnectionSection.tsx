import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  CheckCircle2,
  Mail,
  Network,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import type { PortfolioSection, WorkPresentationData } from "../models/portfolio-presentation";

type ConnectionItem = {
  icon: LucideIcon;
  label: string;
};

function ConnectionList({ items, tone }: { items: ConnectionItem[]; tone: "signal" | "success" }) {
  const toneClasses =
    tone === "signal"
      ? "border-signal-100 bg-signal-50 text-signal-700"
      : "border-success-100 bg-success-50 text-success-700";

  return (
    <ul className="mt-6 grid gap-3">
      {items.map(({ icon: Icon, label }) => (
        <li className="flex items-center gap-3 text-sm font-semibold text-slate-900" key={label}>
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg border shadow-sm ${toneClasses}`}
          >
            <Icon aria-hidden="true" className="size-4" />
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}

function ProductSide({ items, section }: { items: ConnectionItem[]; section: PortfolioSection }) {
  return (
    <div>
      <span className="flex size-14 items-center justify-center rounded-full border border-signal-100 bg-white text-signal-700 shadow-soft">
        <UserRound aria-hidden="true" className="size-6" />
      </span>
      <h3 className="mt-6 max-w-xs text-2xl font-semibold uppercase leading-7 text-signal-700">
        {section.title}
      </h3>
      <p className="mt-4 max-w-[17rem] text-base leading-7 text-slate-700">{section.copy}</p>
      <span aria-hidden="true" className="mt-5 block h-px w-14 bg-signal-300" />
      <ConnectionList items={items} tone="signal" />
    </div>
  );
}

function WorkflowSide({ items, section }: { items: ConnectionItem[]; section: PortfolioSection }) {
  return (
    <div>
      <span className="flex size-14 items-center justify-center rounded-full border border-success-100 bg-white text-success-700 shadow-soft">
        <Settings aria-hidden="true" className="size-6" />
      </span>
      <h3 className="mt-6 max-w-sm text-2xl font-semibold uppercase leading-7 text-success-700">
        {section.title}
      </h3>
      <p className="mt-4 max-w-[17rem] text-base leading-7 text-slate-700">{section.copy}</p>
      <span aria-hidden="true" className="mt-5 block h-px w-14 bg-success-300" />
      <ConnectionList items={items} tone="success" />
    </div>
  );
}

function ConnectedExperience({ section }: { section: PortfolioSection }) {
  return (
    <div className="relative z-20 flex flex-col items-center text-center">
      <span className="flex size-16 items-center justify-center rounded-full border border-signal-100 bg-white text-signal-800 shadow-[0_16px_34px_-20px_rgba(55,48,163,0.65)]">
        <Network aria-hidden="true" className="size-7" />
      </span>
      <h3 className="mt-6 text-xl font-semibold uppercase leading-6 text-signal-950">
        {section.title}
      </h3>
      <p className="mt-4 max-w-[13rem] text-base leading-6 text-slate-700">{section.copy}</p>
    </div>
  );
}

function DesktopConnectionDiagram({
  connects,
  productItems,
  workflowItems,
}: {
  connects: WorkPresentationData["connects"];
  productItems: ConnectionItem[];
  workflowItems: ConnectionItem[];
}) {
  return (
    <div className="relative mx-auto mt-14 hidden min-h-[550px] max-w-[1120px] lg:block">
      <div className="absolute inset-y-0 left-0 w-[59%] rounded-[4.5rem_18rem_18rem_4.5rem] border border-signal-100 bg-[linear-gradient(115deg,rgba(238,242,255,0.76),rgba(255,255,255,0.78))] p-12 pr-64">
        <ProductSide items={productItems} section={connects.products} />
      </div>
      <div className="absolute inset-y-0 right-0 w-[59%] rounded-[18rem_4.5rem_4.5rem_18rem] border border-success-100 bg-[linear-gradient(245deg,rgba(236,253,245,0.76),rgba(255,255,255,0.78))] p-12 lg:pl-[16.5rem] xl:pl-80">
        <WorkflowSide items={workflowItems} section={connects.workflows} />
      </div>
      <div className="absolute left-1/2 top-1/2 z-10 flex h-[86%] w-[30%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[50%] border border-signal-100 bg-[linear-gradient(145deg,rgba(224,231,255,0.78),rgba(236,253,245,0.78))] shadow-[0_24px_70px_-45px_rgba(55,48,163,0.8)]">
        <ConnectedExperience section={connects.experiences} />
      </div>
    </div>
  );
}

function MobileConnectionDiagram({
  connects,
  productItems,
  workflowItems,
}: {
  connects: WorkPresentationData["connects"];
  productItems: ConnectionItem[];
  workflowItems: ConnectionItem[];
}) {
  return (
    <div className="mt-12 grid gap-7 lg:hidden">
      <article className="rounded-3xl border border-signal-100 bg-signal-50/30 p-6 sm:p-8">
        <ProductSide items={productItems} section={connects.products} />
      </article>
      <div className="relative rounded-full border border-signal-100 bg-[linear-gradient(110deg,rgba(238,242,255,0.9),rgba(236,253,245,0.9))] p-6 shadow-soft">
        <ConnectedExperience section={connects.experiences} />
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-full h-7 border-l border-dashed border-signal-300"
        />
      </div>
      <article className="rounded-3xl border border-success-100 bg-success-50/30 p-6 sm:p-8">
        <WorkflowSide items={workflowItems} section={connects.workflows} />
      </article>
    </div>
  );
}

export function WorkConnectionSection({
  connects,
  projects,
}: Pick<WorkPresentationData, "connects" | "projects">) {
  const productItems: ConnectionItem[] = [
    { icon: TrendingUp, label: projects.pay4Me.title },
    { icon: Sparkles, label: projects.portfolioAssistant.title },
    { icon: ArrowUpRight, label: projects.acrossTheHorizon.title },
  ];

  const workflowItems: ConnectionItem[] = [
    { icon: Mail, label: projects.emailPa.title },
    { icon: UsersRound, label: projects.shifty.title },
    { icon: ShieldCheck, label: projects.selfHealing.title },
  ];

  return (
    <section aria-labelledby="work-connection-heading" className="bg-[#fbf9f9] py-20 sm:py-28">
      <Container className="max-w-[1340px]">
        <div className="rounded-[2rem] border border-line bg-white px-5 py-16 shadow-soft sm:px-10 lg:px-14 lg:py-20">
          <MarketingSectionHeading
            eyebrow={connects.eyebrow}
            id="work-connection-heading"
            title={connects.title}
          />

          <DesktopConnectionDiagram
            connects={connects}
            productItems={productItems}
            workflowItems={workflowItems}
          />
          <MobileConnectionDiagram
            connects={connects}
            productItems={productItems}
            workflowItems={workflowItems}
          />

          <div className="mt-14">
            <div className="flex items-center gap-5">
              <span aria-hidden="true" className="h-px flex-1 bg-line" />
              <span className="flex size-12 items-center justify-center rounded-xl border border-signal-100 bg-white text-signal-700 shadow-soft">
                <Sparkles aria-hidden="true" className="size-5" />
              </span>
              <span aria-hidden="true" className="h-px flex-1 bg-line" />
            </div>
            <p className="mt-5 text-center text-base font-medium text-slate-700">
              Different projects. One consistent focus
            </p>
            <ul className="mt-7 grid grid-cols-2 gap-y-7 sm:grid-cols-4">
              {connects.outcomes.map((outcome, index) => (
                <li
                  className={`flex flex-col items-center px-3 text-center text-sm leading-5 text-slate-700 ${index > 0 ? "sm:border-l sm:border-line" : ""
                    }`}
                  key={outcome.label}
                >
                  <CheckCircle2 aria-hidden="true" className="mb-3 size-5 text-signal-600" />
                  {outcome.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
