import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";
import type { CaptureAnnotation, RecordingArtifact } from "@/lib/admin/types";

const execFileAsync = promisify(execFile);

/**
 * Extract a still from a WebM at `atMs` into `posterAbsPath` (PNG).
 * Used after trim so library tiles match the In point.
 */
export async function extractPosterFrame(opts: {
  videoAbsPath: string;
  posterAbsPath: string;
  atMs: number;
}): Promise<boolean> {
  const atSec = Math.max(0, opts.atMs) / 1000;
  await fs.mkdir(path.dirname(opts.posterAbsPath), { recursive: true });
  try {
    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-ss",
        atSec.toFixed(3),
        "-i",
        opts.videoAbsPath,
        "-frames:v",
        "1",
        "-q:v",
        "2",
        opts.posterAbsPath,
      ],
      { timeout: 60_000 },
    );
    const st = await fs.stat(opts.posterAbsPath);
    return st.size > 1000;
  } catch (err) {
    console.error("[extractPosterFrame]", err);
    return false;
  }
}

/**
 * Cache a PNG per annotation at its seek time so library/search tiles aren't black.
 * Mutates annotations in place; returns count extracted.
 */
export async function extractAnnotationStills(opts: {
  capturesRoot: string;
  artifact: RecordingArtifact;
  force?: boolean;
}): Promise<number> {
  const { capturesRoot, artifact, force } = opts;
  if (!artifact.videoPath || !artifact.annotations?.length) return 0;
  const videoAbs = path.join(capturesRoot, artifact.videoPath);
  try {
    await fs.stat(videoAbs);
  } catch {
    return 0;
  }

  let n = 0;
  for (const ann of artifact.annotations) {
    if (ann.publishElement === false) continue;
    const atMs =
      ann.clipWindow?.startMs ??
      (ann.atMs != null ? Math.max(0, ann.atMs) : undefined);
    if (atMs == null) continue;
    if (ann.posterPath && !force) {
      const existing = path.join(capturesRoot, ann.posterPath);
      try {
        const st = await fs.stat(existing);
        if (st.size > 1000) continue;
      } catch {
        /* re-extract */
      }
    }
    const rel = `${artifact.sessionId}/${artifact.id}-ann-${ann.id}.png`;
    const abs = path.join(capturesRoot, rel);
    const ok = await extractPosterFrame({
      videoAbsPath: videoAbs,
      posterAbsPath: abs,
      atMs,
    });
    if (ok) {
      ann.posterPath = rel;
      n += 1;
    }
  }
  return n;
}

export function annotationSeekMs(ann: CaptureAnnotation): number | undefined {
  if (ann.clipWindow?.startMs != null) return ann.clipWindow.startMs;
  if (ann.atMs != null) return Math.max(0, ann.atMs);
  return undefined;
}
