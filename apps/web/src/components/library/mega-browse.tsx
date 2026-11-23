"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { MEGA } from "@/lib/library/taxonomy-nav";
import {
  previewsForLabel,
  type MegaPreview,
} from "@/lib/library/mega-previews";
import { logoCandidates } from "@/lib/marketing/operator-logos";
import { cn } from "@/lib/utils";

const columns = [
  { label: "Categories", items: MEGA.categories },
  { label: "Screens", items: MEGA.screens },
  { label: "UI Elements", items: MEGA.uiElements },
  { label: "Flows", items: MEGA.flows },
] as const;

type HoverState = {
  label: string;
  x: number;
  y: number;
  previews: MegaPreview[];
};

/**
 * Taxonomy mega — Mobbin-scale type (~17–18px) + floating brand preview on hover.
 * Mobbin uses custom M Saans; we use library DM Sans (--font-lib).
 */
export function MegaBrowse({
  active,
  onPick,
}: {
  active?: string | null;
  onPick?: (label: string) => void;
}) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hover || hover.previews.length < 2) return;
    const id = window.setInterval(() => {
      setPreviewIdx((i) => (i + 1) % hover.previews.length);
    }, 900);
    return () => window.clearInterval(id);
  }, [hover]);

  const showHover = useCallback((label: string, el: HTMLElement) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    const r = el.getBoundingClientRect();
    setPreviewIdx(0);
    setHover({
      label,
      x: r.left + r.width * 0.55,
      y: r.top + r.height / 2,
      previews: previewsForLabel(label),
    });
  }, []);

  const hideHover = useCallback(() => {
    leaveTimer.current = setTimeout(() => setHover(null), 80);
  }, []);

  return (
    <div className="lib-hairline relative z-20 w-full overflow-x-hidden border-b bg-[var(--lib-bg,#111)]">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-8 px-5 py-9 md:grid-cols-4 md:gap-10 md:py-10">
        {columns.map((col) => (
          <GlideColumn
            key={col.label}
            label={col.label}
            items={[...col.items]}
            active={active}
            onPick={onPick}
            onItemEnter={showHover}
            onItemLeave={hideHover}
          />
        ))}
      </div>
      {hover && <MegaHoverPreview hover={hover} index={previewIdx} />}
    </div>
  );
}

function GlideColumn({
  label,
  items,
  active,
  onPick,
  onItemEnter,
  onItemLeave,
}: {
  label: string;
  items: string[];
  active?: string | null;
  onPick?: (label: string) => void;
  onItemEnter: (label: string, el: HTMLElement) => void;
  onItemLeave: () => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [pill, setPill] = useState({ y: 0, h: 0, visible: false });

  const glideTo = useCallback((el: HTMLElement | null) => {
    const list = listRef.current;
    if (!list || !el) {
      setPill((p) => ({ ...p, visible: false }));
      return;
    }
    const listBox = list.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    setPill({
      y: box.top - listBox.top,
      h: box.height,
      visible: true,
    });
  }, []);

  return (
    <div>
      <p className="lib-faint mb-4 px-2.5 text-[13px] font-medium tracking-[0.02em]">
        {label}
      </p>
      <ul
        ref={listRef}
        className="relative"
        onMouseLeave={() => {
          setPill((p) => ({ ...p, visible: false }));
          onItemLeave();
        }}
      >
        <span
          aria-hidden
          className={cn(
            "lib-glide pointer-events-none absolute inset-x-0 rounded-full",
            "transition-[transform,height,opacity] duration-300",
            "ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
          )}
          style={{
            height: pill.h || 40,
            transform: `translate3d(0, ${pill.y}px, 0)`,
            opacity: pill.visible ? 1 : 0,
          }}
        />
        {items.map((item) => {
          const isActive = active === item;
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPick?.(item)}
                onMouseEnter={(e) => {
                  glideTo(e.currentTarget);
                  onItemEnter(item, e.currentTarget);
                }}
                onFocus={(e) => {
                  glideTo(e.currentTarget);
                  onItemEnter(item, e.currentTarget);
                }}
                className={cn(
                  "relative z-[1] w-full rounded-full px-2.5 py-2.5 text-left text-[17px] font-medium tracking-[-0.01em] md:text-[18px]",
                  "transition-colors duration-200",
                  isActive
                    ? "text-[#f5f5f5]"
                    : "text-[#bdbdbd] hover:text-[#f5f5f5]",
                )}
              >
                {item}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MegaFavicon({ domain, size }: { domain: string; size: number }) {
  const candidates = logoCandidates(domain, 128);
  const [idx, setIdx] = useState(0);
  const src = candidates[idx];
  if (!src) {
    return <div className="size-full bg-neutral-100" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={`${domain}-${idx}`}
      src={src}
      alt=""
      width={size}
      height={size}
      className="size-full object-contain p-3"
      onError={() =>
        setIdx((i) => (i + 1 < candidates.length ? i + 1 : candidates.length))
      }
    />
  );
}

function MegaHoverPreview({
  hover,
  index,
}: {
  hover: HoverState;
  index: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const preview = hover.previews[index % hover.previews.length]!;
  const size = 72;

  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed z-[120] transition-[left,top] duration-150 ease-out"
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
        <MegaFavicon domain={preview.domain} size={size} />
      </div>
      <p className="mt-2 text-center text-[11px] font-medium text-white/80 drop-shadow">
        {preview.name}
      </p>
    </div>,
    document.body,
  );
}
