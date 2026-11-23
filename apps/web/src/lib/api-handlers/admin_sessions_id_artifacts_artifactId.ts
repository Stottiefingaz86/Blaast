import { createReadStream, promises as fs } from "fs";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import {
  deleteRecordingArtifact,
  resolveArtifactFile,
  setAnnotationClipWindow,
  setArtifactAnnotations,
  setArtifactClipWindow,
  setArtifactReview,
} from "@/lib/admin/store";
import type { CaptureAnnotation } from "@/lib/admin/types";
import { requireAdmin } from "@/lib/platform/auth";

export async function GET(
  req: Request,
  {
    params,
  }: { params: Promise<{ id: string; artifactId: string }> },
) {
  const { id, artifactId } = await params;
  const { searchParams } = new URL(req.url);
  const which = (searchParams.get("file") || "poster") as
    | "video"
    | "poster"
    | "structure";
  const resolved = await resolveArtifactFile(id, artifactId, which);
  if (!resolved) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (which === "structure") {
    const buf = await fs.readFile(resolved.full);
    return new NextResponse(buf, {
      headers: { "Content-Type": "application/json" },
    });
  }

  const mime =
    which === "video"
      ? resolved.artifact.mimeVideo || "video/webm"
      : resolved.artifact.mimePoster || "image/png";

  let stat;
  try {
    stat = await fs.stat(resolved.full);
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }
  const size = stat.size;
  const range = req.headers.get("range");

  if (range && which === "video") {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    if (!m) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    const start = Number(m[1]);
    const end = m[2]
      ? Number(m[2])
      : Math.min(start + 1024 * 1024 - 1, size - 1);
    if (start >= size || end >= size || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    const chunk = end - start + 1;
    const nodeStream = createReadStream(resolved.full, { start, end });
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    return new NextResponse(webStream, {
      status: 206,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(chunk),
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  const nodeStream = createReadStream(resolved.full);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;
  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function PATCH(
  req: Request,
  {
    params,
  }: { params: Promise<{ id: string; artifactId: string }> },
) {
  const { id, artifactId } = await params;
  const body = await req.json();

  if (Array.isArray(body?.annotations)) {
    const session = await setArtifactAnnotations(
      id,
      artifactId,
      body.annotations as CaptureAnnotation[],
    );
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ session });
  }

  if ("clipWindow" in (body ?? {})) {
    const raw = body.clipWindow as
      | { startMs: number; endMs: number }
      | null
      | undefined;
    if (
      raw != null &&
      (!Number.isFinite(raw.startMs) ||
        !Number.isFinite(raw.endMs) ||
        raw.endMs <= raw.startMs)
    ) {
      return NextResponse.json(
        { error: "clipWindow needs startMs < endMs" },
        { status: 400 },
      );
    }
    const annotationId =
      typeof body.annotationId === "string" ? body.annotationId : null;
    const session = annotationId
      ? await setAnnotationClipWindow(
          id,
          artifactId,
          annotationId,
          raw ?? null,
        )
      : await setArtifactClipWindow(id, artifactId, raw ?? null);
    if (!session) {
      return NextResponse.json(
        { error: "Not found or invalid clipWindow (need finite startMs < endMs)" },
        { status: 400 },
      );
    }
    return NextResponse.json({ session });
  }

  if (!body?.reviewStatus) {
    return NextResponse.json(
      { error: "reviewStatus, annotations, or clipWindow required" },
      { status: 400 },
    );
  }
  // Curators capture; only owner/admin may Approve & publish to the library
  if (body.reviewStatus === "approved") {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        {
          error:
            "Only an owner/admin can Approve & publish. Submit the clip for review instead.",
        },
        { status: 403 },
      );
    }
  }
  const session = await setArtifactReview(id, artifactId, body.reviewStatus);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ session });
}

export async function DELETE(
  _req: Request,
  {
    params,
  }: { params: Promise<{ id: string; artifactId: string }> },
) {
  const { id, artifactId } = await params;
  const session = await deleteRecordingArtifact(id, artifactId);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ session });
}
