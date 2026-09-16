"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

export function StoryImage({
  src,
  alt,
  sizes,
  priority = false,
  fallback,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  fallback?: ReactNode;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  if (failedSource === src) {
    return (
      fallback ?? (
        <span className="story-image-unavailable">
          {alt}
          <small>Image unavailable</small>
        </span>
      )
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      onError={() => setFailedSource(src)}
    />
  );
}
