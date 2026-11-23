"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { VideoTrimEditor } from "@/components/admin/video-trim-editor";

export type LobbyTrimTarget = {
  title: string;
  sessionId: string;
  artifactId: string;
  annotationId?: string;
  videoUrl: string;
  durationMs: number;
  clipWindow?: { startMs: number; endMs: number };
  atMs?: number;
};

type Props = {
  open: boolean;
  target: LobbyTrimTarget | null;
  onClose: () => void;
  onSaved: () => void;
};

function finiteMs(n: unknown, fallback: number) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v) || v < 0) return fallback;
  return v;
}

function sanitizeWindow(
  startMs: number,
  endMs: number,
  durationMs: number,
): { startMs: number; endMs: number } {
  const dur = Math.max(1000, finiteMs(durationMs, 60_000));
  let start = Math.max(0, Math.min(finiteMs(startMs, 0), dur - 200));
  let end = finiteMs(endMs, dur);
  if (end <= start) end = Math.min(dur, start + 2000);
  end = Math.min(dur, Math.max(start + 200, end));
  return { startMs: Math.round(start), endMs: Math.round(end) };
}

/** Admin trim from the operator lobby — same Instagram drag UX. */
export function LobbyTrimModal({ open, target, onClose, onSaved }: Props) {
  const [startMs, setStartMs] = useState(0);
  const [endMs, setEndMs] = useState(5000);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!target) return;
    const dur = finiteMs(target.durationMs, 60_000);
    const start =
      target.clipWindow?.startMs ??
      (target.atMs != null ? Math.max(0, target.atMs - 400) : 0);
    const end =
      target.clipWindow?.endMs ??
      (target.atMs != null
        ? target.atMs + 2500
        : Math.min(dur, finiteMs(start, 0) + 5000));
    const next = sanitizeWindow(start, end, dur);
    setStartMs(next.startMs);
    setEndMs(next.endMs);
  }, [target]);

  if (!open || !target) return null;

  const durationMs = finiteMs(target.durationMs, 60_000);

  async function save() {
    const window = sanitizeWindow(startMs, endMs, durationMs);
    if (
      !Number.isFinite(window.startMs) ||
      !Number.isFinite(window.endMs) ||
      window.endMs <= window.startMs
    ) {
      toast.error("Invalid trim range — wait for video to load");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/sessions/${target!.sessionId}/artifacts/${target!.artifactId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clipWindow: window,
            annotationId: target!.annotationId,
          }),
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      toast.success("Trim saved — library updated");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save trim",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white/45">Trim for library</p>
            <p className="truncate text-[15px] font-semibold text-white">
              {target.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
          >
            <X className="size-4 text-white" />
          </button>
        </div>
        <div className="p-4">
          <VideoTrimEditor
            videoSrc={target.videoUrl}
            durationMs={durationMs}
            startMs={startMs}
            endMs={endMs}
            onChange={({ startMs: s, endMs: e }) => {
              const next = sanitizeWindow(s, e, durationMs);
              setStartMs(next.startMs);
              setEndMs(next.endMs);
            }}
          />
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void save()}
              className="h-10 flex-1 rounded-full bg-white text-[13px] font-semibold text-neutral-950 hover:bg-white/90 disabled:opacity-40"
            >
              {busy ? "Saving…" : "Save trim"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-full px-4 text-[13px] text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
