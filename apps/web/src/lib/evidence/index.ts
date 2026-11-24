import { coverageStepById } from "@/lib/admin/coverage-pack";
import { listOperators, listSessions } from "@/lib/admin/store";
import type { CaptureSession, Operator, RecordingArtifact } from "@/lib/admin/types";
import { flowEvidenceFromRecording } from "@/lib/evidence/from-recording";
import { loadFlowEvidence as loadDemoFlowEvidence } from "@/lib/evidence/from-catalog";
import type {
  EvidenceSearchHit,
  FlowEvidence,
} from "@/lib/evidence/types";
import { curatedTagMeta, tagSearchText } from "@/lib/library/tag-catalog";

function matchQuery(hay: string, q: string) {
  const parts = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!parts.length) return true;
  const h = hay.toLowerCase();
  return parts.every((p) => h.includes(p));
}

function mediaUrls(
  art: RecordingArtifact,
  sessionId: string,
  origin: string,
) {
  const base = origin.replace(/\/$/, "");
  // Public library media for approved clips (no admin auth)
  const pub = `${base}/api/library/media/${sessionId}/${art.id}`;
  return {
    posterUrl: art.posterPath ? `${pub}?file=poster` : undefined,
    videoUrl: art.videoPath ? `${pub}?file=video` : undefined,
    structureUrl: art.structurePath
      ? `${base}/api/admin/sessions/${sessionId}/artifacts/${art.id}?file=structure`
      : undefined,
  };
}

/** Flat index of approved capture beats + tagged element regions. */
export async function listPublishedHits(
  origin: string,
): Promise<EvidenceSearchHit[]> {
  const [operators, sessions] = await Promise.all([
    listOperators(),
    listSessions(),
  ]);
  const byId = new Map(operators.map((o) => [o.id, o]));
  const hits: EvidenceSearchHit[] = [];

  for (const session of sessions) {
    const op = byId.get(session.operatorId);
    if (!op) continue;
    const approved = (session.artifacts ?? []).filter(
      (a) => a.reviewStatus === "approved",
    );
    for (const art of approved) {
      const cov = coverageStepById(art.coverageStepId);
      const annTags = (art.annotations ?? []).map((a) => a.tag);
      const tags = [...new Set([...(cov?.tags ?? []), ...annTags])];
      const media = mediaUrls(art, session.id, origin);
      const kind =
        (cov?.taxonomy as EvidenceSearchHit["kind"]) || "screen";
      const platform =
        session.platform === "mobile_web" ? "mobile" : ("web" as const);
      hits.push({
        id: `cap-${art.id}`,
        kind,
        title: cov?.instruction ?? art.coverageStepId,
        operator: op.name,
        operatorSlug: op.hostname,
        tags,
        platform,
        hasVideo: Boolean(art.videoPath),
        hasMotion:
          tags.some((t) => /loader|skeleton|spinner|motion|anim/i.test(t)) ||
          Boolean(art.videoPath),
        hasStructure: Boolean(art.structurePath),
        confidence: "reviewed",
        evidenceId: `ev-rec-${session.id}-${art.coverageStepId}`,
        flowId: cov?.flowId
          ? `${op.hostname}-${cov.flowId}`
          : `${op.hostname}-coverage`,
        coverageStepId: art.coverageStepId,
        ...media,
        adminPath: `/admin/capture/${session.id}`,
      });

      // Mobbin-style element hits: each tagged region is searchable (popular slots, …)
      for (const ann of art.annotations ?? []) {
        if (ann.publishElement === false) continue;
        if (!ann.region && ann.atMs == null && !ann.clipWindow) continue;
        const curated = curatedTagMeta(ann.tag);
        const title =
          ann.label?.trim() && ann.label !== ann.tag
            ? ann.label
            : (curated?.title ?? ann.label);
        const synonyms = [
          ...(ann.searchSynonyms ?? []),
          ...(curated?.synonyms ?? []),
        ];
        const searchHay = tagSearchText(ann.tag, { title, synonyms });
        const trimStart =
          ann.clipWindow?.startMs ??
          (ann.atMs != null ? Math.max(0, ann.atMs - 400) : undefined);
        const base = `${origin.replace(/\/$/, "")}/api/library/media/${session.id}/${art.id}`;
        const posterUrl = ann.posterPath
          ? `${base}?file=poster&ann=${encodeURIComponent(ann.id)}`
          : trimStart != null
            ? `${base}?file=poster&t=${Math.round(trimStart)}`
            : media.posterUrl;
        hits.push({
          id: `cap-${art.id}-el-${ann.id}`,
          kind: "ui_element",
          title,
          operator: op.name,
          operatorSlug: op.hostname,
          tags: [...new Set([ann.tag, searchHay, ...tags, ...synonyms])],
          platform,
          hasVideo: Boolean(art.videoPath),
          hasMotion: Boolean(art.videoPath),
          hasStructure: Boolean(ann.region || art.structurePath),
          confidence: "reviewed",
          evidenceId: `ev-rec-${session.id}-${art.coverageStepId}#${ann.id}`,
          flowId: cov?.flowId
            ? `${op.hostname}-${cov.flowId}`
            : `${op.hostname}-coverage`,
          coverageStepId: art.coverageStepId,
          posterUrl,
          videoUrl: media.videoUrl,
          structureUrl: media.structureUrl,
          adminPath: `/admin/capture/${session.id}`,
          atMs: ann.atMs,
          region: ann.region,
          annotationId: ann.id,
          clipWindow: ann.clipWindow,
        });
      }
    }
  }

  return hits;
}

export async function searchPublishedEvidence(opts: {
  query: string;
  origin: string;
  platform?: string;
  motionOnly?: boolean;
  kind?: string;
  limit?: number;
}): Promise<EvidenceSearchHit[]> {
  const {
    query,
    origin,
    platform = "any",
    motionOnly = false,
    kind,
    limit = 20,
  } = opts;
  let hits = await listPublishedHits(origin);

  if (platform !== "any") {
    hits = hits.filter((h) => h.platform === platform);
  }
  if (motionOnly) {
    hits = hits.filter((h) => h.hasMotion || h.hasVideo);
  }
  if (kind) {
    hits = hits.filter((h) => h.kind === kind);
  }
  if (query) {
    hits = hits.filter((h) =>
      matchQuery(
        `${h.title} ${h.operator} ${h.operatorSlug} ${h.tags.join(" ")} ${h.coverageStepId} ${h.kind} ${h.annotationId ?? ""}`,
        query,
      ),
    );
  }

  // Prefer richer evidence
  hits.sort((a, b) => {
    const score = (h: EvidenceSearchHit) =>
      (h.hasStructure ? 4 : 0) + (h.hasVideo ? 2 : 0) + (h.hasMotion ? 1 : 0);
    return score(b) - score(a);
  });

  return hits.slice(0, limit);
}

export async function getPublishedEvidenceById(
  evidenceId: string,
  origin: string,
): Promise<FlowEvidence | null> {
  const [operators, sessions] = await Promise.all([
    listOperators(),
    listSessions(),
  ]);
  const byId = new Map(operators.map((o) => [o.id, o]));

  // ev-rec-{sessionId}-{flowOrStep}
  const m = /^ev-rec-([0-9a-f-]{36})-(.+)$/i.exec(evidenceId);
  if (!m) return null;
  const sessionId = m[1]!;
  const suffix = m[2]!;
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const op = byId.get(session.operatorId);
  if (!op) return null;

  const cov = coverageStepById(suffix);
  if (cov?.flowId) {
    const full = await flowEvidenceFromRecording(op, session, {
      flowId: cov.flowId,
      baseUrl: origin,
    });
    if (full) return full;
  }

  const art = session.artifacts?.find(
    (a) =>
      a.reviewStatus === "approved" &&
      (a.coverageStepId === suffix || a.id === suffix),
  );
  if (!art) {
    return flowEvidenceFromRecording(op, session, { baseUrl: origin });
  }
  const one: CaptureSession = { ...session, artifacts: [art] };
  return flowEvidenceFromRecording(op, one, { baseUrl: origin });
}

export async function getPublishedFlowEvidence(
  flowId: string,
  origin: string,
): Promise<FlowEvidence | null> {
  const [operators, sessions] = await Promise.all([
    listOperators(),
    listSessions(),
  ]);

  for (const session of sessions) {
    const op = operators.find((o) => o.id === session.operatorId);
    if (!op) continue;

    // Prefer hostname-prefixed ids: stake.com-place_a_bet
    const flowKey = flowId.startsWith(`${op.hostname}-`)
      ? flowId.slice(op.hostname.length + 1)
      : flowId;

    const ev = await flowEvidenceFromRecording(op, session, {
      flowId: flowKey,
      baseUrl: origin,
    });
    if (ev) return ev;

    // Whole-session pack when asking for hostname-coverage
    if (flowKey === "coverage" || flowId === `${op.hostname}-coverage`) {
      const all = await flowEvidenceFromRecording(op, session, {
        baseUrl: origin,
      });
      if (all) return all;
    }
  }

  return null;
}

/** Unified loader: reviewed capture first, demo catalog fallback. */
export async function resolveFlowEvidence(
  flowId: string,
  origin: string,
): Promise<FlowEvidence | null> {
  const real = await getPublishedFlowEvidence(flowId, origin);
  if (real) return real;
  return loadDemoFlowEvidence(flowId);
}

function slugKey(value: string) {
  return value
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\./g, "-")
    .replace(/[^a-z0-9-]+/g, "");
}

export async function getOperatorPublishedSummary(
  slug: string,
  origin: string,
) {
  const want = slugKey(slug);
  const hits = (await listPublishedHits(origin)).filter((h) => {
    const keys = [
      slugKey(h.operatorSlug),
      slugKey(h.operator),
      // hostname stored as operatorSlug (whale.io) vs catalog slug (whale-io)
      slugKey(h.operatorSlug.replace(/\./g, "-")),
    ];
    return keys.some((k) => k === want || k.startsWith(want) || want.startsWith(k));
  });
  return {
    slug,
    published_count: hits.length,
    beats: hits,
  };
}

export type { Operator, CaptureSession };
