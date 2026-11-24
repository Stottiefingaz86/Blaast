"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/admin/brand-logo";
import type { CaptureQueueRow } from "@/lib/admin/capture-queue";
import { captureQueueSummary } from "@/lib/admin/capture-queue";
import { COVERAGE_PACK_ID } from "@/lib/admin/coverage-pack";
import { suggestFromHostname } from "@/lib/admin/operator-directory";
import { OPERATOR_LOGOS } from "@/lib/marketing/operator-logos";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<CaptureQueueRow["status"], string> = {
  todo: "To do",
  in_progress: "In progress",
  captured: "Captured",
  reviewed: "Done",
};

const STATUS_CLASS: Record<CaptureQueueRow["status"], string> = {
  todo: "bg-neutral-100 text-neutral-600",
  in_progress: "bg-amber-50 text-amber-900",
  captured: "bg-sky-50 text-sky-900",
  reviewed: "bg-emerald-50 text-emerald-800",
};

type Props = {
  rows: CaptureQueueRow[];
  remainingOnly?: boolean;
  limit?: number;
};

function logoMeta(domain: string) {
  return OPERATOR_LOGOS.find(
    (o) => o.domain.toLowerCase() === domain.toLowerCase(),
  );
}

function verticalFromLogo(
  verticals: string[],
): "crypto_casino" | "traditional_sportsbook" | "hybrid" | "other" {
  const v = verticals.map((x) => x.toLowerCase());
  const casino = v.some((x) => x.includes("casino"));
  const sports = v.some(
    (x) => x.includes("sport") || x.includes("racing") || x.includes("dfs"),
  );
  if (casino && sports) return "hybrid";
  if (casino) return "crypto_casino";
  if (sports) return "traditional_sportsbook";
  return "other";
}

export function CaptureQueuePanel({
  rows,
  remainingOnly = false,
  limit,
}: Props) {
  const router = useRouter();
  const summary = captureQueueSummary(rows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    let next = remainingOnly
      ? rows.filter((r) => r.status === "todo" || r.status === "in_progress")
      : rows;
    const q = query.trim().toLowerCase();
    if (q) {
      next = next.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.domain.toLowerCase().includes(q) ||
          r.verticals.some((v) => v.toLowerCase().includes(q)),
      );
    }
    if (limit) next = next.slice(0, limit);
    return next;
  }, [rows, remainingOnly, limit, query]);

  async function openBrand(row: CaptureQueueRow, startRecording: boolean) {
    setBusyId(row.id);
    try {
      let operatorId = row.operatorId;
      if (!operatorId) {
        const hint = suggestFromHostname(row.domain);
        const res = await fetch("/api/admin/operators", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.name,
            url: `https://${row.domain}`,
            markets: hint.markets,
            products: hint.products,
            regions: row.regions,
            vertical: verticalFromLogo(row.verticals),
            referenceTier: "notable",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not add site");
        operatorId = data.operator.id as string;
        toast.success(`${row.name} added`);
      }

      if (!startRecording) {
        router.push(`/admin/operators/${operatorId}`);
        return;
      }

      // Prefer continue in-progress desktop session via brand page; else start E2E
      const sessRes = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId,
          playbookId: COVERAGE_PACK_ID,
          platform: "desktop_web",
        }),
      });
      const sessData = await sessRes.json();
      if (!sessRes.ok) throw new Error(sessData.error || "Could not start");
      const sessionId = sessData.session.id as string;
      toast.success(`${row.vpn.detail} · then capture opens`);
      toast.message(`Recording ${row.name}`);
      window.open(
        `/admin/capture/${sessionId}/stage`,
        `blaast-stage-${sessionId}`,
        "noopener,noreferrer",
      );
      router.push(`/admin/capture/${sessionId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-[20px] border border-black/[0.06] bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">Capture brands</h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            Click a brand to open it, or <strong className="font-medium text-neutral-700">Record</strong> to
            start Desktop E2E immediately.
          </p>
          <p className="mt-1 text-[12px] text-neutral-400">
            {summary.todo} to do · {summary.in_progress} in progress ·{" "}
            {summary.captured + summary.reviewed} captured of {rows.length}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brands…"
            className="h-9 w-[180px] rounded-full border border-neutral-200 bg-white px-3 text-[13px] outline-none focus:border-neutral-400"
          />
          <Link
            href="/admin/operators"
            className="text-[12px] font-medium text-neutral-500 hover:text-neutral-900"
          >
            All sites →
          </Link>
        </div>
      </div>

      <div className="mt-4 grid max-h-[min(70vh,640px)] grid-cols-2 gap-2.5 overflow-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {list.map((row) => {
          const meta = logoMeta(row.domain);
          const busy = busyId === row.id;
          return (
            <div
              key={row.id}
              className={cn(
                "group relative flex flex-col rounded-2xl border border-black/[0.06] bg-neutral-50/60 p-3 transition-colors hover:border-neutral-300 hover:bg-white",
                busy && "opacity-60",
              )}
            >
              <button
                type="button"
                disabled={busy}
                onClick={() => void openBrand(row, false)}
                className="flex flex-col items-start text-left"
              >
                <BrandLogo
                  domain={row.domain}
                  name={row.name}
                  size={44}
                  color={meta?.color}
                  className="rounded-2xl"
                />
                <p className="mt-2.5 w-full truncate text-[13px] font-semibold text-neutral-900">
                  {row.name}
                </p>
                <p className="w-full truncate text-[11px] text-neutral-400">
                  {row.domain}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                      STATUS_CLASS[row.status],
                    )}
                  >
                    {STATUS_LABEL[row.status]}
                  </span>
                  <span
                    className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-800"
                    title={row.vpn.detail}
                  >
                    VPN {row.vpn.label}
                  </span>
                </div>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void openBrand(row, true)}
                className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-full bg-neutral-950 text-[12px] font-semibold text-white opacity-100 transition-opacity group-hover:opacity-100 disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100"
              >
                {busy ? "Starting…" : "Record"}
              </button>
            </div>
          );
        })}
        {list.length === 0 && (
          <p className="col-span-full py-10 text-center text-[13px] text-neutral-400">
            No brands match.
          </p>
        )}
      </div>
    </section>
  );
}
