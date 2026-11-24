import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { AddOperatorForm } from "@/components/admin/add-operator-form";
import { BrandLogo } from "@/components/admin/brand-logo";
import { CaptureQueuePanel } from "@/components/admin/capture-queue-panel";
import { buildCaptureQueue } from "@/lib/admin/capture-queue";
import { listOperators, listSessions } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export default async function OperatorsPage() {
  const [operators, sessions] = await Promise.all([
    listOperators(),
    listSessions(),
  ]);
  const queue = buildCaptureQueue(operators, sessions);

  return (
    <AdminShell title="Sites">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_1fr]">
        <section className="rounded-[20px] border border-black/[0.06] bg-white p-6">
          <h2 className="text-[15px] font-semibold">Add site</h2>
          <p className="mt-1 mb-5 text-[13px] text-neutral-500">
            Or pick a brand from the queue below — Record starts Desktop E2E
            right away.
          </p>
          <AddOperatorForm />
        </section>

        <section className="rounded-[20px] border border-black/[0.06] bg-white p-5">
          <h2 className="text-[15px] font-semibold">
            Your sites · {operators.length}
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            Open a brand to see clips, trim, tags, and missing steps.
          </p>
          {operators.length === 0 ? (
            <p className="mt-8 text-[13px] text-neutral-400">
              None yet — click Record on a brand in the queue.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {operators.map((op) => (
                <li key={op.id}>
                  <Link
                    href={`/admin/operators/${op.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-neutral-50/80 px-3 py-3 transition-colors hover:border-neutral-300 hover:bg-white"
                  >
                    <BrandLogo
                      domain={op.hostname}
                      name={op.name}
                      size={40}
                      className="rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-neutral-900">
                        {op.name}
                      </p>
                      <p className="truncate text-[11px] text-neutral-400">
                        {op.hostname}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {op.products.slice(0, 3).map((p) => (
                          <span
                            key={p}
                            className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-neutral-600 ring-1 ring-black/[0.04]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <CaptureQueuePanel rows={queue} />
    </AdminShell>
  );
}
