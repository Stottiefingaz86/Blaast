import type { CatalogOperator, CatalogScreen } from "@/lib/library/catalog";

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
  betslip: ["betslip"],
  "event view": ["event", "event view"],
  "place a bet": ["place a bet", "event", "betslip", "add to betslip"],
  "first deposit": ["deposit", "cashier"],
};

function screenMatches(screen: CatalogScreen, needles: string[]): boolean {
  const hay = `${screen.title} ${(screen.tags ?? []).join(" ")} ${screen.journey ?? ""} ${screen.id}`.toLowerCase();
  return needles.some((n) => hay.includes(n));
}

/**
 * When the library filter is Home / Onboarding / …, use that screen’s
 * media as the card cover — not the default sports hero.
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

  const needles =
    FOCUS_ALIASES[chip] ??
    Object.entries(FOCUS_ALIASES).find(([k]) => chip.includes(k))?.[1] ??
    [chip];

  const screens = operator.screens.filter((s) => screenMatches(s, needles));
  const withMedia =
    screens.find((s) => s.videoUrl || s.posterUrl) ?? screens[0];

  if (withMedia) {
    return {
      posterUrl: withMedia.posterUrl ?? operator.posterUrl,
      videoUrl: withMedia.videoUrl ?? operator.videoUrl,
      clipWindow: withMedia.clipWindow ?? operator.heroClipWindow,
      label: withMedia.title,
    };
  }

  // Flows (e.g. onboarding) — first step with media
  const flow = operator.flows.find((f) => {
    const hay = `${f.name} ${f.group} ${f.journey ?? ""}`.toLowerCase();
    return needles.some((n) => hay.includes(n));
  });
  const step = flow?.steps.find((s) => s.videoUrl || s.posterUrl);
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
