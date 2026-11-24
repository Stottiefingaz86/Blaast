"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/admin/brand-logo";
import { ClipReviewModal } from "@/components/admin/clip-review-modal";
import { CaptureMedia } from "@/components/library/capture-media";
import { OperatorSegmentForm } from "@/components/admin/operator-segment-form";
import {
  COVERAGE_PACK_ID,
  coverageJourneyProgress,
  type CoverageStep,
} from "@/lib/admin/coverage-pack";
import type { PlatformCoverage } from "@/lib/admin/platform-coverage";
import type {
  CaptureSession,
  Operator,
  Platform,
  RecordingArtifact,
} from "@/lib/admin/types";
import { vpnHintForBrand } from "@/lib/admin/vpn-hint";
import { cn } from "@/lib/utils";

type ClipRow = RecordingArtifact & {
  sessionId: string;
  platform: Platform;
  stepLabel: string;
};

type Props = {
  operator: Operator;
  sessions: CaptureSession[];
  coverageSteps: CoverageStep[];
  platformCoverage: {
    desktop: PlatformCoverage;
    mobile: PlatformCoverage;
  };
};

export function BrandDesk({
  operator,
  sessions: initialSessions,
  coverageSteps,
  platformCoverage,
}: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [platformFilter, setPlatformFilter] = useState<
    "all" | "desktop_web" | "mobile_web"
  >("all");
  const [review, setReview] = useState<ClipRow | null>(null);
  const [pending, setPending] = useState(false);

  const stepLabel = (id: string) =>
    coverageSteps.find((s) => s.id === id)?.instruction ?? id;

  const clips: ClipRow[] = useMemo(() => {
    const rows: ClipRow[] = [];
    for (const s of sessions) {
      for (const art of s.artifacts ?? []) {
        rows.push({
          ...art,
          sessionId: s.id,
          platform: s.platform,
          stepLabel: stepLabel(art.coverageStepId),
        });
      }
    }
    rows.sort((a, b) =>
      (b.capturedAt || "").localeCompare(a.capturedAt || ""),
    );
    return rows.filter(
      (c) =>
        platformFilter === "all" || c.platform === platformFilter,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, platformFilter, coverageSteps]);

  const desktopSession =
    platformCoverage.desktop.session ??
    sessions.find(
      (s) =>
        s.playbookId === COVERAGE_PACK_ID && s.platform === "desktop_web",
    );
  const mobileSession =
    platformCoverage.mobile.session ??
    sessions.find(
      (s) =>
        s.playbookId === COVERAGE_PACK_ID && s.platform === "mobile_web",
    );

  function statusMap(session: CaptureSession | null | undefined) {
    const m = new Map<string, string>();
    if (!session) return m;
    for (const row of session.items) m.set(row.playbookItemId, row.status);
    return m;
  }

  const activeSession =
    platformFilter === "mobile_web"
      ? mobileSession
      : desktopSession ?? mobileSession;
  const statuses = statusMap(activeSession);
  const journeys = coverageJourneyProgress(coverageSteps, statuses);

  const checklist = coverageSteps.map((step) => {
    const st = statuses.get(step.id) ?? "todo";
    const clip = (activeSession?.artifacts ?? []).find(
      (a) => a.coverageStepId === step.id,
    );
    return { step, status: st, clip };
  });
  const missing = checklist.filter(
    (c) => c.status !== "done" && c.status !== "skipped",
  );
  const doneCount = checklist.filter(
    (c) => c.status === "done" || c.status === "skipped",
  ).length;

  async function startOrContinue(
    platform: Platform,
    stepId?: string,
    openStage = true,
  ) {
    setPending(true);
    try {
      let session =
        sessions.find(
          (s) =>
            s.playbookId === COVERAGE_PACK_ID &&
            s.platform === platform &&
            (s.status === "in_progress" || s.status === "review"),
        ) ?? null;

      if (!session) {
        const res = await fetch("/api/admin/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operatorId: operator.id,
            playbookId: COVERAGE_PACK_ID,
            platform,
            market: operator.markets[0],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to start");
        session = data.session as CaptureSession;
        setSessions((prev) => [session!, ...prev]);
      }

      if (stepId) {
        const res = await fetch(`/api/admin/sessions/${session.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guide: { currentStepId: stepId, phase: "idle" },
          }),
        });
        const data = await res.json();
        if (res.ok && data.session) {
          session = data.session as CaptureSession;
          setSessions((prev) =>
            prev.map((s) => (s.id === session!.id ? session! : s)),
          );
        }
      }

      const href = openStage
        ? `/admin/capture/${session.id}/stage`
        : `/admin/capture/${session.id}`;
      if (openStage) {
        window.open(href, `blaast-stage-${session.id}`, "noopener,noreferrer");
        router.push(`/admin/capture/${session.id}`);
      } else {
        router.push(href);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  async function skipStep(stepId: string) {
    const session = activeSession;
    if (!session) {
      toast.message("Start Desktop E2E first, then you can skip steps");
      return;
    }
    const res = await fetch(`/api/admin/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playbookItemId: stepId,
        itemStatus: "skipped",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Skip failed");
      return;
    }
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? data.session : s)),
    );
    toast.success("Skipped — you can record it later");
    router.refresh();
  }

  async function setReviewStatus(
    clip: ClipRow,
    reviewStatus: "approved" | "rejected",
  ) {
    const res = await fetch(
      `/api/admin/sessions/${clip.sessionId}/artifacts/${clip.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Update failed");
      return;
    }
    const next = data.session as CaptureSession;
    setSessions((prev) => prev.map((s) => (s.id === next.id ? next : s)));
    const updated = next.artifacts?.find((a) => a.id === clip.id);
    if (updated) {
      setReview({
        ...updated,
        sessionId: next.id,
        platform: next.platform,
        stepLabel: stepLabel(updated.coverageStepId),
      });
    }
    toast.success(
      reviewStatus === "approved"
        ? "Approved — published to library"
        : "Rejected",
    );
    router.refresh();
  }

  async function deleteClip(clip: ClipRow) {
    if (!confirm("Delete this clip?")) return;
    const res = await fetch(
      `/api/admin/sessions/${clip.sessionId}/artifacts/${clip.id}`,
      { method: "DELETE" },
    );
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Delete failed");
      return;
    }
    setSessions((prev) =>
      prev.map((s) => (s.id === clip.sessionId ? data.session : s)),
    );
    setReview(null);
    toast.success("Clip deleted");
    router.refresh();
  }

  function onSessionUpdate(session: CaptureSession) {
    setSessions((prev) => prev.map((s) => (s.id === session.id ? session : s)));
    if (review && review.sessionId === session.id) {
      const art = session.artifacts?.find((a) => a.id === review.id);
      if (art) {
        setReview({
          ...art,
          sessionId: session.id,
          platform: session.platform,
          stepLabel: stepLabel(art.coverageStepId),
        });
      }
    }
  }

  const desktop = platformCoverage.desktop;
  const mobile = platformCoverage.mobile;
  const vpn = vpnHintForBrand({
    domain: operator.hostname,
    regions: operator.regions,
    markets: operator.markets,
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Progress + primary actions */}
      <section className="rounded-[20px] border border-black/[0.06] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3.5">
            <BrandLogo
              domain={operator.hostname}
              name={operator.name}
              size={52}
              className="rounded-2xl"
            />
            <div className="min-w-0">
              <p className="truncate text-[18px] font-semibold tracking-tight text-neutral-950">
                {operator.name}
              </p>
              <p className="truncate text-[13px] text-neutral-500">
                {operator.url}
              </p>
              <p
                className="mt-2 inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-[12px] font-medium text-violet-900"
                title={vpn.detail}
              >
                {vpn.detail}
              </p>
              <p className="mt-2 text-[13px] text-neutral-600">
                {doneCount}/{checklist.length} steps
                {missing.length
                  ? ` · ${missing.length} missing`
                  : " · complete"}
                <span className="text-neutral-300"> · </span>
                Desktop {desktop.journeysComplete}/{desktop.journeysTotal}
                <span className="text-neutral-300"> · </span>
                Mobile {mobile.journeysComplete}/{mobile.journeysTotal}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                void startOrContinue(
                  "desktop_web",
                  missing[0]?.step.id,
                  true,
                )
              }
              className="inline-flex h-10 items-center rounded-full bg-neutral-950 px-4 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              {desktop.inProgress ? "Continue Desktop" : "Start Desktop E2E"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                void startOrContinue(
                  "mobile_web",
                  undefined,
                  true,
                )
              }
              className="inline-flex h-10 items-center rounded-full border border-neutral-200 px-4 text-[13px] font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            >
              {mobile.inProgress ? "Continue Mobile" : "Start Mobile E2E"}
            </button>
            {(desktopSession || mobileSession) && (
              <Link
                href={`/admin/capture/${(desktopSession ?? mobileSession)!.id}`}
                className="inline-flex h-10 items-center rounded-full border border-neutral-200 px-4 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Open desk
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Clips — primary surface */}
      <section className="rounded-[20px] border border-black/[0.06] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">Clips</h2>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              Open any clip to trim, tag, approve, or delete.
            </p>
          </div>
          <div className="flex gap-1 rounded-full bg-neutral-100 p-1">
            {(
              [
                ["all", "All"],
                ["desktop_web", "Desktop"],
                ["mobile_web", "Mobile"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPlatformFilter(id)}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium",
                  platformFilter === id
                    ? "bg-white text-neutral-950 shadow-sm"
                    : "text-neutral-500",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {clips.length === 0 ? (
          <div className="mt-4 flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 text-center">
            <p className="text-[14px] font-medium text-neutral-800">
              No clips yet
            </p>
            <p className="mt-1 max-w-sm text-[13px] text-neutral-500">
              Start Desktop E2E, record a beat, Stop — clips show up here for
              trim, tags, and approve.
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() => void startOrContinue("desktop_web")}
              className="mt-4 inline-flex h-9 items-center rounded-full bg-neutral-950 px-4 text-[13px] font-semibold text-white"
            >
              Start recording
            </button>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {clips.map((clip) => (
              <li key={`${clip.sessionId}-${clip.id}`}>
                <button
                  type="button"
                  onClick={() => setReview(clip)}
                  className={cn(
                    "w-full overflow-hidden rounded-2xl border text-left transition-colors hover:border-neutral-400",
                    clip.reviewStatus === "approved"
                      ? "border-emerald-400/60"
                      : "border-neutral-200",
                  )}
                >
                  <div className="relative aspect-video bg-neutral-900">
                    <CaptureMedia
                      posterUrl={
                        clip.posterPath
                          ? `/api/admin/sessions/${clip.sessionId}/artifacts/${clip.id}?file=poster&t=${clip.clipWindow?.startMs ?? 0}`
                          : undefined
                      }
                      videoUrl={
                        clip.videoPath
                          ? `/api/admin/sessions/${clip.sessionId}/artifacts/${clip.id}?file=video`
                          : undefined
                      }
                      clipWindow={clip.clipWindow}
                      loop={Boolean(clip.clipWindow)}
                      playOnHover
                      hovering={Boolean(clip.clipWindow)}
                    />
                    {clip.reviewStatus === "approved" && (
                      <span className="absolute top-2 left-2 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Approved
                      </span>
                    )}
                    <span className="absolute right-2 bottom-2 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                      {clip.platform === "mobile_web" ? "Mobile" : "Desktop"}
                    </span>
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="truncate text-[13px] font-medium">
                      {clip.stepLabel}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {(clip.annotations?.length ?? 0) > 0
                        ? `${clip.annotations!.length} tags · `
                        : ""}
                      {clip.clipWindow ? "trimmed · " : ""}
                      {clip.reviewStatus}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Checklist — missing steps easy to fill */}
      <section className="rounded-[20px] border border-black/[0.06] bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-semibold">E2E checklist</h2>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              Skip anything you want — come back and record missing steps
              anytime.
            </p>
          </div>
          <div className="flex gap-1 rounded-full bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setPlatformFilter("desktop_web")}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] font-medium",
                platformFilter !== "mobile_web"
                  ? "bg-white text-neutral-950 shadow-sm"
                  : "text-neutral-500",
              )}
            >
              Desktop list
            </button>
            <button
              type="button"
              onClick={() => setPlatformFilter("mobile_web")}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] font-medium",
                platformFilter === "mobile_web"
                  ? "bg-white text-neutral-950 shadow-sm"
                  : "text-neutral-500",
              )}
            >
              Mobile list
            </button>
          </div>
        </div>

        <ul className="mt-3 divide-y divide-neutral-100 rounded-2xl border border-neutral-100">
          {checklist.map(({ step, status, clip }) => {
            const done = status === "done";
            const skipped = status === "skipped";
            return (
              <li
                key={step.id}
                className="flex flex-wrap items-center gap-2 px-3 py-2.5"
              >
                <span
                  className={cn(
                    "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    done
                      ? "bg-emerald-100 text-emerald-800"
                      : skipped
                        ? "bg-neutral-100 text-neutral-400"
                        : "bg-amber-50 text-amber-800",
                  )}
                >
                  {done ? "✓" : skipped ? "–" : "!"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">
                    {step.instruction}
                    {!step.required && (
                      <span className="ml-1 text-[11px] font-normal text-neutral-400">
                        optional
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {step.flowId?.replace(/_/g, " ") ?? step.taxonomy}
                    {clip ? " · has clip" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {clip && (
                    <button
                      type="button"
                      onClick={() =>
                        setReview({
                          ...clip,
                          sessionId: activeSession!.id,
                          platform: activeSession!.platform,
                          stepLabel: step.instruction,
                        })
                      }
                      className="rounded-full border border-neutral-200 px-3 py-1 text-[12px] font-medium hover:bg-neutral-50"
                    >
                      Trim / tags
                    </button>
                  )}
                  {!done && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        void startOrContinue(
                          platformFilter === "mobile_web"
                            ? "mobile_web"
                            : "desktop_web",
                          step.id,
                          true,
                        )
                      }
                      className="rounded-full bg-neutral-950 px-3 py-1 text-[12px] font-semibold text-white disabled:opacity-50"
                    >
                      {clip ? "Re-record" : "Record"}
                    </button>
                  )}
                  {!done && !skipped && (
                    <button
                      type="button"
                      onClick={() => void skipStep(step.id)}
                      className="rounded-full px-3 py-1 text-[12px] text-neutral-500 hover:bg-neutral-100"
                    >
                      Skip
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {journeys.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {journeys.map((j) => (
              <span
                key={j.flowId}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium",
                  j.complete
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-neutral-100 text-neutral-600",
                )}
              >
                {j.name} {j.done}/{j.total}
              </span>
            ))}
          </div>
        )}
      </section>

      <details className="rounded-[20px] border border-black/[0.06] bg-white p-5">
        <summary className="cursor-pointer text-[13px] font-semibold text-neutral-600">
          Advanced · pattern segment (MCP)
        </summary>
        <div className="mt-4">
          <OperatorSegmentForm operator={operator} embedded />
        </div>
      </details>

      {review && (
        <ClipReviewModal
          open
          tone="light"
          sessionId={review.sessionId}
          clip={review}
          title={review.stepLabel}
          onClose={() => setReview(null)}
          onSession={onSessionUpdate}
          onDelete={() => void deleteClip(review)}
          onApprove={() => void setReviewStatus(review, "approved")}
        />
      )}
    </div>
  );
}
