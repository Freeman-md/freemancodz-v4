import { Container } from "@/shared/components/layout/Container";
import type { HomePresentationData } from "../models/portfolio-presentation";
import { PortfolioAction } from "./PortfolioAction";

export function HomeClosingSection({ closing }: Pick<HomePresentationData, "closing">) {
  return (
    <div className="bg-surface pb-20 lg:pb-24" id="home-cta">
      <Container>
        <p className="max-w-[56ch] text-base leading-7 text-muted">{closing.copy}</p>
        <div className="mt-6 flex flex-wrap items-center gap-6">
          {closing.actions.map((action) => (
            <PortfolioAction
              action={{ ...action, variant: "GHOST" }}
              className="h-auto min-h-12 max-w-full gap-3 whitespace-normal rounded-sm border-ink/20 bg-transparent px-4 py-3 font-medium text-ink shadow-none hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-700"
              key={action.label}
            />
          ))}
          <p className="text-sm leading-6 text-muted">
            Free · Personally reviewed · Delivered within 48 hours
          </p>
        </div>
      </Container>
    </div>
  );
}
