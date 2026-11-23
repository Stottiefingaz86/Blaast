"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { VideoTrimEditor } from "@/components/admin/video-trim-editor";
import type { CaptureSession, RecordingArtifact } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type Props = {
  sessionId: string;
  clip: RecordingArtifact;
  videoSrc: string;
  onSession: (session: CaptureSession) => void;
  tone?: "light" | "dark";
};

/** Trim for library — Instagram-style drag handles. */
export function LibraryTrimPanel({
  sessionId,
  clip,
  videoSrc,
  onSession,
  tone = "dark",
}: Props) {
  const dark = tone === "dark";
  const [busy, setBusy] = useState(false);
  const [startMs, setStartMs] = useState(clip.clipWindow?.startMs ?? 0);
  const [endMs, setEndMs] = useState(
    clip.clipWindow?.endMs ?? clip.durationMs ?? 10000,
  );

  useEffect(() => {
    setStartMs(clip.clipWindow?.startMs ?? 0);
    setEndMs(clip.clipWindow?.endMs ?? clip.durationMs ?? 10000);
  }, [clip.id, clip.clipWindow?.startMs, clip.clipWindow?.endMs, clip.durationMs]);

  async function save(window: { startMs: number; endMs: number } | null) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/sessions/${sessionId}/artifacts/${clip.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clipWindow: window }),
        },
      );
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { session: CaptureSession };
      onSession(data.session);
      toast.success(
        window
          ? `Library trim · ${(window.startMs / 1000).toFixed(1)}s → ${(window.endMs / 1000).toFixed(1)}s`
          : "Trim cleared",
      );
    } catch {
      toast.error("Could not save trim");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "mt-4 rounded-xl border p-4",
        dark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-neutral-50",
      )}
    >
      <p
        className={cn(
          "text-[13px] font-semibold",
          dark ? "text-white" : "text-neutral-950",
        )}
      >
        Trim for library
      </p>
      <p
        className={cn(
          "mt-0.5 mb-3 text-[12px]",
          dark ? "text-white/45" : "text-neutral-500",
        )}
      >
        Drag the handles to cut geo-blocks and junk. Only this window shows on
        the site.
      </p>

      <VideoTrimEditor
        videoSrc={videoSrc}
        durationMs={clip.durationMs ?? endMs}
        startMs={startMs}
        endMs={endMs}
        onChange={({ startMs: s, endMs: e }) => {
          setStartMs(s);
          setEndMs(e);
        }}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || endMs <= startMs}
          onClick={() => void save({ startMs, endMs })}
          className="h-9 rounded-full bg-emerald-500 px-4 text-[13px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save trim"}
        </button>
        {clip.clipWindow && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void save(null)}
            className={cn(
              "h-9 rounded-full px-4 text-[13px]",
              dark ? "text-white/50 hover:text-white" : "text-neutral-500",
            )}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
