"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaRegion } from "@/lib/library/catalog";
import { cn } from "@/lib/utils";

type Props = {
  posterUrl?: string;
  videoUrl?: string;
  atMs?: number;
  region?: MediaRegion;
  clipWindow?: { startMs: number; endMs: number };
  label?: string;
  className?: string;
  playOnHover?: boolean;
  hovering?: boolean;
  /** Loop within clipWindow / atMs window */
  loop?: boolean;
};

/**
 * Trim-aware preview: still + playback always anchored to clip In/Out.
 * When `loop` is set, plays the trim window continuously.
 */
export function CaptureMedia({
  posterUrl,
  videoUrl,
  atMs,
  clipWindow,
  label,
  className,
  playOnHover,
  hovering,
  loop,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  const startMs = clipWindow?.startMs ?? atMs ?? 0;
  const endMs =
    clipWindow?.endMs ?? (atMs != null ? atMs + 3000 : undefined);
  const hasTrim = clipWindow != null || atMs != null;

  const shouldPlay = Boolean(loop || (playOnHover && hovering));
  // With a trim, always mount video so the tile shows the In frame (not a stale poster)
  const loadVideo = Boolean(videoUrl && (shouldPlay || loop || hasTrim || !posterUrl));
  const showPoster = Boolean(posterUrl && !posterFailed);

  useEffect(() => {
    setPosterFailed(false);
    setReady(false);
    setBuffering(Boolean(videoUrl));
  }, [posterUrl, videoUrl, startMs]);

  useEffect(() => {
    if (!loadVideo) {
      setReady(false);
      setBuffering(false);
      return;
    }
    const v = ref.current;
    if (!v || !videoUrl) return;

    const startSec = Math.max(0, startMs / 1000);
    const seek = () => {
      try {
        if (Math.abs(v.currentTime - startSec) > 0.05) {
          v.currentTime = startSec;
        }
      } catch {
        /* ignore */
      }
    };
    const onMeta = () => seek();
    const onSeeked = () => {
      setReady(true);
      setBuffering(false);
    };
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => {
      setReady(true);
      setBuffering(false);
    };
    const onCanPlay = () => setBuffering(false);

    if (v.readyState >= 1) onMeta();
    else v.addEventListener("loadedmetadata", onMeta, { once: true });
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("canplay", onCanPlay);
    return () => {
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("canplay", onCanPlay);
    };
  }, [videoUrl, startMs, loadVideo]);

  useEffect(() => {
    const v = ref.current;
    if (!v || !videoUrl || !loadVideo) return;

    const start = Math.max(0, startMs / 1000);
    const end = endMs != null ? Math.max(start + 0.2, endMs / 1000) : undefined;

    if (!shouldPlay) {
      v.pause();
      try {
        v.currentTime = start;
      } catch {
        /* ignore */
      }
      return;
    }

    try {
      v.currentTime = start;
    } catch {
      /* ignore */
    }
    void v.play().catch(() => undefined);

    const onTime = () => {
      if (end == null) return;
      if (v.currentTime >= end - 0.04) {
        if (loop) {
          try {
            v.currentTime = start;
          } catch {
            /* ignore */
          }
          void v.play().catch(() => undefined);
        } else {
          v.pause();
          try {
            v.currentTime = start;
          } catch {
            /* ignore */
          }
        }
      }
    };
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.pause();
    };
  }, [shouldPlay, loadVideo, loop, videoUrl, startMs, endMs]);

  return (
    <div className={cn("relative size-full overflow-hidden bg-[#1a1a1a]", className)}>
      {showPoster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl}
          alt=""
          className={cn(
            "absolute inset-0 size-full object-cover object-top transition-opacity",
            loadVideo && ready ? "opacity-0" : "opacity-100",
          )}
          onError={() => setPosterFailed(true)}
        />
      )}
      {loadVideo && videoUrl && (
        <video
          key={`${videoUrl}-${startMs}-${endMs ?? "x"}`}
          ref={ref}
          src={videoUrl}
          muted
          playsInline
          preload="metadata"
          className={cn(
            "absolute inset-0 size-full object-cover object-top transition-opacity duration-200",
            ready ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      {(buffering || (loadVideo && !ready)) && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/25"
          aria-busy
          aria-label="Loading video"
        >
          <span className="size-8 animate-pulse rounded-full bg-white/25 ring-2 ring-white/40" />
        </div>
      )}
      {!showPoster && !loadVideo && (
        <div className="flex size-full items-center justify-center text-[12px] text-white/35">
          No media
        </div>
      )}
      {label && (
        <span className="absolute right-2 bottom-2 left-2 z-20 truncate rounded-md bg-black/55 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
          {label}
        </span>
      )}
    </div>
  );
}
