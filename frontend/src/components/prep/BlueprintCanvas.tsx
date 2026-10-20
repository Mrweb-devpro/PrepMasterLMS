import { useId, useRef, useState, type MouseEvent } from "react";
import { MechanicalCadComponent } from "./MechanicalCadComponent";

interface BlueprintCanvasProps {
  variant?: "signup" | "login" | "solidworks";
}

/** Interactive drafting grid used behind the desktop auth-panel copy. */
export function BlueprintCanvas({ variant = "signup" }: BlueprintCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 120, y: 160 });
  const [isHovered, setIsHovered] = useState(false);
  const gridId = useId().replace(/:/g, "");

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top),
    });
  };

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute inset-0 select-none overflow-hidden bg-[#0c0d12]"
    >
      <svg className="pointer-events-none absolute inset-0 size-full stroke-white/[0.06]">
        <defs>
          <pattern id={`${gridId}-minor`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" strokeWidth="0.5" />
          </pattern>
          <pattern id={`${gridId}-major`} width="96" height="96" patternUnits="userSpaceOnUse">
            <path d="M 96 0 L 0 0 0 96" fill="none" strokeWidth="1" className="stroke-white/[0.12]" />
            <path d="M 44 48 L 52 48 M 48 44 L 48 52" strokeWidth="1" className="stroke-primary/40" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill={`url(#${gridId}-minor)`} />
        <rect width="100%" height="100%" fill={`url(#${gridId}-major)`} />

        {variant === "signup" && (
          <g className="fill-none stroke-primary/25" strokeWidth="1">
            <circle cx="50%" cy="45%" r="140" strokeDasharray="4 6" />
            <circle cx="50%" cy="45%" r="220" strokeDasharray="2 6" className="opacity-60" />
            <circle cx="50%" cy="45%" r="300" strokeDasharray="1 8" className="opacity-40" />
            <line x1="10%" y1="45%" x2="90%" y2="45%" strokeDasharray="2 6" />
            <line x1="50%" y1="15%" x2="50%" y2="75%" strokeDasharray="2 6" />
          </g>
        )}

        {variant === "login" && (
          <g className="fill-none stroke-primary/30" strokeWidth="1">
            <circle cx="50%" cy="42%" r="48" />
            <circle cx="50%" cy="42%" r="96" strokeDasharray="8 6" className="origin-center animate-spin-slow" />
            <line x1="10%" y1="42%" x2="90%" y2="42%" strokeDasharray="4 4" />
            <line x1="50%" y1="12%" x2="50%" y2="72%" strokeDasharray="4 4" />
            <rect x="276" y="228" width="48" height="48" strokeDasharray="3 3" className="stroke-primary/50" />
          </g>
        )}
      </svg>

      {variant === "solidworks" && (
        <MechanicalCadComponent mouseX={mousePos.x} mouseY={mousePos.y} isHovered={isHovered} />
      )}

      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0.4,
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, color-mix(in oklab, var(--primary) 22%, transparent), transparent 75%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 h-32 animate-scan bg-gradient-to-b from-transparent via-primary/[0.07] to-transparent" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex h-4 items-end space-x-12 border-b border-white/[0.08] px-4 font-mono text-[8px] text-white/30">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="flex items-end gap-1">
            <span className="h-2 w-px bg-white/20" />
            <span className="hidden sm:inline">{(index + 1) * 50}</span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-4 flex-col items-end space-y-12 border-r border-white/[0.08] py-12 font-mono text-[8px] text-white/30">
        {Array.from({ length: 10 }).map((_, index) => (
          <span key={index} className="h-px w-2 bg-white/20" />
        ))}
      </div>

      <div className="pointer-events-none absolute right-6 top-5 flex items-center gap-3 font-mono text-[10px] tracking-wider text-white/40">
        <span className="inline-flex items-center gap-1.5 text-primary">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          {variant === "solidworks" ? "CAD: DRAFTING" : "CANVAS: ACTIVE"}
        </span>
        <span className="text-white/20">|</span>
        <span>X: {String(mousePos.x).padStart(3, "0")}</span>
        <span>Y: {String(mousePos.y).padStart(3, "0")}</span>
      </div>
      <div className="pointer-events-none absolute bottom-5 right-6 font-mono text-[9px] uppercase tracking-widest text-white/25">
        {variant === "solidworks" ? "Scale 1:1 • Metric ISO" : "Prep-Sys v2.4 • Academic"}
      </div>
    </div>
  );
}
