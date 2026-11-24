"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaRegion } from "@/lib/library/catalog";
import { MediaBusy } from "@/components/library/media-busy";
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
 * Trim-aware preview: poster by default; video only when in view + playing.
 * Avoids mounting hundreds of videos for annotated UI tiles.
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
  const rootRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  const startMs = clipWindow?.startMs ?? atMs ?? 0;
  const endMs =
    clipWindow?.endMs ?? (atMs != null ? atMs + 3000 : undefined);

  const shouldPlay = Boolean(
    inView && (loop || (playOnHover && hovering) || (!playOnHover && hovering)),
  );
  // Only attach <video> when near viewport — keeps 500-brand grids workable
  // Always attach video when poster missing/failed so tiles aren't empty/broken
  const loadVideo = Boolean(
    videoUrl && inView && (shouldPlay || !posterUrl || posterFailed),
  );
  const showPoster = Boolean(posterUrl && !posterFailed);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { root: null, rootMargin: "120px 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    setPosterFailed(false);
    setReady(false);
    setBuffering(false);
  }, [posterUrl, videoUrl, startMs]);

  useEffect(() => {
    if (!loadVideo) {
      setReady(false);
      setBuffering(false);
      return;
    }
    const v = ref.current;
    if (!v || !videoUrl) return;

    setBuffering(true);
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
    <div
      ref={rootRef}
      className={cn("relative size-full overflow-hidden bg-[#1a1a1a]", className)}
    >
      {showPoster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={inView ? posterUrl : undefined}
          alt=""
          loading="lazy"
          decoding="async"
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
      {(buffering || (loadVideo && shouldPlay && !ready)) && <MediaBusy />}
      {!showPoster && !loadVideo && (
        <div className="flex size-full items-center justify-center text-[12px] text-white/35">
          {inView ? "No media" : ""}
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
