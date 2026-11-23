"use client";

import { useEffect, useRef, useState } from "react";
import { OPERATOR_LOGOS } from "@/lib/marketing/operator-logos";
import { OperatorMark } from "@/components/marketing/operator-mark";
import { Skeleton } from "@/components/ui/skeleton";

type Cover = {
  label: string;
  posterUrl?: string;
  videoUrl?: string;
  operatorName?: string;
  operatorSlug?: string;
  mediaKey?: string;
};

/** Horizontal library preview — posters first; video only when card is visible. */
export function ProductPeekRail() {
  const [covers, setCovers] = useState<Cover[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/library/covers?mode=login&limit=12")
      .then((r) => r.json())
      .then((data: { covers?: Cover[] }) => {
        if (cancelled) return;
        const seen = new Set<string>();
        const unique: Cover[] = [];
        for (const c of data.covers ?? []) {
          if (!c.posterUrl && !c.videoUrl) continue;
          const key =
            c.mediaKey ||
            `${(c.videoUrl ?? "").split("?")[0]}|${(c.posterUrl ?? "").split("?")[0]}`;
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
  }, []);

  if (covers === null) {
    return (
      <div className="flex gap-3 overflow-x-auto px-5 pb-10 sm:px-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-[180px] shrink-0 overflow-hidden rounded-[22px] bg-[#1c1c1c] p-4"
          >
            <Skeleton className="aspect-[9/16] w-full rounded-2xl bg-white/10" />
            <Skeleton className="mt-3 h-4 w-24 bg-white/5" />
          </div>
        ))}
      </div>
    );
  }

  if (covers.length === 0) {
    return (
      <div className="flex gap-3 overflow-x-auto px-5 pb-10 sm:px-8">
        {OPERATOR_LOGOS.slice(0, 6).map((op, i) => (
          <div
            key={op.id}
            className="w-[180px] shrink-0 overflow-hidden rounded-[22px] bg-[#1c1c1c] p-4"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <div className="aspect-[9/16] rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent ring-1 ring-white/10" />
            <div className="mt-3 flex items-center gap-2">
              <span className="size-5 overflow-hidden rounded-md ring-1 ring-white/10">
                <OperatorMark op={op} />
              </span>
              <span className="truncate text-[11px] text-neutral-500">
                {op.alt}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto px-5 pb-10 sm:px-8">
      {covers.map((c, i) => {
        const op =
          OPERATOR_LOGOS.find(
            (o) =>
              o.alt.toLowerCase() === (c.operatorName ?? "").toLowerCase() ||
              (c.operatorSlug ?? "").includes(o.id.replace(/\./g, "-")),
          ) ??
          OPERATOR_LOGOS.find((o) => o.alt === "Rainbet") ??
          OPERATOR_LOGOS[0]!;
        return (
          <div
            key={c.mediaKey ?? `${c.label}-${i}`}
            className="w-[180px] shrink-0 overflow-hidden rounded-[22px] bg-[#1c1c1c] p-4"
          >
            <LazyPeekMedia cover={c} />
            <div className="mt-3 flex items-center gap-2">
              <span className="size-5 overflow-hidden rounded-md ring-1 ring-white/10">
                <OperatorMark op={op} />
              </span>
              <span className="truncate text-[11px] text-neutral-500">
                {c.operatorName ?? op.alt}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LazyPeekMedia({ cover }: { cover: Cover }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { rootMargin: "80px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-[#141414] ring-1 ring-white/10"
    >
      {cover.posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover.posterUrl}
          alt=""
          className="absolute inset-0 size-full object-cover object-top"
          loading="lazy"
        />
      ) : null}
      {inView && cover.videoUrl ? (
        <video
          src={cover.videoUrl}
          poster={cover.posterUrl}
          muted
          playsInline
          autoPlay
          loop
          preload="none"
          className="absolute inset-0 size-full object-cover object-top"
        />
      ) : null}
    </div>
  );
}
