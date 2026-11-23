"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MEGA } from "@/lib/library/taxonomy-nav";
import { previewsForLabel } from "@/lib/library/mega-previews";
import { logoCandidates } from "@/lib/marketing/operator-logos";
import { cn } from "@/lib/utils";

const columns = [
  { label: "Categories", items: [...MEGA.categories] },
  { label: "Screens", items: [...MEGA.screens] },
  { label: "UI Elements", items: [...MEGA.uiElements] },
  { label: "Flows", items: [...MEGA.flows] },
] as const;

type HoverState = {
  label: string;
  x: number;
  y: number;
  brands: { name: string; domain: string }[];
};

/**
 * Taxonomy mega — brand mark sits on the hovered label (library-style),
 * not off to the side.
 */
export function CategoryBrandHover() {
  const [hover, setHover] = useState<HoverState | null>(null);
  const [brandIdx, setBrandIdx] = useState(0);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hover || hover.brands.length < 2) return;
    const id = window.setInterval(() => {
      setBrandIdx((i) => (i + 1) % hover.brands.length);
    }, 850);
    return () => window.clearInterval(id);
  }, [hover]);

  const show = useCallback((label: string, el: HTMLElement) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    const r = el.getBoundingClientRect();
    setBrandIdx(0);
    setHover({
      label,
      // Center on the pill — same as library mega-browse
      x: r.left + r.width * 0.55,
      y: r.top + r.height / 2,
      brands: previewsForLabel(label).map((p) => ({
        name: p.name,
        domain: p.domain,
      })),
    });
  }, []);

  const hide = useCallback(() => {
    leaveTimer.current = setTimeout(() => setHover(null), 90);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-neutral-950 text-white">
      <div className="grid grid-cols-2 gap-8 px-6 py-10 sm:gap-10 sm:px-10 sm:py-12 md:grid-cols-4">
        {columns.map((col) => (
          <div key={col.label}>
            <p className="mb-4 text-[12px] font-medium tracking-[0.08em] text-neutral-500 uppercase">
              {col.label}
            </p>
            <ul className="space-y-0.5" onMouseLeave={hide}>
              {col.items.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onMouseEnter={(e) => show(item, e.currentTarget)}
                    onFocus={(e) => show(item, e.currentTarget)}
                    className="w-full rounded-full px-3 py-2.5 text-left text-[16px] font-medium tracking-[-0.01em] text-neutral-400 transition-colors hover:bg-white/[0.07] hover:text-white sm:text-[17px]"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {hover && hover.brands.length > 0 && (
        <BrandFloat hover={hover} index={brandIdx} />
      )}
    </div>
  );
}

function BrandFloat({
  hover,
  index,
}: {
  hover: HoverState;
  index: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const brand = hover.brands[index % hover.brands.length]!;
  const candidates = logoCandidates(brand.domain, 128);
  const size = 72;

  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed z-[80] transition-[left,top] duration-150 ease-out"
      style={{
        left: hover.x,
        top: hover.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className={cn(
          "overflow-hidden rounded-[18px] bg-white shadow-[0_20px_60px_-12px_rgba(0,0,0,0.55)]",
          "ring-1 ring-black/10",
          "animate-in fade-in-0 zoom-in-95 duration-150",
        )}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`${brand.domain}-${index}`}
          src={candidates[0]}
          alt=""
          width={size}
          height={size}
          className="size-full object-contain p-3"
        />
      </div>
      <p className="mt-2 text-center text-[11px] font-medium text-white/85 drop-shadow">
        {brand.name}
      </p>
    </div>,
    document.body,
  );
}
