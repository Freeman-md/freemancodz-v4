import type { PortfolioTestimonial } from "../../data/types";

export function PortfolioTestimonials({ testimonials }: { testimonials: PortfolioTestimonial[] }) {
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section
      className="story-testimonials story-container"
      id="in-their-words"
      aria-labelledby="testimonials-title"
    >
      <h2 id="testimonials-title">In their words.</h2>
      <div className="story-testimonial-list">
        {testimonials.map((testimonial) => (
          <figure key={`${testimonial.author}-${testimonial.quote}`}>
            <blockquote>
              <p>{testimonial.quote}</p>
            </blockquote>
            <figcaption>
              <strong>{testimonial.author}</strong>
              <span>{testimonial.relationship}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
