import Link from "next/link";
import {
  AdminShell,
  adminPrimaryBtn,
} from "@/components/admin/admin-shell";
import { listOperators, listSessions } from "@/lib/admin/store";
import { COVERAGE_STEPS } from "@/lib/admin/coverage-pack";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [operators, sessions] = await Promise.all([
    listOperators(),
    listSessions(),
  ]);
  const active = sessions.filter((s) => s.status === "in_progress").length;

  return (
    <AdminShell
      title="Capture"
      action={
        <Link href="/admin/operators" className={adminPrimaryBtn()}>
          Add site
        </Link>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Sites" value={operators.length} />
        <Stat label="Active sessions" value={active} />
        <Stat label="Coverage beats" value={COVERAGE_STEPS.length} />
      </div>

      <section className="rounded-[20px] border border-black/[0.06] bg-white p-6">
        <h2 className="text-[15px] font-semibold">Guided brand coverage</h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          Same taxonomy for every brand: instruction → 3-2-1 → short video →
          next. Place a bet, Casino lobby, Deposit, Login — comparable results.
        </p>
        <ol className="mt-3 flex flex-col gap-2 text-[13px] text-neutral-600">
          <li>1. Sites → Add site (products unlock packs).</li>
          <li>2. Start brand coverage → copy session ID.</li>
          <li>3. Open the operator → Blaast Capture → paste session ID → Start.</li>
          <li>4. Follow each beat in admin; extension records & uploads.</li>
        </ol>
        <p className="mt-3 text-[12px] text-neutral-400">
          Admin URL: /admin — not linked from the public header.
        </p>
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
