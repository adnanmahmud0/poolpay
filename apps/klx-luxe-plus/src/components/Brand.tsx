import { cn } from "@repo/ui";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 80" fill="none" aria-hidden="true" className={cn("brand-mark", className)}>
      <ellipse cx="32" cy="16" rx="27" ry="12" stroke="currentColor" strokeWidth="5" />
      <path d="m12 24 13 6 7-7 7 7 13-6-14 17H26L12 24Z" fill="#6AB5EE" />
      <path d="m32 31 7 10-3 7 6 20-10 12-10-12 6-20-3-7 7-10Z" fill="#6AB5EE" />
      <path d="m25 30 7 11 7-11" stroke="white" strokeWidth="1.6" />
    </svg>
  );
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <a href="#home" className={cn("brand", light && "brand-light")} aria-label="KLX Luxe Plus home">
      <BrandMark />
      <span>
        <span className="brand-title">
          KLX <span>LUXE</span> PLUS
        </span>
        <span className="brand-subtitle">A LITTLE MORE, IN EVERY WAY.</span>
      </span>
    </a>
  );
}
