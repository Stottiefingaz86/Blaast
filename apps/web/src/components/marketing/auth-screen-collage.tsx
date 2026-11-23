"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Cover = {
  label: string;
  posterUrl?: string;
  videoUrl?: string;
  operatorName?: string;
};

const COLUMN_COUNT = 7;
/** Phones per column before looping — keeps every column equally dense. */
const PHONES_PER_COLUMN = 5;
/** Two copies = seamless CSS translateY(±50%) marquee. */
const LOOP_COPIES = 2;

/** Durations (s) — slower, staggered. */
const COLUMN_SPEEDS = [90, 110, 98, 120, 104, 115, 108] as const;

/** Mobbin-style dense diagonal wall of phone screens (unique captures). */
export function AuthScreenCollage({
  mode = "login",
}: {
  mode?: "login" | "signup";
}) {
  const [covers, setCovers] = useState<Cover[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/library/covers?mode=${mode}&limit=40`)
      .then((r) => r.json())
      .then((data: { covers?: Cover[] }) => {
        if (cancelled) return;
        const seen = new Set<string>();
        const unique: Cover[] = [];
        for (const c of data.covers ?? []) {
          if (!c.posterUrl && !c.videoUrl) continue;
          const key = `${(c.videoUrl ?? "").split("?")[0]}|${(c.posterUrl ?? "").split("?")[0]}`;
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push(c);
        }
        setCovers(unique);
      })
      .catch(() => {
        if (!cancelled) setCovers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const pool = useMemo(() => {
    if (!covers.length) {
      return Array.from({ length: COLUMN_COUNT * PHONES_PER_COLUMN }, () => ({
        label: "Capture",
      })) as Cover[];
    }
    return covers;
  }, [covers]);

  /** Equal-length columns — pad by cycling the pool so last columns never look empty. */
  const columns = useMemo(() => {
    const cols: Cover[][] = Array.from({ length: COLUMN_COUNT }, () => []);
    const need = COLUMN_COUNT * PHONES_PER_COLUMN;
    for (let i = 0; i < need; i++) {
      cols[i % COLUMN_COUNT]!.push(pool[i % pool.length]!);
    }
    return cols;
  }, [pool]);

  const columnOffset = [
    "mt-0",
    "mt-10",
    "mt-4",
    "mt-14",
    "mt-6",
    "mt-12",
    "mt-2",
  ];

  return (
    <div className="relative hidden h-full min-h-screen overflow-hidden bg-[#1a1a1a] lg:block">
      <div
        className="absolute top-1/2 left-[48%] flex h-[200%] w-max origin-center -translate-x-1/2 -translate-y-[46%] rotate-[-28deg] gap-3"
        aria-hidden
      >
        {columns.map((colPhones, col) => {
          const up = col % 2 === 0;
          const duration = COLUMN_SPEEDS[col] ?? 100;
          const loop = Array.from({ length: LOOP_COPIES }, () => colPhones).flat();
          return (
            <div
              key={col}
              className={cn(
                "flex shrink-0 flex-col",
                columnOffset[col],
              )}
            >
              <div
                className={cn(
                  "flex flex-col gap-3 will-change-transform",
                  up ? "auth-phone-marquee-up" : "auth-phone-marquee-down",
                )}
                style={{ animationDuration: `${duration}s` }}
              >
                {loop.map((cover, loopIdx) => (
                  <PhoneFrame
                    key={`${col}-${loopIdx}-${cover.label}`}
                    cover={cover}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhoneFrame({ cover }: { cover: Cover }) {
  // Posters only — dozens of autoplaying WebMs starved localhost / login.
  return (
    <div className="relative h-[280px] w-[140px] shrink-0 overflow-hidden rounded-[22px] bg-[#2a2a2a] ring-1 ring-white/12">
      <div className="absolute top-2 left-1/2 z-10 h-3.5 w-14 -translate-x-1/2 rounded-full bg-black/70" />
      {cover.posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover.posterUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover object-top"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      )}
    </div>
  );
}
