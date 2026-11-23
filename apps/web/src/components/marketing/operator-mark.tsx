"use client";

import { useEffect, useState } from "react";
import {
  logoCandidates,
  type OperatorLogo,
} from "@/lib/marketing/operator-logos";
import { cn } from "@/lib/utils";

/**
 * Operator mark for bubbles / marquee.
 * Tries local → Brandfetch → Google favicon → lettermark (never a blank hole).
 */
export function OperatorMark({
  op,
  className,
  imgClassName,
}: {
  op: OperatorLogo;
  className?: string;
  imgClassName?: string;
}) {
  const candidates = logoCandidates(op, 256);
  const [idx, setIdx] = useState(0);
  const letter =
    op.alt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "?";
  const src = candidates[idx];
  const isTile = Boolean(src?.startsWith("/operators/") && src.endsWith(".svg"));

  useEffect(() => {
    setIdx(0);
  }, [op.id]);

  return (
    <span
      className={cn(
        "relative flex size-full items-center justify-center overflow-hidden",
        isTile ? "bg-transparent" : "bg-white",
        className,
      )}
    >
      {!src ? (
        <span
          className="flex size-full items-center justify-center font-bold text-white"
          style={{
            backgroundColor: op.color === "#FFFFFF" ? "#111111" : op.color,
            fontSize: letter.length > 1 ? "0.36em" : "0.45em",
          }}
        >
          {letter}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${op.id}-${idx}`}
          src={src}
          alt=""
          width={128}
          height={128}
          className={cn(
            "relative z-[1]",
            isTile ? "size-full object-cover" : "size-[82%] object-contain",
            imgClassName,
          )}
          onError={() => {
            setIdx((i) => (i + 1 < candidates.length ? i + 1 : candidates.length));
          }}
        />
      )}
    </span>
  );
}
