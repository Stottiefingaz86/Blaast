"use client";

import { BlaastMark } from "@/components/brand/blaast-mark";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Full-viewport branded boot screen (auth gate, first paint, route transitions). */
export function BlaastPreloader({
  tone = "dark",
  label = "Loading",
  className,
}: {
  tone?: "dark" | "light";
  label?: string;
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-5",
        dark ? "bg-[#0a0a0a] text-white" : "bg-[#f5f5f5] text-neutral-950",
        className,
      )}
    >
      <div className="relative flex flex-col items-center gap-4">
        <div
          className={cn(
            "absolute inset-[-18px] rounded-full blur-2xl",
            dark ? "bg-white/5" : "bg-black/5",
          )}
        />
        <BlaastMark
          tone={dark ? "onDark" : "onLight"}
          className="relative h-9 w-auto animate-pulse"
        />
        <div
          className={cn(
            "relative h-0.5 w-16 overflow-hidden rounded-full",
            dark ? "bg-white/10" : "bg-black/10",
          )}
        >
          <div
            className={cn(
              "h-full w-1/2 animate-[blaast-indeterminate_1.1s_ease-in-out_infinite] rounded-full",
              dark ? "bg-white/70" : "bg-neutral-800",
            )}
          />
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Library / discover grid placeholder while catalogue hydrates. */
export function LibrarySkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("min-h-screen bg-[#0a0a0a] px-4 pb-16 pt-20 sm:px-6", className)}
      aria-busy
      aria-label="Loading library"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-48 bg-white/10" />
          <Skeleton className="h-4 w-80 max-w-full bg-white/5" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full bg-white/8" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-[9/16] w-full rounded-2xl bg-white/8" />
              <Skeleton className="h-3 w-2/3 bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Admin desk placeholder. */
export function AdminSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("mx-auto flex max-w-5xl flex-col gap-4 p-6", className)}
      aria-busy
      aria-label="Loading admin"
    >
      <Skeleton className="h-8 w-56 bg-neutral-200" />
      <Skeleton className="h-24 w-full rounded-[20px] bg-neutral-100" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-40 rounded-[20px] bg-neutral-100" />
        <Skeleton className="h-40 rounded-[20px] bg-neutral-100" />
      </div>
      <Skeleton className="h-64 w-full rounded-[20px] bg-neutral-100" />
    </div>
  );
}
