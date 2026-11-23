import { NextResponse } from "next/server";
import { getSession, saveRecordingArtifact } from "@/lib/admin/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ artifacts: session.artifacts ?? [] });
}

/**
 * Upload a recording step from the capture extension.
 * Body JSON: coverageStepId, kind, videoBase64?, posterBase64?, structureJson?, …
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  if (!body?.coverageStepId) {
    return NextResponse.json(
      { error: "coverageStepId required" },
      { status: 400 },
    );
  }
  if (!body?.videoBase64 && !body?.posterBase64) {
    return NextResponse.json(
      { error: "videoBase64 or posterBase64 required" },
      { status: 400 },
    );
  }
  try {
    const result = await saveRecordingArtifact({
      sessionId: id,
      coverageStepId: String(body.coverageStepId),
      kind: body.kind === "still" ? "still" : "clip",
      pageUrl: body.pageUrl ? String(body.pageUrl) : undefined,
      pageTitle: body.pageTitle ? String(body.pageTitle) : undefined,
      viewport: body.viewport,
      sensitiveFlags: Array.isArray(body.sensitiveFlags)
        ? body.sensitiveFlags.map(String)
        : [],
      durationMs:
        typeof body.durationMs === "number" ? body.durationMs : undefined,
      videoBase64: body.videoBase64 ? String(body.videoBase64) : undefined,
      videoMime: body.videoMime ? String(body.videoMime) : "video/webm",
      posterBase64: body.posterBase64 ? String(body.posterBase64) : undefined,
      posterMime: body.posterMime ? String(body.posterMime) : "image/png",
      structureJson: body.structureJson,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 },
    );
  }
}
