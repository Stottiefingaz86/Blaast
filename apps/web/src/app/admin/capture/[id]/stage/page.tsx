import { notFound } from "next/navigation";
import { CaptureStage } from "@/components/admin/capture-stage";
import {
  COVERAGE_PACK_ID,
  coverageStepsForProducts,
  type CoverageStep,
} from "@/lib/admin/coverage-pack";
import { playbookById } from "@/lib/admin/playbooks";
import { getOperator, getSession } from "@/lib/admin/store";
import type { PlaybookItem } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

function playbookItemsToSteps(items: PlaybookItem[]): CoverageStep[] {
  return items.map((item) => ({
    id: item.id,
    instruction: item.label,
    hint: item.hint ?? "",
    taxonomy:
      item.kind === "ui_element"
        ? "ui_element"
        : item.kind === "state"
          ? "flow_beat"
          : "screen",
    tags: item.tags ?? [],
    productGate: "cross_product",
    required: item.required,
    recordMode: "clip",
    countdownSec: 3,
    maxClipSec: 300,
  }));
}

export default async function CaptureStagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();
  const operator = await getOperator(session.operatorId);
  if (!operator) notFound();

  let coverageSteps: CoverageStep[] =
    session.playbookId === COVERAGE_PACK_ID
      ? coverageStepsForProducts(operator.products)
      : [];

  if (!coverageSteps.length) {
    const playbook = playbookById(session.playbookId, operator.products);
    if (playbook?.items?.length) {
      coverageSteps = playbookItemsToSteps(playbook.items);
    }
  }

  if (!coverageSteps.length) notFound();

  return (
    <CaptureStage
      initialSession={session}
      operator={operator}
      coverageSteps={coverageSteps}
    />
  );
}
