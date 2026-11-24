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
 * Register a capture beat. Prefer videoPath/posterPath after direct Storage PUT;
 * videoBase64 still works for small local clips.
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
  const hasMedia =
    Boolean(body?.videoBase64) ||
    Boolean(body?.posterBase64) ||
    Boolean(body?.videoPath) ||
    Boolean(body?.posterPath);
  if (!hasMedia) {
    return NextResponse.json(
      { error: "videoPath/posterPath or base64 media required" },
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
      videoPath: body.videoPath ? String(body.videoPath) : undefined,
      posterPath: body.posterPath ? String(body.posterPath) : undefined,
      artifactId: body.artifactId ? String(body.artifactId) : undefined,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 },
    );
  }
}
