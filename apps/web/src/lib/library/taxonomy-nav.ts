/** Mega-browse columns — same structure as Mobbin, iGaming labels. */

export const MEGA = {
  categories: [
    "Sportsbook",
    "Casino",
    "Poker",
    "Cashier",
    "Rewards & VIP",
    "Account",
    "Promotions",
  ],
  screens: [
    "Home",
    "Betslip",
    "Casino lobby",
    "Event view",
    "Deposit",
    "Login",
    "My account",
  ],
  uiElements: [
    "Odds button",
    "Game card",
    "Header",
    "Tab bar",
    "Activity feed",
    "Method row",
    "Loader",
    "Skeleton",
  ],
  flows: [
    "Place a bet",
    "First deposit",
    "Onboarding",
    "Withdrawal",
    "Bonus claim",
    "Cash out",
  ],
} as const;

/** Top product areas — Library (live) · Research / Studio (later) */
export type DiscoverTab = "library" | "research" | "studio";
export type PlatformFilter = "mobile" | "web";
export type SortKey = "latest" | "popular" | "rated" | "animations";
