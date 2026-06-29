export function ImagePlaceholder({ src, label, className = "" }: { src?: string; label: string; className?: string }) {
  if (src) {
    return (
      <div className={`relative overflow-hidden rounded border border-line bg-surface ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} className="h-full w-full object-cover grayscale" />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden rounded border border-line bg-surface ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#fafafa,#ededed)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.14),transparent_35%)]" />
      <div className="absolute bottom-4 left-4 rounded bg-white px-3 py-2 font-mono text-xs text-ink shadow-soft">{label}</div>
    </div>
  );
}
