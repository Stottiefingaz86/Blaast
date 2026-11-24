import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  COVERAGE_PACK_ID,
  coverageStepsForProducts,
} from "./coverage-pack";
import { brandCoveragePlaybook, playbookById } from "./playbooks";
import type {
  AdminStore,
  ArtifactReviewStatus,
  CaptureAnnotation,
  CaptureSession,
  GuidePhase,
  Operator,
  Platform,
  ProductSurface,
  RecordingArtifact,
  SessionGuide,
} from "./types";
import { capturesDir, dataDir } from "@/lib/platform/data-dir";

const storePath = () => path.join(dataDir(), "admin-store.json");
const CAPTURES_DIR = () => capturesDir();

async function ensureStore(): Promise<AdminStore> {
  await fs.mkdir(dataDir(), { recursive: true });
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    return JSON.parse(raw) as AdminStore;
  } catch {
    const empty: AdminStore = { operators: [], sessions: [] };
    await fs.writeFile(storePath(), JSON.stringify(empty, null, 2));
    return empty;
  }
}

async function writeStore(store: AdminStore, opts?: { syncSessions?: boolean }) {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(storePath(), JSON.stringify(store, null, 2));
  // Vercel /tmp is not shared — upsert each session with artifact-safe merge.
  if (opts?.syncSessions !== false && store.sessions.length) {
    try {
      const { upsertSessionCloud } = await import("@/lib/admin/sessions-cloud");
      const merged = await Promise.all(
        store.sessions.map((s) => upsertSessionCloud(s)),
      );
      store.sessions = merged;
      await fs.writeFile(storePath(), JSON.stringify(store, null, 2));
    } catch (err) {
      console.error("[writeStore] sessions cloud", err);
    }
  }
}

function hostnameFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function defaultGuide(firstStepId: string | null): SessionGuide {
  return {
    currentStepId: firstStepId,
    phase: "idle",
    commandSeq: 0,
  };
}

export async function listOperators() {
  const store = await ensureStore();
  let cloud: Operator[] = [];
  try {
    const { listOperatorsCloud } = await import("@/lib/admin/operators-cloud");
    cloud = await listOperatorsCloud();
  } catch (err) {
    console.error("[listOperators] cloud", err);
  }
  // Merge: local wins on id collision (dev), cloud fills Vercel /tmp gaps
  const byId = new Map<string, Operator>();
  for (const o of cloud) byId.set(o.id, o);
  for (const o of store.operators) byId.set(o.id, o);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getOperator(id: string) {
  const store = await ensureStore();
  const local = store.operators.find((o) => o.id === id);
  if (local) return local;
  try {
    const { getOperatorCloud } = await import("@/lib/admin/operators-cloud");
    const cloud = await getOperatorCloud(id);
    // Cache into /tmp so the same instance can start capture without re-fetch
    if (cloud) {
      store.operators.push(cloud);
      await writeStore(store, { syncSessions: false });
    }
    return cloud;
  } catch (err) {
    console.error("[getOperator] cloud", err);
    return null;
  }
}

export async function createOperator(input: {
  name: string;
  url: string;
  markets?: string[];
  products?: ProductSurface[];
  tags?: string[];
  notes?: string;
  vertical?: Operator["vertical"];
  regions?: string[];
  referenceTier?: Operator["referenceTier"];
}) {
  const store = await ensureStore();
  const now = new Date().toISOString();
  const operator: Operator = {
    id: randomUUID(),
    name: input.name.trim(),
    url: input.url.trim(),
    hostname: hostnameFromUrl(input.url.trim()),
    markets: input.markets ?? [],
    products: input.products ?? [
      "sportsbook",
      "casino",
      "cashier",
      "account",
      "rewards",
      "promotions",
    ],
    tags: input.tags ?? [],
    notes: input.notes,
    vertical: input.vertical ?? "other",
    regions: input.regions ?? input.markets ?? [],
    referenceTier: input.referenceTier ?? null,
    createdAt: now,
    updatedAt: now,
  };
  store.operators.push(operator);
  await writeStore(store);
  // Must land in Storage — Vercel /tmp is empty on the next request/instance.
  const { upsertOperatorCloud, getOperatorCloud } = await import(
    "@/lib/admin/operators-cloud"
  );
  await upsertOperatorCloud(operator);
  const verified = await getOperatorCloud(operator.id);
  if (!verified) {
    throw new Error(
      "Brand saved locally but not visible in cloud Storage yet — retry Add brand",
    );
  }
  return operator;
}

export async function updateOperator(
  id: string,
  patch: Partial<
    Pick<
      Operator,
      | "name"
      | "url"
      | "markets"
      | "products"
      | "tags"
      | "notes"
      | "vertical"
      | "regions"
      | "referenceTier"
    >
  >,
) {
  const store = await ensureStore();
  let idx = store.operators.findIndex((o) => o.id === id);
  // On Vercel, operator may only exist in Supabase — hydrate local first
  if (idx < 0) {
    try {
      const { getOperatorCloud } = await import("@/lib/admin/operators-cloud");
      const cloud = await getOperatorCloud(id);
      if (cloud) {
        store.operators.push(cloud);
        idx = store.operators.length - 1;
      }
    } catch (err) {
      console.error("[updateOperator] cloud hydrate", err);
    }
  }
  if (idx < 0) return null;
  const prev = store.operators[idx]!;
  const next: Operator = {
    ...prev,
    ...patch,
    url: patch.url?.trim() ?? prev.url,
    name: patch.name?.trim() ?? prev.name,
    hostname: patch.url ? hostnameFromUrl(patch.url.trim()) : prev.hostname,
    updatedAt: new Date().toISOString(),
  };
  store.operators[idx] = next;
  await writeStore(store);
  try {
    const { upsertOperatorCloud } = await import("@/lib/admin/operators-cloud");
    await upsertOperatorCloud(next);
  } catch (err) {
    console.error("[updateOperator] cloud", err);
  }
  // Segment / reference tier changes affect pattern aggregates
  if (
    patch.vertical !== undefined ||
    patch.referenceTier !== undefined ||
    patch.regions !== undefined
  ) {
    try {
      const { rebuildPatternIndex } = await import("@/lib/patterns/aggregate");
      await rebuildPatternIndex();
    } catch (err) {
      console.error("[updateOperator] pattern index", err);
    }
  }
  return next;
}

export async function listSessions(operatorId?: string) {
  const store = await ensureStore();
  try {
    const { listSessionsCloud } = await import("@/lib/admin/sessions-cloud");
    const cloud = await listSessionsCloud();
    if (cloud.length) {
      const byId = new Map<string, CaptureSession>();
      for (const s of cloud) byId.set(s.id, s);
      for (const s of store.sessions) {
        const prev = byId.get(s.id);
        if (!prev || (s.updatedAt || "") >= (prev.updatedAt || "")) {
          byId.set(s.id, s);
        }
      }
      store.sessions = [...byId.values()];
      await writeStore(store, { syncSessions: false });
    }
  } catch (err) {
    console.error("[listSessions] cloud", err);
  }
  const sessions = operatorId
    ? store.sessions.filter((s) => s.operatorId === operatorId)
    : store.sessions;
  return [...sessions].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export async function getSession(id: string) {
  const store = await ensureStore();
  const local = store.sessions.find((s) => s.id === id);
  if (local) return local;
  try {
    const { getSessionCloud } = await import("@/lib/admin/sessions-cloud");
    const cloud = await getSessionCloud(id);
    if (cloud) {
      store.sessions.push(cloud);
      await writeStore(store, { syncSessions: false });
      return cloud;
    }
  } catch (err) {
    console.error("[getSession] cloud", err);
  }
  return null;
}

export async function startCaptureSession(input: {
  operatorId: string;
  playbookId: string;
  platform: Platform;
  market?: string;
}) {
  const store = await ensureStore();
  // Vercel: operator often exists only in Supabase operators-index — hydrate local.
  let operator = store.operators.find((o) => o.id === input.operatorId);
  if (!operator) {
    try {
      const { getOperatorCloud } = await import("@/lib/admin/operators-cloud");
      const cloud = await getOperatorCloud(input.operatorId);
      if (cloud) {
        store.operators.push(cloud);
        await writeStore(store);
        operator = cloud;
      }
    } catch (err) {
      console.error("[startCaptureSession] cloud hydrate", err);
    }
  }
  if (!operator) {
    throw new Error(
      "Operator not found in cloud Storage — re-open the brand from Sites or add it again",
    );
  }

  const playbook =
    input.playbookId === COVERAGE_PACK_ID
      ? brandCoveragePlaybook(operator.products)
      : playbookById(input.playbookId, operator.products);
  if (!playbook) throw new Error("Playbook not found");

  const now = new Date().toISOString();
  const firstId = playbook.items[0]?.id ?? null;
  const session: CaptureSession = {
    id: randomUUID(),
    operatorId: operator.id,
    playbookId: playbook.id,
    platform: input.platform,
    market: input.market,
    status: "in_progress",
    startedAt: now,
    updatedAt: now,
    items: playbook.items.map((it) => ({
      playbookItemId: it.id,
      status: "todo",
      captureCount: 0,
    })),
    guide: defaultGuide(firstId),
    artifacts: [],
  };
  store.sessions.push(session);
  await writeStore(store);
  // Ensure object exists before client opens /stage on another instance
  try {
    const { upsertSessionCloud } = await import("@/lib/admin/sessions-cloud");
    await upsertSessionCloud(session);
  } catch (err) {
    console.error("[startCaptureSession] session cloud", err);
  }
  return session;
}

export async function updateSessionItem(
  sessionId: string,
  playbookItemId: string,
  patch: Partial<CaptureSession["items"][number]>,
) {
  const store = await ensureStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const item = session.items.find((i) => i.playbookItemId === playbookItemId);
  if (!item) return null;
  Object.assign(item, patch);
  if (patch.status === "done" || patch.status === "skipped") {
    item.completedAt = new Date().toISOString();
  }
  session.updatedAt = new Date().toISOString();
  await maybeAdvanceToReview(session);
  await writeStore(store);
  return session;
}

async function maybeAdvanceToReview(session: CaptureSession) {
  const operator = (await ensureStore()).operators.find(
    (o) => o.id === session.operatorId,
  );
  const products = operator?.products ?? [];
  const playbook =
    session.playbookId === COVERAGE_PACK_ID
      ? brandCoveragePlaybook(products)
      : playbookById(session.playbookId, products);
  const requiredIds = new Set(
    (playbook?.items || []).filter((i) => i.required).map((i) => i.id),
  );
  const requiredDone = [...requiredIds].every((id) => {
    const row = session.items.find((i) => i.playbookItemId === id);
    return row && (row.status === "done" || row.status === "skipped");
  });
  if (requiredDone && session.status === "in_progress") {
    session.status = "review";
  }
}

export async function setSessionStatus(
  sessionId: string,
  status: CaptureSession["status"],
) {
  const store = await ensureStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  session.status = status;
  session.updatedAt = new Date().toISOString();
  await writeStore(store);
  return session;
}

export async function updateSessionGuide(
  sessionId: string,
  patch: {
    currentStepId?: string | null;
    phase?: GuidePhase;
    countdownEndsAt?: string | null;
    recordingStartedAt?: string | null;
    maxClipSec?: number;
  },
) {
  const store = await ensureStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const prev = session.guide ?? defaultGuide(null);
  session.guide = {
    currentStepId:
      patch.currentStepId !== undefined ? patch.currentStepId : prev.currentStepId,
    phase: patch.phase ?? prev.phase,
    countdownEndsAt:
      patch.countdownEndsAt === null
        ? undefined
        : (patch.countdownEndsAt ?? prev.countdownEndsAt),
    recordingStartedAt:
      patch.recordingStartedAt === null
        ? undefined
        : (patch.recordingStartedAt ?? prev.recordingStartedAt),
    maxClipSec: patch.maxClipSec ?? prev.maxClipSec,
    commandSeq: prev.commandSeq + 1,
  };
  session.updatedAt = new Date().toISOString();
  await writeStore(store);
  return session;
}

function sessionCapturesDir(sessionId: string) {
  return path.join(CAPTURES_DIR(), sessionId);
}

export async function saveRecordingArtifact(input: {
  sessionId: string;
  coverageStepId: string;
  kind: "clip" | "still";
  pageUrl?: string;
  pageTitle?: string;
  viewport?: RecordingArtifact["viewport"];
  sensitiveFlags?: string[];
  durationMs?: number;
  videoBase64?: string;
  videoMime?: string;
  posterBase64?: string;
  posterMime?: string;
  structureJson?: unknown;
  /** Already uploaded to Storage (direct browser PUT) — skip base64 body. */
  videoPath?: string;
  posterPath?: string;
  artifactId?: string;
}) {
  const store = await ensureStore();
  let session = store.sessions.find((s) => s.id === input.sessionId);
  if (!session) {
    try {
      const { getSessionCloud } = await import("@/lib/admin/sessions-cloud");
      const cloud = await getSessionCloud(input.sessionId);
      if (cloud) {
        store.sessions.push(cloud);
        session = cloud;
      }
    } catch (err) {
      console.error("[saveRecordingArtifact] cloud hydrate", err);
    }
  }
  if (!session) throw new Error("Session not found");

  const id = input.artifactId?.trim() || randomUUID();
  const dir = sessionCapturesDir(session.id);
  await fs.mkdir(dir, { recursive: true });

  let videoPath: string | undefined = input.videoPath?.replace(/^\//, "");
  let posterPath: string | undefined = input.posterPath?.replace(/^\//, "");
  let structurePath: string | undefined;

  if (input.videoBase64 && !videoPath) {
    const ext = input.videoMime?.includes("mp4") ? "mp4" : "webm";
    videoPath = `${session.id}/${id}.${ext}`;
    const buf = Buffer.from(input.videoBase64, "base64");
    await fs.writeFile(path.join(CAPTURES_DIR(), videoPath), buf);
    try {
      const { uploadCaptureBuffer } = await import("@/lib/storage/captures");
      await uploadCaptureBuffer({
        objectPath: videoPath,
        body: buf,
        contentType: input.videoMime || "video/webm",
      });
    } catch (err) {
      console.error("[saveRecordingArtifact] video cloud", err);
    }
  }
  if (input.posterBase64 && !posterPath) {
    const ext = input.posterMime?.includes("jpeg") ? "jpg" : "png";
    posterPath = `${session.id}/${id}.${ext}`;
    const buf = Buffer.from(input.posterBase64, "base64");
    await fs.writeFile(path.join(CAPTURES_DIR(), posterPath), buf);
    try {
      const { uploadCaptureBuffer } = await import("@/lib/storage/captures");
      await uploadCaptureBuffer({
        objectPath: posterPath,
        body: buf,
        contentType: input.posterMime || "image/png",
      });
    } catch (err) {
      console.error("[saveRecordingArtifact] poster cloud", err);
    }
  }
  if (input.structureJson !== undefined) {
    structurePath = `${session.id}/${id}.structure.json`;
    const { writeAndUploadStructure } = await import(
      "@/lib/evidence/structure-persist"
    );
    const written = await writeAndUploadStructure({
      structureRel: structurePath,
      snapshot: input.structureJson,
    });
    if (!written.ok) {
      console.error(
        "[saveRecordingArtifact] structure persist failed",
        written.error,
      );
      // Keep path only if local write might have partially succeeded; clear if invalid
      if (written.error?.includes("must be") || written.error?.includes("too large")) {
        structurePath = undefined;
      }
    } else if (written.error) {
      console.error(
        "[saveRecordingArtifact] structure cloud warning",
        written.error,
      );
    }
  }

  const pendingLive = session.liveAnnotations?.[input.coverageStepId] ?? [];

  const artifact: RecordingArtifact = {
    id,
    sessionId: session.id,
    coverageStepId: input.coverageStepId,
    kind: input.kind,
    capturedAt: new Date().toISOString(),
    pageUrl: input.pageUrl,
    pageTitle: input.pageTitle,
    viewport: input.viewport,
    videoPath,
    posterPath,
    structurePath,
    mimeVideo: input.videoMime,
    mimePoster: input.posterMime ?? "image/png",
    sensitiveFlags: input.sensitiveFlags ?? [],
    reviewStatus: "pending",
    durationMs: input.durationMs,
    annotations: pendingLive.length ? [...pendingLive] : undefined,
  };

  if (!session.artifacts) session.artifacts = [];
  // Replace prior artifact for same step (redo) — tombstone old ids so cloud merge can't resurrect
  const replaced = (session.artifacts ?? []).filter(
    (a) => a.coverageStepId === input.coverageStepId,
  );
  if (replaced.length) {
    const removed = new Set(session.removedArtifactIds ?? []);
    for (const old of replaced) removed.add(old.id);
    session.removedArtifactIds = [...removed];
  }
  session.artifacts = session.artifacts.filter(
    (a) => a.coverageStepId !== input.coverageStepId,
  );
  session.artifacts.push(artifact);
  if (session.liveAnnotations?.[input.coverageStepId]) {
    delete session.liveAnnotations[input.coverageStepId];
  }

  const item = session.items.find(
    (i) => i.playbookItemId === input.coverageStepId,
  );
  if (item) {
    item.captureCount = (item.captureCount || 0) + 1;
    item.artifactId = artifact.id;
    item.status = "done";
    item.completedAt = new Date().toISOString();
  }

  // Always move forward from the step just captured — never jump back to
  // earlier skipped/undone beats (researcher skipped them on purpose).
  const idx = session.items.findIndex(
    (i) => i.playbookItemId === input.coverageStepId,
  );
  const nextForward =
    idx >= 0
      ? session.items.slice(idx + 1).find((i) => i.status === "todo") ??
        session.items[idx + 1]
      : undefined;
  session.guide = {
    currentStepId:
      nextForward?.playbookItemId ?? input.coverageStepId,
    phase: "idle",
    commandSeq: (session.guide?.commandSeq ?? 0) + 1,
  };
  session.updatedAt = new Date().toISOString();
  await maybeAdvanceToReview(session);
  await writeStore(store);
  return { session, artifact };
}

export async function setArtifactReview(
  sessionId: string,
  artifactId: string,
  reviewStatus: ArtifactReviewStatus,
) {
  const store = await ensureStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const art = session.artifacts?.find((a) => a.id === artifactId);
  if (!art) return null;
  art.reviewStatus = reviewStatus;
  session.updatedAt = new Date().toISOString();
  await writeStore(store);

  // Side-effect publish / unpublish for library / MCP (best-effort)
  if (reviewStatus === "approved") {
    try {
      const { publishApprovedArtifact } = await import(
        "@/lib/evidence/publish"
      );
      await publishApprovedArtifact(session, art);
    } catch (err) {
      console.error("[publishApprovedArtifact]", err);
    }
  } else if (reviewStatus === "rejected") {
    try {
      const { unpublishArtifact } = await import("@/lib/evidence/publish");
      await unpublishArtifact(artifactId);
    } catch (err) {
      console.error("[unpublishArtifact]", err);
    }
  }

  return session;
}

export async function deleteRecordingArtifact(
  sessionId: string,
  artifactId: string,
) {
  const store = await ensureStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const art = session.artifacts?.find((a) => a.id === artifactId);
  if (!art) return null;

  for (const rel of [art.videoPath, art.posterPath, art.structurePath]) {
    if (!rel) continue;
    try {
      await fs.unlink(path.join(CAPTURES_DIR(), rel));
    } catch {
      /* missing file ok */
    }
  }

  session.artifacts = (session.artifacts ?? []).filter((a) => a.id !== artifactId);
  const removed = new Set(session.removedArtifactIds ?? []);
  removed.add(artifactId);
  session.removedArtifactIds = [...removed];

  const item = session.items.find(
    (i) => i.playbookItemId === art.coverageStepId,
  );
  if (item && item.artifactId === artifactId) {
    item.artifactId = undefined;
    item.captureCount = Math.max(0, (item.captureCount || 1) - 1);
    if (item.status === "done" && item.captureCount === 0) {
      item.status = "todo";
      item.completedAt = undefined;
    }
  }

  if (session.liveAnnotations?.[art.coverageStepId]) {
    delete session.liveAnnotations[art.coverageStepId];
  }

  // Stay on the deleted step so re-record doesn't force picking step 1 again
  session.guide = {
    currentStepId: art.coverageStepId,
    phase: "idle",
    commandSeq: (session.guide?.commandSeq ?? 0) + 1,
  };
  if (session.status === "review" || session.status === "done") {
    session.status = "in_progress";
  }

  session.updatedAt = new Date().toISOString();
  await writeStore(store);

  try {
    const { unpublishArtifact } = await import("@/lib/evidence/publish");
    await unpublishArtifact(artifactId);
  } catch (err) {
    console.error("[unpublishArtifact]", err);
  }

  return session;
}

export async function addLiveAnnotation(
  sessionId: string,
  coverageStepId: string,
  input: {
    label: string;
    tag: string;
    comment?: string;
    atMs?: number;
    region?: { x: number; y: number; w: number; h: number };
  },
) {
  const store = await ensureStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  if (!session.liveAnnotations) session.liveAnnotations = {};
  const list = session.liveAnnotations[coverageStepId] ?? [];
  const region =
    input.region &&
    Number.isFinite(input.region.x) &&
    Number.isFinite(input.region.y) &&
    Number.isFinite(input.region.w) &&
    Number.isFinite(input.region.h)
      ? {
          x: clampPct(input.region.x),
          y: clampPct(input.region.y),
          w: Math.max(1, Math.min(100, input.region.w)),
          h: Math.max(1, Math.min(100, input.region.h)),
        }
      : undefined;
  const ann: CaptureAnnotation = {
    id: randomUUID(),
    label: input.label.trim(),
    tag: input.tag.trim().toLowerCase().replace(/\s+/g, "_"),
    comment: input.comment?.trim() || undefined,
    atMs: input.atMs,
    region,
    createdAt: new Date().toISOString(),
  };
  session.liveAnnotations[coverageStepId] = [...list, ann];

  // Also attach to existing artifact for this step if already uploaded
  const art = session.artifacts?.find((a) => a.coverageStepId === coverageStepId);
  if (art) {
    art.annotations = [...(art.annotations ?? []), ann];
  }

  session.updatedAt = new Date().toISOString();
  await writeStore(store);

  // Tags on an already-approved clip must refresh the library UI Elements index
  if (art?.reviewStatus === "approved") {
    try {
      const { publishApprovedArtifact } = await import(
        "@/lib/evidence/publish"
      );
      await publishApprovedArtifact(session, art);
    } catch (err) {
      console.error("[addLiveAnnotation] republish", err);
    }
  }
  return session;
}

export async function removeLiveAnnotation(
  sessionId: string,
  coverageStepId: string,
  annotationId: string,
) {
  const store = await ensureStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  if (session.liveAnnotations?.[coverageStepId]) {
    session.liveAnnotations[coverageStepId] = session.liveAnnotations[
      coverageStepId
    ]!.filter((a) => a.id !== annotationId);
  }
  const art = session.artifacts?.find((a) => a.coverageStepId === coverageStepId);
  if (art?.annotations) {
    art.annotations = art.annotations.filter((a) => a.id !== annotationId);
  }
  session.updatedAt = new Date().toISOString();
  await writeStore(store);
  return session;
}

export async function setArtifactAnnotations(
  sessionId: string,
  artifactId: string,
  annotations: CaptureAnnotation[],
) {
  const store = await ensureStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const art = session.artifacts?.find((a) => a.id === artifactId);
  if (!art) return null;
  art.annotations = annotations;
  session.updatedAt = new Date().toISOString();
  await writeStore(store);

  // Keep published library / MCP element clips in sync
  if (art.reviewStatus === "approved") {
    try {
      const { publishApprovedArtifact } = await import(
        "@/lib/evidence/publish"
      );
      await publishApprovedArtifact(session, art);
    } catch (err) {
      console.error("[publishApprovedArtifact]", err);
    }
  }

  return session;
}

/** Trim a single annotation window (UI element card) without dumping tags to the UI. */
export async function setAnnotationClipWindow(
  sessionId: string,
  artifactId: string,
  annotationId: string,
  clipWindow: { startMs: number; endMs: number } | null,
) {
  const store = await ensureStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const art = session.artifacts?.find((a) => a.id === artifactId);
  if (!art?.annotations) return null;
  const ann = art.annotations.find((a) => a.id === annotationId);
  if (!ann) return null;

  if (clipWindow == null) {
    delete ann.clipWindow;
  } else {
    const startRaw = Number(clipWindow.startMs);
    const endRaw = Number(clipWindow.endMs);
    if (
      !Number.isFinite(startRaw) ||
      !Number.isFinite(endRaw) ||
      endRaw <= startRaw
    ) {
      return null;
    }
    const startMs = Math.max(0, Math.round(startRaw));
    const endMs = Math.max(startMs + 200, Math.round(endRaw));
    ann.clipWindow = { startMs, endMs };
    // Force re-extract element still at new In point
    delete ann.posterPath;
  }
  session.updatedAt = new Date().toISOString();
  await writeStore(store);

  if (art.reviewStatus === "approved") {
    try {
      const { publishApprovedArtifact } = await import(
        "@/lib/evidence/publish"
      );
      await publishApprovedArtifact(session, art);
    } catch (err) {
      console.error("[publishApprovedArtifact]", err);
    }
  }

  return session;
}

/** Trim what the public library plays (ms into the source video). */
export async function setArtifactClipWindow(
  sessionId: string,
  artifactId: string,
  clipWindow: { startMs: number; endMs: number } | null,
) {
  const store = await ensureStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const art = session.artifacts?.find((a) => a.id === artifactId);
  if (!art) return null;

  if (clipWindow == null) {
    delete art.clipWindow;
  } else {
    const startRaw = Number(clipWindow.startMs);
    const endRaw = Number(clipWindow.endMs);
    if (
      !Number.isFinite(startRaw) ||
      !Number.isFinite(endRaw) ||
      endRaw <= startRaw
    ) {
      return null;
    }
    const startMs = Math.max(0, Math.round(startRaw));
    const endMs = Math.max(startMs + 200, Math.round(endRaw));
    art.clipWindow = { startMs, endMs };

    // Refresh poster so library tiles match the trimmed In frame
    if (art.videoPath) {
      const videoAbs = path.join(CAPTURES_DIR(), art.videoPath);
      const posterRel =
        art.posterPath ??
        `${sessionId}/${artifactId}.png`;
      const posterAbs = path.join(CAPTURES_DIR(), posterRel);
      try {
        const { extractPosterFrame } = await import(
          "@/lib/admin/poster-from-video"
        );
        const ok = await extractPosterFrame({
          videoAbsPath: videoAbs,
          posterAbsPath: posterAbs,
          atMs: startMs,
        });
        if (ok) {
          art.posterPath = posterRel;
          art.mimePoster = "image/png";
        }
      } catch (err) {
        console.error("[setArtifactClipWindow] poster", err);
      }
    }
  }
  session.updatedAt = new Date().toISOString();
  await writeStore(store);

  if (art.reviewStatus === "approved") {
    try {
      const { publishApprovedArtifact } = await import(
        "@/lib/evidence/publish"
      );
      await publishApprovedArtifact(session, art);
    } catch (err) {
      console.error("[publishApprovedArtifact]", err);
    }
  }

  return session;
}

function clampPct(n: number) {
  return Math.max(0, Math.min(100, n));
}

export function capturesRoot() {
  return CAPTURES_DIR();
}

export async function resolveArtifactFile(
  sessionId: string,
  artifactId: string,
  which: "video" | "poster" | "structure",
) {
  const session = await getSession(sessionId);
  if (!session) return null;
  const art = session.artifacts?.find((a) => a.id === artifactId);
  if (!art) return null;
  const rel =
    which === "video"
      ? art.videoPath
      : which === "poster"
        ? art.posterPath
        : art.structurePath;
  if (!rel) return null;
  const full = path.join(CAPTURES_DIR(), rel);
  try {
    await fs.access(full);
    return { full, artifact: art };
  } catch {
    /* Local /tmp miss on Vercel — pull from Supabase Storage */
  }
  try {
    const { storagePublicUrl } = await import("@/lib/storage/captures");
    const url = storagePublicUrl(rel);
    if (!url) return null;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buf);
    return { full, artifact: art };
  } catch (err) {
    console.error("[resolveArtifactFile] cloud", err);
    return null;
  }
}

export function sessionCoverageSteps(session: CaptureSession, products: ProductSurface[]) {
  if (session.playbookId === COVERAGE_PACK_ID) {
    return coverageStepsForProducts(products);
  }
  const pb = playbookById(session.playbookId, products);
  return (pb?.items || []).map((it) => {
    const taxonomy = it.kind === "ui_element" ? "ui_element" : "screen";
    return {
      id: it.id,
      instruction: it.label,
      hint: it.hint,
      taxonomy: taxonomy as "screen" | "ui_element",
      tags: it.tags,
      productGate: "cross_product" as const,
      required: it.required,
      recordMode: "still" as const,
      countdownSec: 3,
      maxClipSec: 8,
    };
  });
}
