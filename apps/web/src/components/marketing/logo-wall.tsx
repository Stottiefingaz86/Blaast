"use client";

import { OPERATOR_LOGOS } from "@/lib/marketing/operator-logos";
import { OperatorMark } from "@/components/marketing/operator-mark";
import { cn } from "@/lib/utils";

/** Two-row infinite marquee of operator marks. */
export function LogoWall({ className }: { className?: string }) {
  const mid = Math.ceil(OPERATOR_LOGOS.length / 2);
  const rowA = OPERATOR_LOGOS.slice(0, mid);
  const rowB = OPERATOR_LOGOS.slice(mid);

  return (
    <div className={cn("relative w-full space-y-3.5", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent sm:w-24" />
      <MarqueeRow logos={rowA} duration={55} />
      <MarqueeRow logos={rowB} duration={65} reverse />
    </div>
  );
}

function MarqueeRow({
  logos,
  duration,
  reverse,
}: {
  logos: typeof OPERATOR_LOGOS;
  duration: number;
  reverse?: boolean;
}) {
  const track = [...logos, ...logos];

  return (
    <div className="logo-marquee overflow-hidden py-1.5">
      <div
        className={cn(
          "logo-marquee-track flex w-max items-center gap-3.5",
          reverse && "logo-marquee-track-reverse",
        )}
        style={{ animationDuration: `${duration}s` }}
      >
        {track.map((op, i) => (
          <span
            key={`${op.id}-${i}`}
            className="group/wall relative flex size-12 shrink-0 items-center justify-center overflow-visible sm:size-[3.25rem]"
          >
            <span className="absolute inset-0 overflow-hidden rounded-[14px] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.08] transition-shadow group-hover/wall:shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <OperatorMark op={op} />
            </span>
            <span className="pointer-events-none absolute top-[calc(100%+8px)] left-1/2 z-20 -translate-x-1/2 scale-95 whitespace-nowrap rounded-full bg-neutral-950 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-md transition-all duration-200 group-hover/wall:scale-100 group-hover/wall:opacity-100">
              {op.alt}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
