import { cn } from "@/lib/utils";

/** Compact buffering indicator for capture tiles (not a full-page preloader). */
export function MediaBusy({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]",
        className,
      )}
      aria-busy
      aria-label="Loading video"
    >
      <span className="relative flex size-10 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-white/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-white/85" />
        <span className="size-1.5 rounded-full bg-white/70" />
      </span>
    </div>
  );
}
