import { promises as fs } from "fs";
import path from "path";
import { coverageStepById } from "@/lib/admin/coverage-pack";
import { getOperator, listSessions } from "@/lib/admin/store";
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
  /** Public Supabase Storage URLs when uploaded */
  videoUrl?: string;
  posterUrl?: string;
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

function mergeByArtifactId(
  ...lists: PublishedClipRecord[][]
): PublishedClipRecord[] {
  const byId = new Map<string, PublishedClipRecord>();
  for (const list of lists) {
    for (const row of list) {
      if (!row?.artifactId) continue;
      const prev = byId.get(row.artifactId);
      if (!prev) {
        byId.set(row.artifactId, row);
        continue;
      }
      // Prefer the newer publish; keep cloud URLs if the newer row lacks them
      const newer =
        (row.publishedAt || "") >= (prev.publishedAt || "") ? row : prev;
      const older = newer === row ? prev : row;
      byId.set(row.artifactId, {
        ...older,
        ...newer,
        videoUrl: newer.videoUrl || older.videoUrl,
        posterUrl: newer.posterUrl || older.posterUrl,
        videoPath: newer.videoPath || older.videoPath,
        posterPath: newer.posterPath || older.posterPath,
      });
    }
  }
  return [...byId.values()].sort((a, b) =>
    (b.publishedAt || "").localeCompare(a.publishedAt || ""),
  );
}

async function fetchCloudIndex(): Promise<PublishedClipRecord[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return [];
  try {
    const idxRes = await fetch(
      `${url}/storage/v1/object/public/blaast-captures/published-index.json?t=${Date.now()}`,
      { cache: "no-store" },
    );
    if (!idxRes.ok) return [];
    const rows = (await idxRes.json()) as PublishedClipRecord[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

async function fetchCloudTable(): Promise<PublishedClipRecord[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/blaast_published_clips?select=*&order=published_at.desc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(rows) || !rows.length) return [];
    return rows.map((r) => {
      const videoPath = String(r.video_path ?? "");
      const posterPath = String(r.poster_path ?? "");
      return {
        id: String(r.id),
        sessionId: String(r.session_id),
        artifactId: String(r.artifact_id),
        operatorId: String(r.operator_id),
        operatorHostname: String(r.operator_hostname),
        operatorName: String(r.operator_name),
        coverageStepId: String(r.coverage_step_id),
        instruction: String(r.instruction),
        taxonomy: String(r.taxonomy),
        tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
        annotations: Array.isArray(r.annotations)
          ? (r.annotations as PublishedClipRecord["annotations"])
          : [],
        durationMs:
          typeof r.duration_ms === "number" ? r.duration_ms : undefined,
        pageUrl: r.page_url ? String(r.page_url) : undefined,
        platform: String(r.platform ?? "desktop_web"),
        market: r.market ? String(r.market) : undefined,
        videoPath: videoPath.startsWith("http")
          ? undefined
          : videoPath || undefined,
        posterPath: posterPath.startsWith("http")
          ? undefined
          : posterPath || undefined,
        videoUrl: videoPath.startsWith("http") ? videoPath : undefined,
        posterUrl: posterPath.startsWith("http") ? posterPath : undefined,
        structurePath: r.structure_path
          ? String(r.structure_path)
          : undefined,
        reviewStatus: "approved" as const,
        publishedAt: String(r.published_at ?? new Date().toISOString()),
        evidenceId: String(r.evidence_id ?? r.id),
      };
    });
  } catch {
    return [];
  }
}

async function writePublished(rows: PublishedClipRecord[]) {
  await fs.mkdir(dataDir(), { recursive: true });
  // Merge with cloud before overwrite so one machine cannot wipe another brand
  const cloud = await fetchCloudIndex();
  const merged = mergeByArtifactId(cloud, rows);
  await fs.writeFile(publishPath(), JSON.stringify(merged, null, 2), "utf8");
  await uploadPublishedIndex(merged);
}

/** Durable catalog for Vercel when Postgres table isn’t applied yet. */
async function uploadPublishedIndex(rows: PublishedClipRecord[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return;
  const body = JSON.stringify(rows);
  const res = await fetch(
    `${url}/storage/v1/object/blaast-captures/published-index.json`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "x-upsert": "true",
      },
      body,
    },
  );
  if (!res.ok) {
    console.error(
      "[published-index upload]",
      res.status,
      (await res.text()).slice(0, 200),
    );
  }
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

  try {
    const { uploadPublishedMedia } = await import("@/lib/storage/captures");
    const urls = await uploadPublishedMedia({
      sessionId: session.id,
      artifactId: art.id,
      videoPath: art.videoPath,
      posterPath: art.posterPath,
    });
    if (urls.videoUrl) record.videoUrl = urls.videoUrl;
    if (urls.posterUrl) record.posterUrl = urls.posterUrl;
  } catch (err) {
    console.error("[publishApprovedArtifact] storage upload", err);
  }

  // Merge against local+cloud so one publish never drops another brand
  const rows = await listPublishedClipsMerged();
  const next = mergeByArtifactId(rows, [record]);
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

/**
 * Re-publish every approved artifact in admin sessions.
 * Recovers library when local JSON / cloud index drifted or was overwritten.
 */
export async function republishAllApproved(): Promise<{
  published: number;
  failed: number;
}> {
  const sessions = await listSessions();
  let published = 0;
  let failed = 0;
  for (const session of sessions) {
    for (const art of session.artifacts ?? []) {
      if (art.reviewStatus !== "approved") continue;
      try {
        await publishApprovedArtifact(session, art);
        published += 1;
      } catch (err) {
        failed += 1;
        console.error(
          "[republishAllApproved]",
          art.id,
          art.coverageStepId,
          err,
        );
      }
    }
  }
  return { published, failed };
}

export async function listPublishedClips() {
  return listPublishedClipsMerged();
}

/**
 * Remove a clip from the public library (local + Storage index).
 * Does not merge-restore from cloud — the filtered list becomes the new source of truth.
 */
export async function unpublishArtifact(artifactId: string): Promise<boolean> {
  if (!artifactId) return false;
  const rows = await listPublishedClipsMerged();
  const next = rows.filter((r) => r.artifactId !== artifactId);
  if (next.length === rows.length) return false;
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(publishPath(), JSON.stringify(next, null, 2), "utf8");
  await uploadPublishedIndex(next);
  await maybeDeleteFromSupabase(artifactId);
  try {
    const { rebuildPatternIndex } = await import("@/lib/patterns/aggregate");
    await rebuildPatternIndex();
  } catch (err) {
    console.error("[unpublishArtifact] pattern index", err);
  }
  return true;
}

/** Drop published rows that are not currently approved in admin sessions. */
export async function pruneUnapprovedPublished(): Promise<{
  removed: string[];
  kept: number;
}> {
  const sessions = await listSessions();
  const approved = new Set<string>();
  for (const session of sessions) {
    for (const art of session.artifacts ?? []) {
      if (art.reviewStatus === "approved") approved.add(art.id);
    }
  }
  const rows = await listPublishedClipsMerged();
  const keptRows = rows.filter((r) => approved.has(r.artifactId));
  const removed = rows
    .filter((r) => !approved.has(r.artifactId))
    .map((r) => `${r.operatorHostname}:${r.coverageStepId}:${r.artifactId}`);
  if (removed.length) {
    await fs.mkdir(dataDir(), { recursive: true });
    await fs.writeFile(
      publishPath(),
      JSON.stringify(keptRows, null, 2),
      "utf8",
    );
    await uploadPublishedIndex(keptRows);
  }
  return { removed, kept: keptRows.length };
}

/** Persist annotation posterPath / enrich fields back into published JSON. */
export async function patchPublishedAnnotations(
  artifactId: string,
  annotations: NonNullable<RecordingArtifact["annotations"]>,
) {
  const rows = await listPublishedClipsMerged();
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
      video_path: record.videoUrl ?? record.videoPath ?? null,
      poster_path: record.posterUrl ?? record.posterPath ?? null,
      structure_path: record.structurePath ?? null,
      evidence_id: record.evidenceId,
      published_at: record.publishedAt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[supabase publish]", res.status, text);
  }
}

async function maybeDeleteFromSupabase(artifactId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return;
  try {
    const res = await fetch(
      `${url}/rest/v1/blaast_published_clips?artifact_id=eq.${encodeURIComponent(artifactId)}`,
      {
        method: "DELETE",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      },
    );
    if (!res.ok && res.status !== 404) {
      console.error(
        "[supabase unpublish]",
        res.status,
        (await res.text()).slice(0, 200),
      );
    }
  } catch (err) {
    console.error("[supabase unpublish]", err);
  }
}

/** Always merge local + cloud index + Postgres — never drop a brand. */
export async function listPublishedClipsMerged(): Promise<PublishedClipRecord[]> {
  const local = await readPublished();
  const [indexRows, tableRows] = await Promise.all([
    fetchCloudIndex(),
    fetchCloudTable(),
  ]);
  return mergeByArtifactId(tableRows, indexRows, local);
}
