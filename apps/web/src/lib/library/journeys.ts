/**
 * Library journeys — aligned with Surchly / Scuup Journey Audit keys
 * (`~/surchly/src/lib/constants.ts` ALL_JOURNEYS + JOURNEY_LABELS).
 *
 * Capture coverage `flowId`s and playbook step ids map into these so
 * Screens / UI / Flows can filter by journey + product category.
 */

export type JourneyId =
  | "landing"
  | "signup"
  | "deposit"
  | "withdraw"
  | "casino"
  | "bingo"
  | "sports_betslip"
  | "loyalty_rewards"
  | "support"
  | "my_account"
  | "cross";

/** Product surface for library filters (Sports / Casino / …). */
export type LibraryCategory =
  | "Sports"
  | "Casino"
  | "Cashier"
  | "Rewards"
  | "Account"
  | "Cross";

/**
 * Display names — Scuup Journey Audit (`ALL_JOURNEYS` / `JOURNEY_LABELS`).
 * Library mega “Flows” column uses these (Onboarding = Scuup Sign Up).
 */
export const JOURNEY_LABELS: Record<JourneyId, string> = {
  landing: "Home",
  signup: "Onboarding",
  deposit: "First time deposit",
  withdraw: "Withdrawal",
  casino: "Play casino",
  bingo: "Bingo Lobby",
  sports_betslip: "Sports Betslip",
  loyalty_rewards: "Loyalty & Rewards",
  support: "Support",
  my_account: "My Account",
  cross: "Global chrome",
};

/**
 * Site journey order — how a player moves through the product.
 * Home → Onboarding → Cashier → Casino → Sports → Rewards → Account
 */
export const LIBRARY_FLOW_JOURNEYS: JourneyId[] = [
  "landing",
  "signup",
  "deposit",
  "withdraw",
  "casino",
  "bingo",
  "sports_betslip",
  "loyalty_rewards",
  "support",
  "my_account",
];

/** Flows tab sidebar sections (user path, not product taxonomy). */
export const FLOW_SECTION_ORDER = [
  "Journey",
  "Home",
  "Onboarding",
  "Cashier",
  "Casino",
  "Sports",
  "Loyalty & Rewards",
  "My Account",
] as const;

export type FlowSection = (typeof FLOW_SECTION_ORDER)[number];

export function flowSectionForJourney(
  journey: JourneyId | string | undefined,
): FlowSection {
  switch (journey) {
    case "landing":
      return "Home";
    case "signup":
      return "Onboarding";
    case "deposit":
    case "withdraw":
      return "Cashier";
    case "casino":
    case "bingo":
      return "Casino";
    case "sports_betslip":
      return "Sports";
    case "loyalty_rewards":
      return "Loyalty & Rewards";
    case "support":
    case "my_account":
      return "My Account";
    default:
      return "Home";
  }
}

export function flowSectionSortIndex(section: string): number {
  const i = (FLOW_SECTION_ORDER as readonly string[]).indexOf(section);
  return i >= 0 ? i : FLOW_SECTION_ORDER.length;
}

/** Mega Flows column — site path (Home first). */
export const LIBRARY_FLOWS = LIBRARY_FLOW_JOURNEYS.map(
  (id) => JOURNEY_LABELS[id],
);

/** Flows tab / catalog sort — entry home first, then acquisition → play → retain. */
export function journeySortIndex(journey: JourneyId | string | undefined): number {
  if (!journey) return LIBRARY_FLOW_JOURNEYS.length + 2;
  const i = LIBRARY_FLOW_JOURNEYS.indexOf(journey as JourneyId);
  if (i >= 0) return i;
  if (journey === "cross") return LIBRARY_FLOW_JOURNEYS.length;
  return LIBRARY_FLOW_JOURNEYS.length + 1;
}

export function compareByJourneyOrder(
  a: { journey?: string; name?: string },
  b: { journey?: string; name?: string },
): number {
  const d = journeySortIndex(a.journey) - journeySortIndex(b.journey);
  if (d !== 0) return d;
  return (a.name ?? "").localeCompare(b.name ?? "");
}

/** Extra search tokens per Scuup journey (discover + filters). */
export const JOURNEY_SEARCH_ALIASES: Record<JourneyId, string[]> = {
  landing: ["first impression", "homepage", "home", "landing"],
  signup: [
    "onboarding",
    "sign up",
    "signup",
    "register",
    "registration",
    "join",
  ],
  deposit: ["ftd", "first time deposit", "deposit", "cashier", "fund"],
  withdraw: ["withdrawal", "withdraw", "cash out payout", "payout"],
  casino: ["casino lobby", "slots", "games lobby", "arcade"],
  bingo: ["bingo lobby", "bingo rooms"],
  sports_betslip: [
    "betslip",
    "bet slip",
    "sportsbook",
    "place a bet",
    "odds",
    "sgp",
    "parlay",
    "acca",
  ],
  loyalty_rewards: ["loyalty", "rewards", "vip", "promotions", "bonus"],
  support: ["support", "help", "chat", "contact"],
  my_account: ["my account", "account", "profile", "settings", "login"],
  cross: ["header", "nav", "chrome", "global"],
};

/** Mega flow filter / search — match label, journey id, or aliases. */
export function flowMatchesJourneyFilter(
  flow: { name: string; journey?: string; actions?: string[] },
  filterLabel: string,
): boolean {
  const needle = filterLabel.toLowerCase().trim();
  if (!needle) return true;
  if (flow.name.toLowerCase().includes(needle)) return true;
  if ((flow.actions ?? []).some((a) => a.toLowerCase().includes(needle))) {
    return true;
  }
  const j = flow.journey as JourneyId | undefined;
  if (!j) return false;
  if (JOURNEY_LABELS[j]?.toLowerCase().includes(needle)) return true;
  if (j.replaceAll("_", " ").includes(needle)) return true;
  if (j.replaceAll("_", "").includes(needle.replace(/\s+/g, ""))) return true;
  return (JOURNEY_SEARCH_ALIASES[j] ?? []).some(
    (a) => a.includes(needle) || needle.includes(a),
  );
}

/** Flatten operator text for capture search. */
export function operatorSearchHaystack(op: {
  name: string;
  tagline?: string;
  category?: string;
  screens?: Array<{ title: string; tags?: string[] }>;
  uiElements?: Array<{
    name: string;
    category?: string;
    searchText?: string;
    tags?: string[];
  }>;
  flows?: Array<{
    name: string;
    group?: string;
    journey?: string;
    actions?: string[];
    steps?: Array<{ label: string }>;
  }>;
}): string {
  const parts: string[] = [
    op.name,
    op.tagline ?? "",
    op.category ?? "",
  ];
  for (const s of op.screens ?? []) {
    parts.push(s.title, ...(s.tags ?? []));
  }
  for (const u of op.uiElements ?? []) {
    parts.push(
      u.name,
      u.category ?? "",
      u.searchText ?? "",
      ...(u.tags ?? []),
    );
  }
  for (const f of op.flows ?? []) {
    parts.push(f.name, f.group ?? "", ...(f.actions ?? []));
    if (f.journey) {
      parts.push(f.journey, f.journey.replaceAll("_", " "));
      const label = JOURNEY_LABELS[f.journey as JourneyId];
      if (label) parts.push(label);
      parts.push(...(JOURNEY_SEARCH_ALIASES[f.journey as JourneyId] ?? []));
    }
    for (const step of f.steps ?? []) {
      parts.push(step.label);
    }
  }
  return parts.join(" ").toLowerCase();
}

export const JOURNEY_CATEGORY: Record<JourneyId, LibraryCategory> = {
  landing: "Cross",
  signup: "Account",
  deposit: "Cashier",
  withdraw: "Cashier",
  casino: "Casino",
  bingo: "Casino",
  sports_betslip: "Sports",
  loyalty_rewards: "Rewards",
  support: "Account",
  my_account: "Account",
  cross: "Cross",
};

/** Blaast coverage `flowId` → Scuup journey */
export const COVERAGE_FLOW_TO_JOURNEY: Record<string, JourneyId> = {
  home_tour: "landing",
  sign_up: "signup",
  first_deposit: "deposit",
  place_a_bet: "sports_betslip",
  cash_out: "sports_betslip",
  casino_browse: "casino",
  promotions: "loyalty_rewards",
  vip_rewards: "loyalty_rewards",
  withdrawal: "withdraw",
  account: "signup",
  /** Legacy brand-coverage id */
  onboarding: "signup",
};

/** Capture step ids (coverage + casino-core playbook) → journey */
export const STEP_TO_JOURNEY: Record<string, JourneyId> = {
  "scr-home": "landing",
  "ui-header": "cross",
  "ui-side-nav": "cross",
  "ui-tab-bar": "cross",
  "ui-loader": "cross",
  "ui-skeleton": "cross",
  "ui-activity-feed": "landing",
  "flow-signup-open": "signup",
  "scr-register": "signup",
  "flow-signup-steps": "signup",
  "flow-signup-complete": "signup",
  "flow-signup-email-verify": "signup",
  "flow-signup-email-welcome": "signup",
  "scr-login": "signup",
  "scr-my-account": "signup",
  "scr-deposit": "deposit",
  "ui-method-row": "deposit",
  "flow-deposit-amount": "deposit",
  "flow-withdraw": "withdraw",
  "flow-bet-event": "sports_betslip",
  "flow-bet-add": "sports_betslip",
  "flow-bet-place": "sports_betslip",
  "scr-betslip": "sports_betslip",
  "ui-odds-button": "sports_betslip",
  "flow-cashout": "sports_betslip",
  "scr-casino-lobby": "casino",
  "ca-lobby": "casino",
  "ca-nav": "casino",
  "ca-game-card": "casino",
  "ca-provider": "casino",
  "ca-game-info": "casino",
  "ca-recents": "casino",
  "ca-jackpots": "casino",
  "ui-game-card": "casino",
  "flow-game-launch": "casino",
  "scr-promotions": "loyalty_rewards",
  "ui-promo-card": "loyalty_rewards",
  "scr-vip": "loyalty_rewards",
  "flow-bonus-claim": "loyalty_rewards",
};

/** Tag → journey hints (annotations) */
export const TAG_TO_JOURNEY: Record<string, JourneyId> = {
  sports_event: "sports_betslip",
  place_a_bet: "sports_betslip",
  betslip: "sports_betslip",
  closed_betslip: "sports_betslip",
  single_bet: "sports_betslip",
  single: "sports_betslip",
  combo: "sports_betslip",
  parlay: "sports_betslip",
  combo_parlay_acca: "sports_betslip",
  "combo,_parlay,_acca": "sports_betslip",
  same_game_parlay: "sports_betslip",
  "same_game_parlays,_acca": "sports_betslip",
  sgp: "sports_betslip",
  odds_button: "sports_betslip",
  sports_sub_nav: "sports_betslip",
  casino_lobby: "casino",
  casino_nav: "casino",
  game_card: "casino",
  providers: "casino",
  game_info: "casino",
  casino_slots: "casino",
  trending_slots: "casino",
  casino_originals: "casino",
  new_releases_casino: "casino",
  live_casino_games: "casino",
  casino_providers: "casino",
  jackpots: "casino",
  recents: "casino",
  popular_sports: "sports_betslip",
  sport_carousel: "sports_betslip",
  sportsbook_carousel: "sports_betslip",
  sports_homepage: "sports_betslip",
  sports_offering: "sports_betslip",
  event_view: "sports_betslip",
  activity_feed: "landing",
  vip_block: "loyalty_rewards",
  rewards: "loyalty_rewards",
  rewards_hub: "loyalty_rewards",
  rewards_page: "loyalty_rewards",
  vip_page: "loyalty_rewards",
  vip: "loyalty_rewards",
  loyalty: "loyalty_rewards",
  promotions: "loyalty_rewards",
  promo_card: "loyalty_rewards",
  offers: "loyalty_rewards",
  casino_stats: "casino",
  full_screen_game: "casino",
  mini_casino_game_launcher: "casino",
  mini_game_launcher: "casino",
  game_launch: "casino",
  header_nav: "cross",
  side_nav: "cross",
  main_nav: "cross",
  tab_bar: "cross",
  loader: "cross",
  skeleton: "cross",
  hero: "landing",
};

export function journeyForStep(
  coverageStepId?: string,
  tags: string[] = [],
  flowId?: string,
  /** When true, private tags win (UI element cards from annotations). */
  preferTags = false,
): JourneyId {
  if (preferTags) {
    for (const t of tags) {
      const key = t.toLowerCase().replace(/\s+/g, "_");
      if (TAG_TO_JOURNEY[key]) return TAG_TO_JOURNEY[key]!;
    }
  }
  if (coverageStepId && STEP_TO_JOURNEY[coverageStepId]) {
    return STEP_TO_JOURNEY[coverageStepId]!;
  }
  if (flowId && COVERAGE_FLOW_TO_JOURNEY[flowId]) {
    return COVERAGE_FLOW_TO_JOURNEY[flowId]!;
  }
  for (const t of tags) {
    const key = t.toLowerCase().replace(/\s+/g, "_");
    if (TAG_TO_JOURNEY[key]) return TAG_TO_JOURNEY[key]!;
  }
  return "cross";
}

export function categoryForJourney(journey: JourneyId): LibraryCategory {
  return JOURNEY_CATEGORY[journey];
}

/**
 * Library UI Elements tab labels.
 * "Cross" was internal shorthand for shared chrome (header, nav, loaders) —
 * surface it as Home so filters read like product surfaces.
 */
export const UI_CATEGORY_LABELS: Record<LibraryCategory, string> = {
  Sports: "Sports",
  Casino: "Casino",
  Cashier: "Cashier",
  Rewards: "Rewards",
  Account: "Account",
  Cross: "Home",
};

export function uiCategoryLabel(category: string): string {
  if (category in UI_CATEGORY_LABELS) {
    return UI_CATEGORY_LABELS[category as LibraryCategory];
  }
  return category;
}

export function formatCategories(cats: Iterable<LibraryCategory>): string {
  const order: LibraryCategory[] = [
    "Sports",
    "Casino",
    "Cashier",
    "Rewards",
    "Account",
    "Cross",
  ];
  const set = new Set(cats);
  return order.filter((c) => set.has(c) && c !== "Cross").join(" · ") || "iGaming";
}
