import { useEffect, useState } from "react";

interface MechanicalCadComponentProps {
  mouseX: number;
  mouseY: number;
  isHovered: boolean;
}

/** Animated gear assembly used in the SolidWorks auth drafting canvas. */
export function MechanicalCadComponent({ mouseX, mouseY, isHovered }: MechanicalCadComponentProps) {
  const [rotation, setRotation] = useState(0);
  const tiltX = isHovered ? Math.max(-12, Math.min(12, (mouseY - 260) / 18)) : 0;
  const tiltY = isHovered ? Math.max(-12, Math.min(12, (260 - mouseX) / 18)) : 0;

  useEffect(() => {
    const speed = isHovered ? 0.8 : 0.25;
    let animationFrame = 0;

    const animate = () => {
      setRotation((previous) => (previous + speed) % 360);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isHovered]);

  return (
    <div className="pointer-events-none absolute left-1/2 top-[28%] size-[340px]">
      <div
        className="size-full transition-transform duration-200 ease-out"
        style={{
          transform: `translate(-50%, -50%) perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        }}
      >
        <svg viewBox="0 0 340 340" className="size-full overflow-visible">
          <circle cx="170" cy="170" r="110" className="fill-primary/[0.08] blur-xl" />

          <g
            transform={`rotate(${rotation} 160 160)`}
            className="stroke-primary text-primary transition-colors duration-300"
            strokeWidth="1.2"
            fill="none"
          >
            <circle cx="160" cy="160" r="76" strokeDasharray="3 3" className="stroke-primary/40" />
            <circle cx="160" cy="160" r="84" />
            <circle cx="160" cy="160" r="66" />
            {Array.from({ length: 12 }).map((_, index) => (
              <rect
                key={index}
                x="153"
                y="68"
                width="14"
                height="16"
                rx="2"
                transform={`rotate(${index * 30} 160 160)`}
                className="fill-primary/10 stroke-primary"
              />
            ))}
            {Array.from({ length: 4 }).map((_, index) => (
              <circle
                key={index}
                cx="160"
                cy="122"
                r="14"
                transform={`rotate(${index * 90} 160 160)`}
                className="fill-black/40 stroke-primary/70"
              />
            ))}
            <circle cx="160" cy="160" r="22" className="fill-black stroke-primary" strokeWidth="1.5" />
            <rect x="156" y="136" width="8" height="6" className="fill-primary" />
          </g>

          <g
            transform={`rotate(${-rotation * 2} 248 88)`}
            className="stroke-primary text-primary"
            strokeWidth="1.2"
            fill="none"
          >
            <circle cx="248" cy="88" r="34" strokeDasharray="2 2" className="stroke-primary/40" />
            <circle cx="248" cy="88" r="38" />
            <circle cx="248" cy="88" r="28" />
            {Array.from({ length: 8 }).map((_, index) => (
              <rect
                key={index}
                x="243"
                y="46"
                width="10"
                height="8"
                rx="1.5"
                transform={`rotate(${index * 45} 248 88)`}
                className="fill-primary/10 stroke-primary"
              />
            ))}
            <circle cx="248" cy="88" r="10" className="fill-black stroke-primary" />
          </g>

          <g className="fill-primary/80 font-mono text-[9px] stroke-primary/50" strokeWidth="0.8">
            <path d="M 76 160 L 40 160 L 30 148" fill="none" />
            <circle cx="76" cy="160" r="2" className="fill-primary" />
            <text x="24" y="142" textAnchor="end" className="fill-white/80">
              Ø 168.00 mm
            </text>
            <text x="24" y="152" textAnchor="end" className="fill-white/40 text-[7px]">
              TOL ±0.02
            </text>

            <path d="M 248 88 L 290 88 L 305 76" fill="none" />
            <circle cx="248" cy="88" r="2" className="fill-primary" />
            <text x="312" y="74" className="fill-white/80">
              PINION: 8T
            </text>
            <text x="312" y="84" className="fill-white/40 text-[7px]">
              RATIO 1:2.4
            </text>

            <path d="M 160 160 L 195 210 L 225 210" fill="none" />
            <circle cx="160" cy="160" r="2" className="fill-primary" />
            <text x="230" y="213" className="fill-white/80">
              BORE 22 H7
            </text>

            <line x1="160" y1="50" x2="160" y2="270" strokeDasharray="3 3" className="stroke-white/15" />
            <line x1="50" y1="160" x2="270" y2="160" strokeDasharray="3 3" className="stroke-white/15" />
          </g>

          <g transform="translate(24, 300)" strokeWidth="1.5">
            <line x1="0" y1="0" x2="22" y2="0" stroke="#e5484d" />
            <text x="26" y="3" fill="#e5484d" className="font-mono text-[8px] font-bold">
              X
            </text>
            <line x1="0" y1="0" x2="0" y2="-22" stroke="#16a34a" />
            <text x="-3" y="-26" fill="#16a34a" className="font-mono text-[8px] font-bold">
              Y
            </text>
            <line x1="0" y1="0" x2="-14" y2="14" stroke="#3b82f6" />
            <text x="-24" y="20" fill="#3b82f6" className="font-mono text-[8px] font-bold">
              Z
            </text>
            <circle cx="0" cy="0" r="2" fill="white" />
          </g>
        </svg>
      </div>
    </div>
  );
}
