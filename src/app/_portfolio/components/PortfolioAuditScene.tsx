import { ArrowUpRight, Check } from "lucide-react";
import { AssistantTriggerButton } from "@/app/_assistant/components/AssistantTriggerButton";
import { PortfolioAction } from "./PortfolioAction";
import type { AuditPresentationData, HomePresentationData } from "../types";
import { StoryDisclosure } from "./StoryDisclosure";

export function PortfolioAuditScene({
  audit,
  home,
}: {
  audit: AuditPresentationData;
  home: HomePresentationData;
}) {
  return (
    <section className="story-audit" id="audit" aria-labelledby="audit-title">
      <div className="story-container">
        <span id="home-audit" />
        <span id="home-cta" />
        <span id="work-cta" />
        <span id="about-cta" />
        <span id="audit-cta" />
        <div className="story-audit-grid">
          <div className="story-audit-copy">
            <h2 id="audit-title">
              Let’s find
              <br />
              your next{" "}
              <br />
              <span>better step.</span>
            </h2>
            <p>{audit.hero.copy}</p>
            {audit.hero.actions.map((action) => (
              <PortfolioAction
                action={action}
                assistantDetail={{
                  workflowStart: {
                    workflowId: "audit",
                    originPage: "/",
                    originEntry: "home-audit-cta",
                  },
                }}
                className="story-button story-audit-button"
                key={action.label}
              />
            ))}
            <p className="story-audit-note">A free audit. One journey. No obligation.</p>
          </div>
          <div className="story-audit-paper">
            <div className="story-paper-heading">
              <span>Customer journey & workflow audit</span>
              <ArrowUpRight aria-hidden="true" size={23} />
            </div>
            <h3>
              A little clarity.
              <br />A practical next move.
            </h3>
            <div className="story-paper-example">
              <p>Where it gets stuck</p>
              <strong>{home.audit.problem.copy}</strong>
              <div className="story-paper-rule" />
              <p>A better handoff</p>
              <strong>{home.audit.improvement.copy}</strong>
            </div>
            <span className="story-paper-caption">
              <Check aria-hidden="true" size={17} />
              Illustrative example · your audit is personal
            </span>
          </div>
        </div>
        <div className="story-audit-bottom">
          <div>
            <StoryDisclosure title="What happens after I request an audit?" id="audit-process">
              <ol className="story-process-list">
                {audit.process.stages.map((stage) => (
                  <li key={stage.title}>
                    <strong>{stage.title}</strong>
                    <span>{stage.copy}</span>
                  </li>
                ))}
              </ol>
            </StoryDisclosure>
            <StoryDisclosure title="Is this the right starting point?" id="audit-why">
              <p>{audit.symptoms.copy}</p>
              <ul className="story-symptoms">
                {audit.symptoms.icons.map((item) => (
                  <li key={item.label}>{item.label}</li>
                ))}
              </ul>
            </StoryDisclosure>
          </div>
          <div className="story-audit-alternative">
            <p>Already have a project in mind?</p>
            <AssistantTriggerButton
              className="story-text-link"
              variant="text"
              detail={{ message: "I'd like to book a meeting with Freeman to discuss a project." }}
            >
              Book a conversation
              <ArrowUpRight aria-hidden="true" size={17} />
            </AssistantTriggerButton>
          </div>
        </div>
      </div>
    </section>
  );
}
