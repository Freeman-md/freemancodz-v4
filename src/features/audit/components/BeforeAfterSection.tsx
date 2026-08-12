import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import { PortfolioIcon } from "@/features/portfolio/components/PortfolioIcon";
import type { AuditPresentationData, PortfolioIcon as PortfolioIconModel, PortfolioSection } from "@/features/portfolio/models/portfolio-presentation";

type WorkflowNodeData = PortfolioIconModel;

function WorkflowNode({
  iconName,
  label,
  tone,
}: WorkflowNodeData & { tone: "before" | "after" }) {
  const isAfter = tone === "after";

  return (
    <div className="relative z-10 flex min-w-0 flex-1 flex-col items-center text-center">
      <div
        className={`flex size-16 items-center justify-center rounded-full border bg-white sm:size-[72px] ${
          isAfter
            ? "border-success-300 text-success-700 motion-safe:animate-success-glow"
            : "border-red-300 text-ink motion-safe:animate-alert-glow"
        }`}
      >
        <PortfolioIcon aria-hidden="true" className="size-7 stroke-[1.75] sm:size-8" name={iconName} />
      </div>
      <p className="mt-3 max-w-[10rem] text-sm font-medium leading-5 text-ink sm:text-base">{label}</p>
    </div>
  );
}

function WorkflowPanel({
  title,
  nodes,
  tone,
}: {
  title: string;
  nodes: WorkflowNodeData[];
  tone: "before" | "after";
}) {
  const connectorClass = tone === "after" ? "border-success-600" : "border-slate-400";

  const connectorStyle = tone === "after" ? "border-solid" : "border-dashed";

  return (
    <section>
      <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
        {title}
      </h3>
      <div className={`mt-7 flex items-start gap-3 sm:gap-4 ${
        tone === "after" && nodes.length === 3 ? "md:gap-7" : ""
      }`}>
        {nodes.map((node, index) => (
          <div className="contents" key={node.label}>
            <WorkflowNode {...node} tone={tone} />
            {index < nodes.length - 1 ? (
              <div
                aria-hidden="true"
                className={`relative top-8 hidden min-w-6 flex-1 border-t-2 sm:block ${
                  tone === "after" && nodes.length === 3 ? "md:min-w-10" : ""
                } ${connectorClass} ${connectorStyle}`}
              >
                {tone === "after" ? (
                  <span className="absolute -right-1.5 -top-1.5 size-3 rounded-full bg-success-600" />
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function ComparisonCard({ data, tone }: { data: PortfolioSection & { customer: PortfolioSection; workflow: PortfolioSection }; tone: "before" | "after" }) {
  const isAfter = tone === "after";

  const customerJourney = data.customer.icons;

  const operationalWorkflow = data.workflow.icons;

  return (
    <article
      className={`rounded-3xl border bg-white p-5 shadow-soft transition duration-300 motion-safe:hover:-translate-y-1 sm:p-6 ${
        isAfter
          ? "border-success-100 shadow-[0_16px_42px_-30px_rgba(4,120,87,0.42)] motion-safe:hover:shadow-[0_20px_48px_-28px_rgba(4,120,87,0.34)]"
          : "border-line motion-safe:hover:shadow-[0_20px_48px_-28px_rgba(185,28,28,0.22)]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-2 pb-6">
        <p
          className={`rounded-full px-5 py-2 font-mono text-base font-semibold uppercase tracking-[0.16em] sm:text-lg ${
            isAfter ? "bg-success-50 text-success-700" : "bg-red-50 text-red-600"
          }`}
        >
          {data.title}
        </p>
        <p className="text-base font-medium text-ink sm:text-lg">
          {data.copy}
        </p>
      </div>

      <div
        className={`overflow-hidden rounded-2xl border ${
          isAfter ? "border-success-100" : "border-line"
        }`}
      >
        <div className="p-5 sm:p-6">
          <WorkflowPanel
            nodes={customerJourney}
            title={data.customer.title}
            tone={tone}
          />
        </div>
        <div className={`border-t p-5 sm:p-6 ${isAfter ? "border-success-100" : "border-line"}`}>
          <WorkflowPanel
            nodes={operationalWorkflow}
            title={data.workflow.title}
            tone={tone}
          />
        </div>
      </div>
    </article>
  );
}

export function BeforeAfterSection({ beforeAfter }: Pick<AuditPresentationData, "beforeAfter">) {
  return (
    <section aria-labelledby="friction-heading" className="py-16 sm:py-20">
      <Container>
        <MarketingSectionHeading
          copy={<p>{beforeAfter.copy}</p>}
          eyebrow={beforeAfter.eyebrow}
          id="friction-heading"
          title={beforeAfter.title}
        />

        <div className="mt-12 grid gap-7 lg:grid-cols-2 lg:gap-8">
          <ComparisonCard data={beforeAfter.before} tone="before" />
          <ComparisonCard data={beforeAfter.after} tone="after" />
        </div>
      </Container>
    </section>
  );
}
