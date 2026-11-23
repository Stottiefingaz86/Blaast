"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Film, ExternalLink } from "lucide-react";
import {
  adminOutlineBtn,
  adminPrimaryBtn,
} from "@/components/admin/admin-shell";
import { ClipReviewModal } from "@/components/admin/clip-review-modal";
import { CaptureMedia } from "@/components/library/capture-media";
import {
  coverageJourneyProgress,
  coverageScoreboard,
  missingRequiredJourneySteps,
  type CoverageStep,
} from "@/lib/admin/coverage-pack";
import type {
  CaptureSession,
  Operator,
  RecordingArtifact,
} from "@/lib/admin/types";
import { platformLabel } from "@/lib/admin/viewport-presets";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type Props = {
  initialSession: CaptureSession;
  operator: Operator;
  coverageSteps: CoverageStep[];
};

/**
 * Desk overview: open the capture window (site + Blaast controls),
 * watch clips land here. Recording happens in the stage window — not a separate extension ritual.
 */
export function GuidedCaptureRunner({
  initialSession,
  operator,
  coverageSteps,
}: Props) {
  const [session, setSession] = useState(initialSession);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const stageRef = useRef<Window | null>(null);

  const artifacts = session.artifacts ?? [];
  const selected =
    artifacts.find((a) => a.id === selectedId) ??
    artifacts[artifacts.length - 1] ??
    null;

  const statusMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const row of session.items) m.set(row.playbookItemId, row.status);
    return m;
  }, [session.items]);

  const scoreboard = useMemo(
    () => coverageScoreboard(coverageSteps, statusMap),
    [coverageSteps, statusMap],
  );

  const journeys = useMemo(
    () => coverageJourneyProgress(coverageSteps, statusMap),
    [coverageSteps, statusMap],
  );
  const journeysComplete = journeys.filter((j) => j.complete).length;

  const required = coverageSteps.filter((s) => s.required);
  const requiredDone = required.filter((s) => {
    const st = statusMap.get(s.id);
    return st === "done" || st === "skipped";
  }).length;

  const stageUrl = `/admin/capture/${session.id}/stage`;

  const openStage = useCallback(() => {
    const features =
      "popup=yes,width=1440,height=900,left=40,top=40,noopener=no";
    const win = window.open(stageUrl, `blaast-stage-${session.id}`, features);
    if (!win) {
      toast.error("Popup blocked — allow popups, or use Open in tab");
      return;
    }
    stageRef.current = win;
    try {
      win.focus();
    } catch {
      /* ignore */
    }
    toast.message(
      "Capture window opened — Start recording, Comment, and Tag are in that window",
    );
  }, [session.id, stageUrl]);

  // Auto-open stage once on mount
  useEffect(() => {
    const t = setTimeout(() => openStage(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for new clips
  useEffect(() => {
    if (session.status === "done" || session.status === "abandoned") return;
    let prev = artifacts.length;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/sessions/${session.id}`);
        const data = await res.json();
        if (!data.session) return;
        const next = data.session as CaptureSession;
        const arts = next.artifacts ?? [];
        if (arts.length > prev) {
          const newest = arts[arts.length - 1];
          if (newest) setSelectedId(newest.id);
          toast.success("New clip arrived");
        }
        prev = arts.length;
        setSession(next);
      } catch {
        /* ignore */
      }
    }, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, session.status]);

  async function finish(status: "done" | "abandoned") {
    if (status === "done") {
      const missing = missingRequiredJourneySteps(coverageSteps, statusMap);
      if (missing.length) {
        const names = [
          ...new Set(
            missing.map(
              (s) =>
                journeys.find((j) => j.flowId === (s.flowId ?? "_ungrouped"))
                  ?.name ?? s.instruction,
            ),
          ),
        ].slice(0, 4);
        toast.error(
          `Finish E2E journeys first (${missing.length} required steps left): ${names.join(", ")}`,
        );
        return;
      }
    }
    const res = await fetch(`/api/admin/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed");
      return;
    }
    setSession(data.session);
    toast.success(status === "done" ? "Brand E2E complete" : "Abandoned");
  }

  async function reviewArtifact(
    artifact: RecordingArtifact,
    reviewStatus: "approved" | "rejected" | "sensitive",
  ) {
    const res = await fetch(
      `/api/admin/sessions/${session.id}/artifacts/${artifact.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed");
      return;
    }
    setSession(data.session);
    if (reviewStatus === "approved") {
      toast.success("Approved — published for library / MCP");
      setReviewOpen(false);
    } else if (reviewStatus === "rejected") {
      toast.message("Clip rejected");
    }
  }

  async function deleteClip(artifact: RecordingArtifact) {
    if (!confirm("Delete this clip? This can’t be undone.")) return;
    const res = await fetch(
      `/api/admin/sessions/${session.id}/artifacts/${artifact.id}`,
      { method: "DELETE" },
    );
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Delete failed");
      return;
    }
    setSession(data.session);
    setSelectedId(null);
    toast.success("Clip deleted — back on step 1");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-xl text-[14px] text-neutral-500">
          <span className="font-medium text-neutral-800">
            {platformLabel(session.platform)} session
          </span>
          {" — "}
          capture each brand journey end-to-end (not isolated UI parts). Do not
          flip to the other platform mid-session. Tag UI inside clips; VIP
          add-ons come later.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={openStage} className={adminPrimaryBtn()}>
            Open capture window
          </button>
          <Link
            href={stageUrl}
            target="_blank"
            className={adminOutlineBtn("inline-flex items-center gap-1.5")}
          >
            <ExternalLink className="size-3.5" />
            Open in tab
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
        <h2 className="text-[14px] font-semibold">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-neutral-600">
          <li>
            <strong>Open capture window</strong> — Blaast controls (Start, Stop,
            Comment, Tag). The operator site opens beside it (most sites block
            embeds, so we can’t put Rainbet inside our frame).
          </li>
          <li>
            Hit <strong>Start recording</strong>. When Chrome asks, share the{" "}
            <strong>operator tab</strong> (Rainbet), not the control window.
          </li>
          <li>
            Browse the site; then <strong>Stop</strong>. Tag afterward if you
            were focused on the operator window.
          </li>
          <li>
            Video appears below — scrub it and add tags/comments on each clip.
          </li>
        </ol>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="E2E journeys"
          value={`${journeysComplete}/${journeys.length}`}
        />
        <Stat
          label="Required steps"
          value={`${requiredDone}/${required.length}`}
        />
        <Stat
          label="Clips saved"
          value={String(artifacts.length)}
        />
      </div>
      <Progress
        value={
          required.length
            ? Math.round((requiredDone / required.length) * 100)
            : 0
        }
        className="h-1.5"
      />

      <section className="rounded-2xl border border-black/[0.06] bg-white p-5">
        <h2 className="text-[15px] font-semibold">Brand journeys</h2>
        <p className="mt-1 text-[12px] text-neutral-500">
          Screens {scoreboard.screens.done}/{scoreboard.screens.total} · Flow
          beats {scoreboard.flowBeats.done}/{scoreboard.flowBeats.total} · UI
          tags optional
        </p>
        <ul className="mt-4 divide-y divide-neutral-100">
          {journeys.map((j) => (
            <li
              key={j.flowId}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  j.complete
                    ? "bg-emerald-100 text-emerald-800"
                    : j.done > 0
                      ? "bg-amber-100 text-amber-900"
                      : "bg-neutral-100 text-neutral-500",
                )}
              >
                {j.complete ? "✓" : j.done}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{j.name}</p>
                <p className="truncate text-[11px] text-neutral-400">
                  {j.group}
                  {j.actions.length ? ` · ${j.actions.join(" → ")}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-[12px] tabular-nums text-neutral-500">
                {j.done}/{j.total}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-5">
        <div className="flex items-center gap-2">
          <Film className="size-4 text-neutral-400" />
          <h2 className="text-[15px] font-semibold">Your recordings</h2>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
            {artifacts.length}
          </span>
        </div>

        {artifacts.length === 0 ? (
          <div className="mt-4 flex h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 text-center">
            <p className="text-[14px] font-medium text-neutral-700">
              No video yet
            </p>
            <p className="mt-1 max-w-sm text-[13px] text-neutral-500">
              Open the capture window and press Start recording. When you Stop,
              the clip lands here.
            </p>
            <button
              type="button"
              onClick={openStage}
              className={adminPrimaryBtn("mt-4")}
            >
              Open capture window
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <ul className="flex gap-3 overflow-x-auto pb-1">
              {artifacts.map((art, i) => {
                const label =
                  coverageSteps.find((s) => s.id === art.coverageStepId)
                    ?.instruction ?? `Clip ${i + 1}`;
                const active = art.id === selected?.id;
                const tagCount = art.annotations?.length ?? 0;
                return (
                  <li key={art.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(art.id)}
                      onDoubleClick={() => {
                        setSelectedId(art.id);
                        setReviewOpen(true);
                      }}
                      className={cn(
                        "w-[180px] overflow-hidden rounded-xl border text-left transition-colors",
                        active
                          ? "border-neutral-900 ring-1 ring-neutral-900"
                          : "border-neutral-200 hover:border-neutral-400",
                        art.reviewStatus === "approved" &&
                          "border-emerald-500/50",
                      )}
                    >
                      <div className="relative aspect-video overflow-hidden bg-neutral-900">
                        <CaptureMedia
                          posterUrl={
                            art.posterPath
                              ? `/api/admin/sessions/${session.id}/artifacts/${art.id}?file=poster&t=${art.clipWindow?.startMs ?? 0}`
                              : undefined
                          }
                          videoUrl={
                            art.videoPath
                              ? `/api/admin/sessions/${session.id}/artifacts/${art.id}?file=video`
                              : undefined
                          }
                          clipWindow={art.clipWindow}
                          loop={Boolean(art.clipWindow)}
                          playOnHover={!art.clipWindow}
                          hovering={Boolean(art.clipWindow) || active}
                        />
                        <span className="absolute right-1 bottom-1 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white tabular-nums">
                          {art.clipWindow
                            ? `${((art.clipWindow.endMs - art.clipWindow.startMs) / 1000).toFixed(1)}s`
                            : art.durationMs
                              ? `${Math.round(art.durationMs / 1000)}s`
                              : "video"}
                        </span>
                        {art.reviewStatus === "approved" && (
                          <span className="absolute top-1 left-1 z-10 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            Approved
                          </span>
                        )}
                      </div>
                      <div className="px-2.5 py-2">
                        <p className="truncate text-[12px] font-medium">
                          {label}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {art.clipWindow
                            ? `${(art.clipWindow.startMs / 1000).toFixed(1)}–${(art.clipWindow.endMs / 1000).toFixed(1)}s · `
                            : tagCount
                              ? `${tagCount} tags · `
                              : ""}
                          {art.reviewStatus}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {selected && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={adminOutlineBtn("h-9 px-4 text-[13px]")}
                  onClick={() => setReviewOpen(true)}
                >
                  Open clip &amp; tag
                </button>
                <button
                  type="button"
                  disabled={selected.reviewStatus === "approved"}
                  className={
                    selected.reviewStatus === "approved"
                      ? "inline-flex h-9 items-center rounded-full bg-emerald-100 px-4 text-[13px] font-semibold text-emerald-800"
                      : "inline-flex h-9 items-center rounded-full bg-emerald-600 px-4 text-[13px] font-semibold text-white hover:bg-emerald-700"
                  }
                  onClick={() => void reviewArtifact(selected, "approved")}
                >
                  {selected.reviewStatus === "approved"
                    ? "Approved ✓"
                    : "Approve & publish"}
                </button>
                <button
                  type="button"
                  className={adminOutlineBtn("h-9 px-4 text-[13px]")}
                  onClick={() => void reviewArtifact(selected, "rejected")}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-full px-3 text-[13px] font-medium text-red-600 hover:bg-red-50"
                  onClick={() => void deleteClip(selected)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {selected && reviewOpen && (
        <ClipReviewModal
          open
          tone="light"
          sessionId={session.id}
          clip={selected}
          title={
            coverageSteps.find((s) => s.id === selected.coverageStepId)
              ?.instruction ?? "Clip"
          }
          onClose={() => setReviewOpen(false)}
          onApprove={() => void reviewArtifact(selected, "approved")}
          onDelete={() => {
            void deleteClip(selected);
            setReviewOpen(false);
          }}
          onSession={setSession}
        />
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => finish("done")}
          disabled={session.status === "done"}
          className={adminPrimaryBtn("disabled:opacity-50")}
        >
          Mark coverage done
        </button>
        <button
          type="button"
          onClick={() => finish("abandoned")}
          className={adminOutlineBtn()}
        >
          Abandon
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-3">
      <p className="text-[11px] text-neutral-400">{label}</p>
      <p className="text-[22px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}
