import { AssistantTriggerButton } from "@/features/assistant/components/AssistantTriggerButton";
import type { HomeProofAction, HomeProofProject } from "@/features/portfolio/models/home-page";

type ProofOfWorkCardProps = {
  action: HomeProofAction;
  dominant?: boolean;
  project: HomeProofProject;
};

export function ProofOfWorkCard({ action, dominant = false, project }: ProofOfWorkCardProps) {
  return (
    <article
      className={`flex h-full flex-col rounded-sm border border-line bg-white p-8 transition hover:border-neutral-300 hover:shadow-soft ${
        dominant ? "md:p-10" : ""
      }`}
    >
      <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent">
        {project.category}
      </p>
      <h3 className="mt-5 text-2xl font-medium tracking-[-0.03em] text-ink md:text-[28px]">
        {project.title}
      </h3>
      <dl className="mt-8 grid gap-6">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Problem</dt>
          <dd className="mt-2 text-sm leading-6 text-ink">{project.problem}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            What I built
          </dt>
          <dd className="mt-2 text-sm leading-6 text-ink">{project.whatIBuilt}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Outcome</dt>
          <dd className="mt-2 text-sm leading-6 text-ink">{project.outcome}</dd>
        </div>
      </dl>
      {action ? (
        <div className="mt-auto pt-8">
          {action.type === "assistant" ? (
            <AssistantTriggerButton
              variant="text"
              className="px-0 py-0"
              detail={{ message: action.prompt }}
            >
              {action.label}
              <span aria-hidden="true">↗</span>
            </AssistantTriggerButton>
          ) : (
            <a
              href={action.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-ink underline decoration-line underline-offset-4 transition hover:text-accent"
            >
              {action.label}
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      ) : null}
    </article>
  );
}
