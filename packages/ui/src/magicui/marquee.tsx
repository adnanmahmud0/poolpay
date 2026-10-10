// Adapted from Magic UI Marquee, MIT. See THIRD-PARTY-NOTICES.md.
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../utils";

export function Marquee({
  className,
  children,
  paused = false,
  ...props
}: ComponentPropsWithoutRef<"div"> & { paused?: boolean }) {
  return (
    <div
      {...props}
      className={cn(
        "group flex gap-(--gap) overflow-hidden [--duration:42s] [--gap:2.5rem]",
        className
      )}
    >
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          aria-hidden={index > 0 ? true : undefined}
          className={cn(
            "animate-marquee flex shrink-0 items-center justify-around gap-(--gap) group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused]",
            paused && "[animation-play-state:paused]"
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
