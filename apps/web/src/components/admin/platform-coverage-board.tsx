"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PlatformCoverage } from "@/lib/admin/platform-coverage";

export function PlatformCoverageBoard({
  desktop,
  mobile,
  onStartDesktop,
  onStartMobile,
}: {
  desktop: PlatformCoverage;
  mobile: PlatformCoverage;
  onStartDesktop: () => void;
  onStartMobile: () => void;
}) {
  return (
    <div className="rounded-[20px] border border-black/[0.06] bg-white p-6">
      <h2 className="text-[15px] font-semibold">Brand E2E coverage</h2>
      <p className="mt-1 text-[13px] text-neutral-500">
        Two sessions per brand — finish Desktop journeys, then Mobile web
        (same checklist). Do not flip mid-journey.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <PlatformCard
          coverage={desktop}
          recommended={!desktop.complete}
          onStart={onStartDesktop}
        />
        <PlatformCard
          coverage={mobile}
          recommended={desktop.complete && !mobile.complete}
          onStart={onStartMobile}
          lockedHint={
            !desktop.complete && !desktop.inProgress
              ? "Start Desktop E2E first (or continue an in-progress desktop session)."
              : undefined
          }
        />
      </div>
    </div>
  );
}

function PlatformCard({
  coverage,
  recommended,
  onStart,
  lockedHint,
}: {
  coverage: PlatformCoverage;
  recommended: boolean;
  onStart: () => void;
  lockedHint?: string;
}) {
  const softLock = Boolean(lockedHint) && coverage.platform === "mobile_web";

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-4",
        recommended
          ? "border-neutral-900 bg-neutral-50"
          : "border-neutral-200 bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[14px] font-semibold">{coverage.label}</p>
          <p className="text-[11px] text-neutral-400">
            {coverage.platform === "desktop_web"
              ? "1440×900 window"
              : "390×844 phone window"}
          </p>
        </div>
        <StatusPill coverage={coverage} />
      </div>
      <p className="mt-3 text-[22px] font-semibold tabular-nums tracking-tight">
        {coverage.journeysComplete}/{coverage.journeysTotal}
        <span className="ml-1.5 text-[12px] font-medium text-neutral-400">
          journeys
        </span>
      </p>
      <p className="text-[12px] text-neutral-500">
        {coverage.requiredDone}/{coverage.requiredTotal} required steps
        {coverage.session ? ` · ${coverage.session.status}` : " · not started"}
      </p>
      {softLock && lockedHint && (
        <p className="mt-2 text-[11px] leading-relaxed text-amber-800">
          {lockedHint}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {coverage.session && coverage.inProgress ? (
          <Link
            href={`/admin/capture/${coverage.session.id}`}
            className="inline-flex h-9 items-center rounded-full bg-neutral-950 px-4 text-[13px] font-semibold text-white"
          >
            Continue {coverage.label}
          </Link>
        ) : coverage.complete && coverage.session ? (
          <Link
            href={`/admin/capture/${coverage.session.id}`}
            className="inline-flex h-9 items-center rounded-full border border-neutral-200 px-4 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50"
          >
            View session
          </Link>
        ) : null}
        {!coverage.complete && (
          <button
            type="button"
            onClick={onStart}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-4 text-[13px] font-semibold",
              recommended
                ? "bg-neutral-950 text-white"
                : "border border-neutral-200 text-neutral-800 hover:bg-neutral-50",
            )}
          >
            {coverage.inProgress
              ? `New ${coverage.label} session`
              : `Start ${coverage.label} E2E`}
          </button>
        )}
        {coverage.complete && (
          <button
            type="button"
            onClick={onStart}
            className="inline-flex h-9 items-center rounded-full border border-neutral-200 px-4 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Re-run {coverage.label}
          </button>
        )}
      </div>
    </div>
  );
}

function StatusPill({ coverage }: { coverage: PlatformCoverage }) {
  if (coverage.complete) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
        Done
      </span>
    );
  }
  if (coverage.inProgress) {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
        In progress
      </span>
    );
  }
  return (
    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
      Todo
    </span>
  );
}
