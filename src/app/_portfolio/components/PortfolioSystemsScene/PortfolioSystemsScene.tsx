import { ArrowUpRight, Inbox, MessageCircle, Send } from "lucide-react";
import { AssistantTriggerButton } from "@/app/_assistant/components/AssistantTriggerButton";
import type { HomePresentationData, WorkPresentationData } from "../../data/types";
import { resolvePortfolioIcon } from "../PortfolioIcon";
import { StoryDisclosure } from "../StoryDisclosure/StoryDisclosure";
import { StoryProjectDetail } from "../StoryProjectDetail/StoryProjectDetail";

export function PortfolioSystemsScene({
  home,
  work,
}: {
  home: HomePresentationData;
  work: WorkPresentationData;
}) {
  const assistant = work.projects.portfolioAssistant;

  const email = work.projects.emailPa;

  return (
    <section className="story-systems" id="systems" aria-labelledby="systems-title">
      <div className="story-container">
        <span id="home-improve" />
        <span id="work-connects" />
        <span id="about-thinking" />
        <div className="story-section-intro">
          <h2 id="systems-title">
            {"The click is only".split(" ").map((word) => (
              <span className="story-word" data-story-word key={word}>
                {word}{" "}
              </span>
            ))}
            <br />
            <span>
              {"the beginning.".split(" ").map((word) => (
                <span className="story-word" data-story-word key={word}>
                  {word}{" "}
                </span>
              ))}
            </span>
          </h2>
          <p>{home.improve.copy}</p>
        </div>
        <div className="story-assistant-scene" id={assistant.slug}>
          <div className="story-assistant-object">
            <div className="story-assistant-heading">
              <MessageCircle aria-hidden="true" size={23} />
              <span>{assistant.title}</span>
              <span className="story-live-label">Try it here</span>
            </div>
            <h3>
              What would you
              <br />
              like to know?
            </h3>
            <p>Explore the work. Find your next step.</p>
            <div className="story-prompt-list">
              <AssistantTriggerButton
                className="story-prompt"
                detail={{ message: "What did Freeman build for JPScents?" }}
              >
                What did you build for JPScents?
                <ArrowUpRight aria-hidden="true" size={17} />
              </AssistantTriggerButton>
              <AssistantTriggerButton
                className="story-prompt"
                detail={{ message: "How does Freeman approach workflow automation?" }}
              >
                How do you approach automation?
                <ArrowUpRight aria-hidden="true" size={17} />
              </AssistantTriggerButton>
              <AssistantTriggerButton
                className="story-prompt"
                detail={{ message: "I'd like to book a meeting with Freeman." }}
              >
                Let’s book a conversation
                <ArrowUpRight aria-hidden="true" size={17} />
              </AssistantTriggerButton>
            </div>
            <AssistantTriggerButton className="story-assistant-compose" variant="text">
              Ask your own question
              <Send aria-hidden="true" size={18} />
            </AssistantTriggerButton>
          </div>
          <div className="story-systems-copy">
            <h3>
              Answers that lead
              <br />
              somewhere useful.
            </h3>
            <p className="story-category">{assistant.category}</p>
            <p>{assistant.solution}</p>
            <StoryDisclosure title="How the assistant works">
              <StoryProjectDetail project={assistant} />
            </StoryDisclosure>
          </div>
        </div>
        <div className="story-workflow-scene" id={email.slug}>
          <div className="story-systems-copy">
            <h3>{email.title}</h3>
            <p className="story-category">{email.category}</p>
            <p>{email.solution}</p>
            <StoryDisclosure title="Inside the workflow">
              <StoryProjectDetail project={email} />
            </StoryDisclosure>
          </div>
          <figure className="story-workflow-object">
            <div className="story-flow-start">
              <span>Incoming email</span>
            </div>
            <div className="story-flow-path" aria-hidden="true">
              <span />
              <Send size={24} strokeWidth={1.5} />
              <span />
            </div>
            <ol role="list">
              {home.improve.operationalWorkflow.icons.map((step) => {
                const Icon =
                  step.iconName === "Download" ? Inbox : resolvePortfolioIcon(step.iconName);

                return (
                  <li key={step.label}>
                    {Icon && <Icon aria-hidden="true" size={18} strokeWidth={1.5} />}
                    <span>{step.label}</span>
                  </li>
                );
              })}
            </ol>
            <figcaption>Workflow concept · {email.visualText}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
