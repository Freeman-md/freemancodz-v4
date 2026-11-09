import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { HomeAction } from "./HomeAction";
import { SectionReveal } from "./SectionReveal";
import "./contact.css";

export const profiles = {
  contra:
    "https://contra.com/freeman_madudili_xs81lv56?referralExperimentNid=DEFAULT_REFERRAL_PROGRAM&referrerUsername=freeman_madudili_xs81lv56",
  linkedin: "https://www.linkedin.com/in/freeman-madudili-9864101a2/",
  x: "https://x.com/freemancodz",
  github: "https://github.com/Freeman-md",
};

export function Contact({
  offer,
}: {
  offer?: { title: string; description: string; action: string };
}) {
  return (
    <section className="home-section home-contact" aria-labelledby="contact">
      <SectionReveal className="home-contact-reveal" together>
        <p className="home-available">Available for new projects</p>
        <h2 id="contact" tabIndex={-1}>
          {offer?.title ?? "HAVE A PROJECT IN MIND?"}
        </h2>
        <p className="home-contact-copy">
          {offer?.description ??
            "Let’s build intuitive interfaces and reliable workflows that make your business easier to run."}
        </p>
        {offer ? (
          <button type="button" className="home-action" disabled aria-disabled="true">
            {offer.action}
            <ArrowUpRight aria-hidden="true" size={16} />
            <span className="sr-only">Unavailable</span>
          </button>
        ) : (
          <HomeAction href="mailto:freemanmadudili@gmail.com">Contact Me</HomeAction>
        )}
        <ul className="home-profiles" aria-label="Profiles">
          <li>
            <a href={profiles.contra}>
              <Image src="/images/homepage/contact.png" width={36} height={36} alt="" />
              Freemancodz
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a href={profiles.linkedin}>
              <Image src="/images/homepage/linkedin.png" width={16} height={16} alt="" />
              LinkedIn
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a href={profiles.x}>
              <svg
                width="15"
                height="15"
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.9-7.4L5.6 22H2.4l7.3-8.4L2 2h6.3l4.4 6.7L18.9 2ZM17.8 20h1.7L7.3 3.9H5.5L17.8 20Z" />
              </svg>
              X<ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a href={profiles.github}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656" />
              </svg>
              GitHub
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </li>
        </ul>
      </SectionReveal>
    </section>
  );
}
