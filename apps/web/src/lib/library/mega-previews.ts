/**
 * Hover preview sources for mega-browse — real operator logos per taxonomy.
 */

import { logoCandidates } from "@/lib/marketing/operator-logos";
import { shuffle } from "@/lib/marketing/shuffle";

export type MegaPreview = {
  name: string;
  domain: string;
  /** Optional short clip later; favicon for now */
  kind: "favicon" | "clip";
};

export function faviconUrl(domain: string, size = 128) {
  return logoCandidates(domain, size)[0]!;
}

const sportsbook: MegaPreview[] = [
  { name: "bet365", domain: "bet365.com", kind: "favicon" },
  { name: "FanDuel", domain: "fanduel.com", kind: "favicon" },
  { name: "Paddy Power", domain: "paddypower.com", kind: "favicon" },
  { name: "William Hill", domain: "williamhill.com", kind: "favicon" },
  { name: "Stake", domain: "stake.com", kind: "favicon" },
];

const casino: MegaPreview[] = [
  { name: "Stake", domain: "stake.com", kind: "favicon" },
  { name: "Rainbet", domain: "rainbet.com", kind: "favicon" },
  { name: "Roobet", domain: "roobet.com", kind: "favicon" },
  { name: "FanDuel", domain: "fanduel.com", kind: "favicon" },
  { name: "DraftKings", domain: "draftkings.com", kind: "favicon" },
];

const cashier: MegaPreview[] = [
  { name: "Betway", domain: "betway.com", kind: "favicon" },
  { name: "Stake", domain: "stake.com", kind: "favicon" },
  { name: "bet365", domain: "bet365.com", kind: "favicon" },
];

const account: MegaPreview[] = [
  { name: "Unibet", domain: "unibet.com", kind: "favicon" },
  { name: "bet365", domain: "bet365.com", kind: "favicon" },
  { name: "FanDuel", domain: "fanduel.com", kind: "favicon" },
];

const rewards: MegaPreview[] = [
  { name: "Roobet", domain: "roobet.com", kind: "favicon" },
  { name: "Stake", domain: "stake.com", kind: "favicon" },
];

/** Taxonomy label → rotating preview brands */
export const MEGA_PREVIEWS: Record<string, MegaPreview[]> = {
  Sportsbook: sportsbook,
  Casino: casino,
  Poker: [
    { name: "Betfair", domain: "betfair.com", kind: "favicon" },
    { name: "Paddy Power", domain: "paddypower.com", kind: "favicon" },
  ],
  Cashier: cashier,
  "Rewards & VIP": rewards,
  Account: account,
  Promotions: [...casino.slice(0, 3), ...sportsbook.slice(0, 2)],

  Home: sportsbook,
  Betslip: sportsbook,
  "Casino lobby": casino,
  "Event view": sportsbook,
  Deposit: cashier,
  Login: account,
  "My account": account,

  "Odds button": sportsbook,
  "Game card": casino,
  Header: sportsbook,
  "Tab bar": casino,
  "Activity feed": rewards,
  "Method row": cashier,
  Loader: [...casino, ...sportsbook].slice(0, 4),
  Skeleton: [...casino, ...sportsbook].slice(0, 4),

  "Place a bet": sportsbook,
  "First deposit": cashier,
  Onboarding: account,
  Withdrawal: cashier,
  "Bonus claim": rewards,
  "Cash out": sportsbook,
};

/** Fresh random order every call — never leave bet365 stuck first. */
export function previewsForLabel(label: string): MegaPreview[] {
  return shuffle(MEGA_PREVIEWS[label] ?? sportsbook);
}
