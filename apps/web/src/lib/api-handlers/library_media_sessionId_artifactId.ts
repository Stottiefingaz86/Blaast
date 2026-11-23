import { createReadStream, promises as fs } from "fs";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import path from "path";
import {
  listPublishedClips,
  patchPublishedAnnotations,
} from "@/lib/evidence/publish";
import { capturesRoot } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

/** Public media with Range support — avoid loading 20MB+ WebMs into RAM. */
export async function GET(
  req: Request,
  {
    params,
  }: { params: Promise<{ sessionId: string; artifactId: string }> },
) {
  const { sessionId, artifactId } = await params;
  const url = new URL(req.url);
  const which = url.searchParams.get("file") || "poster";
  const annId = url.searchParams.get("ann");
  const atParam = url.searchParams.get("t");
  if (which !== "poster" && which !== "video") {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const published = await listPublishedClips();
  const rec = published.find(
    (p) => p.sessionId === sessionId && p.artifactId === artifactId,
  );
  if (!rec) {
    return NextResponse.json({ error: "Not published" }, { status: 404 });
  }

  let rel =
    which === "video"
      ? rec.videoPath
      : annId
        ? (rec.annotations?.find((a) => a.id === annId)?.posterPath ??
          rec.posterPath)
        : rec.posterPath;

  // Lazy extract still when ann poster missing but we have video + time
  if (
    which === "poster" &&
    annId &&
    !rec.annotations?.find((a) => a.id === annId)?.posterPath
  ) {
    const ann = rec.annotations?.find((a) => a.id === annId);
    const atMs =
      ann?.clipWindow?.startMs ??
      ann?.atMs ??
      (atParam != null ? Number(atParam) : undefined);
    if (ann && rec.videoPath && atMs != null && Number.isFinite(atMs)) {
      try {
        const { extractPosterFrame } = await import(
          "@/lib/admin/poster-from-video"
        );
        const stillRel = `${sessionId}/${artifactId}-ann-${annId}.png`;
        const ok = await extractPosterFrame({
          videoAbsPath: path.join(capturesRoot(), rec.videoPath),
          posterAbsPath: path.join(capturesRoot(), stillRel),
          atMs,
        });
        if (ok) {
          ann.posterPath = stillRel;
          rel = stillRel;
          await patchPublishedAnnotations(
            artifactId,
            rec.annotations ?? [],
          );
        }
      } catch (err) {
        console.error("[media] lazy ann still", err);
      }
    }
  }

  if (!rel) {
    return NextResponse.json({ error: "Missing media" }, { status: 404 });
  }

  const full = path.join(capturesRoot(), rel);
  let stat;
  try {
    stat = await fs.stat(full);
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }

  const contentType = which === "video" ? "video/webm" : "image/png";
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
    const end = m[2] ? Number(m[2]) : Math.min(start + 1024 * 1024 - 1, size - 1);
    if (start >= size || end >= size || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    const chunk = end - start + 1;
    const nodeStream = createReadStream(full, { start, end });
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    return new NextResponse(webStream, {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(chunk),
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const nodeStream = createReadStream(full);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;
  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
