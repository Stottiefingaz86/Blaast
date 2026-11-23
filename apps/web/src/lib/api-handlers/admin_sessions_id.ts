import { NextResponse } from "next/server";
import {
  addLiveAnnotation,
  getOperator,
  getSession,
  removeLiveAnnotation,
  setSessionStatus,
  updateSessionGuide,
  updateSessionItem,
} from "@/lib/admin/store";
import { playbookById } from "@/lib/admin/playbooks";
import { coverageStepsForProducts, COVERAGE_PACK_ID } from "@/lib/admin/coverage-pack";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const operator = await getOperator(session.operatorId);
  const playbook = playbookById(
    session.playbookId,
    operator?.products,
  );
  const coverageSteps =
    session.playbookId === COVERAGE_PACK_ID && operator
      ? coverageStepsForProducts(operator.products)
      : undefined;
  return NextResponse.json({ session, operator, playbook, coverageSteps });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  if (body?.guide) {
    const session = await updateSessionGuide(id, {
      currentStepId: body.guide.currentStepId,
      phase: body.guide.phase,
      countdownEndsAt: body.guide.countdownEndsAt,
      recordingStartedAt: body.guide.recordingStartedAt,
      maxClipSec: body.guide.maxClipSec,
    });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ session });
  }

  if (body?.status) {
    const session = await setSessionStatus(id, body.status);
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ session });
  }

  if (body?.playbookItemId) {
    const session = await updateSessionItem(id, String(body.playbookItemId), {
      status: body.itemStatus,
      note: body.note,
      captureCount:
        typeof body.captureCount === "number" ? body.captureCount : undefined,
    });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ session });
  }

  if (body?.annotation && body?.coverageStepId) {
    const r = body.annotation.region;
    const session = await addLiveAnnotation(id, String(body.coverageStepId), {
      label: String(body.annotation.label ?? ""),
      tag: String(body.annotation.tag ?? body.annotation.label ?? ""),
      comment: body.annotation.comment
        ? String(body.annotation.comment)
        : undefined,
      atMs:
        typeof body.annotation.atMs === "number"
          ? body.annotation.atMs
          : undefined,
      region:
        r &&
        typeof r.x === "number" &&
        typeof r.y === "number" &&
        typeof r.w === "number" &&
        typeof r.h === "number"
          ? { x: r.x, y: r.y, w: r.w, h: r.h }
          : undefined,
    });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ session });
  }

  if (body?.removeAnnotationId && body?.coverageStepId) {
    const session = await removeLiveAnnotation(
      id,
      String(body.coverageStepId),
      String(body.removeAnnotationId),
    );
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ session });
  }

  return NextResponse.json({ error: "Invalid patch" }, { status: 400 });
}
