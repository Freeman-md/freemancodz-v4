import { MessageCircleMore } from "lucide-react";

export function SignalVisual() {
  return (
    <div className="relative flex min-h-72 w-full items-center justify-center overflow-hidden sm:min-h-80">
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full text-signal-300"
        fill="none"
        viewBox="0 0 620 400"
      >
        <path d="M-20 240C100 166 132 304 255 236C380 167 397 61 645 121" stroke="currentColor" strokeWidth="1.25" />
        <path
          className="motion-safe:animate-signal-flow"
          d="M-8 108C134 164 172 76 302 126C420 170 463 337 648 270"
          stroke="currentColor"
          strokeDasharray="7 9"
          strokeWidth="1.5"
        />
        <path d="M366 -8C420 72 481 51 641 85" stroke="currentColor" strokeWidth="1.25" />
        <circle cx="83" cy="203" fill="currentColor" r="6" />
        <circle cx="427" cy="98" fill="currentColor" r="6" />
        <circle cx="518" cy="283" fill="currentColor" r="6" />
      </svg>
      <div className="relative z-10 flex size-48 items-center justify-center rounded-full border border-signal-300 bg-signal-50/60 motion-safe:animate-signal-glow sm:size-56">
        <div className="flex size-28 items-center justify-center rounded-full border border-white bg-white text-signal-800 shadow-[0_12px_30px_-18px_rgba(55,48,163,0.7)] sm:size-32">
          <MessageCircleMore aria-hidden="true" className="size-12 stroke-[1.7] sm:size-14" />
        </div>
      </div>
    </div>
  );
}
