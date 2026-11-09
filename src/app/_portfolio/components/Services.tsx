import { SectionHeading } from "./SectionHeading";
import { SectionReveal } from "./SectionReveal";
import { QuestionChips } from "./QuestionChips";
import { ServiceRequest } from "./ServiceRequest";
import "./services.css";

type ServiceCard = {
  key: string;
  title: string;
  description: string;
  examples: readonly string[];
  questions: readonly string[];
  requestDraft: string;
};

export function Services({ services }: { services: readonly ServiceCard[] }) {
  return (
    <section className="home-section home-services" aria-labelledby="services">
      <SectionHeading id="services" description="What I can help with">
        Beyond clarity.
      </SectionHeading>
      <SectionReveal className="home-service-grid">
        {services.map((service) => (
          <article key={service.key} className="home-service">
            <div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
            <ul>
              {service.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
            <QuestionChips subject={service.title} questions={service.questions} />
            <ServiceRequest draft={{ subject: service.title, text: service.requestDraft }} />
          </article>
        ))}
      </SectionReveal>
    </section>
  );
}
