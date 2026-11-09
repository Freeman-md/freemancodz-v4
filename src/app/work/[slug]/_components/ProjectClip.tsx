"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export function ProjectClip({
  source,
  poster,
  label,
}: {
  source: string;
  poster: string;
  label: string;
}) {
  const video = useRef<HTMLVideoElement>(null);

  const [playing, setPlaying] = useState(false);

  const [intent, setIntent] = useState<"auto" | "play" | "pause">("auto");

  const [visible, setVisible] = useState(false);

  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const clip = video.current;

    if (!clip) {
      return;
    }

    setAvailable(clip.readyState >= HTMLMediaElement.HAVE_METADATA && !clip.error);

    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.25,
    });

    observer.observe(clip);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const clip = video.current;

    if (!clip) {
      return;
    }

    const motion = matchMedia("(prefers-reduced-motion: reduce)");

    function sync() {
      if (!clip) {
        return;
      }

      if (
        !visible ||
        document.hidden ||
        intent === "pause" ||
        (intent === "auto" && motion.matches)
      ) {
        clip.pause();

        return;
      }

      void clip.play().catch(() => {
        // A blocked autoplay still leaves a poster and a manual Play action.
      });
    }

    sync();
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [intent, visible]);

  return (
    <>
      <video
        ref={video}
        src={source}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        data-playing={playing}
        onLoadedMetadata={() => setAvailable(true)}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          setAvailable(false);
          setPlaying(false);
        }}
      />
      {available && (
        <button
          className="case-playback"
          type="button"
          aria-label={`${playing ? "Pause" : "Play"} ${label}`}
          onClick={() => {
            const clip = video.current;

            if (!clip) {
              return;
            }

            if (playing) {
              clip.pause();
              setIntent("pause");
            } else {
              setIntent("play");
              void clip.play().catch(() => {
                // Browsers may reject playback until a decodable source is available.
              });
            }
          }}
        >
          {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
        </button>
      )}
    </>
  );
}
