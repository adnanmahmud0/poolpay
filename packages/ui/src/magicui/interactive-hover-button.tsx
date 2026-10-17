"use client";

// Adapted from Magic UI Interactive Hover Button, MIT. See THIRD-PARTY-NOTICES.md.
import * as React from "react";

import { ArrowRight } from "lucide-react";

import { cn } from "../utils";

export interface InteractiveHoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  href?: string;
  dotClassName?: string;
  hoverTextClassName?: string;
}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(
  (
    {
      text,
      className,
      children,
      href,
      onClick,
      dotClassName = "bg-primary",
      hoverTextClassName = "text-primary-foreground",
      ...props
    },
    ref
  ) => {
    const content = children ?? text ?? "Button";
    const baseClasses = cn(
      "group bg-background relative inline-flex w-auto cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-200 px-6 py-2.5 text-center text-sm font-semibold text-slate-800 transition-all duration-300 hover:border-slate-300 disabled:pointer-events-none disabled:opacity-50",
      className
    );

    const innerContent = (
      <>
        {/* Unhovered content with animated scaling dot */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={cn(
              "size-2 shrink-0 rounded-full transition-all duration-500 ease-out group-hover:scale-[120]",
              dotClassName
            )}
          />
          <span className="inline-block whitespace-nowrap transition-all duration-300 group-hover:translate-x-6 group-hover:opacity-0">
            {content}
          </span>
        </div>

        {/* Hovered content sliding into optical center */}
        <div
          className={cn(
            "absolute inset-0 z-10 flex h-full w-full translate-x-6 items-center justify-center gap-2 px-6 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100",
            hoverTextClassName
          )}
        >
          <span className="whitespace-nowrap">{content}</span>
          <ArrowRight className="size-4 shrink-0" />
        </div>
      </>
    );

    if (href) {
      return (
        <a
          href={href}
          className={baseClasses}
          onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
        >
          {innerContent}
        </a>
      );
    }

    return (
      <button ref={ref} className={baseClasses} onClick={onClick} {...props}>
        {innerContent}
      </button>
    );
  }
);

InteractiveHoverButton.displayName = "InteractiveHoverButton";
