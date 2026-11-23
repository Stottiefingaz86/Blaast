"use client";

import { useState } from "react";
import { toast } from "sonner";
import type {
  CaptureAnnotation,
  CaptureSession,
  RecordingArtifact,
} from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type Props = {
  sessionId: string;
  clip: RecordingArtifact;
  onSession: (session: CaptureSession) => void;
  tone?: "light" | "dark";
};

/**
 * Admin trim / publish controls for tagged elements.
 * Sets clipWindow around a tag so library + MCP can deliver a tighter beat
 * (side nav, betslip, etc.) without re-recording.
 */
export function ElementClipPanel({
  sessionId,
  clip,
  onSession,
  tone = "dark",
}: Props) {
  const dark = tone === "dark";
  const [busyId, setBusyId] = useState<string | null>(null);
  const annotations = clip.annotations ?? [];

  if (!annotations.length) {
    return (
      <p
        className={cn(
          "mt-4 text-[12px]",
          dark ? "text-white/40" : "text-neutral-500",
        )}
      >
        Tag regions on the video first — then set a clip window for library /
        MCP (e.g. Rainbet side nav).
      </p>
    );
  }

  async function save(next: CaptureAnnotation[]) {
    const res = await fetch(
      `/api/admin/sessions/${sessionId}/artifacts/${clip.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annotations: next }),
      },
    );
    if (!res.ok) throw new Error("Failed to save");
    const data = (await res.json()) as { session: CaptureSession };
    onSession(data.session);
  }

  async function updateAnn(
    id: string,
    patch: Partial<CaptureAnnotation>,
  ) {
    setBusyId(id);
    try {
      const next = annotations.map((a) =>
        a.id === id ? { ...a, ...patch } : a,
      );
      await save(next);
      toast.success("Element clip updated");
    } catch {
      toast.error("Could not save element clip");
    } finally {
      setBusyId(null);
    }
  }

  function defaultWindow(ann: CaptureAnnotation) {
    const at = ann.atMs ?? 0;
    const pad = 1500;
    const endCap = clip.durationMs ?? at + 4000;
    return {
      startMs: Math.max(0, at - pad),
      endMs: Math.min(endCap, at + pad + 2000),
    };
  }

  return (
    <div className="mt-5 space-y-3">
      <div>
        <p
          className={cn(
            "text-[13px] font-semibold",
            dark ? "text-white" : "text-neutral-950",
          )}
        >
          Element clips for library / MCP
        </p>
        <p
          className={cn(
            "mt-0.5 text-[12px]",
            dark ? "text-white/45" : "text-neutral-500",
          )}
        >
          Trim around a tag so agents get the exact side nav / block — like
          Mobbin elements. Re-approving is not required; saves sync when
          already published.
        </p>
      </div>
      <ul className="space-y-2">
        {annotations.map((ann) => {
          const win = ann.clipWindow ?? defaultWindow(ann);
          const published = ann.publishElement !== false;
          return (
            <li
              key={ann.id}
              className={cn(
                "rounded-xl border p-3",
                dark
                  ? "border-white/10 bg-white/[0.03]"
                  : "border-black/10 bg-neutral-50",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "text-[13px] font-medium",
                    dark ? "text-white" : "text-neutral-900",
                  )}
                >
                  {ann.label}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px]",
                    dark
                      ? "bg-white/10 text-white/60"
                      : "bg-neutral-200 text-neutral-600",
                  )}
                >
                  {ann.tag}
                </span>
                {ann.region && (
                  <span
                    className={cn(
                      "text-[10px]",
                      dark ? "text-white/35" : "text-neutral-400",
                    )}
                  >
                    region {Math.round(ann.region.w)}×{Math.round(ann.region.h)}%
                  </span>
                )}
                <label
                  className={cn(
                    "ml-auto flex items-center gap-1.5 text-[11px]",
                    dark ? "text-white/55" : "text-neutral-600",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={published}
                    disabled={busyId === ann.id}
                    onChange={(e) =>
                      void updateAnn(ann.id, {
                        publishElement: e.target.checked,
                      })
                    }
                  />
                  Show on site
                </label>
              </div>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-0.5 text-[10px] opacity-70">
                  Start ms
                  <input
                    type="number"
                    min={0}
                    defaultValue={win.startMs}
                    className={cn(
                      "h-8 w-24 rounded-lg border px-2 text-[12px]",
                      dark
                        ? "border-white/15 bg-black/40 text-white"
                        : "border-black/10 bg-white text-neutral-900",
                    )}
                    id={`start-${ann.id}`}
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-[10px] opacity-70">
                  End ms
                  <input
                    type="number"
                    min={0}
                    defaultValue={win.endMs}
                    className={cn(
                      "h-8 w-24 rounded-lg border px-2 text-[12px]",
                      dark
                        ? "border-white/15 bg-black/40 text-white"
                        : "border-black/10 bg-white text-neutral-900",
                    )}
                    id={`end-${ann.id}`}
                  />
                </label>
                <button
                  type="button"
                  disabled={busyId === ann.id}
                  className={cn(
                    "h-8 rounded-full px-3 text-[12px] font-medium",
                    dark
                      ? "bg-white text-neutral-950 hover:bg-white/90"
                      : "bg-neutral-900 text-white hover:bg-neutral-800",
                  )}
                  onClick={() => {
                    const startEl = document.getElementById(
                      `start-${ann.id}`,
                    ) as HTMLInputElement | null;
                    const endEl = document.getElementById(
                      `end-${ann.id}`,
                    ) as HTMLInputElement | null;
                    const startMs = Number(startEl?.value ?? win.startMs);
                    const endMs = Number(endEl?.value ?? win.endMs);
                    if (
                      !Number.isFinite(startMs) ||
                      !Number.isFinite(endMs) ||
                      endMs <= startMs
                    ) {
                      toast.error("End must be after start");
                      return;
                    }
                    void updateAnn(ann.id, {
                      clipWindow: { startMs, endMs },
                      publishElement: true,
                    });
                  }}
                >
                  {busyId === ann.id ? "Saving…" : "Save clip window"}
                </button>
                <button
                  type="button"
                  disabled={busyId === ann.id}
                  className={cn(
                    "h-8 rounded-full px-3 text-[12px] font-medium",
                    dark
                      ? "bg-white/10 text-white hover:bg-white/15"
                      : "bg-neutral-200 text-neutral-800 hover:bg-neutral-300",
                  )}
                  onClick={() => {
                    const w = defaultWindow(ann);
                    const startEl = document.getElementById(
                      `start-${ann.id}`,
                    ) as HTMLInputElement | null;
                    const endEl = document.getElementById(
                      `end-${ann.id}`,
                    ) as HTMLInputElement | null;
                    if (startEl) startEl.value = String(w.startMs);
                    if (endEl) endEl.value = String(w.endMs);
                    void updateAnn(ann.id, {
                      clipWindow: w,
                      publishElement: true,
                    });
                  }}
                >
                  Auto ± around tag
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
