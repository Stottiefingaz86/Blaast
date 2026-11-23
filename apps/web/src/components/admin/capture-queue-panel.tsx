import Link from "next/link";
import type { CaptureQueueRow } from "@/lib/admin/capture-queue";
import { captureQueueSummary } from "@/lib/admin/capture-queue";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<CaptureQueueRow["status"], string> = {
  todo: "To do",
  in_progress: "In progress",
  captured: "Captured",
  reviewed: "Reviewed",
};

const STATUS_CLASS: Record<CaptureQueueRow["status"], string> = {
  todo: "bg-neutral-100 text-neutral-600",
  in_progress: "bg-amber-50 text-amber-800",
  captured: "bg-sky-50 text-sky-800",
  reviewed: "bg-emerald-50 text-emerald-800",
};

type Props = {
  rows: CaptureQueueRow[];
  /** Show only incomplete rows when true */
  remainingOnly?: boolean;
  limit?: number;
};

export function CaptureQueuePanel({
  rows,
  remainingOnly = false,
  limit,
}: Props) {
  const summary = captureQueueSummary(rows);
  let list = remainingOnly
    ? rows.filter((r) => r.status === "todo" || r.status === "in_progress")
    : rows;
  if (limit) list = list.slice(0, limit);

  return (
    <section className="rounded-[20px] border border-black/[0.06] bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-[15px] font-semibold">Capture queue</h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            {summary.todo} to do · {summary.in_progress} in progress ·{" "}
            {summary.captured + summary.reviewed} captured of {rows.length}
          </p>
        </div>
        <Link
          href="/admin/operators"
          className="text-[12px] font-medium text-neutral-500 hover:text-neutral-900"
        >
          All sites →
        </Link>
      </div>

      <div className="mt-4 max-h-[min(60vh,520px)] overflow-auto rounded-xl border border-black/[0.04]">
        <table className="w-full text-left text-[13px]">
          <thead className="sticky top-0 bg-neutral-50 text-[11px] uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Operator</th>
              <th className="hidden px-3 py-2 font-medium sm:table-cell">
                Focus
              </th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr
                key={row.id}
                className="border-t border-black/[0.04] hover:bg-neutral-50/80"
              >
                <td className="px-3 py-2.5 tabular-nums text-neutral-400">
                  {row.rank}
                </td>
                <td className="px-3 py-2.5">
                  {row.operatorId ? (
                    <Link
                      href={`/admin/operators/${row.operatorId}`}
                      className="font-medium text-neutral-900 hover:underline"
                    >
                      {row.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-neutral-900">
                      {row.name}
                    </span>
                  )}
                  <span className="mt-0.5 block text-[11px] text-neutral-400">
                    {row.domain}
                    {row.desktopLabel || row.mobileLabel
                      ? ` · ${[row.desktopLabel, row.mobileLabel].filter(Boolean).join(" · ")}`
                      : ""}
                  </span>
                </td>
                <td className="hidden px-3 py-2.5 text-neutral-500 sm:table-cell">
                  {row.verticals.slice(0, 2).join(", ")}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                      STATUS_CLASS[row.status],
                    )}
                  >
                    {STATUS_LABEL[row.status]}
                  </span>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-neutral-400"
                >
                  Queue clear — every listed brand is captured.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
