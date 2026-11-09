import { HomeAction } from "./HomeAction";
import { HeroPortrait } from "./HeroPortrait";
import "./hero.css";

export const heroDescription =
  "I build intuitive interfaces and reliable workflows that simplify your business operations, using AI where it helps.";

export function Hero() {
  return (
    <section className="home-hero" id="top" aria-labelledby="hero-heading">
      <div className="home-hero-intro">
        <h1 id="hero-heading">
          <span>From first click.</span> <span>To a job well done.</span>
        </h1>
        <p>{heroDescription}</p>
        <div className="home-hero-action">
          <HomeAction href="/#work" down>
            Explore my work
          </HomeAction>
        </div>
      </div>
      <HeroPortrait />
      <div className="home-hero-labels">
        <p>
          Freeman Madudili<span>Software Engineer</span>
        </p>
        <p>
          Customer-facing products<span>Connected to what happens next</span>
        </p>
      </div>
    </section>
  );
}
