"use client";

// Adapted from Magic UI Border Beam, MIT. See THIRD-PARTY-NOTICES.md.
import { motion, useReducedMotion, type MotionStyle } from "motion/react";

import { cn } from "../utils";

export function BorderBeam({
  className,
  duration = 8,
  size = 100,
  delay = 0
}: {
  className?: string;
  duration?: number;
  size?: number;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)] mask-intersect [mask-clip:padding-box,border-box]"
    >
      <motion.div
        className={cn(
          "absolute aspect-square bg-linear-to-l from-transparent via-sky-300 to-transparent",
          className
        )}
        style={{ width: size, offsetPath: `rect(0 auto auto 0 round ${size}px)` } as MotionStyle}
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: ["0%", "100%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration, delay: -delay }}
      />
    </div>
  );
}
