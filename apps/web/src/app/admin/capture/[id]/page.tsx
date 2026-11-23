import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { GuidedCaptureRunner } from "@/components/admin/guided-capture-runner";
import { CaptureRunner } from "@/components/admin/capture-runner";
import {
  COVERAGE_PACK_ID,
  coverageStepsForProducts,
} from "@/lib/admin/coverage-pack";
import { playbookById } from "@/lib/admin/playbooks";
import { getOperator, getSession } from "@/lib/admin/store";
import { getSessionUser, isPublisherRole } from "@/lib/platform/auth";

export const dynamic = "force-dynamic";

export default async function CaptureSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();
  const operator = await getOperator(session.operatorId);
  if (!operator) notFound();
  const user = await getSessionUser();
  const canPublish = isPublisherRole(user?.role);

  if (session.playbookId === COVERAGE_PACK_ID) {
    const coverageSteps = coverageStepsForProducts(operator.products);
    return (
      <AdminShell title={`Coverage · ${operator.name}`}>
        <GuidedCaptureRunner
          initialSession={session}
          operator={operator}
          coverageSteps={coverageSteps}
          canPublish={canPublish}
        />
      </AdminShell>
    );
  }

  const playbook = playbookById(session.playbookId, operator.products);
  if (!playbook) notFound();

  return (
    <AdminShell title={`Capture · ${operator.name}`}>
      <CaptureRunner
        initialSession={session}
        operator={operator}
        playbook={playbook}
        canPublish={canPublish}
      />
    </AdminShell>
  );
}
