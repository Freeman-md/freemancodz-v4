import Image from "next/image";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { QuestionChips } from "./QuestionChips";
import { SectionHeading } from "./SectionHeading";
import { SectionReveal } from "./SectionReveal";
import "./selected-work.css";

const projects = [
  {
    name: "JPScents",
    id: "jpscents",
    context: "Novier Labs · Fragrance commerce",
    image: "/images/homepage/jpscents.jpg",
    alt: "JPScents storefront with its fragrance collection",
    problem: "Choosing a scent meant a WhatsApp chat.",
    outcome: "Customers arrive ready to pay.",
    questions: ["Why WhatsApp?", "How is stock handled?"],
    href: "https://jpscents.shop",
  },
  {
    name: "Debby Art & Prints",
    id: "debby-arts",
    context: "Novier Labs · Art and creative services",
    image: "/images/homepage/debby.jpg",
    alt: "Debby Art & Prints portfolio with a gallery of paintings",
    problem: "Custom enquiries lacked useful detail.",
    outcome: "Defined the enquiry scope and plan.",
    questions: ["Why a portfolio?", "What makes a useful brief?"],
    href: null,
  },
  {
    name: "Pay4Me / WithRadius",
    id: "pay4me-withradius",
    context: "Pay4Me · Fintech",
    image: "/images/work/withradius-hero.jpg",
    alt: "WithRadius payment product artwork",
    problem: "Gateway checks delayed large payments.",
    outcome: "Team supported US$500k+ in transactions.",
    questions: ["Why a bank partner?", "What did you build?"],
    href: "https://withradius.com/",
  },
] as const;

export function SelectedWork() {
  return (
    <section className="home-section home-work" aria-labelledby="work">
      <SectionHeading
        id="work"
        description="Real products, from finding the right scent to making a creative request or payment."
      >
        Good software makes the next step clear.
      </SectionHeading>
      <SectionReveal className="home-project-grid">
        {projects.map((project) => (
          <article key={project.name} className="home-project">
            <div className="home-project-art">
              <Image
                src={project.image}
                alt={project.alt}
                fill
                sizes="(max-width: 700px) calc(100vw - 48px), 408px"
              />
              <div className="home-project-actions">
                <span
                  className="home-art-action"
                  role="button"
                  aria-disabled="true"
                  tabIndex={0}
                  aria-label={`${project.name} case study unavailable`}
                  data-label="Case study unavailable"
                >
                  <BookOpen size={18} aria-hidden="true" />
                </span>
                {project.href ? (
                  <a
                    className="home-art-action"
                    href={project.href}
                    aria-label={`Visit ${project.name} website`}
                    data-label="Visit website"
                  >
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </a>
                ) : (
                  <span
                    className="home-art-action"
                    role="button"
                    aria-disabled="true"
                    tabIndex={0}
                    aria-label={`${project.name} website unavailable`}
                    data-label="Website unavailable"
                  >
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </span>
                )}
              </div>
            </div>
            <div className="home-project-copy">
              <div>
                <h3 id={project.id} tabIndex={-1}>
                  {project.name}
                </h3>
                <p>{project.context}</p>
              </div>
              <div className="home-project-excerpts">
                <p>
                  <strong>Problem</strong> {project.problem}
                </p>
                <p>
                  <strong>Outcome</strong> {project.outcome}
                </p>
              </div>
              <QuestionChips subject={project.name} questions={project.questions} />
            </div>
          </article>
        ))}
      </SectionReveal>
      <div className="home-work-more">
        <span role="button" aria-disabled="true" tabIndex={0}>
          View rest of work<span className="sr-only"> (unavailable)</span>
          <ArrowRight size={16} aria-hidden="true" />
        </span>
        <p>from explorations to real-world impact</p>
      </div>
    </section>
  );
}
