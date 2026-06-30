import { CTASection } from "@/components/CTASection";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { PrincipleCard } from "@/components/PrincipleCard";
import { SectionHeader } from "@/components/SectionHeader";
import { profile } from "@/data/profile";
const outside = [
  "Strength training",
  "Running",
  "Community",
  "Learning / events",
];
export default function AboutPage() {
  return (
    <>
      <section className="container py-20 md:py-28">
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.25em] text-accent">
          About Freeman
        </p>
        <h1 className="max-w-5xl text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-black md:text-7xl">
          Calm engineering for systems that need to hold up.
        </h1>
        <p className="mt-8 max-w-3xl text-lg leading-8 text-muted">
          I’m a software engineer focused on building reliable, scalable systems
          and using AI to make engineering workflows sharper, faster, and more
          practical.
        </p>
      </section>
      <section className="border-y border-line bg-surface">
        <div className="container section">
          <SectionHeader title="Engineering Philosophy" />
          <div className="grid gap-8 md:grid-cols-5">
            {profile.aboutPrinciples.map((p, i) => (
              <PrincipleCard key={p} index={i + 1} text={p} />
            ))}
          </div>
        </div>
      </section>
      <section className="container section">
        <SectionHeader
          title="How I Work"
          copy="A simple process for turning ambiguity into shipped, observable software."
        />
        <div className="grid gap-4 md:grid-cols-6">
          {profile.workProcess.map((step, i) => (
            <div key={step} className="rounded border border-line bg-white p-6">
              <p className="font-mono text-xs text-accent">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-5 font-semibold leading-6 text-black">{step}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="border-y border-line bg-surface">
        <div className="container section">
          <div className="rounded border border-line bg-white p-8 md:p-12">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Current Direction
            </p>
            <h2 className="max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.05em] text-black md:text-6xl">
              Self-healing backend operations agents.
            </h2>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-muted">
              I’m currently studying MSc Computer Science and researching a
              self-healing backend operations agent: an AI-powered system that
              helps production backends detect, diagnose, and recover from
              failures while keeping engineers in control.
            </p>
          </div>
        </div>
      </section>
      <section className="container section">
        <SectionHeader
          title="Outside Engineering"
          copy="Outside engineering, I care about strength training, discipline, community, learning, and becoming the kind of person who can handle bigger responsibilities well."
        />
        <div className="grid gap-5 md:grid-cols-4">
          {outside.map((label) => (
            <div key={label}>
              <ImagePlaceholder label={label} className="h-56" />
              <h3 className="mt-4 font-semibold text-black">{label}</h3>
            </div>
          ))}
        </div>
      </section>
      <section className="container pb-20 md:pb-28">
        <CTASection copy="Want to see how this thinking shows up in my work?" />
      </section>
    </>
  );
}
