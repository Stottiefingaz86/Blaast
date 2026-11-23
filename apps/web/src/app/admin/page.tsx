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

      <CaptureQueuePanel rows={queue} remainingOnly limit={40} />

      <section className="rounded-[20px] border border-black/[0.06] bg-white p-6">
        <h2 className="text-[15px] font-semibold">Guided brand coverage</h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          Same taxonomy for every brand: open site → record (share the window
          once) → stop → next beat reuses the share. Home → Sign up → Deposit
          first.
        </p>
        <ol className="mt-3 flex flex-col gap-2 text-[13px] text-neutral-600">
          <li>1. Sites → Add site from the queue (or paste a URL).</li>
          <li>2. Start Desktop E2E → allow popups → site window opens.</li>
          <li>
            3. Start recording → pick that window once → Stop when the beat is
            done. Later clips keep the same share.
          </li>
          <li>4. Approve on the desk — only approved clips hit the library.</li>
        </ol>
      </section>

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
