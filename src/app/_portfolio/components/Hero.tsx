import { HomeAction } from "./HomeAction";
import { HeroPortrait } from "./HeroPortrait";
import "./hero.css";

export function Hero({ profile }: { profile: { name: string; headline: string; intro: string } }) {
  return (
    <section className="home-hero" id="top" tabIndex={-1} aria-labelledby="hero-heading">
      <div className="home-hero-intro">
        <h1 id="hero-heading">
          <span>From first click.</span> <span>To a job well done.</span>
        </h1>
        <p>{profile.intro}</p>
        <div className="home-hero-action">
          <HomeAction href="/#work" down>
            Explore my work
          </HomeAction>
        </div>
      </div>
      <HeroPortrait name={profile.name} />
      <div className="home-hero-labels">
        <p>
          {profile.name}
          <span>{profile.headline}</span>
        </p>
        <p>
          Customer-facing products<span>Connected to what happens next</span>
        </p>
      </div>
    </section>
  );
}
