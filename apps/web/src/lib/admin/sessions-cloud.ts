import { scuupConfig } from "@/lib/scuup/client";
import type { CaptureSession, RecordingArtifact } from "@/lib/admin/types";

/**
 * Durable capture sessions for Vercel — local /tmp is per-instance.
 * Artifacts must be union-merged or a stale guide PATCH can wipe clips.
 */

const BUCKET = "blaast-captures";
const INDEX_PATH = "sessions-index.json";

function mergeRemovedIds(
  a?: string[],
  b?: string[],
): string[] | undefined {
  const set = new Set<string>();
  for (const id of [...(a ?? []), ...(b ?? [])]) {
    if (id) set.add(id);
  }
  return set.size ? [...set] : undefined;
}

function mergeArtifacts(
  a?: RecordingArtifact[],
  b?: RecordingArtifact[],
  removedIds?: string[],
): RecordingArtifact[] {
  const removed = new Set(removedIds ?? []);
  const byId = new Map<string, RecordingArtifact>();
  for (const art of [...(a ?? []), ...(b ?? [])]) {
    if (!art?.id || removed.has(art.id)) continue;
    const prev = byId.get(art.id);
    if (!prev || (art.capturedAt || "") >= (prev.capturedAt || "")) {
      byId.set(art.id, art);
    }
  }
  // One clip per coverage step — newest wins
  const byStep = new Map<string, RecordingArtifact>();
  for (const art of byId.values()) {
    const prev = byStep.get(art.coverageStepId);
    if (!prev || (art.capturedAt || "") >= (prev.capturedAt || "")) {
      byStep.set(art.coverageStepId, art);
    }
  }
  return [...byStep.values()].sort((x, y) =>
    (y.capturedAt || "").localeCompare(x.capturedAt || ""),
  );
}

function mergeItems(
  a: CaptureSession["items"],
  b: CaptureSession["items"],
): CaptureSession["items"] {
  const rank = (s: string) =>
    s === "done" ? 3 : s === "skipped" ? 2 : s === "in_progress" ? 1 : 0;
  const byId = new Map<string, CaptureSession["items"][number]>();
  for (const item of [...a, ...b]) {
    const prev = byId.get(item.playbookItemId);
    if (!prev || rank(item.status) >= rank(prev.status)) {
      byId.set(item.playbookItemId, { ...prev, ...item });
    }
  }
  return [...byId.values()];
}

/** Deep-merge two versions of the same session — never drop live clips. */
export function mergeSessionPair(
  a: CaptureSession,
  b: CaptureSession,
): CaptureSession {
  const newer = (a.updatedAt || "") >= (b.updatedAt || "") ? a : b;
  const older = newer === a ? b : a;
  const removedArtifactIds = mergeRemovedIds(
    a.removedArtifactIds,
    b.removedArtifactIds,
  );
  return {
    ...older,
    ...newer,
    removedArtifactIds,
    artifacts: mergeArtifacts(a.artifacts, b.artifacts, removedArtifactIds),
    items: mergeItems(a.items, b.items),
    liveAnnotations: {
      ...(older.liveAnnotations ?? {}),
      ...(newer.liveAnnotations ?? {}),
    },
    guide: newer.guide ?? older.guide,
    updatedAt:
      (a.updatedAt || "") >= (b.updatedAt || "")
        ? a.updatedAt
        : b.updatedAt,
  };
}

function mergeSessions(...lists: CaptureSession[][]): CaptureSession[] {
  const byId = new Map<string, CaptureSession>();
  for (const list of lists) {
    for (const s of list) {
      if (!s?.id) continue;
      const prev = byId.get(s.id);
      byId.set(s.id, prev ? mergeSessionPair(prev, s) : s);
    }
  }
  return [...byId.values()].sort((a, b) =>
    (b.updatedAt || "").localeCompare(a.updatedAt || ""),
  );
}

async function fetchSessionsIndex(): Promise<CaptureSession[]> {
  const { url, key } = scuupConfig();
  if (!url || !key) return [];
  try {
    const res = await fetch(
      `${url}/storage/v1/object/public/${BUCKET}/${INDEX_PATH}?t=${Date.now()}`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as CaptureSession[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

async function uploadSessionsIndex(sessions: CaptureSession[]): Promise<void> {
  const { url, key } = scuupConfig();
  if (!url || !key) return;
  const body = JSON.stringify(sessions);
  const res = await fetch(
    `${url}/storage/v1/object/${BUCKET}/${INDEX_PATH}`,
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
      "[sessions-index upload]",
      res.status,
      (await res.text()).slice(0, 200),
    );
  }
}

async function uploadSessionObject(session: CaptureSession): Promise<void> {
  const { url, key } = scuupConfig();
  if (!url || !key) return;
  const res = await fetch(
    `${url}/storage/v1/object/${BUCKET}/sessions/${session.id}.json`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "x-upsert": "true",
      },
      body: JSON.stringify(session),
    },
  );
  if (!res.ok) {
    console.error(
      "[session object upload]",
      session.id,
      res.status,
      (await res.text()).slice(0, 200),
    );
  }
}

async function fetchSessionObject(
  id: string,
): Promise<CaptureSession | null> {
  const { url, key } = scuupConfig();
  if (!url || !key) return null;
  try {
    const res = await fetch(
      `${url}/storage/v1/object/public/${BUCKET}/sessions/${id}.json?t=${Date.now()}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const row = (await res.json()) as CaptureSession;
    return row?.id ? row : null;
  } catch {
    return null;
  }
}

export async function getSessionCloud(
  id: string,
): Promise<CaptureSession | null> {
  const direct = await fetchSessionObject(id);
  if (direct) return direct;
  const all = await fetchSessionsIndex();
  return all.find((s) => s.id === id) ?? null;
}

export async function listSessionsCloud(
  operatorId?: string,
): Promise<CaptureSession[]> {
  const all = await fetchSessionsIndex();
  if (!operatorId) return all;
  return all.filter((s) => s.operatorId === operatorId);
}

/** Persist one session — merge with cloud copy so clips are never dropped. */
export async function upsertSessionCloud(
  session: CaptureSession,
): Promise<CaptureSession> {
  const existingObj = await fetchSessionObject(session.id);
  const merged = existingObj
    ? mergeSessionPair(existingObj, session)
    : session;
  await uploadSessionObject(merged);
  const existing = await fetchSessionsIndex();
  const next = mergeSessions(existing, [merged]);
  await uploadSessionsIndex(next);
  return merged;
}

/** Merge local sessions into cloud without dropping other instances' rows. */
export async function syncSessionsCloud(
  localSessions: CaptureSession[],
): Promise<void> {
  if (!localSessions.length) return;
  const existing = await fetchSessionsIndex();
  const next = mergeSessions(existing, localSessions);
  await uploadSessionsIndex(next);
  await Promise.all(localSessions.map((s) => upsertSessionCloud(s)));
}
