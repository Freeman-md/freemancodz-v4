import type { ReactNode } from "react";

export function MarketingSectionHeading({
  align = "center",
  copy,
  eyebrow,
  id,
  title,
}: {
  align?: "center" | "left" | "right";
  copy?: ReactNode;
  eyebrow: string;
  id: string;
  title: ReactNode;
}) {
  const alignment = {
    center: "mx-auto text-center",
    left: "mr-auto text-left",
    right: "ml-auto text-right",
  }[align];

  const ruleAlignment = { center: "mx-auto", left: "mr-auto", right: "ml-auto" }[align];

  const copyAlignment = { center: "mx-auto", left: "mr-auto", right: "ml-auto" }[align];

  return (
    <div className={`max-w-4xl ${alignment}`}>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-signal-700 sm:text-xs">
        {eyebrow}
      </p>
      <span
        aria-hidden="true"
        className={`mt-5 block h-1 w-16 rounded-full bg-signal-600 ${ruleAlignment}`}
      />
      <h2
        className="mt-7 font-display text-4xl leading-[1.03] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl"
        id={id}
      >
        {title}
      </h2>
      {copy ? (
        <div
          className={`mt-6 max-w-3xl text-lg leading-8 text-slate-700 sm:text-xl ${copyAlignment}`}
        >
          {copy}
        </div>
      ) : null}
    </div>
  );
}
