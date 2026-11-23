"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { toast } from "sonner";
import { Crosshair, Pause, Play, Tag } from "lucide-react";
import { CLIP_QUICK_TAGS } from "@/components/admin/clip-annotations";
import type {
  CaptureAnnotation,
  CaptureRegion,
  CaptureSession,
} from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type Props = {
  sessionId: string;
  coverageStepId: string;
  videoSrc: string;
  posterSrc?: string;
  durationMsHint?: number;
  annotations: CaptureAnnotation[];
  onSession: (session: CaptureSession) => void;
  tone?: "light" | "dark";
  className?: string;
  size?: "default" | "hero";
};

type DragState = {
  startX: number;
  startY: number;
  curX: number;
  curY: number;
};

/**
 * Scrub · click/drag a block on the frame · custom or quick tag.
 * Region % is stored so many similar blocks stay distinguishable.
 */
export function ClipVideoTagger({
  sessionId,
  coverageStepId,
  videoSrc,
  posterSrc,
  durationMsHint,
  annotations,
  onSession,
  tone = "light",
  className,
  size = "default",
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [atMs, setAtMs] = useState(0);
  const [paused, setPaused] = useState(true);
  const [durationMs, setDurationMs] = useState(
    finiteMs(durationMsHint) ?? 0,
  );
  const [comment, setComment] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingRegion, setPendingRegion] = useState<CaptureRegion | null>(
    null,
  );
  const [drag, setDrag] = useState<DragState | null>(null);
  const [markMode, setMarkMode] = useState(true);
  const dark = tone === "dark";
  const hero = size === "hero";

  const safeDuration =
    finiteMs(durationMs) ?? finiteMs(durationMsHint) ?? 0;

  const regionsAtTime = annotations.filter((a) => {
    if (!a.region) return false;
    if (a.atMs == null) return true;
    return Math.abs(a.atMs - atMs) < 800;
  });

  const timed = annotations
    .filter((a) => a.atMs != null && Number.isFinite(a.atMs))
    .sort((a, b) => (a.atMs ?? 0) - (b.atMs ?? 0));

  const syncTime = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setAtMs(Math.max(0, v.currentTime * 1000));
    setPaused(v.paused);
    const d = finiteMs(v.duration * 1000);
    if (d) setDurationMs(d);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    function resolveDuration() {
      const el = videoRef.current;
      if (!el) return;
      const d = finiteMs(el.duration * 1000);
      if (d) {
        setDurationMs(d);
        return;
      }
      if (finiteMs(durationMsHint)) setDurationMs(durationMsHint!);
      try {
        const onSeeked = () => {
          el.removeEventListener("seeked", onSeeked);
          const fixed = finiteMs(el.duration * 1000);
          if (fixed) setDurationMs(fixed);
          el.currentTime = 0;
        };
        el.addEventListener("seeked", onSeeked);
        el.currentTime = 1e101;
      } catch {
        /* ignore */
      }
    }
    if (v.readyState >= 1) resolveDuration();
    else v.addEventListener("loadedmetadata", resolveDuration, { once: true });
  }, [videoSrc, durationMsHint]);

  function seekTo(ms: number) {
    const v = videoRef.current;
    if (!v) return;
    const next = safeDuration ? Math.min(ms, safeDuration) : Math.max(0, ms);
    v.currentTime = next / 1000;
    setAtMs(next);
    v.pause();
    setPaused(true);
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPaused(false);
      setMarkMode(false);
    } else {
      v.pause();
      setPaused(true);
      setMarkMode(true);
      syncTime();
    }
  }

  function pctFromEvent(e: ReactPointerEvent | PointerEvent): {
    x: number;
    y: number;
  } | null {
    const box = frameRef.current?.getBoundingClientRect();
    if (!box || box.width < 1 || box.height < 1) return null;
    return {
      x: clamp(((e.clientX - box.left) / box.width) * 100, 0, 100),
      y: clamp(((e.clientY - box.top) / box.height) * 100, 0, 100),
    };
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!markMode || !paused) return;
    e.preventDefault();
    const p = pctFromEvent(e);
    if (!p) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ startX: p.x, startY: p.y, curX: p.x, curY: p.y });
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const p = pctFromEvent(e);
    if (!p) return;
    setDrag({ ...drag, curX: p.x, curY: p.y });
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const p = pctFromEvent(e) ?? { x: drag.curX, y: drag.curY };
    const region = normalizeDrag({ ...drag, curX: p.x, curY: p.y });
    setPendingRegion(region);
    setDrag(null);
    toast.message("Area marked — pick a tag or type your own");
  }

  const draftRegion = drag ? normalizeDrag(drag) : pendingRegion;

  async function addTag(input: {
    label: string;
    tag: string;
    comment?: string;
  }) {
    const v = videoRef.current;
    if (v && !v.paused) {
      v.pause();
      setPaused(true);
    }
    if (!pendingRegion && !drag) {
      toast.error("Click the block on the video first (drag to size the box)");
      setMarkMode(true);
      return;
    }
    const stamp = Math.round(v ? v.currentTime * 1000 : atMs);
    const region = pendingRegion ?? (drag ? normalizeDrag(drag) : undefined);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverageStepId,
          annotation: { ...input, atMs: stamp, region },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onSession(data.session);
      toast.success(
        `${input.label} @ ${formatTime(stamp)}${region ? " (area marked)" : ""}`,
      );
      setComment("");
      setCustomLabel("");
      setPendingRegion(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tag failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(annotationId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverageStepId,
          removeAnnotationId: annotationId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onSession(data.session);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  }

  function submitCustom() {
    const label = customLabel.trim();
    if (!label) {
      toast.error("Type a custom tag name");
      return;
    }
    void addTag({
      label,
      tag: label,
      comment: comment.trim() || undefined,
    });
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        ref={frameRef}
        className={cn(
          "relative overflow-hidden rounded-2xl touch-none",
          dark ? "bg-black" : "bg-neutral-950",
          markMode && paused ? "cursor-crosshair" : "cursor-pointer",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          className={cn(
            "pointer-events-none w-full bg-black object-contain",
            hero ? "max-h-[min(56vh,520px)]" : "max-h-[320px]",
          )}
          playsInline
          preload="metadata"
          onTimeUpdate={syncTime}
          onPause={syncTime}
          onPlay={() => setPaused(false)}
          onDurationChange={syncTime}
          onLoadedMetadata={syncTime}
        />

        {/* Saved regions near this time */}
        {regionsAtTime.map((a) => (
          <div
            key={a.id}
            className="pointer-events-none absolute rounded-md border-2 border-amber-400 bg-amber-400/20"
            style={regionStyle(a.region!)}
          >
            <span className="absolute -top-5 left-0 max-w-[140px] truncate rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-950">
              {a.label}
            </span>
          </div>
        ))}

        {/* Pending / dragging box */}
        {draftRegion && (
          <div
            className="pointer-events-none absolute rounded-md border-2 border-sky-400 bg-sky-400/25"
            style={regionStyle(draftRegion)}
          >
            <span className="absolute -top-5 left-0 rounded bg-sky-400 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-950">
              New mark
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur",
              markMode && paused
                ? "bg-sky-400 text-neutral-950"
                : "bg-black/65 text-white",
            )}
          >
            {markMode && paused ? (
              <>
                <Crosshair className="size-3" />
                Drag on a block to mark it
              </>
            ) : (
              <>
                <Pause className="size-3" />
                Pause to mark areas
              </>
            )}
          </span>
          {pendingRegion && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-neutral-950">
              <Tag className="size-3" />
              Area ready — add tag below
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-3 left-3 z-10 inline-flex size-10 items-center justify-center rounded-full bg-white text-neutral-950 shadow-lg"
          aria-label={paused ? "Play" : "Pause"}
        >
          {paused ? (
            <Play className="size-4 fill-current" />
          ) : (
            <Pause className="size-4 fill-current" />
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const v = videoRef.current;
            v?.pause();
            setPaused(true);
            setMarkMode(true);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "absolute bottom-3 left-14 z-10 inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold shadow-lg",
            markMode && paused
              ? "bg-sky-400 text-neutral-950"
              : "bg-white/90 text-neutral-950",
          )}
        >
          <Crosshair className="size-3.5" />
          Mark area
        </button>
      </div>

      {/* Timeline */}
      <div>
        <div
          className={cn(
            "relative h-4 cursor-pointer rounded-full",
            dark ? "bg-white/15" : "bg-neutral-200",
          )}
          onClick={(e) => {
            if (!safeDuration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = Math.min(
              1,
              Math.max(0, (e.clientX - rect.left) / rect.width),
            );
            seekTo(pct * safeDuration);
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-red-500"
            style={{
              width: safeDuration
                ? `${Math.min(100, (atMs / safeDuration) * 100)}%`
                : "0%",
            }}
          />
          {timed.map((a) => (
            <button
              key={a.id}
              type="button"
              title={`${a.label} @ ${formatTime(a.atMs!)}`}
              className="absolute top-1/2 z-10 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-amber-400 shadow"
              style={{
                left: safeDuration
                  ? `${Math.min(100, (a.atMs! / safeDuration) * 100)}%`
                  : "0%",
              }}
              onClick={(e) => {
                e.stopPropagation();
                seekTo(a.atMs!);
              }}
            />
          ))}
        </div>
        <div
          className={cn(
            "mt-1.5 flex justify-between text-[11px] tabular-nums",
            dark ? "text-white/45" : "text-neutral-500",
          )}
        >
          <span>{formatTime(atMs)}</span>
          <span>{safeDuration ? formatTime(safeDuration) : "—:—"}</span>
        </div>
      </div>

      <div>
        <p
          className={cn(
            "text-[13px] font-semibold",
            dark ? "text-white" : "text-neutral-900",
          )}
        >
          {pendingRegion
            ? `Marked area @ ${formatTime(atMs)} is…`
            : `Mark a block on the video, then tag it`}
        </p>
        <p
          className={cn(
            "mt-0.5 text-[12px]",
            dark ? "text-white/45" : "text-neutral-500",
          )}
        >
          Drag a box over the specific block (VIP strip, feed card, etc.) so we
          know which one — then use a quick tag or your own name.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Your tag — e.g. Live wins row, Volkanovski banner…"
            className={cn(
              "min-w-0 flex-1 rounded-xl px-3 py-2.5 text-[13px] outline-none",
              dark
                ? "border border-white/15 bg-black/40 placeholder:text-white/30 focus:border-sky-400"
                : "border border-neutral-200 placeholder:text-neutral-400 focus:border-neutral-500",
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitCustom();
              }
            }}
          />
          <button
            type="button"
            disabled={busy || !customLabel.trim()}
            onClick={submitCustom}
            className={cn(
              "h-11 shrink-0 rounded-full px-5 text-[13px] font-semibold disabled:opacity-40",
              dark ? "bg-sky-400 text-neutral-950" : "bg-neutral-950 text-white",
            )}
          >
            Add my tag
          </button>
        </div>

        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional note with the tag…"
          className={cn(
            "mt-2 w-full rounded-xl px-3 py-2 text-[12px] outline-none",
            dark
              ? "border border-white/10 bg-black/40 placeholder:text-white/30"
              : "border border-neutral-200 placeholder:text-neutral-400",
          )}
        />

        <p
          className={cn(
            "mt-3 text-[11px] font-medium uppercase tracking-wide",
            dark ? "text-white/35" : "text-neutral-400",
          )}
        >
          Or quick tags
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {CLIP_QUICK_TAGS.map((q) => (
            <button
              key={q.tag}
              type="button"
              disabled={busy}
              onClick={() =>
                void addTag({
                  label: q.label,
                  tag: q.tag,
                  comment: comment.trim() || undefined,
                })
              }
              className={cn(
                "rounded-full px-3 py-1.5 text-[12px] font-medium disabled:opacity-40",
                dark
                  ? "border border-white/15 bg-white/5 hover:bg-amber-400 hover:text-neutral-950"
                  : "border border-neutral-200 bg-neutral-50 hover:border-amber-400 hover:bg-amber-50",
              )}
            >
              {q.label}
            </button>
          ))}
        </div>
        {pendingRegion && (
          <button
            type="button"
            className={cn(
              "mt-2 text-[11px]",
              dark ? "text-white/40 hover:text-white/70" : "text-neutral-400",
            )}
            onClick={() => setPendingRegion(null)}
          >
            Clear marked area
          </button>
        )}
      </div>

      {annotations.length > 0 && (
        <div>
          <p
            className={cn(
              "mb-1.5 text-[11px] font-medium uppercase tracking-wide",
              dark ? "text-white/40" : "text-neutral-400",
            )}
          >
            Tagged sections ({annotations.length})
          </p>
          <ul className="flex flex-col gap-1">
            {annotations.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-[13px]",
                  dark ? "bg-white/5" : "bg-neutral-50",
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left"
                  onClick={() => a.atMs != null && seekTo(a.atMs)}
                >
                  <span className="font-medium">{a.label}</span>
                  {a.atMs != null && (
                    <span
                      className={cn(
                        "ml-1.5 tabular-nums",
                        dark ? "text-amber-300/80" : "text-amber-700",
                      )}
                    >
                      @{formatTime(a.atMs)}
                    </span>
                  )}
                  {a.region && (
                    <span
                      className={cn(
                        "ml-1.5",
                        dark ? "text-sky-300/80" : "text-sky-700",
                      )}
                    >
                      area
                    </span>
                  )}
                  {a.comment ? (
                    <span
                      className={cn(
                        "ml-1",
                        dark ? "text-white/50" : "text-neutral-500",
                      )}
                    >
                      — {a.comment}
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void remove(a.id)}
                  className={cn(
                    "shrink-0 text-[11px]",
                    dark
                      ? "text-white/35 hover:text-red-300"
                      : "text-neutral-400 hover:text-red-600",
                  )}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function normalizeDrag(d: DragState): CaptureRegion {
  const x = Math.min(d.startX, d.curX);
  const y = Math.min(d.startY, d.curY);
  let w = Math.abs(d.curX - d.startX);
  let h = Math.abs(d.curY - d.startY);
  // Click without drag → small pin box around the point
  if (w < 2 && h < 2) {
    return {
      x: clamp(x - 4, 0, 92),
      y: clamp(y - 4, 0, 92),
      w: 8,
      h: 8,
    };
  }
  w = Math.max(w, 3);
  h = Math.max(h, 3);
  return { x, y, w: Math.min(w, 100 - x), h: Math.min(h, 100 - y) };
}

function regionStyle(r: CaptureRegion): CSSProperties {
  return {
    left: `${r.x}%`,
    top: `${r.y}%`,
    width: `${r.w}%`,
    height: `${r.h}%`,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function finiteMs(n: number | undefined | null): number | undefined {
  if (n == null || !Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

function formatTime(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
