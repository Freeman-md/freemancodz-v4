import Image from "next/image";

import { Container } from "@/shared/components/layout/Container";
import type { HomePresentationData } from "../models/portfolio-presentation";
import { PortfolioAction } from "./PortfolioAction";

export function HomeHero({ hero, profile }: Pick<HomePresentationData, "hero" | "profile">) {
  return (
    <section className="bg-surface py-12 sm:py-16 lg:py-20">
      <Container
        className={`grid items-center gap-12 ${profile.coverImage ? "lg:grid-cols-[3fr_2fr]" : ""}`}
      >
        <div className="min-w-0">
          <p className="text-base font-medium text-muted">{profile.name}</p>
          <h1 className="mt-6 max-w-[24ch] font-display text-4xl tracking-tight text-ink text-balance sm:text-5xl lg:text-6xl">
            {hero.title}
          </h1>
          <p className="mt-6 max-w-[56ch] text-base leading-7 text-muted">{hero.copy}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {hero.actions.map((action) => (
              <PortfolioAction
                action={{ ...action, variant: action.variant === "PRIMARY" ? "PRIMARY" : "LINK" }}
                className="h-auto min-h-12 max-w-full gap-3 whitespace-normal rounded-sm py-3 font-medium shadow-none active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-700"
                key={action.label}
              />
            ))}
          </div>
        </div>
        {profile.coverImage ? (
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm lg:max-w-none">
            <Image
              alt={profile.name}
              className="object-contain object-bottom [mask-image:linear-gradient(to_bottom,black_88%,transparent_100%)]"
              fill
              preload
              sizes="(min-width: 1200px) 440px, (min-width: 1024px) 38vw, (min-width: 424px) 384px, calc(100vw - 40px)"
              src={profile.coverImage}
            />
          </div>
        ) : null}
      </Container>
    </section>
  );
}
