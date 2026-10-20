import { cn } from "@/lib/utils";

interface IllustrationProps {
  className?: string;
}

/** Technical-drafting illustrations for empty and not-found states. */
export function CbtEmptyIllustration({ className }: IllustrationProps) {
  return (
    <div className={cn("flex size-28 items-center justify-center", className)}>
      <svg viewBox="0 0 120 120" fill="none" className="size-full text-primary" aria-hidden="true">
        <rect x="16" y="16" width="88" height="88" rx="12" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="30" y="25" width="53" height="71" rx="6" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
        <rect x="47" y="20" width="20" height="9" rx="2" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.5" />
        <path d="M41 40h31M41 50h25M41 60h29M41 70h17" stroke="currentColor" strokeOpacity="0.65" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="79" cy="79" r="16" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
        <path d="m72 79 4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** Computer-based test catalogue empty state. */
export function CbtMonitorIllustration({ className }: IllustrationProps) {
  return (
    <div className={cn("relative flex size-28 items-center justify-center", className)}>
      <svg viewBox="0 0 120 120" fill="none" className="size-full text-primary" aria-hidden="true">
        <rect
          x="16"
          y="16"
          width="88"
          height="88"
          rx="12"
          className="stroke-border"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
        <rect
          x="26"
          y="26"
          width="68"
          height="46"
          rx="5"
          className="fill-surface stroke-border-strong"
          strokeWidth="1.5"
        />
        <path d="M60 72v8M46 80h28" className="stroke-border-strong" strokeWidth="2" strokeLinecap="round" />
        <line x1="32" y1="34" x2="52" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <circle cx="36" cy="44" r="2" className="fill-primary" />
        <line x1="42" y1="44" x2="68" y2="44" className="stroke-text-muted" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="36" cy="52" r="2" className="stroke-text-muted" strokeWidth="1" />
        <line x1="42" y1="52" x2="62" y2="52" className="stroke-text-muted" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="36" cy="60" r="2" className="stroke-text-muted" strokeWidth="1" />
        <line x1="42" y1="60" x2="58" y2="60" className="stroke-text-muted" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="82" cy="74" r="15" className="fill-surface stroke-primary" strokeWidth="2" />
        <line x1="82" y1="56" x2="82" y2="59" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="82" y1="74" x2="82" y2="67" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="82" y1="74" x2="88" y2="74" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="82" cy="74" r="1.5" className="fill-primary" />
      </svg>
    </div>
  );
}

export function DriveEmptyIllustration({ className }: IllustrationProps) {
  return (
    <div className={cn("flex size-28 items-center justify-center", className)}>
      <svg viewBox="0 0 120 120" fill="none" className="size-full text-primary" aria-hidden="true">
        <circle cx="60" cy="60" r="46" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d="M26 40c0-3.3 2.7-6 6-6h18l6 6h32c3.3 0 6 2.7 6 6v38c0 3.3-2.7 6-6 6H32c-3.3 0-6-2.7-6-6V40Z" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
        <g transform="rotate(-6 60 52)">
          <rect x="42" y="26" width="36" height="46" rx="4" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5" />
          <path d="M48 37h24M48 45h20M48 53h14" stroke="currentColor" strokeOpacity="0.65" strokeWidth="1.5" strokeLinecap="round" />
        </g>
        <path d="M26 52h68v26c0 3.3-2.7 6-6 6H32c-3.3 0-6-2.7-6-6V52Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
        <path d="M22 52v32m-2-32h4m-4 32h4" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="2 2" />
      </svg>
    </div>
  );
}

export function QuestionsEmptyIllustration({ className }: IllustrationProps) {
  return (
    <div className={cn("flex size-28 items-center justify-center", className)}>
      <svg viewBox="0 0 120 120" fill="none" className="size-full text-primary" aria-hidden="true">
        <circle cx="60" cy="56" r="42" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M60 10v10m0 72v10M14 56h10m72 0h10" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
        <path d="M32 32h56c4.4 0 8 3.6 8 8v30c0 4.4-3.6 8-8 8H56L42 88V78H32c-4.4 0-8-3.6-8-8V40c0-4.4 3.6-8 8-8Z" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
        <path d="M52 46a8 8 0 0 1 15 4c0 5-7 6.5-7 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="60" cy="68" r="1.5" fill="currentColor" />
        <circle cx="32" cy="32" r="2.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="96" cy="78" r="2.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export function NotFoundIllustration({ className }: IllustrationProps) {
  return (
    <div className={cn("mx-auto mb-2 flex size-32 items-center justify-center", className)}>
      <svg viewBox="0 0 140 140" fill="none" className="size-full text-primary" aria-hidden="true">
        <circle cx="70" cy="70" r="54" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="70" cy="70" r="34" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="70" cy="70" r="16" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" />
        <circle cx="70" cy="24" r="5" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M70 14v5m-2 9L52 82m20-54 26 48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M98 76A34 34 0 0 1 40 84" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="70" cy="70" r="2" fill="currentColor" />
        <path d="M64 70h12m-6-6v12" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
