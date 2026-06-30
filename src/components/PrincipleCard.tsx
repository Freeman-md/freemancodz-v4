export function PrincipleCard({
  index,
  title,
  text,
}: {
  index: number;
  title: string;
  text: string;
}) {
  return (
    <article className="border-t border-line pt-6">
      <p className="mb-2 font-mono text-[12px] text-accent">
        {String(index).padStart(2, "0")}
      </p>
      <h3 className="text-xl font-medium tracking-[-0.03em] text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted">{text}</p>
    </article>
  );
}
