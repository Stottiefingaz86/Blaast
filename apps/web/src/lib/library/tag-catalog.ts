import type { LibraryCategory } from "@/lib/library/journeys";

/**
 * Tag → Mobbin-style UI element cards.
 * Private capture tags become clean library titles + search synonyms.
 */
export type CuratedTagMeta = {
  title: string;
  order: number;
  /** Product surface for UI Elements category chips */
  category: LibraryCategory;
  /**
   * Parent screen chip (global taxonomy).
   * e.g. single_bet / combo → "betslip" so Library → Betslip includes them.
   */
  parentScreen?: string;
  /** Extra search terms (e.g. popular → trending_slots) */
  synonyms: string[];
};

export const CURATED_UI_TAGS: Record<string, CuratedTagMeta> = {
  // Chrome
  side_nav: {
    title: "Side nav",
    order: 1,
    category: "Cross",
    synonyms: ["nav", "menu", "sidebar"],
  },
  main_nav: {
    title: "Side nav",
    order: 1,
    category: "Cross",
    synonyms: ["nav", "menu", "sidebar"],
  },
  header_nav: {
    title: "Header",
    order: 2,
    category: "Cross",
    synonyms: ["header", "top bar", "wallet"],
  },
  sports_sub_nav: {
    title: "Sports sub nav",
    order: 3,
    category: "Sports",
    synonyms: ["sports nav", "leagues"],
  },
  tab_bar: {
    title: "Tab bar",
    order: 4,
    category: "Cross",
    synonyms: ["tabs", "product switcher"],
  },
  global_nav: {
    title: "Global nav",
    order: 4,
    category: "Cross",
    synonyms: ["nav", "chrome"],
  },
  hamburger_menu: {
    title: "Menu",
    order: 4,
    category: "Cross",
    synonyms: ["hamburger", "menu"],
  },
  odds_button: {
    title: "Odds button",
    order: 5,
    category: "Sports",
    synonyms: ["odds", "price", "selection"],
  },
  activity_feed: {
    title: "Activity feed",
    order: 6,
    category: "Cross",
    synonyms: ["feed", "live wins", "activity"],
  },
  vip_block: {
    title: "VIP",
    order: 7,
    category: "Rewards",
    synonyms: ["vip", "loyalty", "tier"],
  },
  "rewards,_loyalty": {
    title: "Rewards",
    order: 7,
    category: "Rewards",
    synonyms: ["rewards", "loyalty", "missions"],
  },
  rewards: {
    title: "Rewards",
    order: 7,
    category: "Rewards",
    synonyms: ["rewards", "loyalty"],
  },
  loader: {
    title: "Loader",
    order: 8,
    category: "Cross",
    synonyms: ["spinner", "loading", "motion", "animation"],
  },
  skeleton: {
    title: "Skeleton",
    order: 8,
    category: "Cross",
    synonyms: ["shimmer", "loading", "placeholder"],
  },
  loading_skeleton: {
    title: "Skeleton",
    order: 8,
    category: "Cross",
    synonyms: ["shimmer", "loading", "placeholder", "loader"],
  },
  animation: {
    title: "Animation",
    order: 8,
    category: "Cross",
    // Keep synonyms narrow — do not pull every loader clip into Animation filter
    synonyms: ["motion", "transition"],
  },
  motion: {
    title: "Animation",
    order: 8,
    category: "Cross",
    synonyms: ["animation", "transition"],
  },
  error: {
    title: "Error alert",
    order: 9,
    category: "Account",
    synonyms: ["error", "alert", "toast", "validation", "inline error"],
  },
  alert: {
    title: "Error alert",
    order: 9,
    category: "Account",
    synonyms: ["error", "toast", "banner"],
  },
  toast: {
    title: "Error alert",
    order: 9,
    category: "Account",
    synonyms: ["error", "alert"],
  },

  // Casino discovery rows
  casino_nav: {
    title: "Casino nav",
    order: 20,
    category: "Casino",
    synonyms: ["casino", "categories"],
  },
  casino_lobby: {
    title: "Casino lobby",
    order: 21,
    category: "Casino",
    synonyms: ["casino", "lobby"],
  },
  casino_slots: {
    title: "Slots row",
    order: 22,
    category: "Casino",
    synonyms: ["slots", "casino", "games", "popular"],
  },
  trending_slots: {
    title: "Popular slots",
    order: 23,
    category: "Casino",
    synonyms: ["popular", "trending", "slots", "casino", "hot"],
  },
  casino_originals: {
    title: "Casino originals",
    order: 24,
    category: "Casino",
    synonyms: ["originals", "casino", "in-house"],
  },
  new_releases_casino: {
    title: "New casino releases",
    order: 25,
    category: "Casino",
    synonyms: ["new", "releases", "casino", "slots"],
  },
  live_casino_games: {
    title: "Live casino",
    order: 26,
    category: "Casino",
    synonyms: ["live", "casino", "blackjack", "roulette"],
  },
  casino_providers: {
    title: "Providers row",
    order: 27,
    category: "Casino",
    synonyms: ["providers", "studios", "casino"],
  },
  providers: {
    title: "Provider hub",
    order: 28,
    category: "Casino",
    synonyms: ["providers", "studio"],
  },
  game_card: {
    title: "Game card",
    order: 29,
    category: "Casino",
    synonyms: ["tile", "game", "slot card"],
  },
  game_info: {
    title: "Game info",
    order: 30,
    category: "Casino",
    synonyms: ["rtp", "info", "launch"],
  },
  jackpots: {
    title: "Jackpots",
    order: 31,
    category: "Casino",
    synonyms: ["jackpot", "progressive"],
  },
  recents: {
    title: "Recents",
    order: 32,
    category: "Casino",
    synonyms: ["recent", "favourites", "continue"],
  },

  // Sports discovery
  popular_sports: {
    title: "Popular sports",
    order: 40,
    category: "Sports",
    synonyms: ["popular", "sports", "trending", "sportsbook"],
  },
  sport_carousel: {
    title: "Sports carousel",
    order: 41,
    category: "Sports",
    synonyms: ["popular", "sports", "carousel"],
  },
  sportsbook_carousel: {
    title: "Sports carousel",
    order: 41,
    category: "Sports",
    synonyms: ["popular", "sports", "carousel", "sportsbook"],
  },
  sports_homepage: {
    title: "Sports home",
    order: 42,
    category: "Sports",
    synonyms: ["sports", "home", "offering"],
  },
  sports_offering: {
    title: "Sports offering",
    order: 43,
    category: "Sports",
    synonyms: ["sports", "leagues", "events"],
  },
  event_view: {
    title: "Event view",
    order: 44,
    category: "Sports",
    synonyms: ["match", "event", "markets"],
  },
  live_scoreboard: {
    title: "Live scoreboard",
    order: 45,
    category: "Sports",
    synonyms: ["live", "score", "match"],
  },
  match_tracker: {
    title: "Match tracker",
    order: 46,
    category: "Sports",
    synonyms: ["tracker", "live", "pitch"],
  },
  betslip: {
    title: "Betslip",
    order: 47,
    category: "Sports",
    parentScreen: "betslip",
    synonyms: ["betslip", "stake", "ticket"],
  },
  closed_betslip: {
    title: "Closed betslip",
    order: 47,
    category: "Sports",
    parentScreen: "betslip",
    synonyms: ["betslip", "closed"],
  },
  single_bet: {
    title: "Single bet",
    order: 48,
    category: "Sports",
    parentScreen: "betslip",
    synonyms: ["single", "betslip"],
  },
  single: {
    title: "Single bet",
    order: 48,
    category: "Sports",
    parentScreen: "betslip",
    synonyms: ["single", "betslip"],
  },
  "combo,_parlay,_acca": {
    title: "Combo / parlay",
    order: 49,
    category: "Sports",
    parentScreen: "betslip",
    synonyms: ["parlay", "acca", "combo", "multi"],
  },
  combo_parlay_acca: {
    title: "Combo / parlay",
    order: 49,
    category: "Sports",
    parentScreen: "betslip",
    synonyms: ["parlay", "acca", "combo", "multi"],
  },
  combo: {
    title: "Combo / parlay",
    order: 49,
    category: "Sports",
    parentScreen: "betslip",
    synonyms: ["parlay", "acca", "combo", "multi"],
  },
  parlay: {
    title: "Combo / parlay",
    order: 49,
    category: "Sports",
    parentScreen: "betslip",
    synonyms: ["parlay", "acca", "combo", "multi"],
  },
  "same_game_parlays,_acca": {
    title: "Same game parlay",
    order: 50,
    category: "Sports",
    parentScreen: "betslip",
    synonyms: ["sgp", "parlay", "bet builder"],
  },
  same_game_parlay: {
    title: "Same game parlay",
    order: 50,
    category: "Sports",
    parentScreen: "betslip",
    synonyms: ["sgp", "parlay", "bet builder"],
  },
  sgp: {
    title: "Same game parlay",
    order: 50,
    category: "Sports",
    parentScreen: "betslip",
    synonyms: ["sgp", "parlay", "bet builder"],
  },

  // Home / trust
  hero: {
    title: "Hero",
    order: 10,
    category: "Cross",
    synonyms: ["banner", "promo", "hero"],
  },
  trust: {
    title: "Trust strip",
    order: 11,
    category: "Cross",
    synonyms: ["trust", "payments", "licence"],
  },
  payments: {
    title: "Payments",
    order: 12,
    category: "Cashier",
    synonyms: ["payments", "methods", "cashier"],
  },
  support: {
    title: "Support",
    order: 13,
    category: "Account",
    synonyms: ["help", "support", "chat"],
  },
  help: {
    title: "Help",
    order: 13,
    category: "Account",
    synonyms: ["help", "faq"],
  },
  chat: {
    title: "Chat",
    order: 14,
    category: "Cross",
    synonyms: ["chat", "community"],
  },
  "chat,_community": {
    title: "Community chat",
    order: 14,
    category: "Cross",
    synonyms: ["chat", "community"],
  },
  global_search: {
    title: "Search",
    order: 15,
    category: "Cross",
    synonyms: ["search", "find"],
  },
  promotions: {
    title: "Promotions",
    order: 16,
    category: "Rewards",
    synonyms: ["promo", "offers", "bonus"],
  },
  promotion_raffles: {
    title: "Raffles",
    order: 17,
    category: "Rewards",
    synonyms: ["raffle", "promo"],
  },
  "races,_daily,_weekly,_monthly": {
    title: "Races",
    order: 18,
    category: "Rewards",
    synonyms: ["races", "leaderboard", "rewards"],
  },
};

/** Normalize raw annotation tags for lookup. */
export function normalizeTagKey(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[,\s]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function curatedTagMeta(tag: string): CuratedTagMeta | undefined {
  const key = normalizeTagKey(tag);
  if (CURATED_UI_TAGS[key]) return CURATED_UI_TAGS[key];
  // Legacy keys that kept literal commas in the map
  const withCommas = key.replace(/_/g, ",_");
  if (CURATED_UI_TAGS[withCommas]) return CURATED_UI_TAGS[withCommas];
  return undefined;
}

/** Tags / UI titles that belong under a screen chip (e.g. Betslip → single, combo). */
export function belongsToScreenChip(
  chip: string,
  opts: {
    name?: string;
    tags?: string[];
    searchText?: string;
    parentScreen?: string;
  },
): boolean {
  const needle = chip.trim().toLowerCase();
  if (!needle) return false;
  if (opts.parentScreen?.toLowerCase() === needle) return true;
  const hay = [opts.name, opts.searchText, ...(opts.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (hay.includes(needle)) return true;
  for (const t of opts.tags ?? []) {
    const meta = curatedTagMeta(t);
    if (meta?.parentScreen?.toLowerCase() === needle) return true;
    if (meta?.title.toLowerCase().includes(needle)) return true;
  }
  return false;
}

/** Search haystack for a curated tag + optional LLM synonyms. */
export function tagSearchText(
  tag: string,
  extras?: { title?: string; synonyms?: string[] },
): string {
  const meta = curatedTagMeta(tag);
  const parts = [
    tag,
    meta?.title,
    extras?.title,
    ...(meta?.synonyms ?? []),
    ...(extras?.synonyms ?? []),
    meta?.category,
  ].filter(Boolean);
  return parts.join(" ").toLowerCase();
}

/** Dedupe key: same title within ~5s collapses; distinct moments stay separate. */
export function momentDedupeKey(title: string, atMs?: number): string {
  const bucket = Math.round((atMs ?? 0) / 5000);
  return `${title.toLowerCase()}::${bucket}`;
}
