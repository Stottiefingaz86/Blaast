"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  videoSrc: string;
  durationMs: number;
  startMs: number;
  endMs: number;
  onChange: (next: { startMs: number; endMs: number }) => void;
  className?: string;
};

type DragKind = "start" | "end" | "playhead" | null;

const FALLBACK_DURATION_MS = 60_000;

function finiteMs(n: unknown, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v) || v < 0) return fallback;
  return v;
}

function fmt(ms: number) {
  const safe = finiteMs(ms, 0);
  const s = safe / 1000;
  const m = Math.floor(s / 60);
  const rem = s - m * 60;
  return `${m}:${rem.toFixed(1).padStart(4, "0")}`;
}

/** WebM from MediaRecorder often has duration = Infinity — probe real end. */
async function resolveDurationMs(
  v: HTMLVideoElement,
  seedMs: number,
): Promise<number> {
  const known = v.duration;
  if (Number.isFinite(known) && known > 0) {
    return Math.max(1000, Math.round(known * 1000));
  }

  if (v.seekable && v.seekable.length > 0) {
    const end = v.seekable.end(v.seekable.length - 1);
    if (Number.isFinite(end) && end > 0) {
      return Math.max(1000, Math.round(end * 1000));
    }
  }

  const probed = await new Promise<number>((resolve) => {
    let settled = false;
    const done = (sec: number) => {
      if (settled) return;
      settled = true;
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("error", onErr);
      window.clearTimeout(timer);
      resolve(sec);
    };
    const onSeeked = () => {
      const t = v.currentTime;
      done(Number.isFinite(t) && t > 0 ? t : 0);
    };
    const onErr = () => done(0);
    const timer = window.setTimeout(() => done(0), 2500);
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("error", onErr);
    try {
      v.currentTime = 1e101;
    } catch {
      done(0);
    }
  });

  if (probed > 0) return Math.max(1000, Math.round(probed * 1000));
  return Math.max(1000, finiteMs(seedMs, FALLBACK_DURATION_MS));
}

/**
 * Instagram-style trim: drag In/Out handles. Always uses finite ms — WebM Infinity never reaches UI/save.
 */
export function VideoTrimEditor({
  videoSrc,
  durationMs,
  startMs,
  endMs,
  onChange,
  className,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const seed = Math.max(
    1000,
    finiteMs(durationMs, 0) || FALLBACK_DURATION_MS,
    finiteMs(endMs, 0),
    finiteMs(startMs, 0) + 1000,
  );

  const [duration, setDuration] = useState(seed);
  const [playhead, setPlayhead] = useState(finiteMs(startMs, 0));
  const [dragging, setDragging] = useState<DragKind>(null);
  const [ready, setReady] = useState(false);

  const clamp = useCallback(
    (ms: number) =>
      Math.max(0, Math.min(finiteMs(duration, seed), finiteMs(ms, 0))),
    [duration, seed],
  );

  // Sanitize parent values whenever they go non-finite
  useEffect(() => {
    const s = finiteMs(startMs, 0);
    const e = finiteMs(endMs, 0);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || e <= s) {
      const nextEnd = Math.max(s + 200, Math.min(duration, seed));
      onChangeRef.current({
        startMs: Math.min(s, nextEnd - 200),
        endMs: nextEnd,
      });
    }
  }, [startMs, endMs, duration, seed]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let cancelled = false;

    const boot = async () => {
      const d = await resolveDurationMs(v, seed);
      if (cancelled) return;
      const safe = finiteMs(d, seed);
      setDuration(safe);

      const s = Math.min(finiteMs(startMs, 0), safe - 200);
      const eRaw = finiteMs(endMs, 0);
      const e =
        eRaw > s && eRaw <= safe ? eRaw : Math.min(safe, Math.max(s + 2000, s + 200));
      if (s !== startMs || e !== endMs) {
        onChangeRef.current({ startMs: Math.max(0, s), endMs: e });
      }

      setReady(true);
      try {
        v.currentTime = Math.max(0, s) / 1000;
      } catch {
        /* ignore */
      }
    };

    if (v.readyState >= 1) void boot();
    else {
      const onMeta = () => void boot();
      v.addEventListener("loadedmetadata", onMeta, { once: true });
      return () => {
        cancelled = true;
        v.removeEventListener("loadedmetadata", onMeta);
      };
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoSrc, seed]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () =>
      setPlayhead(Math.round(finiteMs(v.currentTime * 1000, 0)));
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, []);

  const msFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const t = (clientX - rect.left) / Math.max(rect.width, 1);
      return clamp(Math.round(t * finiteMs(duration, seed)));
    },
    [clamp, duration, seed],
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const ms = msFromClientX(e.clientX);
      const s0 = finiteMs(startMs, 0);
      const e0 = finiteMs(endMs, duration);
      if (dragging === "start") {
        const next = Math.min(ms, e0 - 200);
        onChangeRef.current({ startMs: next, endMs: e0 });
        const v = videoRef.current;
        if (v) {
          try {
            v.currentTime = next / 1000;
          } catch {
            /* ignore */
          }
        }
      } else if (dragging === "end") {
        const next = Math.max(ms, s0 + 200);
        onChangeRef.current({ startMs: s0, endMs: next });
        const v = videoRef.current;
        if (v) {
          try {
            v.currentTime = next / 1000;
          } catch {
            /* ignore */
          }
        }
      } else if (dragging === "playhead") {
        const v = videoRef.current;
        if (v) {
          try {
            v.currentTime = ms / 1000;
          } catch {
            /* ignore */
          }
        }
        setPlayhead(ms);
      }
    };
    const onUp = () => setDragging(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, endMs, startMs, msFromClientX, duration]);

  const dur = finiteMs(duration, seed);
  const safeStart = clamp(finiteMs(startMs, 0));
  const safeEnd = clamp(Math.max(safeStart + 200, finiteMs(endMs, dur)));
  const startPct = (safeStart / dur) * 100;
  const endPct = (safeEnd / dur) * 100;
  const playPct = (clamp(playhead) / dur) * 100;

  function preview() {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.currentTime = safeStart / 1000;
    } catch {
      /* ignore */
    }
    void v.play().catch(() => undefined);
    const stop = safeEnd / 1000;
    const onTime = () => {
      if (v.currentTime >= stop) {
        v.pause();
        v.removeEventListener("timeupdate", onTime);
      }
    };
    v.addEventListener("timeupdate", onTime);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          muted
          preload="auto"
          className="aspect-video w-full object-contain"
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            if (v.paused) void v.play().catch(() => undefined);
            else v.pause();
          }}
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-[12px] text-white/40">
            Loading…
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-white/50">
        <span>
          In {fmt(safeStart)} · Out {fmt(safeEnd)} ·{" "}
          {((safeEnd - safeStart) / 1000).toFixed(1)}s
        </span>
        <button
          type="button"
          onClick={preview}
          className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white hover:bg-white/15"
        >
          Preview selection
        </button>
      </div>

      <div
        ref={trackRef}
        className="relative h-14 touch-none select-none rounded-lg bg-white/[0.08]"
        onPointerDown={(e) => {
          if (e.target !== e.currentTarget) return;
          setDragging("playhead");
          const ms = msFromClientX(e.clientX);
          const v = videoRef.current;
          if (v) {
            try {
              v.currentTime = ms / 1000;
            } catch {
              /* ignore */
            }
          }
        }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 bg-black/55"
          style={{ width: `${startPct}%` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 bg-black/55"
          style={{ width: `${100 - endPct}%` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 rounded-md border-2 border-white"
          style={{
            left: `${startPct}%`,
            width: `${Math.max(endPct - startPct, 0.5)}%`,
          }}
        />
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-yellow-400"
          style={{ left: `${playPct}%` }}
        />
        <button
          type="button"
          aria-label="Drag start"
          className="absolute top-0 bottom-0 z-10 w-4 -translate-x-1/2 cursor-ew-resize touch-none"
          style={{ left: `${startPct}%` }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            setDragging("start");
          }}
        >
          <span className="absolute inset-y-1 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-white shadow" />
        </button>
        <button
          type="button"
          aria-label="Drag end"
          className="absolute top-0 bottom-0 z-10 w-4 -translate-x-1/2 cursor-ew-resize touch-none"
          style={{ left: `${endPct}%` }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            setDragging("end");
          }}
        >
          <span className="absolute inset-y-1 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-white shadow" />
        </button>
      </div>

      <p className="text-[11px] text-white/40">
        Drag the white handles to set start and end — like Instagram.
      </p>
    </div>
  );
}
