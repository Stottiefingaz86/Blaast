import { MEGA } from "@/lib/library/taxonomy-nav";

/** Full vertical list — only used when the primary filter can span products. */
export const VERTICALS = [
  "Sportsbook",
  "Casino",
  "Poker",
  "Sweepstakes",
  "Prediction markets",
  "Cashier",
  "Rewards & VIP",
  "Promotions",
] as const;

/** Markets — KYC / geo patterns differ (US vs UK vs DE…). */
export const REGIONS = [
  "US",
  "UK",
  "Germany",
  "Ontario",
  "Sweden",
  "Brazil",
  "Rest of world",
] as const;

export type Vertical = (typeof VERTICALS)[number];
export type Region = (typeof REGIONS)[number];

type ContextKind = "screen" | "category" | "ui" | "flow" | "unknown";

/** Resolve what the primary chip is so secondary menus stay relevant. */
export function classifyPrimary(label: string | null | undefined): ContextKind {
  if (!label) return "unknown";
  if ((MEGA.screens as readonly string[]).includes(label)) return "screen";
  if ((MEGA.categories as readonly string[]).includes(label)) return "category";
  if ((MEGA.uiElements as readonly string[]).includes(label)) return "ui";
  if ((MEGA.flows as readonly string[]).includes(label)) return "flow";
  return "unknown";
}

/**
 * Contextual UI elements for a primary filter.
 * Login → auth controls; Betslip → stake/odds; Deposit → methods; etc.
 */
export function uiElementsForContext(primary: string | null): string[] {
  const kind = classifyPrimary(primary);
  const label = primary ?? "";

  if (kind === "screen") {
    switch (label) {
      case "Login":
        return [
          "Email field",
          "Password field",
          "OTP / 2FA",
          "Social login",
          "Continue button",
          "Forgot password",
          "Age / geo gate",
          "KYC banner",
          "Loader",
          "Skeleton",
        ];
      case "Deposit":
        return [
          "Method row",
          "Amount stepper",
          "Quick amounts",
          "Limits warning",
          "KYC gate",
          "Continue button",
          "Loader",
          "Skeleton",
        ];
      case "Betslip":
        return [
          "Odds button",
          "Stake stepper",
          "Betslip tray",
          "Quick bet",
          "Odds format toggle",
          "Multi / SGP",
          "Cash out control",
          "Loader",
          "Skeleton",
        ];
      case "Casino lobby":
        return [
          "Game card",
          "Provider row",
          "Banner carousel",
          "Search field",
          "Tab bar",
          "Loader",
          "Skeleton",
        ];
      case "Home":
        return [
          "Header",
          "Banner carousel",
          "Odds button",
          "Game card",
          "Activity feed",
          "Tab bar",
          "Loader",
          "Skeleton",
        ];
      case "Event view":
        return [
          "Odds button",
          "Accordion markets",
          "Scoreboard",
          "Bet builder",
          "Live badge",
          "Loader",
          "Skeleton",
        ];
      case "My account":
        return [
          "Avatar",
          "Segmented control",
          "Toggle",
          "Document upload",
          "Limits control",
          "Loader",
          "Skeleton",
        ];
      default:
        break;
    }
  }

  if (kind === "flow") {
    if (label === "Place a bet") {
      return [
        "Odds button",
        "Betslip tray",
        "Stake stepper",
        "Quick bet",
        "Confirmation",
        "Loader",
      ];
    }
    if (label === "Sign up" || label === "Onboarding") {
      return [
        "Welcome",
        "Registration form",
        "OTP / 2FA",
        "Age / geo gate",
        "KYC upload",
        "Loader",
        "Skeleton",
      ];
    }
  }

  return [...MEGA.uiElements];
}

/**
 * Categories must match the primary screen/flow.
 * Betslip → sports only — never Casino / Poker / Sweepstakes.
 */
export function categoriesForContext(primary: string | null): string[] {
  const kind = classifyPrimary(primary);
  const label = primary ?? "";

  if (kind === "screen") {
    switch (label) {
      case "Betslip":
      case "Event view":
        return ["Sportsbook", "Horse racing", "Exchange"];
      case "Casino lobby":
        return ["Casino", "Sweepstakes", "Live casino"];
      case "Home":
        return ["Sportsbook", "Casino", "Poker", "Rewards & VIP"];
      case "Deposit":
        return ["Cashier", "Sportsbook", "Casino", "Poker"];
      case "Login":
      case "My account":
        return [...VERTICALS];
      default:
        break;
    }
  }

  if (kind === "flow") {
    switch (label) {
      case "Place a bet":
      case "Cash out":
        return ["Sportsbook", "Horse racing", "Exchange"];
      case "First deposit":
      case "Withdrawal":
        return ["Cashier", "Sportsbook", "Casino"];
      case "Bonus claim":
        return ["Promotions", "Rewards & VIP", "Casino", "Sportsbook"];
      case "Sign up":
      case "Onboarding":
        return [...VERTICALS];
      default:
        break;
    }
  }

  if (kind === "category") {
    return VERTICALS.filter((v) => v !== label);
  }

  if (kind === "ui") {
    if (label === "Odds button" || label === "Betslip tray") {
      return ["Sportsbook", "Horse racing", "Exchange"];
    }
    if (label === "Game card") {
      return ["Casino", "Sweepstakes", "Live casino"];
    }
  }

  return [...VERTICALS];
}

export function regionsForContext(_primary: string | null): string[] {
  return [...REGIONS];
}

export function describeCategory(label: string): string {
  const map: Record<string, string> = {
    Sportsbook: "Betting home, leagues, events, and slips.",
    "Horse racing": "Racecards, silks, each-way, and in-play racing.",
    Exchange: "Back/lay books and exchange betslips.",
    Casino: "Lobbies, game tiles, providers, and launches.",
    "Live casino": "Tables, dealers, and live lobby chrome.",
    Poker: "Cash games, tournaments, and table chrome.",
    Sweepstakes: "Social / sweepstakes casinos and coin flows.",
    "Prediction markets": "Polymarket-style contracts and order books.",
    Cashier: "Deposit, withdraw, methods, and limits.",
    "Rewards & VIP": "Loyalty, cashback, missions, leaderboards.",
    Promotions: "Offers, opt-ins, and promo modules.",
  };
  return map[label] ?? "Operator product surface.";
}

export function describeRegion(label: string): string {
  const map: Record<string, string> = {
    US: "State-regulated KYC, geofence, and payment patterns.",
    UK: "UKGC age/KYC, affordability, and safer-gambling chrome.",
    Germany: "LUGAS / stake-limit and ID verification patterns.",
    Ontario: "iGaming Ontario verification and responsible play.",
    Sweden: "Spelpaus and Nordic KYC patterns.",
    Brazil: "Local payments and ID flows.",
    "Rest of world": "Other licensed or offshore patterns.",
  };
  return map[label] ?? "Market-specific access patterns.";
}
