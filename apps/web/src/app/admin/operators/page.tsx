import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { AddOperatorForm } from "@/components/admin/add-operator-form";
import { listOperators } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export default async function OperatorsPage() {
  const operators = await listOperators();

  return (
    <AdminShell title="Sites">
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-[20px] border border-black/[0.06] bg-white p-6">
          <h2 className="text-[15px] font-semibold">Add site</h2>
          <p className="mt-1 mb-5 text-[13px] text-neutral-500">
            Short wizard — then run the same guided coverage pack on every brand
            (Home → Sign up → Deposit, then Place a bet / Casino …).
          </p>
          <AddOperatorForm />
        </section>

        <section className="rounded-[20px] border border-black/[0.06] bg-white p-4">
          <h2 className="px-2 pt-2 text-[15px] font-semibold">
            Catalogue · {operators.length}
          </h2>
          <div className="mt-3 flex flex-col gap-1">
            {operators.length === 0 && (
              <p className="px-2 py-6 text-[13px] text-neutral-400">
                No sites yet.
              </p>
            )}
            {operators.map((op) => (
              <Link
                key={op.id}
                href={`/admin/operators/${op.id}`}
                className="rounded-xl px-3 py-3 hover:bg-neutral-50"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[14px] font-semibold">{op.name}</span>
                  <span className="text-[11px] text-neutral-400">
                    {op.hostname}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {op.products.slice(0, 4).map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
