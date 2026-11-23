"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { CaptureAnnotation, CaptureSession } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

export const CLIP_QUICK_TAGS: { label: string; tag: string }[] = [
  { label: "VIP block", tag: "vip_block" },
  { label: "Activity feed", tag: "activity_feed" },
  { label: "Casino tournaments", tag: "casino_tournaments" },
  { label: "Odds ladder", tag: "odds_ladder" },
  { label: "Betslip", tag: "betslip" },
  { label: "Single bet", tag: "single_bet" },
  { label: "Combo / parlay", tag: "combo" },
  { label: "Same game parlay", tag: "sgp" },
  { label: "Closed betslip", tag: "closed_betslip" },
  { label: "Header / nav", tag: "header_nav" },
  { label: "Game grid", tag: "game_grid" },
  { label: "Promo banner", tag: "promo_banner" },
  { label: "Cashier", tag: "cashier" },
  { label: "Live scoreboard", tag: "live_scoreboard" },
  { label: "Loading / skeleton", tag: "loading_skeleton" },
];

type Props = {
  sessionId: string;
  coverageStepId: string;
  annotations: CaptureAnnotation[];
  /** Optional ms into the clip (e.g. from video.currentTime) */
  atMs?: number;
  onSession: (session: CaptureSession) => void;
  /** dark = capture stage, light = desk */
  tone?: "light" | "dark";
  className?: string;
};

export function ClipAnnotations({
  sessionId,
  coverageStepId,
  annotations,
  atMs,
  onSession,
  tone = "light",
  className,
}: Props) {
  const [comment, setComment] = useState("");
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  const dark = tone === "dark";

  async function add(input: { label: string; tag: string; comment?: string }) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverageStepId,
          annotation: {
            ...input,
            atMs: typeof atMs === "number" ? Math.round(atMs) : undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onSession(data.session);
      toast.success(`Tagged: ${input.label}`);
      setComment("");
      setCustom("");
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

  async function saveCommentOnly() {
    const text = comment.trim();
    if (!text) return;
    await add({ label: "Comment", tag: "comment", comment: text });
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div>
        <p
          className={cn(
            "text-[11px] font-medium",
            dark ? "text-white/50" : "text-neutral-500",
          )}
        >
          Tags & comments on this clip
          {typeof atMs === "number" ? (
            <span className="ml-1 opacity-70">
              (@{Math.round(atMs / 1000)}s)
            </span>
          ) : null}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CLIP_QUICK_TAGS.map((q) => (
            <button
              key={q.tag}
              type="button"
              disabled={busy}
              onClick={() =>
                void add({
                  label: q.label,
                  tag: q.tag,
                  comment: comment.trim() || undefined,
                })
              }
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium disabled:opacity-40",
                dark
                  ? "border border-white/15 bg-white/5 hover:bg-white/10"
                  : "border border-neutral-200 bg-neutral-50 hover:bg-neutral-100",
              )}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="Comment — saved with next tag, or click Save comment"
          className={cn(
            "min-w-0 flex-1 resize-none rounded-xl px-3 py-2 text-[13px] outline-none",
            dark
              ? "border border-white/10 bg-black/40 text-white placeholder:text-white/30 focus:border-white/30"
              : "border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400",
          )}
        />
        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            disabled={busy || !comment.trim()}
            onClick={() => void saveCommentOnly()}
            className={cn(
              "h-9 rounded-full px-4 text-[12px] font-semibold disabled:opacity-40",
              dark
                ? "bg-white text-neutral-950"
                : "bg-neutral-950 text-white",
            )}
          >
            Save comment
          </button>
          <div className="flex gap-1.5">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Custom tag…"
              className={cn(
                "min-w-0 flex-1 rounded-xl px-2.5 py-1.5 text-[12px] outline-none",
                dark
                  ? "border border-white/10 bg-black/40 focus:border-white/30"
                  : "border border-neutral-200 focus:border-neutral-400",
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter" && custom.trim()) {
                  e.preventDefault();
                  void add({
                    label: custom.trim(),
                    tag: custom.trim(),
                    comment: comment.trim() || undefined,
                  });
                }
              }}
            />
            <button
              type="button"
              disabled={busy || !custom.trim()}
              onClick={() =>
                void add({
                  label: custom.trim(),
                  tag: custom.trim(),
                  comment: comment.trim() || undefined,
                })
              }
              className={cn(
                "rounded-xl px-2.5 text-[11px] font-medium disabled:opacity-40",
                dark ? "bg-white/10" : "bg-neutral-100",
              )}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {annotations.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {annotations.map((a) => (
            <li
              key={a.id}
              className={cn(
                "flex items-start justify-between gap-2 rounded-xl px-3 py-2 text-[12px]",
                dark ? "bg-white/5" : "bg-neutral-50",
              )}
            >
              <div className="min-w-0">
                <span className="font-medium">{a.label}</span>
                {a.atMs != null && (
                  <span
                    className={cn(
                      "ml-1.5",
                      dark ? "text-white/40" : "text-neutral-400",
                    )}
                  >
                    @{Math.round(a.atMs / 1000)}s
                  </span>
                )}
                {a.comment && (
                  <p
                    className={cn(
                      "mt-0.5",
                      dark ? "text-white/55" : "text-neutral-500",
                    )}
                  >
                    {a.comment}
                  </p>
                )}
              </div>
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
      ) : (
        <p
          className={cn(
            "text-[12px]",
            dark ? "text-white/35" : "text-neutral-400",
          )}
        >
          No tags yet — add them after the take if you were busy recording.
        </p>
      )}
    </div>
  );
}
