import { coverageStepById, FLOW_LABELS } from "@/lib/admin/coverage-pack";
import { listPublishedClips, type PublishedClipRecord } from "@/lib/evidence/publish";
import type {
  CatalogEmail,
  CatalogFlow,
  CatalogOperator,
  CatalogScreen,
  CatalogUiElement,
  SurfaceKind,
} from "@/lib/library/catalog";
import {
  categoryForJourney,
  compareByJourneyOrder,
  flowSectionForJourney,
  formatCategories,
  journeyForStep,
  LIBRARY_FLOW_JOURNEYS,
  JOURNEY_LABELS,
  type JourneyId,
  type LibraryCategory,
} from "@/lib/library/journeys";
import { logoSrc } from "@/lib/marketing/operator-logos";
import {
  emailStepLabel,
  loadResearchEmailsForHost,
  onboardingEmails,
  type ResearchEmail,
} from "@/lib/research/emails";
import { artifactPublicUrl } from "@/lib/storage/public-url";

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
  // Core acquisition: Home → Sign up → Deposit
  "scr-home": { title: "Home", slot: "screen", order: 1 },
  "flow-signup-open": { title: "Open sign up", slot: "flow", order: 2 },
  "scr-register": { title: "Sign up", slot: "screen", order: 3 },
  "flow-signup-steps": { title: "Sign-up steps", slot: "flow", order: 4 },
  "flow-signup-complete": { title: "After sign up", slot: "flow", order: 5 },
  "flow-signup-email-verify": { title: "Verify email", slot: "flow", order: 5.5 },
  "flow-signup-email-welcome": { title: "Welcome email", slot: "flow", order: 5.6 },
  "scr-deposit": { title: "Deposit", slot: "screen", order: 6 },
  "flow-deposit-amount": { title: "Deposit amount", slot: "flow", order: 7 },
  "scr-login": { title: "Login", slot: "screen", order: 8 },
  "scr-my-account": { title: "My account", slot: "screen", order: 9 },
  "flow-bet-event": { title: "Event view", slot: "screen", order: 10 },
  "flow-bet-add": { title: "Add to betslip", slot: "screen", order: 11 },
  "scr-betslip": { title: "Betslip", slot: "screen", order: 12 },
  "flow-bet-place": { title: "Place bet", slot: "flow", order: 13 },
  "flow-cashout": { title: "Cash out", slot: "flow", order: 14 },
  "scr-casino-lobby": { title: "Casino lobby", slot: "screen", order: 20 },
  // Casino browse & launch (casino-core playbook + brand-coverage)
  "ca-lobby": { title: "Casino lobby", slot: "screen", order: 20 },
  "ca-nav": { title: "Browse categories", slot: "flow", order: 21 },
  "ca-game-card": { title: "Pick a game", slot: "flow", order: 22 },
  "ui-game-card": { title: "Pick a game", slot: "flow", order: 22 },
  "ca-provider": { title: "Provider hub", slot: "flow", order: 23 },
  "ca-game-info": { title: "Game info", slot: "flow", order: 24 },
  "flow-game-launch": { title: "Launch game", slot: "flow", order: 25 },
  "ca-recents": { title: "Recents", slot: "flow", order: 26 },
  "ca-jackpots": { title: "Jackpots", slot: "flow", order: 27 },
  "scr-promotions": { title: "Promotions", slot: "screen", order: 30 },
  "ui-promo-card": { title: "Promo card", slot: "ui", order: 31 },
  "scr-vip": { title: "VIP", slot: "screen", order: 32 },
  "flow-bonus-claim": { title: "Claim bonus", slot: "flow", order: 33 },
  "flow-withdraw": { title: "Withdrawal", slot: "flow", order: 34 },
  "ui-side-nav": { title: "Side nav", slot: "ui", order: 1 },
  "ui-header": { title: "Header", slot: "ui", order: 2 },
  "ui-tab-bar": { title: "Tab bar", slot: "ui", order: 3 },
  "ui-odds-button": { title: "Odds button", slot: "ui", order: 4 },
  "ui-loader": { title: "Loader", slot: "ui", order: 5 },
  "ui-skeleton": { title: "Skeleton", slot: "ui", order: 6 },
  "ui-activity-feed": { title: "Activity feed", slot: "ui", order: 7 },
  "ui-method-row": { title: "Payment methods", slot: "ui", order: 8 },
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
  posterUrl?: string;
  videoUrl?: string;
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

function mediaUrls(rec: PublishedClipRecord, _origin: string) {
  // Prefer direct Supabase CDN — never /api/library/media on Vercel (no local files).
  const cloudPoster = rec.posterUrl?.startsWith("http")
    ? rec.posterUrl
    : artifactPublicUrl(rec.posterPath);
  const cloudVideo = rec.videoUrl?.startsWith("http")
    ? rec.videoUrl
    : artifactPublicUrl(rec.videoPath);
  const bustMs =
    rec.clipWindow?.startMs != null
      ? Math.round(rec.clipWindow.startMs)
      : null;
  return {
    posterUrl: cloudPoster
      ? bustMs != null
        ? `${cloudPoster}${cloudPoster.includes("?") ? "&" : "?"}t=${bustMs}`
        : cloudPoster
      : undefined,
    videoUrl: cloudVideo,
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
      hasVideo: Boolean(media.videoUrl),
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

    // Annotation segments → UI Elements (animation, loader, VIP block, …).
    // Untimed tags still publish (default a short window) so Tag-on-desk works.
    for (const ann of rec.annotations ?? []) {
      if (ann.publishElement === false) continue;
      if (!ann.tag && !ann.label) continue;
      const curated = curatedTagMeta(ann.tag);
      const title =
        ann.label?.trim() && ann.label !== ann.tag
          ? ann.label
          : (curated?.title ??
            ann.label ??
            ann.tag.replace(/_/g, " "));
      const trimStart =
        ann.clipWindow?.startMs ??
        (ann.atMs != null ? Math.max(0, ann.atMs - 400) : 0);
      const annPoster =
        artifactPublicUrl(ann.posterPath) ??
        media.posterUrl ??
        (media.videoUrl
          ? undefined // CaptureMedia will show video frame at atMs
          : undefined);
      // Primary tag only — do not inherit parent journey tags (broke Animation filter)
      const annTags = [ann.tag].filter(Boolean);
      // Parent coverage journey wins — keeps Rewards hub / VIP moments on Loyalty
      const annMeta = journeyMeta(
        rec.coverageStepId,
        [ann.tag, ...(rec.tags ?? [])],
        cov?.flowId,
        false,
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
        hasVideo: Boolean(media.videoUrl),
        posterUrl: annPoster || media.posterUrl,
        videoUrl: media.videoUrl,
        elementLabel: title,
        atMs: ann.atMs ?? trimStart,
        region: ann.region,
        clipWindow:
          ann.clipWindow ??
          {
            startMs: Math.max(0, (ann.atMs ?? 0) - (ann.atMs != null ? 400 : 0)),
            endMs: (ann.atMs ?? 0) + 2500,
          },
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

function emailFlowSteps(emails: ResearchEmail[]): CatalogFlow["steps"] {
  return emails.map((e) => ({
    id: `email-${e.id}`,
    label: emailStepLabel(e),
    kind: "account" as const,
    posterUrl: e.posterUrl,
    evidenceId: e.id,
    email: {
      subject: e.subject,
      from: e.from,
      receivedAt: e.receivedAt,
      category: e.category,
      snippet: e.snippet,
      html: e.html,
    },
  }));
}

/**
 * Precise beat labels for MCP / flow theater — tagged moments become named steps.
 * Keys are annotation tags (normalized).
 */
const JOURNEY_MOMENT_LABELS: Record<string, string> = {
  // Onboarding
  error: "Error alert",
  alert: "Error alert",
  toast: "Error alert",
  animation: "Submit animation",
  motion: "Submit animation",
  loader: "Loading",
  spinner: "Loading",
  form: "Form filled",
  // Play casino
  casino_stats: "Game details",
  game_info: "Game details",
  full_screen_game: "Full-screen game",
  mini_casino_game_launcher: "Mini player",
  mini_game_launcher: "Mini player",
  game_launch: "Launch game",
  // Loyalty & Rewards
  rewards_hub: "Rewards hub",
  rewards_page: "Rewards page",
  vip_page: "VIP page",
  promo_card: "Claim CTA",
  promotions: "Promotions",
  // Sports
  sports_homepage: "Sports home",
  event_view: "Event view",
  live_scoreboard: "Live scoreboard",
  match_tracker: "Match tracker",
  closed_betslip: "Closed betslip",
  single_bet: "Single bet",
  "combo,_parlay,_acca": "Combo / parlay",
  same_game_parlays_acca: "Same game parlay",
  "same_game_parlays,_acca": "Same game parlay",
};

/** Parents replaced entirely by their tagged moments (sparse overview clips). */
const REPLACE_PARENT_WITH_MOMENTS = new Set([
  "scr-vip",
  "flow-game-launch",
]);

function momentLabel(tag: string, title: string): string | null {
  const key = tag.toLowerCase().replace(/\s+/g, "_");
  if (JOURNEY_MOMENT_LABELS[key]) return JOURNEY_MOMENT_LABELS[key]!;
  const t = `${tag} ${title}`.toLowerCase();
  if (/error|alert|toast|validation/.test(t)) return "Error alert";
  if (/animation|motion/.test(t)) return "Submit animation";
  if (/loader|spinner/.test(t)) return "Loading";
  if (/verify|confirm.?email/.test(t)) return "Verify page";
  if (/form|field|filled/.test(t)) return "Form filled";
  if (/mini.?player|mini.?game|mini.?casino/.test(t)) return "Mini player";
  if (/full.?screen/.test(t)) return "Full-screen game";
  if (/rewards.?hub/.test(t)) return "Rewards hub";
  if (/rewards.?page/.test(t)) return "Rewards page";
  if (/vip.?page/.test(t)) return "VIP page";
  return null;
}

function toMomentStep(m: LibraryMediaItem, label: string): CatalogFlow["steps"][number] {
  const start =
    m.clipWindow?.startMs ??
    (m.atMs != null ? Math.max(0, m.atMs - 400) : 0);
  const end =
    m.clipWindow?.endMs ??
    (m.atMs != null ? m.atMs + 2800 : start + 2800);
  return {
    id: m.id,
    label,
    kind: m.kind,
    posterUrl: m.posterUrl,
    videoUrl: m.videoUrl,
    atMs: m.atMs ?? start,
    clipWindow: { startMs: start, endMs: end },
    evidenceId: m.evidenceId,
    coverageStepId: m.coverageStepId,
  };
}

function momentsForParent(
  parentCoverageId: string | undefined,
  moments: LibraryMediaItem[],
): CatalogFlow["steps"] {
  if (!parentCoverageId) return [];
  const seen = new Set<string>();
  const out: CatalogFlow["steps"] = [];
  const sorted = moments
    .filter(
      (m) =>
        m.annotationId &&
        m.videoUrl &&
        m.coverageStepId === parentCoverageId,
    )
    .sort((a, b) => (a.atMs ?? 0) - (b.atMs ?? 0));
  for (const m of sorted) {
    const tag = m.tags?.[0] ?? "";
    const label = momentLabel(tag, m.title);
    if (!label) continue;
    const bucket = Math.round((m.atMs ?? 0) / 2500);
    const motion =
      label === "Loading" || label === "Submit animation";
    const key = motion ? `motion:${bucket}` : `${label}:${bucket}`;
    if (label === "Submit animation") {
      const idx = out.findIndex(
        (s) =>
          s.label === "Loading" &&
          Math.round((s.atMs ?? 0) / 2500) === bucket,
      );
      if (idx >= 0) {
        out.splice(idx, 1);
        seen.delete(`motion:${bucket}`);
      }
    }
    if (seen.has(key)) continue;
    if (label === "Loading" && seen.has(`motion:${bucket}`)) continue;
    // One mini-player beat per parent clip (launcher + player tags collapse)
    if (label === "Mini player" && out.some((s) => s.label === "Mini player")) {
      continue;
    }
    seen.add(key);
    out.push(toMomentStep(m, label));
  }
  return out;
}

/**
 * Expand capture beats with timed tagged moments so MCP gets every precise step.
 * VIP / launch parents that are “jumpy” overviews are replaced by their moments.
 */
function expandJourneySteps(
  journey: JourneyId,
  captureSteps: CatalogFlow["steps"],
  moments: LibraryMediaItem[],
  emails: ResearchEmail[] = [],
): CatalogFlow["steps"] {
  if (journey === "signup") {
    const open = captureSteps.filter((s) => /open sign/i.test(s.label));
    const formRaw = captureSteps.filter((s) =>
      /sign-up steps|^sign up$|register/i.test(s.label),
    );
    const after = captureSteps.filter((s) => /after sign/i.test(s.label));
    const used = new Set([...open, ...formRaw, ...after].map((s) => s.id));
    const rest = captureSteps.filter((s) => !used.has(s.id));
    const formMoments = formRaw.flatMap((s) =>
      momentsForParent(s.coverageStepId, moments),
    );
    const firstMomentMs = formMoments[0]?.atMs;
    const form = formRaw.map((s) => {
      // Prefer a later window — early seconds of signup clips are usually still Home
      const end =
        s.clipWindow?.endMs ??
        (firstMomentMs != null && firstMomentMs > 2500
          ? firstMomentMs - 400
          : 22000);
      const start =
        s.clipWindow?.startMs != null && s.clipWindow.startMs >= 2500
          ? s.clipWindow.startMs
          : Math.max(4500, Math.round(end * 0.35));
      return {
        ...s,
        label: "Form filled",
        clipWindow: { startMs: start, endMs: Math.max(start + 2500, end) },
      };
    });
    return [
      ...open,
      ...form,
      ...formMoments,
      ...emailFlowSteps(emails),
      ...after,
      ...rest.flatMap((s) => {
        const kids = momentsForParent(s.coverageStepId, moments);
        return kids.length ? [...(REPLACE_PARENT_WITH_MOMENTS.has(s.coverageStepId ?? "") ? [] : [s]), ...kids] : [s];
      }),
    ];
  }

  const out: CatalogFlow["steps"] = [];
  for (const step of captureSteps) {
    const kids = momentsForParent(step.coverageStepId, moments);
    const replace =
      kids.length > 0 &&
      REPLACE_PARENT_WITH_MOMENTS.has(step.coverageStepId ?? "");

    if (replace) {
      // Keep a short “entry” beat then the precise tagged steps
      const first = kids[0]!;
      const entryEnd = Math.max(1200, (first.atMs ?? 2000) - 600);
      out.push({
        ...step,
        label:
          step.coverageStepId === "scr-vip"
            ? "Rewards entry"
            : step.coverageStepId === "flow-game-launch"
              ? "Launch game"
              : step.label,
        clipWindow: { startMs: 0, endMs: entryEnd },
        atMs: 0,
      });
      out.push(...kids);
      continue;
    }

    if (kids.length > 0) {
      const first = kids[0]!;
      const trimmedEnd = Math.max(1500, (first.atMs ?? 4000) - 500);
      out.push({
        ...step,
        clipWindow:
          step.clipWindow ??
          (first.atMs != null
            ? { startMs: 0, endMs: trimmedEnd }
            : step.clipWindow),
      });
      out.push(...kids);
      continue;
    }

    out.push(step);
  }

  // Orphan moments for this journey (tag mapped, parent beat not in capture list)
  const usedIds = new Set(out.map((s) => s.id));
  const orphans = moments
    .filter(
      (m) =>
        m.annotationId &&
        m.videoUrl &&
        m.journey === journey &&
        !usedIds.has(m.id) &&
        !captureSteps.some((s) => s.coverageStepId === m.coverageStepId),
    )
    .sort((a, b) => (a.atMs ?? 0) - (b.atMs ?? 0));
  for (const m of orphans) {
    const label = momentLabel(m.tags?.[0] ?? "", m.title);
    if (!label || usedIds.has(m.id)) continue;
    out.push(toMomentStep(m, label));
    usedIds.add(m.id);
  }

  return out;
}

function buildCoreFlows(
  host: string,
  coreItems: LibraryMediaItem[],
  researchEmails: ResearchEmail[] = [],
  annotationMoments: LibraryMediaItem[] = [],
): CatalogFlow[] {
  // Flows = screen + flow beats, merged into one CatalogFlow per Scuup journey.
  const journeyItems = coreItems.filter((b) => {
    const slot = CORE_LIBRARY_STEPS[b.coverageStepId ?? ""]?.slot;
    return slot === "screen" || slot === "flow";
  });
  const byJourney = new Map<JourneyId, LibraryMediaItem[]>();
  for (const b of journeyItems) {
    const journey = (b.journey ?? "cross") as JourneyId;
    // Pure global chrome belongs on UI Elements, not Flows.
    if (journey === "cross") continue;
    const list = byJourney.get(journey) ?? [];
    list.push(b);
    byJourney.set(journey, list);
  }

  const flows: CatalogFlow[] = [];
  for (const [journey, list] of byJourney) {
    const ordered = [...list].sort((a, b) => {
      const oa = CORE_LIBRARY_STEPS[a.coverageStepId ?? ""]?.order ?? 99;
      const ob = CORE_LIBRARY_STEPS[b.coverageStepId ?? ""]?.order ?? 99;
      if (oa !== ob) return oa - ob;
      return a.id.localeCompare(b.id);
    });
    const first = ordered[0]!;
    const category = categoryForJourney(journey);
    // Sidebar section = player path (Home → Onboarding → Cashier…), not product taxonomy
    const group = flowSectionForJourney(journey);

    // Prefer Scuup coverage pack actions when present; else ordered step titles.
    const actionSet = new Set<string>();
    for (const item of ordered) {
      const pack = item.flowId ? FLOW_LABELS[item.flowId] : undefined;
      if (pack?.actions?.length) {
        for (const a of pack.actions) actionSet.add(a);
      }
    }
    const actions =
      actionSet.size > 0
        ? [...actionSet]
        : [
            ...new Set(
              ordered.map(
                (i) =>
                  CORE_LIBRARY_STEPS[i.coverageStepId ?? ""]?.title ?? i.title,
              ),
            ),
          ];

    const withVideo = ordered.find((i) => i.hasVideo && i.videoUrl);
    const captureSteps = ordered.map((i) => ({
      id: i.id,
      label:
        CORE_LIBRARY_STEPS[i.coverageStepId ?? ""]?.title ?? i.title,
      kind: i.kind,
      posterUrl: i.posterUrl,
      videoUrl: i.hasVideo ? i.videoUrl : undefined,
      evidenceId: i.evidenceId,
      clipWindow: i.clipWindow,
      coverageStepId: i.coverageStepId,
    }));
    // Precise journey: every tagged moment becomes an ordered step (MCP-ready)
    const journeyMoments = annotationMoments.filter(
      (m) =>
        m.journey === journey ||
        (m.coverageStepId != null &&
          ordered.some((o) => o.coverageStepId === m.coverageStepId)),
    );
    const steps = expandJourneySteps(
      journey,
      captureSteps,
      journeyMoments,
      journey === "signup" ? researchEmails : [],
    );
    const actionsFromSteps = steps.map((s) => s.label);

    flows.push({
      id: `${slugHost(host)}-${journey}`,
      name: JOURNEY_LABELS[journey] ?? journey.replaceAll("_", " "),
      group,
      actions: [...new Set([...actionsFromSteps, ...actions])].slice(0, 12),
      journey,
      category,
      hasVideo: ordered.some((i) => i.hasVideo) || steps.some((s) => s.videoUrl),
      posterUrl: steps[0]?.posterUrl ?? first.posterUrl,
      videoUrl: withVideo?.videoUrl ?? (first.hasVideo ? first.videoUrl : undefined),
      steps,
    });
  }

  // Emails alone: still surface Onboarding when capture signup beats are missing
  if (
    researchEmails.length > 0 &&
    !flows.some((f) => f.journey === "signup")
  ) {
    const emailSteps = emailFlowSteps(researchEmails);
    flows.push({
      id: `${slugHost(host)}-signup`,
      name: JOURNEY_LABELS.signup,
      group: flowSectionForJourney("signup"),
      actions: researchEmails.map((e) => emailStepLabel(e)),
      journey: "signup",
      category: categoryForJourney("signup"),
      hasVideo: false,
      posterUrl: emailSteps[0]?.posterUrl,
      steps: emailSteps,
    });
  }

  // Brand storyboard = precise expanded journeys in site path order (MCP-ready)
  // Onboarding emails are already inside the signup flow steps when present.
  const brandFlowSteps = LIBRARY_FLOW_JOURNEYS.flatMap((j) => {
    const f = flows.find((x) => x.journey === j);
    return f?.steps ?? [];
  });
  // If signup capture exists but emails weren't expanded (edge), splice them
  // after Form filled / Open sign up so Brand journey always shows verify/welcome.
  const hasEmailStep = brandFlowSteps.some((s) => Boolean(s.email));
  if (researchEmails.length > 0 && !hasEmailStep) {
    const emailSteps = emailFlowSteps(researchEmails);
    const afterForm = brandFlowSteps.findIndex((s) =>
      /form filled|sign-?up steps|open sign/i.test(s.label),
    );
    const insertAt =
      afterForm >= 0
        ? afterForm + 1
        : Math.max(
            0,
            brandFlowSteps.findIndex((s) => /login|casino|deposit/i.test(s.label)),
          );
    brandFlowSteps.splice(
      insertAt >= 0 ? insertAt : brandFlowSteps.length,
      0,
      ...emailSteps,
    );
  }
  if (brandFlowSteps.length >= 2) {
    flows.unshift({
      id: `${slugHost(host)}-brand-journey`,
      name: "Brand journey",
      group: "Journey",
      actions: brandFlowSteps.map((s) => s.label).slice(0, 16),
      journey: "landing",
      category: categoryForJourney("landing"),
      hasVideo: brandFlowSteps.some((s) => Boolean(s.videoUrl)),
      posterUrl: brandFlowSteps[0]?.posterUrl,
      videoUrl: undefined,
      steps: brandFlowSteps,
    });
  }

  return flows.sort((a, b) => {
    if (a.id.endsWith("-brand-journey")) return -1;
    if (b.id.endsWith("-brand-journey")) return 1;
    return compareByJourneyOrder(a, b);
  });
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

    // Show every published beat with media — CORE_LIBRARY_STEPS orders/titles only.
    const use = [...beats]
      .filter((i) => i.posterUrl || i.hasVideo)
      .sort((a, b) => {
        const oa = CORE_LIBRARY_STEPS[a.coverageStepId ?? ""]?.order ?? 80;
        const ob = CORE_LIBRARY_STEPS[b.coverageStepId ?? ""]?.order ?? 80;
        return oa - ob;
      });
    if (!use.length) continue;
    const first = use[0]!;

    const screens: CatalogScreen[] = use
      .filter((i) => {
        const slot = CORE_LIBRARY_STEPS[i.coverageStepId ?? ""]?.slot;
        if (slot === "ui") return false;
        if (slot === "screen" || slot === "flow") return true;
        // Unknown step ids still surface as screens when they have media
        return i.taxonomy !== "ui_element";
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
      // Always surface tagged moments (animation / loader / custom) — curated
      // titles preferred; otherwise use label or tag so filters can find them.
      const title =
        a.elementLabel?.trim() ||
        curated?.title ||
        rawTag.replace(/_/g, " ").trim();
      if (!title) continue;
      const dedupe = momentDedupeKey(title, a.atMs);
      if (seenMoments.has(dedupe)) continue;
      seenMoments.add(dedupe);
      const category = a.category || curated?.category || "Cross";
      uiFromTags.push({
        id: a.id,
        name: title,
        count: 1,
        posterUrl: a.posterUrl,
        videoUrl: a.hasVideo || a.videoUrl ? a.videoUrl : undefined,
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
        parentScreen: curated?.parentScreen,
        tags: a.tags,
        searchText: tagSearchText(rawTag, {
          title,
          synonyms: a.searchSynonyms ?? curated?.synonyms,
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

    const emailPack = await loadResearchEmailsForHost(host);
    const onboardingMail = emailPack ? onboardingEmails(emailPack) : [];
    const flows = buildCoreFlows(
      host,
      use.filter((i) => {
        const slot = CORE_LIBRARY_STEPS[i.coverageStepId ?? ""]?.slot;
        return slot !== "ui";
      }),
      onboardingMail,
      anns,
    );
    // Prefer a trimmed screen beat for the catalogue hero (not a black t=0 frame).
    // Casino lobby first when present (crypto/casino brands beat sports home).
    // Then betslip over full event view so sports covers stay element-true.
    const hero =
      use.find(
        (i) =>
          i.hasVideo &&
          (i.coverageStepId === "scr-casino-lobby" ||
            i.coverageStepId === "ca-lobby"),
      ) ??
      use.find((i) => i.hasVideo && i.coverageStepId === "flow-game-launch") ??
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
      // No community ratings yet — avoid hard-coded 5.0 / fake review counts
      rating: 0,
      ratingCount: 0,
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
      emails: emailPack?.emails?.length
        ? (emailPack.emails.map(
            (e): CatalogEmail => ({
              id: e.id,
              subject: e.subject,
              from: e.from,
              receivedAt: e.receivedAt,
              category: e.category,
              snippet: e.snippet,
              posterUrl: e.posterUrl,
              html: e.html,
            }),
          ))
        : undefined,
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
