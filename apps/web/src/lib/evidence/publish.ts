import { promises as fs } from "fs";
import path from "path";
import { coverageStepById } from "@/lib/admin/coverage-pack";
import { getOperator } from "@/lib/admin/store";
import type { CaptureSession, RecordingArtifact } from "@/lib/admin/types";
import { dataDir } from "@/lib/platform/data-dir";

export type PublishedClipRecord = {
  id: string;
  sessionId: string;
  artifactId: string;
  operatorId: string;
  operatorHostname: string;
  operatorName: string;
  coverageStepId: string;
  instruction: string;
  taxonomy: string;
  tags: string[];
  annotations: RecordingArtifact["annotations"];
  durationMs?: number;
  pageUrl?: string;
  platform: string;
  market?: string;
  videoPath?: string;
  posterPath?: string;
  structurePath?: string;
  /** Library playback window — hide junk outside this range */
  clipWindow?: { startMs: number; endMs: number };
  reviewStatus: "approved";
  publishedAt: string;
  evidenceId: string;
};

const publishPath = () => path.join(dataDir(), "published-clips.json");

async function readPublished(): Promise<PublishedClipRecord[]> {
  try {
    const raw = await fs.readFile(publishPath(), "utf8");
    const parsed = JSON.parse(raw) as PublishedClipRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writePublished(rows: PublishedClipRecord[]) {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(publishPath(), JSON.stringify(rows, null, 2), "utf8");
}

function buildRecord(
  session: CaptureSession,
  art: RecordingArtifact,
  operator: { id: string; hostname: string; name: string },
): PublishedClipRecord {
  const cov = coverageStepById(art.coverageStepId);
  const annTags = (art.annotations ?? []).map((a) => a.tag);
  const tags = [...new Set([...(cov?.tags ?? []), ...annTags])];
  return {
    id: `pub-${art.id}`,
    sessionId: session.id,
    artifactId: art.id,
    operatorId: operator.id,
    operatorHostname: operator.hostname,
    operatorName: operator.name,
    coverageStepId: art.coverageStepId,
    instruction: cov?.instruction ?? art.coverageStepId,
    taxonomy: cov?.taxonomy ?? "screen",
    tags,
    annotations: art.annotations ?? [],
    durationMs: art.durationMs,
    pageUrl: art.pageUrl,
    platform: session.platform,
    market: session.market,
    videoPath: art.videoPath,
    posterPath: art.posterPath,
    structurePath: art.structurePath,
    clipWindow: art.clipWindow,
    reviewStatus: "approved",
    publishedAt: new Date().toISOString(),
    evidenceId: `ev-rec-${session.id}-${art.coverageStepId}`,
  };
}

/**
 * Persist approved clip metadata for library / MCP.
 * Local JSON always; Supabase when NEXT_PUBLIC_SUPABASE_URL + service role are set
 * and `blaast_published_clips` exists.
 */
export async function publishApprovedArtifact(
  session: CaptureSession,
  art: RecordingArtifact,
) {
  const operator = await getOperator(session.operatorId);
  if (!operator) throw new Error("Operator missing for publish");

  // Tag-anchored stills for searchable element cards
  try {
    const { capturesRoot } = await import("@/lib/admin/store");
    const { extractAnnotationStills } = await import(
      "@/lib/admin/poster-from-video"
    );
    await extractAnnotationStills({
      capturesRoot: capturesRoot(),
      artifact: art,
    });
  } catch (err) {
    console.error("[publishApprovedArtifact] annotation stills", err);
  }

  const record = buildRecord(session, art, operator);

  const rows = await readPublished();
  const next = [
    ...rows.filter((r) => r.artifactId !== art.id),
    record,
  ];
  await writePublished(next);

  await maybePublishToSupabase(record);

  // Pattern intelligence index (most_used / notable_flows MCP)
  try {
    const { rebuildPatternIndex } = await import("@/lib/patterns/aggregate");
    await rebuildPatternIndex();
  } catch (err) {
    console.error("[publishApprovedArtifact] pattern index", err);
  }

  return record;
}

export async function listPublishedClips() {
  return readPublished();
}

/** Persist annotation posterPath / enrich fields back into published JSON. */
export async function patchPublishedAnnotations(
  artifactId: string,
  annotations: NonNullable<RecordingArtifact["annotations"]>,
) {
  const rows = await readPublished();
  const idx = rows.findIndex((r) => r.artifactId === artifactId);
  if (idx < 0) return false;
  rows[idx]!.annotations = annotations;
  await writePublished(rows);
  return true;
}

async function maybePublishToSupabase(record: PublishedClipRecord) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return;

  const res = await fetch(`${url}/rest/v1/blaast_published_clips`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      id: record.id,
      session_id: record.sessionId,
      artifact_id: record.artifactId,
      operator_id: record.operatorId,
      operator_hostname: record.operatorHostname,
      operator_name: record.operatorName,
      coverage_step_id: record.coverageStepId,
      instruction: record.instruction,
      taxonomy: record.taxonomy,
      tags: record.tags,
      annotations: record.annotations ?? [],
      duration_ms: record.durationMs ?? null,
      page_url: record.pageUrl ?? null,
      platform: record.platform,
      market: record.market ?? null,
      video_path: record.videoPath ?? null,
      poster_path: record.posterPath ?? null,
      structure_path: record.structurePath ?? null,
      clip_window: record.clipWindow ?? null,
      evidence_id: record.evidenceId,
      published_at: record.publishedAt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[supabase publish]", res.status, text);
  }
}
