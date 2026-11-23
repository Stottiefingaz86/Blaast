import type { Operator } from "@/lib/admin/types";
import type { PublishedClipRecord } from "@/lib/evidence/publish";
import { curatedTagMeta } from "@/lib/library/tag-catalog";
import { journeyForStep } from "@/lib/library/journeys";
import { coverageStepById } from "@/lib/admin/coverage-pack";
import {
  operatorRegions,
  operatorVertical,
  slugFromHostname,
} from "@/lib/patterns/segments";
import {
  PATTERN_EXTRACTOR_VERSION,
  type PatternFingerprint,
} from "@/lib/patterns/types";

const CASINO_TAG_HINTS =
  /casino|slot|jackpot|provider|game_card|live_casino|originals/i;
const SPORTS_TAG_HINTS =
  /sport|betslip|odds|scoreboard|parlay|event_view|match_tracker/i;

function baseFp(
  op: Operator,
  partial: Omit<
    PatternFingerprint,
    | "patternId"
    | "operatorId"
    | "operatorSlug"
    | "operatorHostname"
    | "vertical"
    | "regions"
    | "referenceTier"
    | "provenance"
    | "extractedAt"
    | "extractorVersion"
  >,
): PatternFingerprint {
  const slug = slugFromHostname(op.hostname);
  return {
    ...partial,
    patternId: `${slug}:${partial.normalizedKey}`,
    operatorId: op.id,
    operatorSlug: slug,
    operatorHostname: op.hostname,
    vertical: operatorVertical(op),
    regions: operatorRegions(op),
    referenceTier: op.referenceTier ?? null,
    provenance: "measured",
    extractedAt: new Date().toISOString(),
    extractorVersion: PATTERN_EXTRACTOR_VERSION,
  };
}

/** Homepage IA: casino-first vs sports-first from ordered annotation timestamps. */
export function fingerprintHomepageIa(
  op: Operator,
  clips: PublishedClipRecord[],
): PatternFingerprint | null {
  const home = clips.find(
    (c) =>
      c.operatorHostname === op.hostname &&
      (c.coverageStepId === "scr-home" || c.tags.includes("home")),
  );
  if (!home) return null;

  const moments = (home.annotations ?? [])
    .filter((a) => a.publishElement !== false && a.atMs != null)
    .map((a) => ({
      tag: a.tag,
      atMs: a.atMs!,
      curated: curatedTagMeta(a.tag),
    }))
    .sort((a, b) => a.atMs - b.atMs);

  if (!moments.length) return null;

  let firstCasinoMs: number | undefined;
  let firstSportsMs: number | undefined;
  for (const m of moments) {
    const hay = `${m.tag} ${m.curated?.title ?? ""} ${m.curated?.category ?? ""}`;
    if (firstCasinoMs == null && CASINO_TAG_HINTS.test(hay)) {
      firstCasinoMs = m.atMs;
    }
    if (firstSportsMs == null && SPORTS_TAG_HINTS.test(hay)) {
      firstSportsMs = m.atMs;
    }
  }

  let key = "homepage.mixed_or_unclear";
  let label = "Homepage — mixed / unclear IA";
  if (firstCasinoMs != null && (firstSportsMs == null || firstCasinoMs < firstSportsMs)) {
    key = "homepage.casino_first";
    label = "Homepage — casino-first";
  } else if (
    firstSportsMs != null &&
    (firstCasinoMs == null || firstSportsMs < firstCasinoMs)
  ) {
    key = "homepage.sports_first";
    label = "Homepage — sports-first";
  }

  const structure = moments
    .slice(0, 12)
    .map((m) => m.curated?.title ?? m.tag)
    .join(" > ");

  return baseFp(op, {
    kind: "homepage_ia",
    normalizedKey: key,
    label: structure ? `${label} (${structure})` : label,
    evidenceIds: [home.evidenceId],
    tags: [...new Set(moments.map((m) => m.tag))],
    journey: "landing",
  });
}

/** Casino lobby structure from ordered ca-* / casino coverage steps. */
export function fingerprintCasinoLobby(
  op: Operator,
  clips: PublishedClipRecord[],
): PatternFingerprint | null {
  const casinoSteps = clips
    .filter(
      (c) =>
        c.operatorHostname === op.hostname &&
        (/^ca-/.test(c.coverageStepId) ||
          c.coverageStepId === "scr-casino-lobby" ||
          c.coverageStepId === "ui-game-card" ||
          c.coverageStepId === "flow-game-launch"),
    )
    .sort((a, b) => a.coverageStepId.localeCompare(b.coverageStepId));

  if (!casinoSteps.length) return null;

  const order = casinoSteps.map((c) => c.coverageStepId);
  const key = `lobby.${order.join(">")}`;
  const label = `Casino lobby — ${order
    .map((id) => id.replace(/^ca-/, "").replace(/^scr-/, "").replace(/^flow-/, ""))
    .join(" → ")}`;

  return baseFp(op, {
    kind: "flow",
    normalizedKey: key,
    label,
    evidenceIds: casinoSteps.map((c) => c.evidenceId),
    tags: [...new Set(casinoSteps.flatMap((c) => c.tags))],
    journey: "casino",
  });
}

/** Generic flow shape from coverage flowId grouping. */
export function fingerprintFlows(
  op: Operator,
  clips: PublishedClipRecord[],
): PatternFingerprint[] {
  const byFlow = new Map<string, PublishedClipRecord[]>();
  for (const c of clips) {
    if (c.operatorHostname !== op.hostname) continue;
    const cov = coverageStepById(c.coverageStepId);
    const journey = journeyForStep(c.coverageStepId, c.tags, cov?.flowId);
    const flowId =
      cov?.flowId ??
      (journey === "casino"
        ? "casino_browse"
        : journey === "sports_betslip"
          ? "place_a_bet"
          : journey === "landing"
            ? "home_tour"
            : journey === "signup"
              ? "onboarding"
              : undefined);
    if (!flowId) continue;
    const list = byFlow.get(flowId) ?? [];
    list.push(c);
    byFlow.set(flowId, list);
  }

  const out: PatternFingerprint[] = [];
  for (const [flowId, list] of byFlow) {
    const ordered = [...list].sort((a, b) =>
      a.coverageStepId.localeCompare(b.coverageStepId),
    );
    const steps = ordered.map((c) => c.coverageStepId);
    const key = `flow.${flowId}.${steps.join(">")}`;
    const journey = journeyForStep(
      ordered[0]!.coverageStepId,
      ordered[0]!.tags,
      flowId,
    );
    out.push(
      baseFp(op, {
        kind: "flow",
        normalizedKey: key,
        label: `${flowId.replaceAll("_", " ")} — ${steps.length} beats`,
        evidenceIds: ordered.map((c) => c.evidenceId),
        tags: [...new Set(ordered.flatMap((c) => c.tags))],
        journey,
      }),
    );
  }
  return out;
}

/** UI element pattern keys from curated tags (one per distinct curated title). */
export function fingerprintUiElements(
  op: Operator,
  clips: PublishedClipRecord[],
): PatternFingerprint[] {
  const seen = new Set<string>();
  const out: PatternFingerprint[] = [];
  for (const c of clips) {
    if (c.operatorHostname !== op.hostname) continue;
    for (const ann of c.annotations ?? []) {
      if (ann.publishElement === false) continue;
      const meta = curatedTagMeta(ann.tag);
      if (!meta) continue;
      const key = `ui.${meta.title.toLowerCase().replace(/\s+/g, "_")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(
        baseFp(op, {
          kind: "ui_element",
          normalizedKey: key,
          label: meta.title,
          evidenceIds: [`${c.evidenceId}#${ann.id}`],
          tags: [ann.tag, ...(ann.searchSynonyms ?? [])],
          journey: journeyForStep(c.coverageStepId, [ann.tag, ...c.tags], undefined, true),
        }),
      );
    }
  }
  return out;
}

export function extractOperatorFingerprints(
  op: Operator,
  clips: PublishedClipRecord[],
): PatternFingerprint[] {
  const fps: PatternFingerprint[] = [];
  const home = fingerprintHomepageIa(op, clips);
  if (home) fps.push(home);
  const lobby = fingerprintCasinoLobby(op, clips);
  if (lobby) fps.push(lobby);
  fps.push(...fingerprintFlows(op, clips));
  fps.push(...fingerprintUiElements(op, clips));
  return fps;
}
