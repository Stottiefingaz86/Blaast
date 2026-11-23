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

export const JOURNEY_LABELS: Record<JourneyId, string> = {
  landing: "First impression",
  signup: "Sign up",
  deposit: "First deposit",
  withdraw: "Withdraw",
  casino: "Casino lobby",
  bingo: "Bingo lobby",
  sports_betslip: "Sports betslip",
  loyalty_rewards: "Loyalty & rewards",
  support: "Support",
  my_account: "My account",
  cross: "Global chrome",
};

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
