"use client";

import { useEffect, useState } from "react";
import {
  OPERATOR_LOGOS,
  type OperatorLogo,
} from "@/lib/marketing/operator-logos";
import { shuffle } from "@/lib/marketing/shuffle";
import { OperatorMark } from "@/components/marketing/operator-mark";
import { cn } from "@/lib/utils";

/** Three distinct random operators from the full ~100 pool. */
function pickThree(exclude: string[] = []): [OperatorLogo, OperatorLogo, OperatorLogo] {
  const pool = OPERATOR_LOGOS.filter((o) => !exclude.includes(o.id));
  const source = pool.length >= 3 ? pool : OPERATOR_LOGOS;
  const shuffled = shuffle(source);
  return [shuffled[0]!, shuffled[1]!, shuffled[2]!];
}

/**
 * Fixed tagline + inline floating operator bubbles.
 * Text never changes; marks randomly cycle across all operators.
 */
export function AnimatedHeadline({ className }: { className?: string }) {
  // Stable SSR seed — shuffle only after mount so hydration matches
  const [ops, setOps] = useState<[OperatorLogo, OperatorLogo, OperatorLogo]>(
    () => [OPERATOR_LOGOS[0]!, OPERATOR_LOGOS[1]!, OPERATOR_LOGOS[2]!],
  );
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    setOps(pickThree());
    const id = window.setInterval(() => {
      setPhase("out");
      window.setTimeout(() => {
        setOps((prev) => pickThree(prev.map((o) => o.id)));
        setPhase("in");
      }, 240);
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  const [a, b, c] = ops;

  return (
    <h1
      className={cn(
        "mx-auto max-w-[15ch] text-[3.25rem] leading-[1.05] font-bold tracking-[-0.048em] text-neutral-950 sm:max-w-[20ch] sm:text-[5rem] sm:leading-[1.02]",
        className,
      )}
    >
      The
      <LogoBubble op={a} phase={phase} />
      sportsbook and casino
      <LogoBubble op={b} phase={phase} />
      design
      <LogoBubble op={c} phase={phase} />
      library.
    </h1>
  );
}

function LogoBubble({
  op,
  phase,
}: {
  op: OperatorLogo;
  phase: "in" | "out";
}) {
  return (
    <span
      className={cn(
        "group/bubble relative mx-[0.14em] inline-flex h-[0.92em] w-[0.92em] translate-y-[0.08em] align-[-0.12em]",
        phase === "in" ? "logo-bubble-enter" : "logo-bubble-exit",
      )}
    >
      <span className="logo-bubble relative flex size-full items-center justify-center overflow-visible">
        <span className="absolute inset-0 overflow-hidden rounded-[24%] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.1] transition-shadow duration-300 group-hover/bubble:shadow-[0_12px_36px_rgba(0,0,0,0.22)]">
          <OperatorMark op={op} />
        </span>
        <span className="logo-bubble-pulse pointer-events-none absolute inset-[-18%] rounded-[28%] opacity-0 ring-2 ring-neutral-900/10" />
      </span>
      <span
        className="pointer-events-none absolute top-[calc(100%+0.4em)] left-1/2 z-20 -translate-x-1/2 scale-95 whitespace-nowrap rounded-full bg-neutral-950 px-2.5 py-1 text-[11px] font-semibold tracking-normal text-white opacity-0 shadow-lg transition-all duration-200 group-hover/bubble:scale-100 group-hover/bubble:opacity-100"
        aria-hidden
      >
        {op.alt}
      </span>
    </span>
  );
}
