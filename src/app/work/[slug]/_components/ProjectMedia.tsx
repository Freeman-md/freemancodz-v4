import Image from "next/image";
import type { ProjectMedia as MediaRecord } from "@/modules/portfolio/data/project-case-study.schema";
import { ProjectClip } from "./ProjectClip";

export function ProjectMedia({ media, label }: { media: MediaRecord; label: string }) {
  return (
    <figure className="case-media">
      <div className="case-media-label">
        <h3>{label}</h3>
        <p>{media.poster.provenance}</p>
      </div>
      <div className="case-media-frame">
        <Image
          src={media.poster.source}
          alt={media.poster.altText}
          fill
          sizes="(max-width: 700px) calc(100vw - 48px), 624px"
        />
        {media.video && (
          <ProjectClip source={media.video} poster={media.poster.source} label={label} />
        )}
      </div>
      <figcaption>{media.caption}</figcaption>
    </figure>
  );
}
