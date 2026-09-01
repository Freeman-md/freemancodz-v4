"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type AuditProcessStage = {
  title: string;
  copy: string;
};

function TimelineStage({
  activeIndex,
  index,
  onActivate,
  stage,
  total,
}: {
  activeIndex: number;
  index: number;
  onActivate: (index: number) => void;
  stage: AuditProcessStage;
  total: number;
}) {
  const reference = useRef<HTMLLIElement>(null);

  const isInView = useInView(reference, { amount: 0.5, margin: "-35% 0px -35% 0px" });

  const shouldReduceMotion = useReducedMotion();

  const isFinal = index === total - 1;

  const isActive = activeIndex === index;

  const connectorIsActive = index < activeIndex;

  useEffect(() => {
    if (isInView && !shouldReduceMotion) {
      onActivate(index);
    }
  }, [index, isInView, onActivate, shouldReduceMotion]);

  return (
    <motion.li
      animate={{
        backgroundColor:
          isActive && isFinal ? "rgba(238, 236, 255, 0.5)" : "rgba(255, 255, 255, 0)",
      }}
      className="relative grid grid-cols-[3.25rem_minmax(0,1fr)] gap-4 border-t border-line py-6 last:border-b sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-6 sm:py-7"
      ref={reference}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
    >
      <div className="relative z-10 flex justify-center bg-white">
        <motion.span
          animate={{
            backgroundColor: isActive ? "rgb(55, 48, 163)" : "rgb(255, 255, 255)",
            color: isActive ? "rgb(255, 255, 255)" : "rgb(100, 116, 139)",
          }}
          className={`flex size-11 items-center justify-center rounded-full border font-mono text-xs font-semibold motion-reduce:border-signal-800 motion-reduce:bg-signal-800 motion-reduce:text-white sm:size-12 ${
            isFinal ? "border-signal-300" : "border-line"
          }`}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
        >
          {String(index + 1).padStart(2, "0")}
        </motion.span>
      </div>
      <div className="py-1">
        <h3 className="text-xl font-semibold tracking-[-0.03em] text-ink sm:text-2xl">
          {stage.title}
        </h3>
        <p className="mt-2 text-base leading-7 text-slate-700">{stage.copy}</p>
      </div>
      {index < total - 1 ? (
        <motion.span
          animate={{ scaleY: connectorIsActive ? 1 : 0 }}
          aria-hidden="true"
          className="absolute bottom-0 left-[1.6rem] top-[4.2rem] w-px origin-top bg-signal-500 motion-reduce:scale-y-100 sm:left-[2rem]"
          transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
        />
      ) : null}
    </motion.li>
  );
}

export function AuditProcessTimeline({ stages }: { stages: AuditProcessStage[] }) {
  const shouldReduceMotion = useReducedMotion();

  const [activeIndex, setActiveIndex] = useState(0);

  const displayActiveIndex = shouldReduceMotion ? stages.length - 1 : activeIndex;

  const activateStage = useCallback(
    (nextIndex: number) => setActiveIndex((current) => Math.max(current, nextIndex)),
    [],
  );

  return (
    <ol aria-label="Audit process" className="relative">
      {stages.map((stage, index) => (
        <TimelineStage
          activeIndex={displayActiveIndex}
          index={index}
          key={stage.title}
          onActivate={activateStage}
          stage={stage}
          total={stages.length}
        />
      ))}
    </ol>
  );
}
