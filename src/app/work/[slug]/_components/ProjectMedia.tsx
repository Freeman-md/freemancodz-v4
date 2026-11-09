import Image from "next/image";
import { ProjectClip } from "./ProjectClip";

export function ProjectMedia({
  source,
  poster,
  label,
}: {
  source: string;
  poster: { source: string; altText: string };
  label: string;
}) {
  return (
    <figure className="case-media">
      <div className="case-media-label">
        <h3>{label}</h3>
      </div>
      <div className="case-media-frame">
        <Image
          src={poster.source}
          alt={poster.altText}
          fill
          sizes="(max-width: 700px) calc(100vw - 48px), 624px"
        />
        <ProjectClip source={source} poster={poster.source} label={label} />
      </div>
    </figure>
  );
}
