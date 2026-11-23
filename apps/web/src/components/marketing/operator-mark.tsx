"use client";

import { useEffect, useState } from "react";
import { logoSrc, type OperatorLogo } from "@/lib/marketing/operator-logos";
import { cn } from "@/lib/utils";

/**
 * Operator mark for bubbles / marquee.
 * Local SVG tiles are full-bleed; remote icons use contain so they don't shrink.
 * On failure → brand-color lettermark (never a blank hole).
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
  const [failed, setFailed] = useState(false);
  const letter =
    op.alt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "?";
  const isTile = Boolean(op.localSrc?.endsWith(".svg"));

  useEffect(() => {
    setFailed(false);
  }, [op.id]);

  return (
    <span
      className={cn(
        "relative flex size-full items-center justify-center overflow-hidden",
        isTile ? "bg-transparent" : "bg-white",
        className,
      )}
    >
      {failed ? (
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
          key={op.id}
          src={logoSrc(op, 256)}
          alt=""
          width={128}
          height={128}
          className={cn(
            "relative z-[1]",
            isTile
              ? "size-full object-cover"
              : "size-[82%] object-contain",
            imgClassName,
          )}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
