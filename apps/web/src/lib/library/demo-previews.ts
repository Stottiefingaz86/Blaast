/** Demo library items — iGaming operators with journey/video frames until real captures land. */

export type JourneyFrame = {
  label: string;
  kind: "sportsbook" | "casino" | "cashier" | "rewards" | "account";
};

export type DemoPreview = {
  id: string;
  name: string;
  tagline: string;
  badge?: "New" | "Updated";
  platform: "mobile" | "web";
  /** Primary still (also first journey frame). */
  kind: JourneyFrame["kind"];
  /** Ordered journey frames — Mobbin-style tile hover / video scrub. */
  journey: JourneyFrame[];
  hasVideo: boolean;
};

export const DEMO_PREVIEWS: DemoPreview[] = [
  {
    id: "1",
    name: "Stake",
    tagline: "Sports · Casino · Crypto",
    badge: "New",
    platform: "mobile",
    kind: "sportsbook",
    hasVideo: true,
    journey: [
      { label: "Home", kind: "sportsbook" },
      { label: "Event", kind: "sportsbook" },
      { label: "Betslip", kind: "sportsbook" },
      { label: "Confirm", kind: "cashier" },
    ],
  },
  {
    id: "2",
    name: "bet365",
    tagline: "Sports offering & live",
    badge: "Updated",
    platform: "mobile",
    kind: "sportsbook",
    hasVideo: true,
    journey: [
      { label: "In-play", kind: "sportsbook" },
      { label: "Markets", kind: "sportsbook" },
      { label: "Betslip", kind: "sportsbook" },
    ],
  },
  {
    id: "3",
    name: "DraftKings",
    tagline: "US sportsbook",
    platform: "mobile",
    kind: "casino",
    hasVideo: false,
    journey: [
      { label: "Lobby", kind: "casino" },
      { label: "Game", kind: "casino" },
    ],
  },
  {
    id: "4",
    name: "FanDuel",
    tagline: "Casino lobby patterns",
    badge: "New",
    platform: "web",
    kind: "casino",
    hasVideo: true,
    journey: [
      { label: "Lobby", kind: "casino" },
      { label: "Slots", kind: "casino" },
      { label: "Deposit", kind: "cashier" },
    ],
  },
  {
    id: "5",
    name: "Betfair",
    tagline: "Exchange & cash out",
    platform: "web",
    kind: "sportsbook",
    hasVideo: true,
    journey: [
      { label: "Exchange", kind: "sportsbook" },
      { label: "Cash out", kind: "sportsbook" },
      { label: "Wallet", kind: "cashier" },
    ],
  },
  {
    id: "6",
    name: "Pinnacle",
    tagline: "Sharp sportsbook UI",
    badge: "Updated",
    platform: "mobile",
    kind: "sportsbook",
    hasVideo: false,
    journey: [
      { label: "Lines", kind: "sportsbook" },
      { label: "Bet", kind: "sportsbook" },
    ],
  },
  {
    id: "7",
    name: "Roobet",
    tagline: "Rewards & activity feed",
    platform: "web",
    kind: "rewards",
    hasVideo: true,
    journey: [
      { label: "VIP", kind: "rewards" },
      { label: "Activity", kind: "rewards" },
      { label: "Claim", kind: "rewards" },
    ],
  },
  {
    id: "8",
    name: "Betway",
    tagline: "Cashier & deposit hub",
    platform: "mobile",
    kind: "cashier",
    hasVideo: true,
    journey: [
      { label: "Deposit", kind: "cashier" },
      { label: "Methods", kind: "cashier" },
      { label: "Success", kind: "account" },
    ],
  },
  {
    id: "9",
    name: "Unibet",
    tagline: "Account & limits",
    platform: "web",
    kind: "account",
    hasVideo: false,
    journey: [
      { label: "Account", kind: "account" },
      { label: "Limits", kind: "account" },
    ],
  },
];
