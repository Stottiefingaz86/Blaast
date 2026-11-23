"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause } from "lucide-react";
import type { CatalogOperator } from "@/lib/library/catalog";
import { resolveFocusHero } from "@/lib/library/focus-media";
import { cn } from "@/lib/utils";

/** Poster by default; video only on hover (keeps library snappy). */
export function PreviewCard({
  operator,
  focusChip,
}: {
  operator: CatalogOperator;
  /** Library filter (Home, Onboarding, …) — drives cover media */
  focusChip?: string | null;
}) {
  const isMobile = operator.platform === "mobile";
  const [hover, setHover] = useState(false);
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hero = useMemo(
    () => resolveFocusHero(operator, focusChip),
    [operator, focusChip],
  );
  const startSec = (hero.clipWindow?.startMs ?? 0) / 1000;
  const endSec =
    hero.clipWindow?.endMs != null
      ? hero.clipWindow.endMs / 1000
      : startSec + 4;
  const playing = hover && Boolean(hero.videoUrl);

  useEffect(() => {
    if (!playing) {
      setReady(false);
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    const seek = () => {
      try {
        v.currentTime = startSec;
      } catch {
        /* ignore */
      }
    };
    const onMeta = () => {
      seek();
    };
    const onSeeked = () => setReady(true);
    if (v.readyState >= 1) onMeta();
    else v.addEventListener("loadedmetadata", onMeta, { once: true });
    v.addEventListener("seeked", onSeeked);
    void v.play().catch(() => undefined);
    const onTime = () => {
      if (v.currentTime >= endSec) {
        v.pause();
        try {
          v.currentTime = startSec;
        } catch {
          /* ignore */
        }
      }
    };
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("timeupdate", onTime);
      v.pause();
    };
  }, [playing, startSec, endSec, hero.videoUrl]);

  return (
    <Link
      href={`/operators/${operator.slug}`}
      className="group flex flex-col gap-3 outline-none"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className={cn(
          "lib-card relative overflow-hidden rounded-[28px] transition-[background] duration-300",
          "p-5 sm:p-7",
        )}
      >
        {operator.badge && (
          <span className="absolute top-4 left-4 z-10 rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[10px] font-medium text-[#d4d4d4] backdrop-blur-sm">
            {operator.badge}
          </span>
        )}
        {hero.label && focusChip && (
          <span className="absolute bottom-4 left-4 z-10 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {hero.label}
          </span>
        )}
        {playing && (
          <span className="absolute top-4 right-4 z-10 flex size-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">
            <Pause className="size-3.5" fill="currentColor" strokeWidth={0} />
          </span>
        )}
        <div
          className={cn(
            "relative mx-auto overflow-hidden bg-[#1a1a1a] transition-transform duration-500",
            isMobile
              ? "aspect-[9/19] w-full max-w-[210px] rounded-[26px] shadow-[0_16px_48px_-20px_rgba(0,0,0,0.55)]"
              : "aspect-[16/10] w-full rounded-[18px] shadow-[0_16px_48px_-24px_rgba(0,0,0,0.5)]",
            playing && "scale-[1.015]",
          )}
        >
          {hero.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.posterUrl}
              alt=""
              className={cn(
                "absolute inset-0 size-full object-cover object-top",
                playing && ready && "opacity-0",
              )}
            />
          ) : operator.logoUrl ? (
            <div className="flex size-full items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={operator.logoUrl}
                alt=""
                className="size-16 rounded-2xl object-contain"
              />
            </div>
          ) : null}
          {playing && hero.videoUrl && (
            <video
              key={hero.videoUrl}
              ref={videoRef}
              src={hero.videoUrl}
              muted
              playsInline
              preload="metadata"
              poster={hero.posterUrl}
              className={cn(
                "absolute inset-0 size-full object-cover object-top",
                ready ? "opacity-100" : "opacity-0",
              )}
            />
          )}
        </div>
      </div>
      <div className="flex items-start gap-2.5 px-1">
        {operator.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={operator.logoUrl}
            alt=""
            className="mt-0.5 size-7 shrink-0 rounded-full bg-white object-contain p-0.5"
          />
        ) : (
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white">
            {operator.name.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-[#f5f5f5]">
            {operator.name}
          </p>
          <p className="lib-muted mt-0.5 truncate text-[12px] leading-snug">
            {focusChip && hero.label
              ? `${hero.label} · ${operator.tagline}`
              : operator.tagline}
          </p>
        </div>
      </div>
    </Link>
  );
}
