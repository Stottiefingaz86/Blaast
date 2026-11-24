"use client";

import { useState } from "react";
import { logoCandidates } from "@/lib/marketing/operator-logos";
import { cn } from "@/lib/utils";

type Props = {
  domain: string;
  name?: string;
  size?: number;
  className?: string;
  /** Brand accent behind the mark */
  color?: string;
};

/** Admin brand mark with local → favicon → Brandfetch fallbacks. */
export function BrandLogo({
  domain,
  name,
  size = 40,
  className,
  color,
}: Props) {
  const candidates = logoCandidates(domain, Math.max(size * 2, 64));
  const [idx, setIdx] = useState(0);
  const src = candidates[Math.min(idx, candidates.length - 1)];
  const letter = (name || domain).trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/[0.06] bg-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: color ? `${color}18` : undefined,
      }}
      title={name || domain}
    >
      {src && idx < candidates.length ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="size-full object-contain p-[18%]"
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        <span
          className="text-[13px] font-semibold"
          style={{ color: color || "#525252" }}
        >
          {letter}
        </span>
      )}
    </span>
  );
}
