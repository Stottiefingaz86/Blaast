import {
  COVERAGE_PACK_ID,
  coverageStepsForProducts,
  type CoverageStep,
} from "./coverage-pack";
import type { CapturePlaybook, ProductSurface } from "./types";

function item(
  id: string,
  label: string,
  hint: string,
  tags: string[],
  required = true,
  kind: "screen" | "ui_element" | "state" | "note" = "screen",
): CapturePlaybook["items"][number] {
  return { id, label, hint, tags, required, kind };
}

function coverageToPlaybookItem(step: CoverageStep): CapturePlaybook["items"][number] {
  const kind =
    step.taxonomy === "ui_element"
      ? "ui_element"
      : step.taxonomy === "flow_beat"
        ? "state"
        : "screen";
  return {
    id: step.id,
    label: step.instruction,
    hint: step.hint,
    tags: step.tags,
    required: step.required,
    kind,
  };
}

/** Full brand coverage pack — same steps every operator (products filter at session start). */
export function brandCoveragePlaybook(
  products: ProductSurface[],
): CapturePlaybook {
  const steps = coverageStepsForProducts(products);
  return {
    id: COVERAGE_PACK_ID,
    title: "Brand E2E journeys",
    description:
      "Required end-to-end journeys for this brand (home → bet → casino → cashier → account). UI close-ups are optional tags inside each journey.",
    products: products.length ? products : ["cross_product"],
    platforms: ["mobile_web", "desktop_web"],
    items: steps.map(coverageToPlaybookItem),
  };
}

/**
 * Standard capture playbooks — same checklist every operator so the library stays consistent.
 * Researcher opens site → works down the list → Alt+Shift+S per item → mark done.
 */
export const CAPTURE_PLAYBOOKS: CapturePlaybook[] = [
  {
    id: "core-chrome",
    title: "Global chrome (every site)",
    description:
      "Headers, footers, nav, search — capture once per platform before deep flows.",
    products: ["cross_product"],
    platforms: ["mobile_web", "desktop_web"],
    items: [
      item("gc-home", "Home page", "Logged-in home if possible; full viewport.", ["home", "global_nav"]),
      item("gc-header", "Header", "Wallet, deposit CTA, inbox, profile entry.", ["header", "global_nav"], true, "ui_element"),
      item("gc-global-nav", "Global navigation", "Main product switcher / bottom or side nav.", ["global_nav"], true, "ui_element"),
      item("gc-search", "Search", "Open search; empty + results if available.", ["search"]),
      item("gc-footer", "Footer", "Scroll to footer links / legal / apps.", ["footer"], true, "ui_element"),
      item("gc-account-entry", "My account entry", "Open account menu or hub landing.", ["my_account", "header"]),
    ],
  },
  {
    id: "sportsbook-core",
    title: "Sportsbook core",
    description: "Offering, event, betslip — desktop and mobile separately.",
    products: ["sportsbook"],
    platforms: ["mobile_web", "desktop_web"],
    items: [
      item("sb-home", "Sports home / offering", "League list or featured sports landing.", ["sports_offering", "home"]),
      item("sb-sports-nav", "Sports navigation", "Sport/league nav open.", ["sports_nav"], true, "ui_element"),
      item("sb-event", "Event view (prematch)", "Full event with markets visible.", ["sports_event", "markets"]),
      item("sb-event-live", "Event view (live)", "Live badge / in-play if available.", ["sports_event", "live"], false),
      item("sb-alt-lines", "Alternate lines / extras", "Expand alt lines or similar.", ["alternate_lines"], false),
      item("sb-odds", "Odds buttons", "Close-up of odds chip states if distinct.", ["odds_button"], true, "ui_element"),
      item("sb-betslip-empty", "Betslip empty", "Open empty betslip tray/sheet.", ["betslip"], true, "state"),
      item("sb-betslip-single", "Betslip with selection", "Add one leg; stake field visible.", ["betslip"]),
      item("sb-betslip-multi", "Betslip multi", "Two+ legs if possible.", ["betslip", "multi"], false),
      item("sb-my-bets", "My bets", "Open bets list.", ["my_bets"]),
      item("sb-cashout", "Cash out affordance", "Cash out on open bet if shown.", ["cash_out"], false),
    ],
  },
  {
    id: "casino-core",
    title: "Casino lobby & nav",
    description: "Lobby structure, categories, game cards.",
    products: ["casino"],
    platforms: ["mobile_web", "desktop_web"],
    items: [
      item("ca-lobby", "Casino lobby", "Full lobby with rows/tiles.", ["casino_lobby", "home"]),
      item("ca-nav", "Casino navigation", "Categories / providers nav.", ["casino_nav"], true, "ui_element"),
      item("ca-game-card", "Game card / tile", "Typical game tile in a row.", ["game_card"], true, "ui_element"),
      item("ca-provider", "Provider hub", "Single provider page if exists.", ["providers"], false),
      item("ca-recents", "Recently played / favourites", "If shown on lobby.", ["recents", "favourites"], false),
      item("ca-jackpots", "Jackpots row", "If present.", ["jackpots"], false),
      item("ca-game-info", "Game info panel", "Before or beside launch.", ["game_info"], false),
    ],
  },
  {
    id: "engagement",
    title: "Activity, rewards, leaderboards",
    description: "Feeds and loyalty surfaces.",
    products: ["rewards", "cross_product"],
    platforms: ["mobile_web", "desktop_web"],
    items: [
      item("en-feed", "Activity / live wins feed", "Feed or carousel of wins/activity.", ["activity_feed"]),
      item("en-leaderboard", "Leaderboard", "Rewards or challenge board.", ["leaderboard"], false),
      item("en-rewards", "Rewards hub", "Loyalty / missions landing.", ["rewards"]),
      item("en-claim", "Claim / bonus state", "Claim CTA or active bonus.", ["rewards", "bonus"], false),
      item("en-vip", "VIP / tier", "VIP status if visible.", ["vip"], false),
    ],
  },
  {
    id: "cashier",
    title: "Cashier (safe selective capture)",
    description:
      "Prefer method lists and empty states. Avoid card number entry screens; redact if needed.",
    products: ["cashier"],
    platforms: ["mobile_web", "desktop_web"],
    items: [
      item("ch-entry", "Cashier entry", "Deposit hub before payment details.", ["cashier", "deposit"]),
      item("ch-methods", "Payment methods list", "Method picker only.", ["cashier", "payment_methods"]),
      item("ch-withdraw", "Withdrawal hub", "Withdraw landing / methods.", ["cashier", "withdraw"], false),
      item("ch-history", "Transaction history", "If available.", ["cashier", "history"], false),
      item(
        "ch-note",
        "Skip live card entry",
        "Do not capture filled card/OTP fields. Mark blocked if only path is card form.",
        ["cashier"],
        true,
        "note",
      ),
    ],
  },
  {
    id: "onboarding-account",
    title: "Onboarding & my account",
    description: "Login/register and account cards — no password values.",
    products: ["account"],
    platforms: ["mobile_web", "desktop_web"],
    items: [
      item("oa-welcome", "Welcome / marketing gate", "Pre-login landing if any.", ["onboarding", "welcome"], false),
      item("oa-login", "Login screen", "Empty form only.", ["login", "onboarding"]),
      item("oa-register", "Registration", "Empty form only.", ["registration", "onboarding"], false),
      item("oa-account", "My account hub", "Profile / settings landing.", ["my_account"]),
      item("oa-cards", "Account cards / tiles", "Wallet, limits, docs tiles.", ["my_account", "cards"], true, "ui_element"),
      item("oa-security", "Security / prefs", "If reachable without secrets on screen.", ["security"], false),
    ],
  },
];

export function playbookById(id: string, products?: ProductSurface[]) {
  if (id === COVERAGE_PACK_ID) {
    return brandCoveragePlaybook(products ?? ["sportsbook", "casino", "cashier", "account"]);
  }
  return CAPTURE_PLAYBOOKS.find((p) => p.id === id);
}

export function playbooksForProducts(products: string[]) {
  const typed = products as ProductSurface[];
  const coverage = brandCoveragePlaybook(
    typed.length ? typed : ["sportsbook", "casino", "cashier", "account"],
  );
  const rest = !products.length
    ? CAPTURE_PLAYBOOKS
    : CAPTURE_PLAYBOOKS.filter(
        (p) =>
          p.products.includes("cross_product") ||
          p.products.some((x) => products.includes(x)),
      );
  return [coverage, ...rest];
}

/** Brand E2E pack first; everything else is an optional add-on after brand. */
export function splitPlaybooksForProducts(products: string[]) {
  const all = playbooksForProducts(products);
  return {
    brand: all.filter((p) => p.id === COVERAGE_PACK_ID),
    addons: all.filter((p) => p.id !== COVERAGE_PACK_ID),
  };
}
