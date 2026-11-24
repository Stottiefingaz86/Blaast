import type { ProductSurface } from "./types";

export type CoverageTaxonomy = "screen" | "ui_element" | "flow_beat";

export type CoverageStep = {
  id: string;
  /** Human instruction shown large in the wizard */
  instruction: string;
  hint: string;
  taxonomy: CoverageTaxonomy;
  tags: string[];
  /** Product that must be enabled; cross_product always included */
  productGate: ProductSurface | "cross_product";
  required: boolean;
  recordMode: "clip" | "still";
  countdownSec: number;
  maxClipSec: number;
  /** Flow grouping for scoreboard (e.g. place_a_bet) */
  flowId?: string;
};

function beat(
  id: string,
  instruction: string,
  hint: string,
  taxonomy: CoverageTaxonomy,
  tags: string[],
  productGate: CoverageStep["productGate"],
  opts?: Partial<
    Pick<CoverageStep, "required" | "recordMode" | "countdownSec" | "maxClipSec" | "flowId">
  >,
): CoverageStep {
  return {
    id,
    instruction,
    hint,
    taxonomy,
    tags,
    productGate,
    // UI close-ups are optional tags inside journeys — never block brand E2E.
    required: opts?.required ?? taxonomy !== "ui_element",
    recordMode: opts?.recordMode ?? "clip",
    countdownSec: opts?.countdownSec ?? 3,
    maxClipSec: opts?.maxClipSec ?? 300,
    flowId: opts?.flowId,
  };
}

/**
 * Canonical brand coverage — full E2E journeys every operator (filtered by products).
 * Core acquisition first: Home → Sign up → Deposit. Then sports / casino / rewards.
 * UI element beats are optional tags inside a journey, not standalone captures.
 * Stop yourself when done — maxClipSec is a ceiling, not a target.
 * Never type passwords, PII, or payment credentials.
 */
export const COVERAGE_STEPS: CoverageStep[] = [
  // —— Core journey 1: Land on home ——
  beat(
    "scr-home",
    "Land on the Home page",
    "Open the site logged out if you can. Capture first paint / loader then settled home. Tag hero, nav, Sign up / Login / Deposit CTAs.",
    "screen",
    ["home", "landing", "loader"],
    "cross_product",
    { recordMode: "clip", maxClipSec: 300, flowId: "home_tour" },
  ),
  beat(
    "ui-side-nav",
    "Show the side navigation",
    "Open/expand the left (or bottom) nav. Tag Home, Casino, Sports, Promotions, VIP rows.",
    "ui_element",
    ["side_nav", "global_nav"],
    "cross_product",
    { flowId: "home_tour", maxClipSec: 60 },
  ),
  beat(
    "ui-header",
    "Show the Header",
    "Wallet, deposit CTA, Sign up / Login, inbox, profile entry. Tag each CTA.",
    "ui_element",
    ["header", "cta"],
    "cross_product",
    { flowId: "home_tour", maxClipSec: 60 },
  ),
  beat(
    "ui-tab-bar",
    "Show the Tab bar / product switcher",
    "Casino ↔ Sports (or bottom tabs). Capture the switch.",
    "ui_element",
    ["tab_bar", "global_nav"],
    "cross_product",
    { flowId: "home_tour", maxClipSec: 45 },
  ),
  beat(
    "ui-loader",
    "Capture a loading spinner / loader",
    "Trigger a load (refresh, open lobby). Prefer motion clip.",
    "ui_element",
    ["loader", "spinner"],
    "cross_product",
    { maxClipSec: 45 },
  ),
  beat(
    "ui-skeleton",
    "Capture a skeleton / shimmer loading state",
    "Skeleton cards or shimmer rows while content loads.",
    "ui_element",
    ["skeleton", "loader"],
    "cross_product",
    { maxClipSec: 30 },
  ),

  // —— Core journey 2: Sign up ——
  beat(
    "flow-signup-open",
    "Open Sign up / Register from home",
    "From logged-out home or header, open Sign up / Register / Join. Capture the CTA → form transition.",
    "flow_beat",
    ["signup", "register", "onboarding", "cta"],
    "account",
    { flowId: "sign_up", maxClipSec: 60 },
  ),
  beat(
    "scr-register",
    "Show the registration / sign-up form",
    "Empty registration form only — no PII typed. Tag field groups, social auth, Continue / Create account CTA.",
    "screen",
    ["register", "signup", "onboarding"],
    "account",
    { flowId: "sign_up", maxClipSec: 90 },
  ),
  beat(
    "flow-signup-steps",
    "Walk the sign-up steps / gates",
    "Step through registration with research placeholders visible in fields. Tag Form filled, Error alert, Loader/Animation, Verify page as they appear. Never real passwords or documents.",
    "flow_beat",
    ["signup", "onboarding", "kyc", "form", "error", "animation", "loader"],
    "account",
    { flowId: "sign_up", maxClipSec: 180 },
  ),
  beat(
    "flow-signup-complete",
    "Land after sign-up (logged-in home)",
    "After register (or with a research account already signed in), show the post-signup home / welcome. Tag wallet empty state and Deposit CTA.",
    "flow_beat",
    ["signup", "home", "welcome"],
    "account",
    { flowId: "sign_up", maxClipSec: 90 },
  ),
  beat(
    "flow-signup-email-verify",
    "Capture the verify-email message",
    "From the research inbox, open the operator’s verify / confirm email. Screenshot the message (subject + body). Never open live verify links in capture.",
    "flow_beat",
    ["signup", "onboarding", "email", "verify", "crm"],
    "account",
    { flowId: "sign_up", maxClipSec: 45, recordMode: "still" },
  ),
  beat(
    "flow-signup-email-welcome",
    "Capture the welcome email",
    "Open the welcome / thanks-for-joining CRM email in the research inbox. Still of the rendered message only.",
    "flow_beat",
    ["signup", "onboarding", "email", "welcome", "crm"],
    "account",
    { flowId: "sign_up", maxClipSec: 45, recordMode: "still" },
  ),

  // —— Core journey 3: First deposit ——
  beat(
    "scr-deposit",
    "Open Deposit / cashier entry",
    "From home or header, open Deposit. Hub before payment details — no card digits, no filled wallets.",
    "screen",
    ["deposit", "cashier", "first_deposit"],
    "cashier",
    { flowId: "first_deposit", maxClipSec: 90 },
  ),
  beat(
    "ui-method-row",
    "Show payment method rows",
    "Method picker only. Never capture filled card/OTP fields.",
    "ui_element",
    ["payment_methods", "method_row"],
    "cashier",
    { flowId: "first_deposit", maxClipSec: 45 },
  ),
  beat(
    "flow-deposit-amount",
    "Show amount / confirm step (safe)",
    "Amount picker or confirm step with methods visible. Stop before entering real payment credentials.",
    "flow_beat",
    ["deposit", "cashier", "first_deposit"],
    "cashier",
    { flowId: "first_deposit", maxClipSec: 60 },
  ),

  // —— Flow: Place a bet (sportsbook) ——
  beat(
    "flow-bet-event",
    "Open an event view",
    "Prematch event with markets visible. Tag market groups.",
    "flow_beat",
    ["sports_event", "place_a_bet"],
    "sportsbook",
    { flowId: "place_a_bet", maxClipSec: 90 },
  ),
  beat(
    "ui-odds-button",
    "Show odds buttons / CTAs",
    "Close-up of odds chips — hover/tap. Tag primary CTA.",
    "ui_element",
    ["odds_button", "cta"],
    "sportsbook",
    { flowId: "place_a_bet", maxClipSec: 30 },
  ),
  beat(
    "flow-bet-add",
    "Add a bet to the betslip",
    "Tap an odds button so a selection lands in the betslip. Tag single vs combo.",
    "flow_beat",
    ["betslip", "place_a_bet"],
    "sportsbook",
    { flowId: "place_a_bet", maxClipSec: 90 },
  ),
  beat(
    "scr-betslip",
    "Show the betslip with a selection",
    "Stake field, selection, place CTA visible. Tag each control.",
    "screen",
    ["betslip"],
    "sportsbook",
    { flowId: "place_a_bet", maxClipSec: 60 },
  ),
  beat(
    "flow-bet-place",
    "Place the bet (confirmation)",
    "Confirm / place — capture motion through confirmation if safe (no payment secrets).",
    "flow_beat",
    ["place_a_bet", "bet_confirmation"],
    "sportsbook",
    { flowId: "place_a_bet", maxClipSec: 90 },
  ),
  beat(
    "flow-cashout",
    "Show cash out on an open bet",
    "My bets with cash-out affordance. Skip if none available.",
    "flow_beat",
    ["cash_out", "my_bets"],
    "sportsbook",
    { flowId: "cash_out", required: false, maxClipSec: 60 },
  ),

  // —— Flow: Casino browse + launch ——
  beat(
    "scr-casino-lobby",
    "Browse the casino lobby",
    "Open Casino. Scroll lobby so rows/tiles are clear. Tag categories.",
    "screen",
    ["casino_lobby"],
    "casino",
    { flowId: "casino_browse", maxClipSec: 120 },
  ),
  beat(
    "ui-game-card",
    "Show a game card / tile",
    "Typical game tile — tag title, provider, play CTA.",
    "ui_element",
    ["game_card", "cta"],
    "casino",
    { flowId: "casino_browse", maxClipSec: 30 },
  ),
  beat(
    "flow-game-launch",
    "Launch a game",
    "Open a game from the lobby (info → play). Stop before real-money play if needed.",
    "flow_beat",
    ["game_launch", "casino"],
    "casino",
    { flowId: "casino_browse", maxClipSec: 90 },
  ),

  // —— Promotions / VIP / rewards ——
  beat(
    "scr-promotions",
    "Open the Promotions page",
    "Navigate to Promotions from side nav or header. Scroll offers. Tag promo cards + CTA.",
    "screen",
    ["promotions", "offers"],
    "cross_product",
    { flowId: "promotions", maxClipSec: 90 },
  ),
  beat(
    "ui-promo-card",
    "Show a promotion card CTA",
    "Close-up of one promo tile — Claim / Opt-in CTA tagged.",
    "ui_element",
    ["promo_card", "cta"],
    "cross_product",
    { flowId: "promotions", maxClipSec: 30 },
  ),
  beat(
    "scr-vip",
    "Open the VIP / loyalty page",
    "Navigate to VIP (side nav or profile). Capture tiers, progress, benefits.",
    "screen",
    ["vip", "loyalty", "rewards"],
    "cross_product",
    { flowId: "vip_rewards", maxClipSec: 90 },
  ),
  beat(
    "ui-activity-feed",
    "Show the activity / live wins feed",
    "Feed or carousel of wins if present. Tag the rail.",
    "ui_element",
    ["activity_feed"],
    "cross_product",
    { flowId: "vip_rewards", required: false, maxClipSec: 45 },
  ),
  beat(
    "flow-bonus-claim",
    "Claim a bonus / reward",
    "Rewards hub → claim CTA state. Skip if none.",
    "flow_beat",
    ["bonus_claim", "rewards"],
    "cross_product",
    { flowId: "vip_rewards", required: false, maxClipSec: 60 },
  ),

  // —— Withdrawal (safe) ——
  beat(
    "flow-withdraw",
    "Open Withdrawal hub",
    "Withdraw landing / methods. No filled bank details.",
    "flow_beat",
    ["withdrawal"],
    "cashier",
    { flowId: "withdrawal", required: false, maxClipSec: 60 },
  ),

  // —— Account (after core acquisition) ——
  beat(
    "scr-login",
    "Show the Login screen",
    "Empty form only — no typed passwords. Tag CTAs (Login, Register, forgot).",
    "screen",
    ["login", "onboarding"],
    "account",
    { flowId: "account", maxClipSec: 45 },
  ),
  beat(
    "scr-my-account",
    "Open My account",
    "Profile / settings landing. Tag menu rows (Wallet, Limits, Documents).",
    "screen",
    ["my_account"],
    "account",
    { flowId: "account", maxClipSec: 60 },
  ),
];

export const COVERAGE_PACK_ID = "brand-coverage";

/** Flow groups match Scuup product categories (Sports / Casino / …). */
export const FLOW_LABELS: Record<string, { name: string; group: string; actions: string[] }> = {
  home_tour: {
    name: "Land on home",
    group: "Core",
    actions: ["Land", "Nav", "CTAs"],
  },
  sign_up: {
    name: "Onboarding",
    group: "Core",
    actions: ["Open", "Form", "Steps", "Complete", "Verify email", "Welcome email"],
  },
  first_deposit: {
    name: "First time deposit",
    group: "Core",
    actions: ["Deposit", "Methods", "Amount"],
  },
  place_a_bet: {
    name: "Sports Betslip",
    group: "Sports",
    actions: ["Event", "Odds", "Betslip", "Place"],
  },
  cash_out: {
    name: "Sports Betslip",
    group: "Sports",
    actions: ["My bets", "Cash out"],
  },
  casino_browse: {
    name: "Play casino",
    group: "Casino",
    actions: [
      "Lobby",
      "Browse",
      "Pick a game",
      "Provider",
      "Game details",
      "Launch",
      "Full-screen",
      "Mini player",
    ],
  },
  promotions: {
    name: "Loyalty & Rewards",
    group: "Rewards",
    actions: ["Promotions", "Claim CTA", "Rewards hub", "Rewards page", "VIP"],
  },
  vip_rewards: {
    name: "Loyalty & Rewards",
    group: "Rewards",
    actions: ["Rewards hub", "Rewards page", "VIP page"],
  },
  withdrawal: {
    name: "Withdrawal",
    group: "Cashier",
    actions: ["Withdraw"],
  },
  account: {
    name: "My Account",
    group: "Account",
    actions: ["Login", "Account"],
  },
  /** Legacy id — keep for older sessions still mid-flight */
  onboarding: {
    name: "Onboarding",
    group: "Core",
    actions: ["Login", "Register", "Account"],
  },
};

export function coverageStepsForProducts(
  products: ProductSurface[],
): CoverageStep[] {
  const set = new Set(products);
  // Always include engagement surfaces when doing full brand coverage
  set.add("rewards");
  set.add("promotions");
  // Core acquisition needs account + cashier even if operator list omitted them
  set.add("account");
  set.add("cashier");
  return COVERAGE_STEPS.filter(
    (s) =>
      s.productGate === "cross_product" || set.has(s.productGate as ProductSurface),
  );
}

export function coverageStepById(id: string) {
  return COVERAGE_STEPS.find((s) => s.id === id);
}

export function coverageScoreboard(steps: CoverageStep[], statuses: Map<string, string>) {
  const byTaxonomy = (tax: CoverageTaxonomy) => {
    const subset = steps.filter((s) => s.taxonomy === tax && s.required);
    const done = subset.filter((s) => {
      const st = statuses.get(s.id);
      return st === "done" || st === "skipped";
    }).length;
    return { total: subset.length, done };
  };
  return {
    screens: byTaxonomy("screen"),
    uiElements: byTaxonomy("ui_element"),
    flowBeats: byTaxonomy("flow_beat"),
  };
}

function stepDone(statuses: Map<string, string>, id: string) {
  const st = statuses.get(id);
  return st === "done" || st === "skipped";
}

/** Journey checklist for brand E2E — one row per flowId. */
export function coverageJourneyProgress(
  steps: CoverageStep[],
  statuses: Map<string, string>,
) {
  const byFlow = new Map<string, CoverageStep[]>();
  for (const s of steps) {
    const fid = s.flowId ?? "_ungrouped";
    const list = byFlow.get(fid) ?? [];
    list.push(s);
    byFlow.set(fid, list);
  }
  // Core acquisition first in the scoreboard
  const order = [
    "home_tour",
    "sign_up",
    "first_deposit",
    "place_a_bet",
    "cash_out",
    "casino_browse",
    "promotions",
    "vip_rewards",
    "withdrawal",
    "account",
    "onboarding",
    "_ungrouped",
  ];
  const entries = [...byFlow.entries()].sort((a, b) => {
    const ia = order.indexOf(a[0]);
    const ib = order.indexOf(b[0]);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return entries.map(([flowId, flowSteps]) => {
    const required = flowSteps.filter((s) => s.required);
    const done = required.filter((s) => stepDone(statuses, s.id)).length;
    const meta = FLOW_LABELS[flowId];
    return {
      flowId,
      name: meta?.name ?? flowId,
      group: meta?.group ?? "Other",
      actions: meta?.actions ?? [],
      total: required.length,
      done,
      complete: required.length > 0 && done >= required.length,
      optionalLeft: flowSteps.filter(
        (s) => !s.required && !stepDone(statuses, s.id),
      ).length,
    };
  });
}

/** Soft gate: brand session cannot finish until required journey steps are done. */
export function missingRequiredJourneySteps(
  steps: CoverageStep[],
  statuses: Map<string, string>,
): CoverageStep[] {
  return steps.filter((s) => s.required && !stepDone(statuses, s.id));
}
