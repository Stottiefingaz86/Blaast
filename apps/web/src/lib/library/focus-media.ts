import type {
  CatalogOperator,
  CatalogScreen,
  CatalogUiElement,
} from "@/lib/library/catalog";

export type FocusHero = {
  posterUrl?: string;
  videoUrl?: string;
  clipWindow?: { startMs: number; endMs: number };
  label?: string;
};

const FOCUS_ALIASES: Record<string, string[]> = {
  home: ["home", "landing", "scr-home"],
  onboarding: ["onboarding", "login", "sign up", "signup", "register", "kyc"],
  lobby: ["lobby", "casino lobby", "ca-lobby"],
  search: ["search"],
  betslip: ["betslip", "scr-betslip", "closed_betslip"],
  "event view": ["event view", "event", "flow-bet-event"],
  "place a bet": ["place a bet", "add to betslip", "betslip"],
  "first deposit": ["deposit", "cashier"],
  header: ["header"],
  "odds button": ["odds button", "odds"],
  "tab bar": ["tab bar", "tabbar"],
  "game card": ["game card"],
  "activity feed": ["activity feed"],
  "method row": ["method row", "payment method"],
  loader: ["loader"],
  skeleton: ["skeleton"],
};

function needlesFor(focus: string): string[] {
  const chip = focus.trim().toLowerCase();
  return (
    FOCUS_ALIASES[chip] ??
    Object.entries(FOCUS_ALIASES).find(([k]) => chip.includes(k))?.[1] ??
    [chip]
  );
}

function haystack(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function scoreMatch(
  text: string,
  title: string,
  needles: string[],
  hasClip: boolean,
  hasVideo: boolean,
): number {
  const t = title.toLowerCase().trim();
  let score = 0;
  for (const n of needles) {
    if (t === n) score = Math.max(score, 100);
    else if (t.startsWith(n) || t.endsWith(n)) score = Math.max(score, 80);
    else if (t.includes(n)) score = Math.max(score, 60);
    else if (text.includes(n)) score = Math.max(score, 40);
  }
  if (score === 0) return 0;
  if (hasClip) score += 15;
  if (hasVideo) score += 10;
  return score;
}

function pickBestScreen(
  screens: CatalogScreen[],
  needles: string[],
): CatalogScreen | undefined {
  let best: CatalogScreen | undefined;
  let bestScore = 0;
  for (const s of screens) {
    const text = haystack([
      s.title,
      ...(s.tags ?? []),
      s.journey,
      s.id,
    ]);
    const score = scoreMatch(
      text,
      s.title,
      needles,
      Boolean(s.clipWindow),
      Boolean(s.videoUrl),
    );
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  // Require title/id hit (≥60) — tag-only matches steal Betslip → Event view
  return bestScore >= 60 ? best : undefined;
}

function pickBestUi(
  elements: CatalogUiElement[],
  needles: string[],
): CatalogUiElement | undefined {
  let best: CatalogUiElement | undefined;
  let bestScore = 0;
  for (const el of elements) {
    const text = haystack([
      el.name,
      el.searchText,
      ...(el.tags ?? []),
      el.journey,
      el.id,
    ]);
    const score = scoreMatch(
      text,
      el.name,
      needles,
      Boolean(el.clipWindow || el.atMs != null),
      Boolean(el.videoUrl),
    );
    if (score > bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return bestScore >= 60 ? best : undefined;
}

/**
 * When the library filter is Home / Betslip / Header / …, use that
 * screen or UI element’s media as the card cover — not the default sports hero.
 */
export function resolveFocusHero(
  operator: CatalogOperator,
  focus: string | null | undefined,
): FocusHero {
  const chip = focus?.trim().toLowerCase();
  if (!chip) {
    return {
      posterUrl: operator.posterUrl,
      videoUrl: operator.videoUrl,
      clipWindow: operator.heroClipWindow,
    };
  }

  const needles = needlesFor(chip);

  // Prefer exact screen (e.g. "Betslip") over looser Event-view heroes
  const screen = pickBestScreen(operator.screens, needles);
  const ui = pickBestUi(operator.uiElements, needles);

  const screenScore = screen
    ? scoreMatch(
        haystack([
          screen.title,
          ...(screen.tags ?? []),
          screen.journey,
          screen.id,
        ]),
        screen.title,
        needles,
        Boolean(screen.clipWindow),
        Boolean(screen.videoUrl),
      )
    : 0;
  const uiScore = ui
    ? scoreMatch(
        haystack([
          ui.name,
          ui.searchText,
          ...(ui.tags ?? []),
          ui.journey,
          ui.id,
        ]),
        ui.name,
        needles,
        Boolean(ui.clipWindow || ui.atMs != null),
        Boolean(ui.videoUrl),
      )
    : 0;

  // Element chips (Header, …) prefer UI; screen chips prefer the screen beat
  const uiChips = new Set([
    "header",
    "odds button",
    "tab bar",
    "game card",
    "activity feed",
    "method row",
    "loader",
    "skeleton",
  ]);
  const preferUi =
    uiScore > 0 &&
    (uiChips.has(chip) ? uiScore >= screenScore : uiScore > screenScore);

  if (preferUi && ui) {
    return {
      posterUrl: ui.posterUrl ?? operator.posterUrl,
      videoUrl: ui.videoUrl ?? operator.videoUrl,
      clipWindow:
        ui.clipWindow ??
        (ui.atMs != null
          ? { startMs: Math.max(0, ui.atMs - 400), endMs: ui.atMs + 2500 }
          : operator.heroClipWindow),
      label: ui.name,
    };
  }

  if (screen && screenScore > 0) {
    return {
      posterUrl: screen.posterUrl ?? operator.posterUrl,
      videoUrl: screen.videoUrl ?? operator.videoUrl,
      clipWindow: screen.clipWindow ?? operator.heroClipWindow,
      label: screen.title,
    };
  }

  if (ui) {
    return {
      posterUrl: ui.posterUrl ?? operator.posterUrl,
      videoUrl: ui.videoUrl ?? operator.videoUrl,
      clipWindow:
        ui.clipWindow ??
        (ui.atMs != null
          ? { startMs: Math.max(0, ui.atMs - 400), endMs: ui.atMs + 2500 }
          : operator.heroClipWindow),
      label: ui.name,
    };
  }

  // Flows (e.g. onboarding) — first step with media matching needles
  const flow = operator.flows.find((f) => {
    const hay = `${f.name} ${f.group} ${f.journey ?? ""}`.toLowerCase();
    return needles.some((n) => hay.includes(n));
  });
  const step =
    flow?.steps.find((s) => {
      const hay = `${s.label} ${s.id}`.toLowerCase();
      return needles.some((n) => hay.includes(n)) && (s.videoUrl || s.posterUrl);
    }) ?? flow?.steps.find((s) => s.videoUrl || s.posterUrl);
  if (step) {
    return {
      posterUrl: step.posterUrl ?? flow?.posterUrl ?? operator.posterUrl,
      videoUrl: step.videoUrl ?? flow?.videoUrl ?? operator.videoUrl,
      clipWindow: step.clipWindow ?? operator.heroClipWindow,
      label: step.label,
    };
  }

  return {
    posterUrl: operator.posterUrl,
    videoUrl: operator.videoUrl,
    clipWindow: operator.heroClipWindow,
  };
}
