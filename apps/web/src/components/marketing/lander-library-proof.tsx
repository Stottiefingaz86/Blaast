"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { OPERATOR_LOGOS } from "@/lib/marketing/operator-logos";
import { shuffle } from "@/lib/marketing/shuffle";
import { OperatorMark } from "@/components/marketing/operator-mark";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Cover = {
  label: string;
  posterUrl?: string;
  videoUrl?: string;
  operatorName?: string;
  operatorSlug?: string;
  platform?: "mobile" | "web";
  mediaKey?: string;
};

/**
 * High-end library proof — light Mobbin-style cards, dense grid.
 * Unique media only; same operator OK. Web stays landscape.
 */
export function LanderLibraryProof() {
  const [covers, setCovers] = useState<Cover[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/library/covers?mode=login&limit=24")
      .then((r) => r.json())
      .then((data: { covers?: Cover[] }) => {
        if (cancelled) return;
        const seen = new Set<string>();
        const unique: Cover[] = [];
        for (const c of shuffle(data.covers ?? [])) {
          if (!c.posterUrl && !c.videoUrl) continue;
          const mediaKey =
            c.mediaKey ||
            `${(c.videoUrl ?? "").split("?")[0]}|${(c.posterUrl ?? "").split("?")[0]}`;
          if (seen.has(mediaKey)) continue;
          seen.add(mediaKey);
          unique.push({ ...c, mediaKey, platform: c.platform ?? "web" });
          if (unique.length >= 12) break;
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

  return (
    <section className="relative">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="overflow-hidden rounded-[28px] bg-[#f0f0f2] sm:rounded-[36px]">
          <div className="flex flex-col gap-4 px-5 pt-8 pb-2 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:pt-12">
            <div>
              <p className="text-[13px] font-medium tracking-[0.12em] text-neutral-400 uppercase">
                Inside the library
              </p>
              <h2 className="mt-3 max-w-[16ch] text-[2rem] font-semibold tracking-[-0.03em] text-neutral-950 sm:text-[2.75rem] sm:leading-[1.05]">
                Real captures. Real operators. Ready to search.
              </h2>
            </div>
            <Link
              href="/library"
              className="inline-flex shrink-0 items-center gap-2 text-[15px] font-medium text-neutral-950"
            >
              Open library
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="px-4 pb-8 sm:px-8 sm:pb-12 lg:px-10">
            {covers === null ? (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="aspect-[16/11] w-full rounded-2xl bg-neutral-200/80"
                  />
                ))}
              </div>
            ) : covers.length === 0 ? (
              <p className="mt-10 pb-8 text-center text-[16px] text-neutral-500">
                Publish library captures to fill this preview.
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {covers.slice(0, 9).map((c, i) => (
                  <ProofTile key={c.mediaKey ?? `${c.label}-${i}`} cover={c} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofTile({ cover, index }: { cover: Cover; index: number }) {
  const op =
    OPERATOR_LOGOS.find(
      (o) =>
        o.alt.toLowerCase() === (cover.operatorName ?? "").toLowerCase() ||
        (cover.operatorSlug ?? "").includes(o.id.replace(/\./g, "-")),
    ) ?? OPERATOR_LOGOS[index % OPERATOR_LOGOS.length]!;
  const isMobile = cover.platform === "mobile";

  return (
    <div className="group">
      <div
        className={cn(
          "overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] transition-shadow duration-300 group-hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.18)]",
          isMobile && "flex justify-center bg-neutral-100 p-6 sm:p-8",
        )}
      >
        {isMobile ? (
          <div className="w-[42%] min-w-[110px] max-w-[150px] overflow-hidden rounded-[1.25rem] bg-neutral-950 ring-1 ring-black/10">
            <LazyMedia cover={cover} aspect="phone" />
          </div>
        ) : (
          <>
            <div className="flex h-8 items-center gap-1.5 border-b border-neutral-100 bg-neutral-50/80 px-3">
              <span className="size-2 rounded-full bg-neutral-300" />
              <span className="size-2 rounded-full bg-neutral-300" />
              <span className="size-2 rounded-full bg-neutral-300" />
            </div>
            <LazyMedia cover={cover} aspect="browser" />
          </>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2.5 px-0.5">
        <span className="size-6 overflow-hidden rounded-md ring-1 ring-black/10">
          <OperatorMark op={op} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-neutral-950">
            {cover.operatorName ?? op.alt}
          </p>
          <p className="truncate text-[13px] text-neutral-500">{cover.label}</p>
        </div>
      </div>
    </div>
  );
}

function LazyMedia({
  cover,
  aspect,
}: {
  cover: Cover;
  aspect: "browser" | "phone";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { rootMargin: "100px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={
        aspect === "phone"
          ? "relative aspect-[9/19] bg-neutral-900"
          : "relative aspect-[16/10] bg-neutral-100"
      }
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
