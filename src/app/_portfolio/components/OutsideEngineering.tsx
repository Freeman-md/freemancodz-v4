import Image from "next/image";
import { SectionHeading } from "./SectionHeading";
import { SectionReveal } from "./SectionReveal";
import "./outside-engineering.css";

const photos = [
  {
    label: "Strength",
    src: "/images/outside/strength.jpg",
    alt: "Freeman strength training at the gym",
  },
  {
    label: "Endurance",
    src: "/images/outside/endurance.jpg",
    alt: "Freeman and other runners on a path in a park",
  },
  {
    label: "Good company",
    src: "/images/outside/community.jpg",
    alt: "Freeman with friends in a group photo, with faces covered by privacy stickers",
  },
] as const;

export function OutsideEngineering() {
  return (
    <section className="home-section home-outside" aria-labelledby="outside-engineering">
      <SectionHeading id="outside-engineering">Outside Engineering</SectionHeading>
      <SectionReveal className="home-photo-grid">
        {photos.map((photo) => (
          <figure key={photo.label} tabIndex={0}>
            <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 700px) 50vw, 408px" />
            <figcaption>{photo.label}</figcaption>
          </figure>
        ))}
      </SectionReveal>
    </section>
  );
}
