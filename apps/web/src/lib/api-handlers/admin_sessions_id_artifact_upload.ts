import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/admin/store";
import { createSignedCaptureUpload } from "@/lib/storage/captures";

/**
 * Mint signed Storage upload URLs so the capture stage can PUT video/poster
 * directly (avoids Vercel’s small JSON body limit for base64 webm).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let body: { coverageStepId?: string; hasPoster?: boolean } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    /* empty */
  }
  if (!body.coverageStepId) {
    return NextResponse.json(
      { error: "coverageStepId required" },
      { status: 400 },
    );
  }

  const artifactId = randomUUID();
  const videoPath = `${sessionId}/${artifactId}.webm`;
  const posterPath = `${sessionId}/${artifactId}.png`;

  const video = await createSignedCaptureUpload({ objectPath: videoPath });
  if (!video) {
    return NextResponse.json(
      {
        error:
          "Could not mint storage upload URL — check Supabase keys on Vercel",
      },
      { status: 502 },
    );
  }

  let poster: Awaited<ReturnType<typeof createSignedCaptureUpload>> = null;
  if (body.hasPoster !== false) {
    poster = await createSignedCaptureUpload({ objectPath: posterPath });
  }

  return NextResponse.json({
    artifactId,
    videoPath: video.path,
    videoUploadUrl: video.signedUrl,
    videoToken: video.token,
    posterPath: poster?.path ?? posterPath,
    posterUploadUrl: poster?.signedUrl ?? null,
    posterToken: poster?.token ?? null,
  });
}
