"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

/** Cap concurrent videos so the wall stays smooth. */
let activeVideos = 0;
const MAX_ACTIVE_VIDEOS = 10;

/** Dense diagonal wall of phone screens — posters + in-view looping video. */
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
              className={cn("flex shrink-0 flex-col", columnOffset[col])}
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
                    key={`${col}-${loopIdx}-${cover.videoUrl ?? cover.posterUrl ?? cover.label}`}
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
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const heldSlot = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio > 0.15),
      { root: null, rootMargin: "40px 0px", threshold: [0, 0.15, 0.4] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!cover.videoUrl) {
      setPlaying(false);
      return;
    }
    if (inView) {
      if (!heldSlot.current && activeVideos < MAX_ACTIVE_VIDEOS) {
        activeVideos += 1;
        heldSlot.current = true;
        setPlaying(true);
      } else if (heldSlot.current) {
        setPlaying(true);
      }
    } else {
      setPlaying(false);
      if (heldSlot.current) {
        activeVideos = Math.max(0, activeVideos - 1);
        heldSlot.current = false;
      }
    }
    return () => {
      if (heldSlot.current) {
        activeVideos = Math.max(0, activeVideos - 1);
        heldSlot.current = false;
      }
    };
  }, [inView, cover.videoUrl]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !playing || !cover.videoUrl) {
      setReady(false);
      return;
    }
    const onPlaying = () => setReady(true);
    const onWaiting = () => setReady(false);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("waiting", onWaiting);
    void v.play().catch(() => undefined);
    return () => {
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("waiting", onWaiting);
      v.pause();
      setReady(false);
    };
  }, [playing, cover.videoUrl]);

  return (
    <div
      ref={rootRef}
      className="relative h-[280px] w-[140px] shrink-0 overflow-hidden rounded-[22px] bg-[#2a2a2a] ring-1 ring-white/12"
    >
      <div className="absolute top-2 left-1/2 z-10 h-3.5 w-14 -translate-x-1/2 rounded-full bg-black/70" />
      {cover.posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover.posterUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className={cn(
            "absolute inset-0 size-full object-cover object-top transition-opacity duration-300",
            playing && ready ? "opacity-0" : "opacity-100",
          )}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      )}
      {playing && cover.videoUrl ? (
        <video
          ref={videoRef}
          src={cover.videoUrl}
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
          poster={cover.posterUrl}
          className={cn(
            "absolute inset-0 size-full object-cover object-top transition-opacity duration-300",
            ready ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
    </div>
  );
}
