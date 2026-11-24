import Link from "next/link";
import {
  AdminShell,
  adminPrimaryBtn,
} from "@/components/admin/admin-shell";
import { CaptureQueuePanel } from "@/components/admin/capture-queue-panel";
import { buildCaptureQueue } from "@/lib/admin/capture-queue";
import { listOperators, listSessions } from "@/lib/admin/store";
import { COVERAGE_STEPS } from "@/lib/admin/coverage-pack";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [operators, sessions] = await Promise.all([
    listOperators(),
    listSessions(),
  ]);
  const active = sessions.filter((s) => s.status === "in_progress").length;
  const queue = buildCaptureQueue(operators, sessions);
  const remaining = queue.filter(
    (r) => r.status === "todo" || r.status === "in_progress",
  ).length;

  return (
    <AdminShell
      title="Capture"
      action={
        <Link href="/admin/operators" className={adminPrimaryBtn()}>
          Add site
        </Link>
      }
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Sites added" value={operators.length} />
        <Stat label="Queue remaining" value={remaining} />
        <Stat label="Active sessions" value={active} />
        <Stat label="Coverage beats" value={COVERAGE_STEPS.length} />
      </div>

      <CaptureQueuePanel rows={queue} remainingOnly limit={48} />

      {sessions.slice(0, 6).length > 0 && (
        <section className="rounded-[20px] border border-black/[0.06] bg-white p-2">
          {sessions.slice(0, 6).map((s) => {
            const op = operators.find((o) => o.id === s.operatorId);
            return (
              <Link
                key={s.id}
                href={`/admin/capture/${s.id}`}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-[13px] hover:bg-neutral-50"
              >
                <span className="font-medium">
                  {op?.name ?? "Site"} · {s.playbookId}
                </span>
                <span className="text-neutral-400">{s.status}</span>
              </Link>
            );
          })}
        </section>
      )}
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-black/[0.06] bg-white p-5">
      <p className="text-[12px] text-neutral-400">{label}</p>
      <p className="mt-1 text-[28px] font-semibold tracking-tight">{value}</p>
    </div>
  );
}
