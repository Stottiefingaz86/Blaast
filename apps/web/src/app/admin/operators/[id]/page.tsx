import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminShell,
  adminOutlineBtn,
} from "@/components/admin/admin-shell";
import { OperatorSegmentForm } from "@/components/admin/operator-segment-form";
import { StartCaptureForm } from "@/components/admin/start-capture-form";
import { platformCoverageForOperator } from "@/lib/admin/platform-coverage";
import { playbooksForProducts } from "@/lib/admin/playbooks";
import { getOperator, listSessions } from "@/lib/admin/store";
import { platformLabel } from "@/lib/admin/viewport-presets";

export const dynamic = "force-dynamic";

export default async function OperatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const operator = await getOperator(id);
  if (!operator) notFound();
  const playbooks = playbooksForProducts(operator.products);
  const sessions = await listSessions(operator.id);
  const platformCoverage = platformCoverageForOperator(operator, sessions);

  return (
    <AdminShell
      title={operator.name}
      action={
        <a
          href={operator.url}
          target="_blank"
          rel="noreferrer"
          className={adminOutlineBtn()}
        >
          Open site
        </a>
      }
    >
      <section className="rounded-[20px] border border-black/[0.06] bg-white p-6">
        <p className="text-[13px] text-neutral-500">{operator.url}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            operator.vertical,
            operator.referenceTier,
            ...operator.markets,
            ...(operator.regions ?? []),
            ...operator.products,
            ...operator.tags,
          ]
            .filter(Boolean)
            .map((t) => (
              <span
                key={String(t)}
                className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700"
              >
                {t}
              </span>
            ))}
        </div>
        {operator.notes && (
          <p className="mt-4 text-[13px] whitespace-pre-wrap text-neutral-600">
            {operator.notes}
          </p>
        )}
      </section>

      <OperatorSegmentForm operator={operator} />

      <StartCaptureForm
        operatorId={operator.id}
        playbooks={playbooks}
        markets={operator.markets}
        platformCoverage={platformCoverage}
      />

      <section className="rounded-[20px] border border-black/[0.06] bg-white p-2">
        <h2 className="px-3 pt-3 text-[13px] font-semibold">Sessions</h2>
        {sessions.length === 0 && (
          <p className="px-3 py-4 text-[13px] text-neutral-400">None yet.</p>
        )}
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={`/admin/capture/${s.id}`}
            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] hover:bg-neutral-50"
          >
            <span>
              {s.playbookId === "brand-coverage" ? "Brand E2E" : s.playbookId}
              {" · "}
              {platformLabel(s.platform)}
            </span>
            <span className="text-neutral-400">{s.status}</span>
          </Link>
        ))}
      </section>
    </AdminShell>
  );
}
