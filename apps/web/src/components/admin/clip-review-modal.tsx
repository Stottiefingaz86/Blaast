"use client";

import { X } from "lucide-react";
import { ClipVideoTagger } from "@/components/admin/clip-video-tagger";
import { ElementClipPanel } from "@/components/admin/element-clip-panel";
import { LibraryTrimPanel } from "@/components/admin/library-trim-panel";
import type { CaptureSession, RecordingArtifact } from "@/lib/admin/types";

type Props = {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  clip: RecordingArtifact;
  title: string;
  onSession: (session: CaptureSession) => void;
  onDelete?: () => void;
  onApprove?: () => void;
  tone?: "light" | "dark";
};

/** Full review surface — open a clip, scrub, tag sections. */
export function ClipReviewModal({
  open,
  onClose,
  sessionId,
  clip,
  title,
  onSession,
  onDelete,
  onApprove,
  tone = "dark",
}: Props) {
  if (!open || !clip.videoPath) return null;

  const dark = tone === "dark";
  const approved = clip.reviewStatus === "approved";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={
          dark
            ? "relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl"
            : "relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl"
        }
      >
        <div
          className={
            dark
              ? "flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3"
              : "flex shrink-0 items-center gap-3 border-b border-black/[0.06] px-4 py-3"
          }
        >
          <div className="min-w-0 flex-1">
            <p
              className={
                dark
                  ? "text-[11px] text-white/45"
                  : "text-[11px] text-neutral-400"
              }
            >
              Review &amp; tag sections
              {approved ? " · Approved" : ""}
            </p>
            <p
              className={
                dark
                  ? "truncate text-[15px] font-semibold text-white"
                  : "truncate text-[15px] font-semibold text-neutral-950"
              }
            >
              {title}
            </p>
          </div>
          {onApprove && (
            <button
              type="button"
              onClick={onApprove}
              disabled={approved}
              className={
                approved
                  ? dark
                    ? "rounded-full bg-emerald-500/20 px-4 py-2 text-[13px] font-semibold text-emerald-300"
                    : "rounded-full bg-emerald-100 px-4 py-2 text-[13px] font-semibold text-emerald-800"
                  : "rounded-full bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-emerald-700"
              }
            >
              {approved ? "Approved ✓" : "Approve & publish"}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full px-3 py-1.5 text-[12px] font-medium text-red-400 hover:bg-red-500/10"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={
              dark
                ? "inline-flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
                : "inline-flex size-9 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200"
            }
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ClipVideoTagger
            key={clip.id}
            sessionId={sessionId}
            coverageStepId={clip.coverageStepId}
            videoSrc={`/api/admin/sessions/${sessionId}/artifacts/${clip.id}?file=video`}
            posterSrc={
              clip.posterPath
                ? `/api/admin/sessions/${sessionId}/artifacts/${clip.id}?file=poster`
                : undefined
            }
            durationMsHint={clip.durationMs}
            annotations={clip.annotations ?? []}
            onSession={onSession}
            tone={tone}
            size="hero"
          />
          <LibraryTrimPanel
            sessionId={sessionId}
            clip={clip}
            videoSrc={`/api/admin/sessions/${sessionId}/artifacts/${clip.id}?file=video`}
            onSession={onSession}
            tone={tone}
          />
          <ElementClipPanel
            sessionId={sessionId}
            clip={clip}
            onSession={onSession}
            tone={tone}
          />
        </div>
      </div>
    </div>
  );
}
