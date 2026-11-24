/** Mega-browse columns — Mobbin structure; Flows = Scuup Journeys. */

import { LIBRARY_FLOWS } from "@/lib/library/journeys";

export const MEGA = {
  categories: [
    "Sportsbook",
    "Casino",
    "Cashier",
    "Promotions",
    "Trust",
    "Rewards & VIP",
    "Account",
    "Poker",
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
    "Leaderboards",
    "Races",
    "Method row",
    "Loader",
    "Skeleton",
    "Animation",
    "VIP",
  ],
  /** Scuup Journey Audit list — not ad-hoc flow names */
  flows: LIBRARY_FLOWS,
} as const;

/** Top product areas — Library (live) · Research / Studio (later) */
export type DiscoverTab = "library" | "research" | "studio";
export type PlatformFilter = "mobile" | "web";
export type SortKey = "latest" | "popular" | "rated" | "animations";
