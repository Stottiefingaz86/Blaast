/** Demo catalog shaped like Mobbin: operators → screens / UI / flows → theater steps. */

export type SurfaceKind =
  | "sportsbook"
  | "casino"
  | "cashier"
  | "rewards"
  | "account";

export type MediaRegion = { x: number; y: number; w: number; h: number };

export type CatalogScreen = {
  id: string;
  title: string;
  kind: SurfaceKind;
  badge?: "Highlight" | "New";
  posterUrl?: string;
  videoUrl?: string;
  atMs?: number;
  region?: MediaRegion;
  clipWindow?: { startMs: number; endMs: number };
  evidenceId?: string;
  tags?: string[];
  /** Scuup-aligned journey (sports_betslip, casino, …) */
  journey?: string;
  /** Sports / Casino / … */
  category?: string;
  /** Admin lobby trim */
  sessionId?: string;
  artifactId?: string;
  durationMs?: number;
};

export type CatalogUiElement = {
  id: string;
  name: string;
  count: number;
  /** Real capture media for Mobbin-style element cards */
  posterUrl?: string;
  videoUrl?: string;
  atMs?: number;
  region?: MediaRegion;
  clipWindow?: { startMs: number; endMs: number };
  evidenceId?: string;
  tags?: string[];
  /** Search synonyms from tag catalog + LLM enrich */
  searchText?: string;
  /** Parent screen chip (betslip, home, …) from curated tag taxonomy */
  parentScreen?: string;
  /** Scuup-aligned journey */
  journey?: string;
  /** Sports / Casino / … */
  category?: string;
  sessionId?: string;
  artifactId?: string;
  annotationId?: string;
  durationMs?: number;
};

// clipWindow on screens/UI drives library playback trim (admin “Trim for library”)

export type FlowStep = {
  id: string;
  label: string;
  kind: SurfaceKind;
  posterUrl?: string;
  videoUrl?: string;
  atMs?: number;
  region?: MediaRegion;
  clipWindow?: { startMs: number; endMs: number };
  evidenceId?: string;
};

export type CatalogFlow = {
  id: string;
  name: string;
  group: string;
  actions: string[];
  steps: FlowStep[];
  hasVideo: boolean;
  posterUrl?: string;
  videoUrl?: string;
  /** Scuup journey key */
  journey?: string;
  category?: string;
};

export type CatalogOperator = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  rating: number;
  ratingCount: number;
  badge?: "New" | "Updated";
  /** Capture form factor: web = desktop browser, mobile = phone / mobile web */
  platform: "mobile" | "web";
  kind: SurfaceKind;
  hasVideo: boolean;
  /** Operator site hostname for “View website” (e.g. rainbet.com) */
  hostname?: string;
  /** Brandfetch / local logo for catalogue row */
  logoUrl?: string;
  /** First published poster (real capture) */
  posterUrl?: string;
  /** First published video */
  videoUrl?: string;
  /** Seek here for card thumbnail (after library trim) */
  heroClipWindow?: { startMs: number; endMs: number };
  screens: CatalogScreen[];
  uiElements: CatalogUiElement[];
  flows: CatalogFlow[];
};

export const CATALOG: CatalogOperator[] = [
  {
    slug: "stake",
    name: "Stake",
    tagline: "Sports · Casino · Crypto",
    category: "Sportsbook",
    rating: 4.72,
    ratingCount: 128,
    badge: "New",
    platform: "mobile",
    kind: "sportsbook",
    hasVideo: true,
    screens: [
      { id: "st-home", title: "Home", kind: "sportsbook", badge: "Highlight" },
      { id: "st-live", title: "In-play", kind: "sportsbook" },
      { id: "st-event", title: "Event view", kind: "sportsbook" },
      { id: "st-betslip", title: "Betslip", kind: "sportsbook", badge: "New" },
      { id: "st-casino", title: "Casino lobby", kind: "casino" },
      { id: "st-deposit", title: "Deposit", kind: "cashier" },
      { id: "st-account", title: "Account", kind: "account" },
      { id: "st-rewards", title: "VIP", kind: "rewards" },
    ],
    uiElements: [
      { id: "odds", name: "Odds button", count: 42 },
      { id: "game-card", name: "Game card", count: 18 },
      { id: "tab-bar", name: "Tab bar", count: 6 },
      { id: "betslip-sheet", name: "Betslip sheet", count: 4 },
      { id: "header", name: "Header", count: 9 },
    ],
    flows: [
      {
        id: "stake-place-bet",
        name: "Place a bet",
        group: "Sportsbook",
        actions: ["Browsing", "Selecting", "Confirming"],
        hasVideo: true,
        steps: [
          { id: "1", label: "Home / sports rail", kind: "sportsbook" },
          { id: "2", label: "Event markets", kind: "sportsbook" },
          { id: "3", label: "Odds selected", kind: "sportsbook" },
          { id: "4", label: "Betslip", kind: "sportsbook" },
          { id: "5", label: "Stake & confirm", kind: "sportsbook" },
          { id: "6", label: "Bet receipt", kind: "account" },
        ],
      },
      {
        id: "stake-first-deposit",
        name: "First deposit",
        group: "Cashier",
        actions: ["Depositing", "Paying"],
        hasVideo: true,
        steps: [
          { id: "1", label: "Cashier hub", kind: "cashier" },
          { id: "2", label: "Amount", kind: "cashier" },
          { id: "3", label: "Method picker", kind: "cashier" },
          { id: "4", label: "Success", kind: "account" },
        ],
      },
      {
        id: "stake-onboarding",
        name: "Onboarding",
        group: "Onboarding",
        actions: ["Creating Account", "Verifying"],
        hasVideo: true,
        steps: [
          { id: "1", label: "Welcome", kind: "account" },
          { id: "2", label: "Register", kind: "account" },
          { id: "3", label: "Verify email", kind: "account" },
          { id: "4", label: "First home", kind: "sportsbook" },
        ],
      },
    ],
  },
  {
    slug: "bet365",
    name: "bet365",
    tagline: "Sports offering & live",
    category: "Sportsbook",
    rating: 4.81,
    ratingCount: 204,
    badge: "Updated",
    platform: "mobile",
    kind: "sportsbook",
    hasVideo: true,
    screens: [
      { id: "b-home", title: "Home", kind: "sportsbook", badge: "Highlight" },
      { id: "b-inplay", title: "In-play", kind: "sportsbook" },
      { id: "b-event", title: "Event view", kind: "sportsbook" },
      { id: "b-slip", title: "Betslip", kind: "sportsbook" },
      { id: "b-cashout", title: "Cash out", kind: "sportsbook" },
      { id: "b-mybets", title: "My bets", kind: "account" },
    ],
    uiElements: [
      { id: "odds", name: "Odds button", count: 56 },
      { id: "live-badge", name: "Live badge", count: 12 },
      { id: "cashout", name: "Cash out control", count: 8 },
    ],
    flows: [
      {
        id: "bet365-inplay-bet",
        name: "In-play to betslip",
        group: "Sportsbook",
        actions: ["Browsing", "Selecting"],
        hasVideo: true,
        steps: [
          { id: "1", label: "In-play list", kind: "sportsbook" },
          { id: "2", label: "Match centre", kind: "sportsbook" },
          { id: "3", label: "Market grid", kind: "sportsbook" },
          { id: "4", label: "Betslip", kind: "sportsbook" },
        ],
      },
      {
        id: "bet365-cashout",
        name: "Cash out",
        group: "Sportsbook",
        actions: ["Managing bets"],
        hasVideo: false,
        steps: [
          { id: "1", label: "My bets", kind: "account" },
          { id: "2", label: "Cash out offer", kind: "sportsbook" },
          { id: "3", label: "Confirmed", kind: "account" },
        ],
      },
    ],
  },
  {
    slug: "draftkings",
    name: "DraftKings",
    tagline: "US sportsbook",
    category: "Casino",
    rating: 4.55,
    ratingCount: 91,
    platform: "mobile",
    kind: "casino",
    hasVideo: false,
    screens: [
      { id: "dk-lobby", title: "Casino lobby", kind: "casino", badge: "Highlight" },
      { id: "dk-slots", title: "Slots rail", kind: "casino" },
      { id: "dk-game", title: "Game launch", kind: "casino" },
      { id: "dk-sports", title: "Sports home", kind: "sportsbook" },
    ],
    uiElements: [
      { id: "tile", name: "Game tile", count: 34 },
      { id: "provider", name: "Provider chip", count: 11 },
    ],
    flows: [
      {
        id: "dk-play-slot",
        name: "Lobby to game",
        group: "Casino",
        actions: ["Browsing", "Launching"],
        hasVideo: false,
        steps: [
          { id: "1", label: "Lobby", kind: "casino" },
          { id: "2", label: "Category", kind: "casino" },
          { id: "3", label: "Game", kind: "casino" },
        ],
      },
    ],
  },
  {
    slug: "fanduel",
    name: "FanDuel",
    tagline: "Casino lobby patterns",
    category: "Casino",
    rating: 4.63,
    ratingCount: 77,
    badge: "New",
    platform: "web",
    kind: "casino",
    hasVideo: true,
    screens: [
      { id: "fd-lobby", title: "Lobby", kind: "casino", badge: "Highlight" },
      { id: "fd-live", title: "Live casino", kind: "casino" },
      { id: "fd-deposit", title: "Deposit", kind: "cashier" },
    ],
    uiElements: [
      { id: "hero", name: "Promo hero", count: 5 },
      { id: "tile", name: "Game tile", count: 28 },
    ],
    flows: [
      {
        id: "fd-deposit-play",
        name: "Deposit then play",
        group: "Cashier",
        actions: ["Depositing", "Playing"],
        hasVideo: true,
        steps: [
          { id: "1", label: "Lobby CTA", kind: "casino" },
          { id: "2", label: "Deposit", kind: "cashier" },
          { id: "3", label: "Method", kind: "cashier" },
          { id: "4", label: "Back to lobby", kind: "casino" },
        ],
      },
    ],
  },
  {
    slug: "betfair",
    name: "Betfair",
    tagline: "Exchange & cash out",
    category: "Sportsbook",
    rating: 4.68,
    ratingCount: 112,
    platform: "web",
    kind: "sportsbook",
    hasVideo: true,
    screens: [
      { id: "bf-ex", title: "Exchange", kind: "sportsbook", badge: "Highlight" },
      { id: "bf-cash", title: "Cash out", kind: "sportsbook" },
      { id: "bf-wallet", title: "Wallet", kind: "cashier" },
    ],
    uiElements: [
      { id: "ladder", name: "Price ladder", count: 14 },
      { id: "back-lay", name: "Back / Lay", count: 22 },
    ],
    flows: [
      {
        id: "bf-exchange-bet",
        name: "Exchange bet",
        group: "Sportsbook",
        actions: ["Selecting", "Confirming"],
        hasVideo: true,
        steps: [
          { id: "1", label: "Market", kind: "sportsbook" },
          { id: "2", label: "Ladder", kind: "sportsbook" },
          { id: "3", label: "Bet ticket", kind: "sportsbook" },
          { id: "4", label: "Matched", kind: "account" },
        ],
      },
    ],
  },
  {
    slug: "pinnacle",
    name: "Pinnacle",
    tagline: "Sharp sportsbook UI",
    category: "Sportsbook",
    rating: 4.9,
    ratingCount: 44,
    badge: "Updated",
    platform: "mobile",
    kind: "sportsbook",
    hasVideo: false,
    screens: [
      { id: "pin-lines", title: "Lines", kind: "sportsbook", badge: "Highlight" },
      { id: "pin-bet", title: "Bet ticket", kind: "sportsbook" },
    ],
    uiElements: [
      { id: "line", name: "Line row", count: 30 },
    ],
    flows: [
      {
        id: "pin-place",
        name: "Place line bet",
        group: "Sportsbook",
        actions: ["Selecting"],
        hasVideo: false,
        steps: [
          { id: "1", label: "Lines", kind: "sportsbook" },
          { id: "2", label: "Ticket", kind: "sportsbook" },
        ],
      },
    ],
  },
  {
    slug: "roobet",
    name: "Roobet",
    tagline: "Rewards & activity feed",
    category: "Rewards & VIP",
    rating: 4.41,
    ratingCount: 59,
    platform: "web",
    kind: "rewards",
    hasVideo: true,
    screens: [
      { id: "rb-vip", title: "VIP", kind: "rewards", badge: "Highlight" },
      { id: "rb-feed", title: "Activity", kind: "rewards" },
      { id: "rb-claim", title: "Claim", kind: "rewards" },
    ],
    uiElements: [
      { id: "feed", name: "Activity row", count: 16 },
      { id: "level", name: "Level badge", count: 4 },
    ],
    flows: [
      {
        id: "rb-claim-bonus",
        name: "Bonus claim",
        group: "Rewards",
        actions: ["Claiming"],
        hasVideo: true,
        steps: [
          { id: "1", label: "VIP home", kind: "rewards" },
          { id: "2", label: "Offer", kind: "rewards" },
          { id: "3", label: "Claimed", kind: "rewards" },
        ],
      },
    ],
  },
  {
    slug: "betway",
    name: "Betway",
    tagline: "Cashier & deposit hub",
    category: "Cashier",
    rating: 4.5,
    ratingCount: 66,
    platform: "mobile",
    kind: "cashier",
    hasVideo: true,
    screens: [
      { id: "bw-dep", title: "Deposit", kind: "cashier", badge: "Highlight" },
      { id: "bw-methods", title: "Methods", kind: "cashier" },
      { id: "bw-wd", title: "Withdraw", kind: "cashier" },
    ],
    uiElements: [
      { id: "amount", name: "Amount field", count: 3 },
      { id: "method", name: "Method row", count: 9 },
    ],
    flows: [
      {
        id: "bw-deposit",
        name: "Deposit",
        group: "Cashier",
        actions: ["Depositing"],
        hasVideo: true,
        steps: [
          { id: "1", label: "Deposit", kind: "cashier" },
          { id: "2", label: "Methods", kind: "cashier" },
          { id: "3", label: "Success", kind: "account" },
        ],
      },
      {
        id: "bw-withdraw",
        name: "Withdrawal",
        group: "Cashier",
        actions: ["Withdrawing"],
        hasVideo: false,
        steps: [
          { id: "1", label: "Withdraw", kind: "cashier" },
          { id: "2", label: "Confirm", kind: "cashier" },
          { id: "3", label: "Pending", kind: "account" },
        ],
      },
    ],
  },
  {
    slug: "unibet",
    name: "Unibet",
    tagline: "Account & limits",
    category: "Account",
    rating: 4.33,
    ratingCount: 38,
    platform: "web",
    kind: "account",
    hasVideo: false,
    screens: [
      { id: "ub-acc", title: "Account", kind: "account", badge: "Highlight" },
      { id: "ub-limits", title: "Limits", kind: "account" },
      { id: "ub-docs", title: "Documents", kind: "account" },
    ],
    uiElements: [
      { id: "nav", name: "Account nav", count: 7 },
      { id: "limit", name: "Limit control", count: 5 },
    ],
    flows: [
      {
        id: "ub-set-limits",
        name: "Set deposit limits",
        group: "Responsible gaming",
        actions: ["Configuring"],
        hasVideo: false,
        steps: [
          { id: "1", label: "Account", kind: "account" },
          { id: "2", label: "Limits", kind: "account" },
          { id: "3", label: "Confirm", kind: "account" },
        ],
      },
    ],
  },
];

export function getOperator(slug: string) {
  return CATALOG.find((o) => o.slug === slug);
}

export function getFlow(flowId: string) {
  for (const op of CATALOG) {
    const flow = op.flows.find((f) => f.id === flowId);
    if (flow) return { operator: op, flow };
  }
  return null;
}

/**
 * Offline last-resort metadata dump only.
 * Prefer Blaast MCP (`get_flow` / `get_evidence`) or `/api/prompts/generate` when online.
 */
export function buildAgentPrompt(
  operator: CatalogOperator,
  flow: CatalogFlow,
  origin: string,
) {
  const steps = flow.steps
    .map(
      (s, i) =>
        `${i + 1}. ${s.label} (${s.kind})${s.evidenceId ? ` — evidence ${s.evidenceId}` : ""}`,
    )
    .join("\n");
  const flowEvidenceId =
    flow.steps.find((s) => s.evidenceId)?.evidenceId ?? flow.id;
  return `Use **Blaast MCP** to load measured evidence, then rebuild this journey in **our** brand and design system.

## Reference (do not clone branding)
- Operator ID / slug: \`${operator.slug}\`
- Operator: ${operator.name} — ${operator.tagline}
- Flow ID: \`${flow.id}\`
- Evidence ID: \`${flowEvidenceId}\`
- Category: ${operator.category}
- Flow: ${flow.name} (${flow.group})
- Actions: ${flow.actions.join(", ")}
- Platform: ${operator.platform}

## What to mimic
Layout, IA, carousel / lobby behaviour, content order, and interaction of this casino (or sports) journey — **not** logos, trademarks, or proprietary art.

## MCP (preferred)
1. \`get_flow\` with flow_id=\`${flow.id}\` (or \`get_evidence\` with evidence_id=\`${flowEvidenceId}\`)
2. Optionally \`search_ui\` / \`search_screens\` scoped to operator \`${operator.slug}\` for lobby, carousel, game card, launch
3. For corpus intelligence: \`most_used_pattern\`, \`list_patterns\`, \`notable_flows\`, \`compare_operators\`
4. Use returned media URLs, clip windows, regions, tags, and evidence IDs as measured ground truth

## Journey steps (${flow.steps.length})
${steps}

## Library
${origin}/operators/${operator.slug}?tab=flows&flow=${encodeURIComponent(flow.id)}

## Constraints
Do not copy logos or proprietary assets. Adapt patterns to our design system. Cite evidence / flow IDs in decisions.
(Offline fallback — regenerate via Blaast MCP or ${origin}/api/prompts/generate?flowId=${encodeURIComponent(flow.id)} when online.)`;
}
