import { SectionHeading } from "./SectionHeading";
import { SectionReveal } from "./SectionReveal";
import { QuestionChips } from "./QuestionChips";
import { ServiceRequest } from "./ServiceRequest";
import "./services.css";

const services = [
  {
    name: "Product development",
    description: "From a rough idea to a product people can use.",
    examples: ["Web apps", "Mobile apps", "E-commerce"],
    questions: ["What can we build?", "How do we start?"],
    draft: "I’d like to discuss product development.",
  },
  {
    name: "Automation + AI",
    description: "Make repetitive work easier to hand off, track and complete.",
    examples: ["Intake and routing", "Workflow automation", "AI-assisted triage"],
    questions: ["What can I automate?", "Where does AI help?"],
    draft: "I’d like to discuss automation and AI.",
  },
] as const;

export function Services() {
  return (
    <section className="home-section home-services" aria-labelledby="services">
      <SectionHeading id="services" description="What I can help with">
        Beyond clarity.
      </SectionHeading>
      <SectionReveal className="home-service-grid">
        {services.map((service) => (
          <article key={service.name} className="home-service">
            <div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
            </div>
            <ul>
              {service.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
            <QuestionChips subject={service.name} questions={service.questions} />
            <ServiceRequest draft={{ subject: service.name, text: service.draft }} />
          </article>
        ))}
      </SectionReveal>
    </section>
  );
}
