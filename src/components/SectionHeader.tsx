export function SectionHeader({
  eyebrow,
  title,
  copy,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="mb-10 max-w-3xl">
      {eyebrow ? (
        <p className="mb-3 font-mono text-[12px] tracking-[0.02em] text-muted">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-[-0.04em] text-ink md:text-5xl">
        {title}
      </h2>
      {copy ? (
        <p className="mt-4 text-base leading-7 text-muted md:text-lg md:leading-8">
          {copy}
        </p>
      ) : null}
    </div>
  );
}
