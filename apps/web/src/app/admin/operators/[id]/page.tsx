import { notFound } from "next/navigation";
import {
  AdminShell,
  adminOutlineBtn,
} from "@/components/admin/admin-shell";
import { BrandDesk } from "@/components/admin/brand-desk";
import { coverageStepsForProducts } from "@/lib/admin/coverage-pack";
import { platformCoverageForOperator } from "@/lib/admin/platform-coverage";
import { getOperator, listSessions } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export default async function OperatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const operator = await getOperator(id);
  if (!operator) notFound();
  const sessions = await listSessions(operator.id);
  const platformCoverage = platformCoverageForOperator(operator, sessions);
  const coverageSteps = coverageStepsForProducts(operator.products);

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
      <BrandDesk
        operator={operator}
        sessions={sessions}
        coverageSteps={coverageSteps}
        platformCoverage={platformCoverage}
      />
    </AdminShell>
  );
}
