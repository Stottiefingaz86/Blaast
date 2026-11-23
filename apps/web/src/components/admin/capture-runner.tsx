"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Film } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  adminOutlineBtn,
  adminPrimaryBtn,
} from "@/components/admin/admin-shell";
import { ClipReviewModal } from "@/components/admin/clip-review-modal";
import { CaptureMedia } from "@/components/library/capture-media";
import type {
  CapturePlaybook,
  CaptureSession,
  ChecklistItemStatus,
  Operator,
  RecordingArtifact,
} from "@/lib/admin/types";
import { cn } from "@/lib/utils";

export function CaptureRunner({
  initialSession,
  operator,
  playbook,
}: {
  initialSession: CaptureSession;
  operator: Operator;
  playbook: CapturePlaybook;
}) {
  const [session, setSession] = useState(initialSession);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [enrichBusy, setEnrichBusy] = useState(false);

  const artifacts = session.artifacts ?? [];
  const selected =
    artifacts.find((a) => a.id === selectedId) ??
    artifacts.find((a) => a.reviewStatus === "pending") ??
    artifacts[artifacts.length - 1] ??
    null;
  const pendingCount = artifacts.filter(
    (a) => a.reviewStatus === "pending",
  ).length;

  const stageUrl = `/admin/capture/${session.id}/stage`;

  const openStage = useCallback(() => {
    const features =
      "popup=yes,width=1440,height=900,left=40,top=40,noopener=no";
    const win = window.open(stageUrl, `blaast-stage-${session.id}`, features);
    if (!win) {
      toast.error("Popup blocked — allow popups for localhost, or Open in tab");
      return;
    }
    try {
      win.focus();
    } catch {
      /* ignore */
    }
    toast.message(
      "Capture window opened — Start recording is in that window (share the Rainbet tab)",
    );
  }, [session.id, stageUrl]);

  // Poll so clips show up after closing the stage window
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/sessions/${session.id}`);
        const data = await res.json();
        if (data.session) setSession(data.session as CaptureSession);
      } catch {
        /* ignore */
      }
    }, 2000);
    return () => clearInterval(t);
  }, [session.id]);

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
      toast.success("Approved — published to library");
      setReviewOpen(false);
    }
  }

  async function enrichTags(artifactId?: string) {
    setEnrichBusy(true);
    try {
      const res = await fetch(`/api/admin/sessions/${session.id}/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artifactId, forceStills: true }),
      });
      const data = (await res.json()) as {
        error?: string;
        enriched?: number;
        stills?: number;
        source?: string;
      };
      if (!res.ok) {
        toast.error(data.error || "Enrich failed");
        return;
      }
      toast.success(
        `Tagged moments: ${data.stills ?? 0} stills · ${data.enriched ?? 0} labels (${data.source ?? "curated"})`,
      );
      const refresh = await fetch(`/api/admin/sessions/${session.id}`);
      const body = await refresh.json();
      if (body.session) setSession(body.session as CaptureSession);
    } catch {
      toast.error("Enrich failed");
    } finally {
      setEnrichBusy(false);
    }
  }

  const required = playbook.items.filter((i) => i.required);
  const requiredDone = required.filter((i) => {
    const row = session.items.find((x) => x.playbookItemId === i.id);
    return row && (row.status === "done" || row.status === "skipped");
  }).length;
  const progress = required.length
    ? Math.round((requiredDone / required.length) * 100)
    : 0;

  async function patchItem(
    playbookItemId: string,
    body: Record<string, unknown>,
  ) {
    setBusyId(playbookItemId);
    try {
      const res = await fetch(`/api/admin/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playbookItemId, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setSession(data.session);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function mark(
    playbookItemId: string,
    itemStatus: ChecklistItemStatus,
    captureCount?: number,
  ) {
    const row = session.items.find((i) => i.playbookItemId === playbookItemId);
    await patchItem(playbookItemId, {
      itemStatus,
      captureCount:
        captureCount ??
        (itemStatus === "done"
          ? Math.max(1, row?.captureCount || 0)
          : row?.captureCount || 0),
    });
  }

  async function finish(status: "done" | "abandoned") {
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
    toast.success(status === "done" ? "Session complete" : "Session abandoned");
  }

  const itemsById = useMemo(() => {
    return new Map(playbook.items.map((i) => [i.id, i]));
  }, [playbook.items]);
  void itemsById;

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-20 flex h-fit flex-col gap-4 rounded-[20px] border border-black/[0.06] bg-white p-5">
        <div>
          <p className="text-[11px] text-neutral-400">Recording</p>
          <p className="text-[15px] font-semibold">{operator.name}</p>
          <p className="text-[12px] text-neutral-500">{session.platform}</p>
        </div>
        <button
          type="button"
          onClick={openStage}
          className={adminPrimaryBtn("w-full")}
        >
          Start recording
        </button>
        <Link
          href={stageUrl}
          className={adminOutlineBtn(
            "inline-flex w-full items-center justify-center gap-1.5",
          )}
        >
          <ExternalLink className="size-3.5" />
          Open recorder in this tab
        </Link>
        <a
          href={operator.url}
          target="_blank"
          rel="noreferrer"
          className="text-center text-[12px] text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline"
        >
          Open Rainbet without recorder
        </a>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[12px] text-neutral-500">
            <span>Required</span>
            <span>
              {requiredDone}/{required.length}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
        <ol className="flex flex-col gap-2 text-[12px] leading-snug text-neutral-500">
          <li>
            1. Click <strong className="font-medium text-neutral-700">Start recording</strong>{" "}
            (opens Blaast recorder + Rainbet).
          </li>
          <li>2. In the recorder, hit Start → share the Rainbet tab.</li>
          <li>3. Capture each checklist row → Stop → Approve.</li>
          <li>4. Skip card / password screens.</li>
        </ol>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => finish("done")}
            disabled={session.status === "done"}
            className={adminPrimaryBtn("w-full disabled:opacity-50")}
          >
            Mark session done
          </button>
          <button
            type="button"
            onClick={() => finish("abandoned")}
            className={adminOutlineBtn("w-full")}
          >
            Abandon
          </button>
        </div>
        <span className="w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
          {session.status}
        </span>
      </aside>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight">
            {playbook.title}
          </h2>
          <p className="text-[13px] text-neutral-500">{playbook.description}</p>
        </div>

        <section className="rounded-[20px] border border-black/[0.06] bg-white p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Film className="size-4 text-neutral-400" />
            <h2 className="text-[15px] font-semibold">Your recordings</h2>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
              {artifacts.length}
            </span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                {pendingCount} to approve
              </span>
            )}
          </div>
          {artifacts.length === 0 ? (
            <p className="mt-3 text-[13px] text-neutral-500">
              No clips yet — Start recording, then come back here to approve.
            </p>
          ) : (
            <div className="mt-4">
              <ul className="flex gap-3 overflow-x-auto pb-1">
                {artifacts.map((art, i) => {
                  const label =
                    playbook.items.find((p) => p.id === art.coverageStepId)
                      ?.label ?? `Clip ${i + 1}`;
                  const active = art.id === selected?.id;
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
                          {art.reviewStatus === "approved" && (
                            <span className="absolute top-1 left-1 z-10 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              Approved
                            </span>
                          )}
                          {art.reviewStatus === "pending" && (
                            <span className="absolute top-1 left-1 z-10 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="px-2.5 py-2">
                          <p className="truncate text-[12px] font-medium">
                            {label}
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            {art.clipWindow
                              ? `${(art.clipWindow.startMs / 1000).toFixed(1)}s–${(art.clipWindow.endMs / 1000).toFixed(1)}s · `
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
                    disabled={enrichBusy}
                    className={adminOutlineBtn("h-9 px-4 text-[13px]")}
                    onClick={() => void enrichTags(selected.id)}
                    title="Extract stills from tags + optional vision labels for library search"
                  >
                    {enrichBusy ? "Enriching…" : "Enrich tags → stills"}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {playbook.items.map((item) => {
          const row = session.items.find((i) => i.playbookItemId === item.id);
          const status = row?.status ?? "todo";
          const done = status === "done";
          return (
            <div
              key={item.id}
              className={cn(
                "flex flex-col gap-3 rounded-[20px] border border-black/[0.06] bg-white p-5",
                done && "bg-neutral-50/80",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold">{item.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        item.required
                          ? "bg-neutral-950 text-white"
                          : "bg-neutral-100 text-neutral-600",
                      )}
                    >
                      {item.required ? "Required" : "Optional"}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600">
                      {item.kind}
                    </span>
                    {item.tags?.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-[13px] text-neutral-500">{item.hint}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() =>
                    mark(
                      item.id,
                      "done",
                      (row?.captureCount || 0) + 1,
                    )
                  }
                  className={adminPrimaryBtn("disabled:opacity-50")}
                >
                  Captured (+1)
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => mark(item.id, "skipped")}
                  className={adminOutlineBtn("disabled:opacity-50")}
                >
                  Skip
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => mark(item.id, "blocked")}
                  className={adminOutlineBtn("disabled:opacity-50")}
                >
                  Blocked
                </button>
                <span className="text-[12px] text-neutral-400">
                  shots: {row?.captureCount ?? 0} — {status}
                </span>
              </div>
              <Textarea
                placeholder="Note for this step (optional)"
                className="min-h-[64px] rounded-xl border-neutral-200 text-[13px]"
                defaultValue={row?.note ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v === (row?.note ?? "")) return;
                  void patchItem(item.id, { note: v });
                }}
              />
            </div>
          );
        })}
      </div>

      {selected && reviewOpen && (
        <ClipReviewModal
          open
          tone="light"
          sessionId={session.id}
          clip={selected}
          title={
            playbook.items.find((p) => p.id === selected.coverageStepId)
              ?.label ?? "Clip"
          }
          onClose={() => setReviewOpen(false)}
          onSession={setSession}
          onApprove={() => void reviewArtifact(selected, "approved")}
        />
      )}
    </div>
  );
}
