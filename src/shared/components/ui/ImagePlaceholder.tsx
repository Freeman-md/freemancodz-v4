type Props = {
  src?: string;
  label: string;
  className?: string;
  caption?: string;
};

export function ImagePlaceholder({
  src,
  label,
  className = "",
  caption,
}: Props) {
  return (
    <div
      className={`group relative overflow-hidden rounded-sm border border-line bg-surface ${className}`}
    >
      {src ? (
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="block h-full w-full"
          aria-label={`Open full size image: ${label}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={label}
            className="h-full w-full object-cover grayscale transition duration-500 ease-out group-hover:scale-[1.03] group-hover:grayscale-0"
          />
        </a>
      ) : (
        <>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_30%),linear-gradient(160deg,#ffffff,#efeded_75%)]" />
        <div className="absolute inset-x-6 top-6 h-px bg-black/6" />
        <div className="absolute inset-x-6 top-10 h-px bg-black/4" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/8 to-transparent" />
        </>
      )}
      <div className="pointer-events-none absolute bottom-4 right-4 rounded-sm border border-line bg-white/90 px-3 py-1 font-mono text-[11px] text-muted backdrop-blur">
        {caption || label}
      </div>
    </div>
  );
}
