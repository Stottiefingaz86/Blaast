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
import { artifactPublicUrl } from "@/lib/storage/public-url";

function matchQuery(hay: string, q: string) {
  const stop = new Set([
    "a",
    "an",
    "the",
    "with",
    "and",
    "or",
    "on",
    "for",
    "of",
    "to",
    "in",
    "desktop",
    "mobile",
    "web",
    "page",
    "screen",
    "homepage",
  ]);
  const parts = q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .filter((p) => !stop.has(p) && p.length > 1);
  if (!parts.length) return true;
  const h = hay.toLowerCase();
  // Prefer all significant tokens; fall back to ≥50% so natural phrases still hit
  const hits = parts.filter((p) => h.includes(p)).length;
  return hits === parts.length || hits >= Math.ceil(parts.length * 0.5);
}

function mediaUrls(
  art: RecordingArtifact,
  sessionId: string,
  origin: string,
) {
  const base = origin.replace(/\/$/, "");
  // Prefer CDN still/video (first-frame posters live in Storage)
  const pub = `${base}/api/library/media/${sessionId}/${art.id}`;
  const cloudPoster = artifactPublicUrl(art.posterPath);
  const cloudVideo = artifactPublicUrl(art.videoPath);
  return {
    posterUrl: cloudPoster ?? (art.posterPath ? `${pub}?file=poster` : undefined),
    videoUrl: cloudVideo ?? (art.videoPath ? `${pub}?file=video` : undefined),
    structureUrl: art.structurePath
      ? `${base}/api/admin/sessions/${sessionId}/artifacts/${art.id}?file=structure`
      : undefined,
  };
}

/** Flat index of approved capture beats + tagged element regions. */
export async function listPublishedHits(
  origin: string,
): Promise<EvidenceSearchHit[]> {
  const [operators, sessions, cloudRows] = await Promise.all([
    listOperators(),
    listSessions(),
    import("@/lib/evidence/publish").then((m) => m.listPublishedClips()),
  ]);
  const byId = new Map(operators.map((o) => [o.id, o]));
  const cloudByArtifact = new Map(
    cloudRows.map((r) => [r.artifactId, r] as const),
  );
  const hits: EvidenceSearchHit[] = [];
  const seen = new Set<string>();

  const cloudPoster = (artifactId: string, posterPath?: string) => {
    const rec = cloudByArtifact.get(artifactId);
    if (rec?.posterUrl?.startsWith("http")) return rec.posterUrl;
    return (
      artifactPublicUrl(rec?.posterPath ?? posterPath) ??
      artifactPublicUrl(posterPath)
    );
  };
  const cloudVideo = (artifactId: string, videoPath?: string) => {
    const rec = cloudByArtifact.get(artifactId);
    if (rec?.videoUrl?.startsWith("http")) return rec.videoUrl;
    return (
      artifactPublicUrl(rec?.videoPath ?? videoPath) ??
      artifactPublicUrl(videoPath)
    );
  };

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
      const posterUrl =
        cloudPoster(art.id, art.posterPath) ?? media.posterUrl;
      const videoUrl = cloudVideo(art.id, art.videoPath) ?? media.videoUrl;
      const kind =
        (cov?.taxonomy as EvidenceSearchHit["kind"]) || "screen";
      const platform =
        session.platform === "mobile_web" ? "mobile" : ("web" as const);
      const beatId = `cap-${art.id}`;
      seen.add(beatId);
      hits.push({
        id: beatId,
        kind,
        title: cov?.instruction ?? art.coverageStepId,
        operator: op.name,
        operatorSlug: op.hostname,
        tags,
        platform,
        hasVideo: Boolean(videoUrl || art.videoPath),
        hasMotion:
          tags.some((t) => /loader|skeleton|spinner|motion|anim/i.test(t)) ||
          Boolean(videoUrl || art.videoPath),
        hasStructure: Boolean(art.structurePath),
        confidence: "reviewed",
        evidenceId: `ev-rec-${session.id}-${art.coverageStepId}`,
        flowId: cov?.flowId
          ? `${op.hostname}-${cov.flowId}`
          : `${op.hostname}-coverage`,
        coverageStepId: art.coverageStepId,
        posterUrl,
        videoUrl,
        structureUrl: media.structureUrl,
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
        const annPoster =
          artifactPublicUrl(ann.posterPath) ?? posterUrl;
        hits.push({
          id: `cap-${art.id}-el-${ann.id}`,
          kind: "ui_element",
          title,
          operator: op.name,
          operatorSlug: op.hostname,
          tags: [...new Set([ann.tag, searchHay, ...tags, ...synonyms])],
          platform,
          hasVideo: Boolean(videoUrl || art.videoPath),
          hasMotion: Boolean(videoUrl || art.videoPath),
          hasStructure: Boolean(ann.region || art.structurePath),
          confidence: "reviewed",
          evidenceId: `ev-rec-${session.id}-${art.coverageStepId}#${ann.id}`,
          flowId: cov?.flowId
            ? `${op.hostname}-${cov.flowId}`
            : `${op.hostname}-coverage`,
          coverageStepId: art.coverageStepId,
          posterUrl: annPoster,
          videoUrl,
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

  // Cloud-only published clips (Vercel has no local sessions)
  for (const rec of cloudRows) {
    const beatId = `cap-${rec.artifactId}`;
    if (seen.has(beatId)) continue;
    const cov = coverageStepById(rec.coverageStepId);
    const tags = [
      ...new Set([...(cov?.tags ?? []), ...(rec.tags ?? [])]),
    ];
    const platform =
      rec.platform === "mobile_web" || rec.platform === "mobile"
        ? ("mobile" as const)
        : ("web" as const);
    hits.push({
      id: beatId,
      kind: (cov?.taxonomy as EvidenceSearchHit["kind"]) || "screen",
      title: cov?.instruction ?? rec.instruction ?? rec.coverageStepId,
      operator: rec.operatorName,
      operatorSlug: rec.operatorHostname,
      tags,
      platform,
      hasVideo: Boolean(rec.videoUrl || rec.videoPath),
      hasMotion:
        tags.some((t) => /loader|skeleton|spinner|motion|anim/i.test(t)) ||
        Boolean(rec.videoUrl || rec.videoPath),
      hasStructure: Boolean(rec.structurePath),
      confidence: "reviewed",
      evidenceId: rec.evidenceId || `ev-rec-${rec.sessionId}-${rec.coverageStepId}`,
      flowId: cov?.flowId
        ? `${rec.operatorHostname}-${cov.flowId}`
        : `${rec.operatorHostname}-coverage`,
      coverageStepId: rec.coverageStepId,
      posterUrl: cloudPoster(rec.artifactId, rec.posterPath),
      videoUrl: cloudVideo(rec.artifactId, rec.videoPath),
      adminPath: `/admin/capture/${rec.sessionId}`,
    });
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

  // Support element evidence: ev-rec-{sessionId}-{step}#{annotationId}
  const bareId = evidenceId.split("#")[0]!;
  const annId = evidenceId.includes("#")
    ? evidenceId.slice(evidenceId.indexOf("#") + 1)
    : null;

  // ev-rec-{sessionId}-{flowOrStep}
  const m = /^ev-rec-([0-9a-f-]{36})-(.+)$/i.exec(bareId);
  if (!m) return null;
  const sessionId = m[1]!;
  const suffix = m[2]!;
  let session = sessions.find((s) => s.id === sessionId) ?? null;
  let op = session ? byId.get(session.operatorId) : undefined;

  // Always merge published cloud clips for this session.
  // Local session JSON on Vercel is often stale (missing later-approved
  // ui-side-nav / ui-tab-bar) — without merge, exact-beat lookup fails and
  // we wrongly expand to a whole journey (e.g. first_deposit).
  {
    const { listPublishedClips } = await import("@/lib/evidence/publish");
    const rows = (await listPublishedClips()).filter(
      (r) => r.sessionId === sessionId,
    );
    if (rows.length) {
      const host = rows[0]!.operatorHostname;
      if (!op) {
        op =
          operators.find((o) => o.hostname === host) ??
          ({
            id: rows[0]!.operatorId,
            hostname: host,
            name: rows[0]!.operatorName,
            url: `https://${host}`,
            products: ["casino"],
          } as Operator);
      }
      const cloudArts = rows.map((r) => ({
        id: r.artifactId,
        sessionId,
        coverageStepId: r.coverageStepId,
        kind: "clip" as const,
        capturedAt: r.publishedAt,
        pageUrl: r.pageUrl,
        videoPath: r.videoPath,
        posterPath: r.posterPath,
        structurePath: r.structurePath,
        sensitiveFlags: [] as string[],
        reviewStatus: "approved" as const,
        durationMs: r.durationMs,
        annotations: r.annotations,
        clipWindow: r.clipWindow,
      }));
      if (!session) {
        session = {
          id: sessionId,
          operatorId: op.id,
          playbookId: "coverage",
          platform: rows[0]!.platform === "mobile" ? "mobile_web" : "desktop_web",
          market: rows[0]!.market,
          status: "review",
          startedAt: rows[0]!.publishedAt,
          updatedAt: rows[0]!.publishedAt,
          items: [],
          artifacts: cloudArts,
        };
      } else {
        const byId = new Map(
          (session.artifacts ?? []).map((a) => [a.id, a]),
        );
        for (const a of cloudArts) byId.set(a.id, a);
        // Prefer cloud coverageStepId when local lacked approval
        for (const a of cloudArts) {
          const local = [...byId.values()].find(
            (x) => x.coverageStepId === a.coverageStepId && x.id !== a.id,
          );
          if (local && local.reviewStatus !== "approved") {
            byId.delete(local.id);
          }
        }
        session = {
          ...session,
          artifacts: [...byId.values()],
        };
      }
    }
  }
  if (!session || !op) return null;

  // Prefer the *exact* coverage beat (ui-side-nav, scr-casino-lobby, …)
  // — do NOT expand to the whole journey flow (that lost nav clips).
  const art = session.artifacts?.find(
    (a) =>
      a.reviewStatus === "approved" &&
      (a.coverageStepId === suffix || a.id === suffix),
  );
  if (art) {
    const one: CaptureSession = { ...session, artifacts: [art] };
    const ev = await flowEvidenceFromRecording(op, one, { baseUrl: origin });
    if (ev) {
      ev.evidenceId = `ev-rec-${sessionId}-${art.coverageStepId}`;
      if (annId) {
        const ann = art.annotations?.find((a) => a.id === annId);
        if (ann && ev.steps[0]) {
          ev.steps[0] = {
            ...ev.steps[0],
            label: ann.label || ann.tag,
            tags: [...new Set([ann.tag, ...ev.steps[0].tags])],
            layoutNotes: [
              ...(ev.steps[0].layoutNotes ?? []),
              ann.region
                ? `Tagged region ${ann.region.x.toFixed(1)}%,${ann.region.y.toFixed(1)}% ${ann.region.w}×${ann.region.h}%`
                : `Annotation ${ann.tag}`,
              ann.posterPath
                ? `Element still: ${artifactPublicUrl(ann.posterPath) ?? ann.posterPath}`
                : "",
            ].filter(Boolean),
          };
          ev.evidenceId = `${ev.evidenceId}#${annId}`;
        }
      }
    }
    return ev;
  }

  // Journey-level id (home_tour, casino_browse, …)
  const cov = coverageStepById(suffix);
  if (cov?.flowId || /_tour$|_browse$|_bet$|deposit|onboarding/i.test(suffix)) {
    const flowKey = cov?.flowId ?? suffix;
    const full = await flowEvidenceFromRecording(op, session, {
      flowId: flowKey,
      baseUrl: origin,
    });
    if (full) return full;
  }

  return flowEvidenceFromRecording(op, session, { baseUrl: origin });
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
