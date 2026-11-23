import { coverageStepById, FLOW_LABELS } from "@/lib/admin/coverage-pack";
import { listPublishedClips, type PublishedClipRecord } from "@/lib/evidence/publish";
import type {
  CatalogFlow,
  CatalogOperator,
  CatalogScreen,
  CatalogUiElement,
  SurfaceKind,
} from "@/lib/library/catalog";
import {
  categoryForJourney,
  formatCategories,
  journeyForStep,
  JOURNEY_LABELS,
  type JourneyId,
  type LibraryCategory,
} from "@/lib/library/journeys";
import { logoSrc } from "@/lib/marketing/operator-logos";

/**
 * Library surface — curated beats only (Mobbin-style).
 * Raw researcher tags are not listed; selected patterns become clean UI cards.
 *
 * slot:
 * - screen → Screens tab + Flows (when in a journey)
 * - flow → Flows only (browse → pick → launch steps)
 * - ui → UI Elements tab (also included in Flows when they have a flowId)
 */
export const CORE_LIBRARY_STEPS: Record<
  string,
  { title: string; slot: "screen" | "ui" | "flow"; order: number }
> = {
  "flow-bet-event": { title: "Event view", slot: "screen", order: 1 },
  "flow-bet-add": { title: "Add to betslip", slot: "screen", order: 2 },
  "scr-betslip": { title: "Betslip", slot: "screen", order: 3 },
  "scr-home": { title: "Home", slot: "screen", order: 4 },
  "scr-casino-lobby": { title: "Casino lobby", slot: "screen", order: 20 },
  // Casino browse & launch (casino-core playbook + brand-coverage)
  // Lobby is a full screen AND step 1 of the flow
  "ca-lobby": { title: "Casino lobby", slot: "screen", order: 20 },
  "ca-nav": { title: "Browse categories", slot: "flow", order: 21 },
  "ca-game-card": { title: "Pick a game", slot: "flow", order: 22 },
  "ui-game-card": { title: "Pick a game", slot: "flow", order: 22 },
  "ca-provider": { title: "Provider hub", slot: "flow", order: 23 },
  "ca-game-info": { title: "Game info", slot: "flow", order: 24 },
  "flow-game-launch": { title: "Launch game", slot: "flow", order: 25 },
  "ca-recents": { title: "Recents", slot: "flow", order: 26 },
  "ca-jackpots": { title: "Jackpots", slot: "flow", order: 27 },
  "ui-side-nav": { title: "Side nav", slot: "ui", order: 1 },
  "ui-header": { title: "Header", slot: "ui", order: 2 },
  "ui-tab-bar": { title: "Tab bar", slot: "ui", order: 3 },
  "ui-odds-button": { title: "Odds button", slot: "ui", order: 4 },
  "ui-loader": { title: "Loader", slot: "ui", order: 5 },
  "ui-skeleton": { title: "Skeleton", slot: "ui", order: 6 },
  "ui-activity-feed": { title: "Activity feed", slot: "ui", order: 7 },
};

/** Playbook / coverage ids that belong on UI Elements as well as a flow. */
const FLOW_STEPS_ALSO_UI: Record<string, string> = {
  "ca-nav": "Casino nav",
  "ca-game-card": "Game card",
  "ui-game-card": "Game card",
  "ca-provider": "Provider hub",
  "ca-game-info": "Game info",
  "ca-recents": "Recents",
  "ca-jackpots": "Jackpots",
};

export {
  CURATED_UI_TAGS,
  curatedTagMeta,
  momentDedupeKey,
  tagSearchText,
} from "@/lib/library/tag-catalog";
import {
  CURATED_UI_TAGS,
  curatedTagMeta,
  momentDedupeKey,
  tagSearchText,
} from "@/lib/library/tag-catalog";

export type LibraryMediaItem = {
  id: string;
  evidenceId: string;
  title: string;
  tagline: string;
  operatorName: string;
  operatorHostname: string;
  logoUrl: string;
  platform: "mobile" | "web";
  kind: SurfaceKind;
  taxonomy: string;
  tags: string[];
  hasVideo: boolean;
  posterUrl: string;
  videoUrl: string;
  sessionId: string;
  artifactId: string;
  coverageStepId?: string;
  flowId?: string;
  durationMs?: number;
  journey: JourneyId;
  category: LibraryCategory;
  /** Internal only — not for library UI cards */
  atMs?: number;
  region?: { x: number; y: number; w: number; h: number };
  clipWindow?: { startMs: number; endMs: number };
  annotationId?: string;
  elementLabel?: string;
  searchSynonyms?: string[];
};

function journeyMeta(
  coverageStepId?: string,
  tags: string[] = [],
  flowId?: string,
  preferTags = false,
) {
  const journey = journeyForStep(coverageStepId, tags, flowId, preferTags);
  return { journey, category: categoryForJourney(journey) };
}

function kindFromCategory(category: LibraryCategory): SurfaceKind {
  if (category === "Sports") return "sportsbook";
  if (category === "Casino") return "casino";
  if (category === "Cashier") return "cashier";
  if (category === "Rewards") return "rewards";
  if (category === "Account") return "account";
  return "sportsbook";
}

function surfaceKind(taxonomy: string, tags: string[]): SurfaceKind {
  const hay = `${taxonomy} ${tags.join(" ")}`.toLowerCase();
  if (/casino|game|lobby|slot/.test(hay)) return "casino";
  if (/cashier|deposit|withdraw|wallet|payment/.test(hay)) return "cashier";
  if (/vip|reward|bonus|promo|loyalty/.test(hay)) return "rewards";
  if (/account|profile|kyc|login|register/.test(hay)) return "account";
  return "sportsbook";
}

function mediaUrls(rec: PublishedClipRecord, origin: string) {
  const base = `${origin}/api/library/media/${rec.sessionId}/${rec.artifactId}`;
  // Bust browser cache when trim (In) changes so tiles show the new still
  const bust =
    rec.clipWindow?.startMs != null
      ? `&t=${Math.round(rec.clipWindow.startMs)}`
      : "";
  return {
    posterUrl: rec.posterUrl?.startsWith("http")
      ? rec.posterUrl
      : `${base}?file=poster${bust}`,
    videoUrl: rec.videoUrl?.startsWith("http")
      ? rec.videoUrl
      : `${base}?file=video`,
  };
}

function slugHost(host: string) {
  return host.replace(/\./g, "-");
}

/**
 * Full media index for MCP / admin (includes annotation segments).
 * Public catalogue uses `catalogFromPublished`, which ignores annotation cards.
 */
export async function listLibraryMedia(
  origin: string,
): Promise<LibraryMediaItem[]> {
  const published = await listPublishedClips();
  const items: LibraryMediaItem[] = [];

  for (const rec of published) {
    const media = mediaUrls(rec, origin);
    const platform: "mobile" | "web" =
      rec.platform === "mobile_web" ? "mobile" : "web";
    const cov = coverageStepById(rec.coverageStepId);
    const logoUrl = logoSrc(rec.operatorHostname, 64);
    const core = CORE_LIBRARY_STEPS[rec.coverageStepId];
    const title = core?.title ?? rec.instruction;
    const meta = journeyMeta(rec.coverageStepId, rec.tags, cov?.flowId);
    const kind = kindFromCategory(meta.category);

    items.push({
      id: rec.id,
      evidenceId: rec.evidenceId,
      title,
      tagline: `${rec.operatorName} · ${JOURNEY_LABELS[meta.journey]}`,
      operatorName: rec.operatorName,
      operatorHostname: rec.operatorHostname,
      logoUrl,
      platform,
      kind,
      taxonomy: rec.taxonomy,
      tags: rec.tags,
      hasVideo: Boolean(rec.videoPath || rec.videoUrl),
      ...media,
      clipWindow: rec.clipWindow,
      durationMs: rec.durationMs,
      sessionId: rec.sessionId,
      artifactId: rec.artifactId,
      coverageStepId: rec.coverageStepId,
      flowId:
        cov?.flowId ??
        (meta.journey === "casino"
          ? "casino_browse"
          : meta.journey === "sports_betslip"
            ? "place_a_bet"
            : meta.journey === "landing"
              ? "home_tour"
              : undefined),
      ...meta,
    });

    // Annotation segments — searchable moments (Popular slots, etc.)
    for (const ann of rec.annotations ?? []) {
      if (ann.publishElement === false) continue;
      if (!ann.region && ann.atMs == null && !ann.clipWindow) continue;
      const curated = curatedTagMeta(ann.tag);
      const title =
        ann.label?.trim() && ann.label !== ann.tag
          ? ann.label
          : (curated?.title ?? ann.label);
      const trimStart =
        ann.clipWindow?.startMs ??
        (ann.atMs != null ? Math.max(0, ann.atMs - 400) : undefined);
      const baseMedia = `${origin}/api/library/media/${rec.sessionId}/${rec.artifactId}`;
      const annPoster = ann.posterPath
        ? `${baseMedia}?file=poster&ann=${encodeURIComponent(ann.id)}`
        : trimStart != null
          ? `${baseMedia}?file=poster&t=${Math.round(trimStart)}`
          : media.posterUrl;
      const annTags = [...new Set([ann.tag, ...rec.tags])];
      const annMeta = journeyMeta(
        rec.coverageStepId,
        annTags,
        cov?.flowId,
        true,
      );
      const category =
        (ann.enrichCategory as LibraryCategory | undefined) ??
        curated?.category ??
        annMeta.category;
      items.push({
        id: `${rec.id}-ann-${ann.id}`,
        evidenceId: `${rec.evidenceId}#${ann.id}`,
        title,
        tagline: `${rec.operatorName} · ${JOURNEY_LABELS[annMeta.journey]}`,
        operatorName: rec.operatorName,
        operatorHostname: rec.operatorHostname,
        logoUrl,
        platform,
        kind: kindFromCategory(category),
        taxonomy: "ui_element",
        tags: annTags,
        hasVideo: Boolean(rec.videoPath),
        posterUrl: annPoster,
        videoUrl: media.videoUrl,
        elementLabel: title,
        atMs: ann.atMs,
        region: ann.region,
        clipWindow:
          ann.clipWindow ??
          (ann.atMs != null
            ? {
                startMs: Math.max(0, ann.atMs - 400),
                endMs: ann.atMs + 2500,
              }
            : undefined),
        durationMs: rec.durationMs,
        sessionId: rec.sessionId,
        artifactId: rec.artifactId,
        annotationId: ann.id,
        coverageStepId: rec.coverageStepId,
        flowId: cov?.flowId,
        journey: annMeta.journey,
        category,
        searchSynonyms: ann.searchSynonyms,
      });
    }
  }

  return items.sort((a, b) => b.id.localeCompare(a.id));
}

function buildCoreFlows(
  host: string,
  coreItems: LibraryMediaItem[],
): CatalogFlow[] {
  // Flows = screen + flow beats (lobby → pick → launch). Pure chrome stays on UI.
  const journeyItems = coreItems.filter((b) => {
    const slot = CORE_LIBRARY_STEPS[b.coverageStepId ?? ""]?.slot;
    return slot === "screen" || slot === "flow";
  });
  const byFlow = new Map<string, LibraryMediaItem[]>();
  for (const b of journeyItems) {
    const fid = b.flowId || "published";
    const list = byFlow.get(fid) ?? [];
    list.push(b);
    byFlow.set(fid, list);
  }

  const flows: CatalogFlow[] = [];
  for (const [fid, list] of byFlow) {
    const pack = FLOW_LABELS[fid];
    const journey = list[0]?.journey ?? "cross";
    const meta = pack ?? {
      name: JOURNEY_LABELS[journey] ?? fid.replaceAll("_", " "),
      group: categoryForJourney(journey),
      actions: ["Browse"],
    };
    const ordered = [...list].sort((a, b) => {
      const oa = CORE_LIBRARY_STEPS[a.coverageStepId ?? ""]?.order ?? 99;
      const ob = CORE_LIBRARY_STEPS[b.coverageStepId ?? ""]?.order ?? 99;
      return oa - ob;
    });
    const first = ordered[0]!;
    // Prefer product category; map legacy "Cross" → "Home" for library chrome
    const rawGroup = String(first.category || meta.group || "Home");
    const group = rawGroup === "Cross" ? "Home" : rawGroup;
    flows.push({
      id: `${slugHost(host)}-${fid}`,
      name: meta.name,
      group,
      actions: meta.actions,
      journey,
      category: first.category,
      hasVideo: ordered.some((i) => i.hasVideo),
      posterUrl: first.posterUrl,
      videoUrl: first.hasVideo ? first.videoUrl : undefined,
      steps: ordered.map((i) => ({
        id: i.id,
        label: i.title,
        kind: i.kind,
        posterUrl: i.posterUrl,
        videoUrl: i.hasVideo ? i.videoUrl : undefined,
        evidenceId: i.evidenceId,
        clipWindow: i.clipWindow,
      })),
    });
  }

  return flows.sort((a, b) => a.name.localeCompare(b.name));
}

/** Operator cards for discover — curated screens + UI (side nav, header, …). */
export async function catalogFromPublished(
  origin: string,
): Promise<CatalogOperator[]> {
  const media = await listLibraryMedia(origin);
  const byHost = new Map<string, LibraryMediaItem[]>();
  for (const m of media) {
    const list = byHost.get(m.operatorHostname) ?? [];
    list.push(m);
    byHost.set(m.operatorHostname, list);
  }

  const operators: CatalogOperator[] = [];
  for (const [host, all] of byHost) {
    const beats = all.filter((i) => !i.annotationId);
    const anns = all.filter((i) => i.annotationId);

    const core = beats
      .filter((i) => i.coverageStepId && CORE_LIBRARY_STEPS[i.coverageStepId])
      .sort((a, b) => {
        const oa = CORE_LIBRARY_STEPS[a.coverageStepId!]!.order;
        const ob = CORE_LIBRARY_STEPS[b.coverageStepId!]!.order;
        return oa - ob;
      });

    const use = core.length ? core : beats.slice(0, 1);
    if (!use.length) continue;
    const first = use[0]!;

    const screens: CatalogScreen[] = use
      .filter((i) => {
        const slot = CORE_LIBRARY_STEPS[i.coverageStepId ?? ""]?.slot;
        return slot === "screen" || (!core.length && i.taxonomy !== "ui_element");
      })
      .map((i) => ({
        id: i.id,
        title: i.title,
        kind: i.kind,
        posterUrl: i.posterUrl,
        videoUrl: i.hasVideo ? i.videoUrl : undefined,
        clipWindow: i.clipWindow,
        evidenceId: i.evidenceId,
        sessionId: i.sessionId,
        artifactId: i.artifactId,
        durationMs: i.durationMs,
        journey: i.journey,
        category: i.category,
        tags: i.tags,
      }));

    // Dedicated UI coverage beats (Header, Loader, …) + casino flow elements
    const uiFromSteps: CatalogUiElement[] = use
      .filter((i) => {
        const id = i.coverageStepId ?? "";
        const slot = CORE_LIBRARY_STEPS[id]?.slot;
        return slot === "ui" || Boolean(FLOW_STEPS_ALSO_UI[id]);
      })
      .map((i) => ({
        id: i.id,
        name: FLOW_STEPS_ALSO_UI[i.coverageStepId ?? ""] ?? i.title,
        count: 1,
        posterUrl: i.posterUrl,
        videoUrl: i.hasVideo ? i.videoUrl : undefined,
        clipWindow: i.clipWindow,
        evidenceId: i.evidenceId,
        sessionId: i.sessionId,
        artifactId: i.artifactId,
        durationMs: i.durationMs,
        journey: i.journey,
        category: i.category,
        tags: i.tags,
      }));

    // Curated tags → clean UI cards (Popular slots, Side nav, …).
    // Distinct timestamps keep separate cards; near-dupes collapse.
    const uiFromTags: CatalogUiElement[] = [];
    const seenMoments = new Set(
      uiFromSteps.map((u) => momentDedupeKey(u.name, u.atMs)),
    );
    const tagCandidates = [...anns].sort((a, b) => {
      const ra = a.region ? 1 : 0;
      const rb = b.region ? 1 : 0;
      return rb - ra || (a.atMs ?? 0) - (b.atMs ?? 0);
    });
    for (const a of tagCandidates) {
      const rawTag = a.tags[0] || "";
      const curated = curatedTagMeta(rawTag);
      if (!curated) continue;
      const title = a.elementLabel?.trim() || curated.title;
      const dedupe = momentDedupeKey(title, a.atMs);
      if (seenMoments.has(dedupe)) continue;
      seenMoments.add(dedupe);
      const category = a.category || curated.category;
      uiFromTags.push({
        id: a.id,
        name: title,
        count: 1,
        posterUrl: a.posterUrl,
        videoUrl: a.hasVideo ? a.videoUrl : undefined,
        atMs: a.atMs,
        clipWindow:
          a.clipWindow ??
          (a.atMs != null
            ? { startMs: Math.max(0, a.atMs - 400), endMs: a.atMs + 2500 }
            : undefined),
        evidenceId: a.evidenceId,
        sessionId: a.sessionId,
        artifactId: a.artifactId,
        annotationId: a.annotationId,
        durationMs: a.durationMs,
        journey: a.journey,
        category,
        tags: a.tags,
        searchText: tagSearchText(rawTag, {
          title,
          synonyms: a.searchSynonyms,
        }),
      });
    }

    const uiElements = [...uiFromSteps, ...uiFromTags].sort((a, b) => {
      const oa =
        Object.values(CORE_LIBRARY_STEPS).find((c) => c.title === a.name)?.order ??
        Object.values(CURATED_UI_TAGS).find((c) => c.title === a.name)?.order ??
        99;
      const ob =
        Object.values(CORE_LIBRARY_STEPS).find((c) => c.title === b.name)?.order ??
        Object.values(CURATED_UI_TAGS).find((c) => c.title === b.name)?.order ??
        99;
      return oa - ob;
    });

    const flows = buildCoreFlows(host, use.filter((i) => {
      const slot = CORE_LIBRARY_STEPS[i.coverageStepId ?? ""]?.slot;
      return slot !== "ui";
    }));
    // Prefer a trimmed screen beat for the catalogue hero (not a black t=0 frame).
    // Prefer betslip over full event view so filtered covers stay element-true.
    const hero =
      use.find((i) => i.hasVideo && i.coverageStepId === "scr-betslip") ??
      use.find((i) => i.hasVideo && i.coverageStepId === "flow-bet-add") ??
      use.find((i) => i.hasVideo && i.coverageStepId === "flow-bet-event") ??
      use.find((i) => i.hasVideo) ??
      use.find((i) => i.posterUrl) ??
      first;

    // Skip brands with no real media
    if (!hero.hasVideo && !hero.posterUrl) continue;

    const cats = new Set(
      [...use, ...uiElements].map((i) => i.category).filter(Boolean) as LibraryCategory[],
    );
    const primaryKind =
      [...cats].includes("Sports")
        ? ("sportsbook" as const)
        : [...cats].includes("Casino")
          ? ("casino" as const)
          : first.kind;

    operators.push({
      slug: slugHost(host),
      name: first.operatorName,
      tagline: [
        screens.length ? `${screens.length} screen${screens.length === 1 ? "" : "s"}` : null,
        uiElements.length ? `${uiElements.length} UI` : null,
        flows.length ? `${flows.length} flow${flows.length === 1 ? "" : "s"}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "Published",
      category: formatCategories(cats),
      rating: 5,
      ratingCount: use.length,
      badge: "New",
      platform: first.platform,
      kind: primaryKind,
      hasVideo: use.some((i) => i.hasVideo),
      hostname: host,
      logoUrl: first.logoUrl,
      posterUrl: hero.posterUrl,
      videoUrl: hero.hasVideo ? hero.videoUrl : undefined,
      heroClipWindow: hero.clipWindow,
      screens: screens.length
        ? screens
        : use.map((i) => ({
            id: i.id,
            title: i.title,
            kind: i.kind,
            posterUrl: i.posterUrl,
            videoUrl: i.hasVideo ? i.videoUrl : undefined,
            clipWindow: i.clipWindow,
          })),
      uiElements,
      flows,
    });
  }

  return operators;
}

/** Library detail — published captures only (no empty Scuup stubs). */
export async function getPublishedOperator(
  slug: string,
  origin: string,
): Promise<CatalogOperator | undefined> {
  const operators = await catalogFromPublished(origin);
  return operators.find((o) => o.slug === slug);
}

export async function getPublishedFlow(
  flowId: string,
  origin: string,
): Promise<{ operator: CatalogOperator; flow: CatalogFlow } | null> {
  const operators = await catalogFromPublished(origin);
  for (const op of operators) {
    const flow = op.flows.find((f) => f.id === flowId);
    if (flow) return { operator: op, flow };
  }
  return null;
}

export function absoluteOrigin(reqUrl: string) {
  try {
    return new URL(reqUrl).origin;
  } catch {
    return "http://localhost:3000";
  }
}
