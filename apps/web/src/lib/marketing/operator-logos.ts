/** iGaming operator marks — logos only in UI; names for alt / scenario fill. */

export type OperatorLogo = {
  id: string;
  domain: string;
  alt: string;
  color: string;
  /** Optional local asset under /public/operators */
  localSrc?: string;
  verticals: string[];
  regions: string[];
};

export const OPERATOR_LOGOS: OperatorLogo[] = [
  { id: "bet365", domain: "bet365.com", alt: "bet365", color: "#FFDF1B", localSrc: "/operators/bet365.svg", verticals: ["Sportsbook", "Casino", "Poker"], regions: ["UK", "Europe", "Americas", "AU"] },
  { id: "betway", domain: "betway.com", alt: "Betway", color: "#00A651", verticals: ["Sportsbook", "Casino"], regions: ["UK", "Europe", "Africa", "Americas"] },
  { id: "fanduel", domain: "fanduel.com", alt: "FanDuel", color: "#1493FF", verticals: ["Sportsbook", "Casino", "DFS"], regions: ["US", "Canada"] },
  { id: "draftkings", domain: "draftkings.com", alt: "DraftKings", color: "#61B5E3", verticals: ["Sportsbook", "Casino", "DFS"], regions: ["US", "Canada"] },
  { id: "betmgm", domain: "betmgm.com", alt: "BetMGM", color: "#C4A35A", verticals: ["Sportsbook", "Casino", "Poker"], regions: ["US", "UK", "Europe"] },
  { id: "bwin", domain: "bwin.com", alt: "bwin", color: "#FF6600", verticals: ["Sportsbook", "Casino", "Poker"], regions: ["Europe"] },
  { id: "betfair", domain: "betfair.com", alt: "Betfair", color: "#FFB80C", localSrc: "/operators/betfair.svg", verticals: ["Exchange", "Sportsbook"], regions: ["UK", "Europe", "LATAM"] },
  { id: "williamhill", domain: "williamhill.com", alt: "William Hill", color: "#003087", verticals: ["Sportsbook", "Casino"], regions: ["UK", "Europe"] },
  { id: "unibet", domain: "unibet.com", alt: "Unibet", color: "#14933B", verticals: ["Sportsbook", "Casino", "Poker"], regions: ["Europe", "UK"] },
  { id: "888", domain: "888.com", alt: "888", color: "#E31837", verticals: ["Casino", "Poker", "Sportsbook"], regions: ["UK", "Europe", "Canada"] },
  { id: "betano", domain: "betano.com", alt: "Betano", color: "#00A651", verticals: ["Sportsbook", "Casino"], regions: ["Europe", "LATAM"] },
  { id: "paddypower", domain: "paddypower.com", alt: "Paddy Power", color: "#004B23", verticals: ["Sportsbook", "Casino"], regions: ["UK", "Ireland"] },
  { id: "ladbrokes", domain: "ladbrokes.com", alt: "Ladbrokes", color: "#E30613", verticals: ["Sportsbook", "Casino"], regions: ["UK", "Ireland", "AU"] },
  { id: "coral", domain: "coral.co.uk", alt: "Coral", color: "#E30613", verticals: ["Sportsbook", "Casino"], regions: ["UK"] },
  { id: "skybet", domain: "skybet.com", alt: "Sky Bet", color: "#FFFFFF", localSrc: "/operators/skybet.svg", verticals: ["Sportsbook", "Casino"], regions: ["UK", "Ireland"] },
  { id: "betsson", domain: "betsson.com", alt: "Betsson", color: "#FFCC00", verticals: ["Sportsbook", "Casino"], regions: ["Europe", "LATAM"] },
  { id: "betsafe", domain: "betsafe.com", alt: "Betsafe", color: "#00A0E3", verticals: ["Sportsbook", "Casino"], regions: ["Europe", "Canada"] },
  { id: "nordicbet", domain: "nordicbet.com", alt: "NordicBet", color: "#0033A0", localSrc: "/operators/nordicbet.svg", verticals: ["Sportsbook", "Casino"], regions: ["Nordics"] },
  { id: "1xbet", domain: "1xbet.com", alt: "1xBet", color: "#1B5E20", verticals: ["Sportsbook", "Casino"], regions: ["Global"] },
  { id: "22bet", domain: "22bet.com", alt: "22Bet", color: "#1565C0", verticals: ["Sportsbook", "Casino"], regions: ["Global"] },
  { id: "melbet", domain: "melbet.com", alt: "Melbet", color: "#0D47A1", verticals: ["Sportsbook", "Casino"], regions: ["Global"] },
  { id: "parimatch", domain: "parimatch.com", alt: "Parimatch", color: "#F9A825", verticals: ["Sportsbook", "Casino"], regions: ["Eastern Europe", "UK"] },
  { id: "pinnacle", domain: "pinnacle.com", alt: "Pinnacle", color: "#C8102E", verticals: ["Sportsbook", "Esports"], regions: ["Global"] },
  { id: "marathonbet", domain: "marathonbet.com", alt: "Marathonbet", color: "#1A237E", verticals: ["Sportsbook", "Casino"], regions: ["Europe", "LATAM"] },
  { id: "sportingbet", domain: "sportingbet.com", alt: "Sportingbet", color: "#E65100", verticals: ["Sportsbook", "Casino"], regions: ["LATAM", "Europe"] },
  { id: "pokerstars", domain: "pokerstars.com", alt: "PokerStars", color: "#E4002B", verticals: ["Poker", "Casino", "Sportsbook"], regions: ["Global"] },
  { id: "leovegas", domain: "leovegas.com", alt: "LeoVegas", color: "#FF6B00", verticals: ["Casino", "Sportsbook"], regions: ["Europe", "UK"] },
  { id: "casumo", domain: "casumo.com", alt: "Casumo", color: "#32007E", verticals: ["Casino", "Sportsbook"], regions: ["Europe", "UK"] },
  { id: "mrgreen", domain: "mrgreen.com", alt: "Mr Green", color: "#05372C", verticals: ["Casino", "Sportsbook"], regions: ["Europe", "UK"] },
  { id: "videoslots", domain: "videoslots.com", alt: "VideoSlots", color: "#1A1A1A", localSrc: "/operators/videoslots.svg", verticals: ["Casino"], regions: ["Europe"] },
  { id: "mrq", domain: "mrq.com", alt: "MrQ", color: "#00BCD4", verticals: ["Casino"], regions: ["UK"] },
  { id: "playojo", domain: "playojo.com", alt: "PlayOJO", color: "#FF4081", verticals: ["Casino"], regions: ["UK", "Europe", "Canada"] },
  { id: "jackpotcity", domain: "jackpotcitycasino.com", alt: "JackpotCity", color: "#D4AF37", verticals: ["Casino"], regions: ["Canada", "Europe", "LATAM"] },
  { id: "spincasino", domain: "spincasino.com", alt: "Spin Casino", color: "#E91E63", verticals: ["Casino", "Sportsbook"], regions: ["Canada", "Europe", "LATAM"] },
  { id: "royalpanda", domain: "royalpanda.com", alt: "Royal Panda", color: "#C62828", verticals: ["Casino", "Sportsbook"], regions: ["Canada", "Europe"] },
  { id: "rizk", domain: "rizk.com", alt: "Rizk", color: "#00E5FF", verticals: ["Casino", "Sportsbook"], regions: ["Europe"] },
  { id: "guts", domain: "guts.com", alt: "Guts", color: "#FF1744", verticals: ["Casino", "Poker", "Sportsbook"], regions: ["Europe"] },
  { id: "dunder", domain: "dunder.com", alt: "Dunder", color: "#FF6F00", verticals: ["Casino"], regions: ["Europe", "Canada"] },
  { id: "partycasino", domain: "partycasino.com", alt: "PartyCasino", color: "#9C27B0", verticals: ["Casino"], regions: ["Europe", "US"] },
  { id: "partypoker", domain: "partypoker.com", alt: "partypoker", color: "#E91E63", verticals: ["Poker"], regions: ["Europe", "Canada"] },
  { id: "ggpoker", domain: "ggpoker.com", alt: "GGPoker", color: "#212121", verticals: ["Poker"], regions: ["Global"] },
  { id: "wptglobal", domain: "wptglobal.com", alt: "WPT Global", color: "#0D47A1", verticals: ["Poker"], regions: ["Global"] },
  { id: "acr", domain: "americascardroom.eu", alt: "ACR Poker", color: "#B71C1C", verticals: ["Poker"], regions: ["Americas"] },
  { id: "bovada", domain: "bovada.lv", alt: "Bovada", color: "#FF6F00", verticals: ["Sportsbook", "Casino", "Poker"], regions: ["US"] },
  { id: "ignition", domain: "ignitioncasino.eu", alt: "Ignition", color: "#FF5722", verticals: ["Casino", "Poker"], regions: ["US", "AU"] },
  { id: "betonline", domain: "betonline.ag", alt: "BetOnline", color: "#1565C0", verticals: ["Sportsbook", "Casino", "Poker"], regions: ["US", "Canada"] },
  { id: "mybookie", domain: "mybookie.ag", alt: "MyBookie", color: "#1B5E20", verticals: ["Sportsbook", "Casino"], regions: ["US"] },
  { id: "karamba", domain: "karamba.com", alt: "Karamba", color: "#FF9800", verticals: ["Casino", "Sportsbook"], regions: ["UK", "Europe"] },
  { id: "32red", domain: "32red.com", alt: "32Red", color: "#C62828", verticals: ["Casino"], regions: ["UK", "Ireland"] },
  { id: "grosvenor", domain: "grosvenorcasinos.com", alt: "Grosvenor", color: "#4A148C", verticals: ["Casino", "Poker", "Sportsbook"], regions: ["UK"] },
  { id: "stake", domain: "stake.com", alt: "Stake", color: "#1475E1", localSrc: "/operators/stake.svg", verticals: ["Casino", "Sportsbook"], regions: ["Global", "US"] },
  { id: "bcgame", domain: "bc.game", alt: "BC.GAME", color: "#00C853", verticals: ["Casino", "Sportsbook"], regions: ["Global"] },
  { id: "roobet", domain: "roobet.com", alt: "Roobet", color: "#1B9E4B", verticals: ["Casino", "Sportsbook"], regions: ["Global", "LATAM"] },
  { id: "rollbit", domain: "rollbit.com", alt: "Rollbit", color: "#76FF03", verticals: ["Casino", "Sports"], regions: ["Global"] },
  { id: "bitcasino", domain: "bitcasino.io", alt: "Bitcasino", color: "#FFD600", verticals: ["Casino"], regions: ["Global"] },
  { id: "sportsbetio", domain: "sportsbet.io", alt: "Sportsbet.io", color: "#00E676", verticals: ["Sportsbook", "Casino"], regions: ["Global"] },
  { id: "cloudbet", domain: "cloudbet.com", alt: "Cloudbet", color: "#2979FF", verticals: ["Sportsbook", "Casino"], regions: ["Global"] },
  { id: "fortunejack", domain: "fortunejack.com", alt: "FortuneJack", color: "#FF6D00", verticals: ["Casino", "Sportsbook"], regions: ["Global"] },
  { id: "mbit", domain: "mbitcasino.io", alt: "mBit", color: "#651FFF", verticals: ["Casino"], regions: ["Global"] },
  { id: "bitstarz", domain: "bitstarz.com", alt: "BitStarz", color: "#FF1744", verticals: ["Casino"], regions: ["Global"] },
  { id: "7bit", domain: "7bitcasino.com", alt: "7Bit", color: "#00B0FF", verticals: ["Casino"], regions: ["Global"] },
  { id: "wildio", domain: "wild.io", alt: "Wild.io", color: "#76FF03", verticals: ["Casino", "Sportsbook"], regions: ["Global"] },
  { id: "duelbits", domain: "duelbits.com", alt: "Duelbits", color: "#FFEA00", verticals: ["Casino", "Esports"], regions: ["Global"] },
  { id: "gamdom", domain: "gamdom.com", alt: "Gamdom", color: "#E040FB", verticals: ["Casino", "Esports"], regions: ["Global"] },
  { id: "shuffle", domain: "shuffle.com", alt: "Shuffle", color: "#18FFFF", verticals: ["Casino", "Sportsbook"], regions: ["Global"] },
  { id: "winz", domain: "winz.io", alt: "Winz.io", color: "#69F0AE", verticals: ["Casino", "Sportsbook"], regions: ["Global"] },
  { id: "vave", domain: "vave.com", alt: "Vave", color: "#40C4FF", verticals: ["Sportsbook", "Casino"], regions: ["Global"] },
  { id: "thunderpick", domain: "thunderpick.io", alt: "Thunderpick", color: "#FFD740", verticals: ["Esports", "Sports", "Casino"], regions: ["Global"] },
  { id: "betsio", domain: "bets.io", alt: "Bets.io", color: "#00E5FF", verticals: ["Casino", "Sportsbook"], regions: ["Global"] },
  { id: "caesars", domain: "caesars.com", alt: "Caesars", color: "#C4A35A", verticals: ["Sportsbook", "Casino"], regions: ["US", "Ontario"] },
  { id: "espnbet", domain: "espnbet.com", alt: "ESPN BET", color: "#D50000", verticals: ["Sportsbook", "Casino"], regions: ["US"] },
  { id: "fanatics", domain: "fanatics.com", alt: "Fanatics", color: "#0D47A1", verticals: ["Sportsbook", "Casino"], regions: ["US"] },
  { id: "hardrock", domain: "hardrock.bet", alt: "Hard Rock Bet", color: "#C8102E", verticals: ["Sportsbook", "Casino"], regions: ["US"] },
  { id: "betrivers", domain: "betrivers.com", alt: "BetRivers", color: "#0033A0", verticals: ["Sportsbook", "Casino"], regions: ["US", "Canada"] },
  { id: "borgata", domain: "borgataonline.com", alt: "Borgata", color: "#6A1B9A", verticals: ["Casino", "Sportsbook", "Poker"], regions: ["US"] },
  { id: "goldennugget", domain: "goldennuggetcasino.com", alt: "Golden Nugget", color: "#FFC107", verticals: ["Casino"], regions: ["US"] },
  { id: "codere", domain: "codere.es", alt: "Codere", color: "#E53935", verticals: ["Sportsbook", "Casino"], regions: ["Spain", "LATAM"] },
  { id: "sportium", domain: "sportium.es", alt: "Sportium", color: "#1565C0", verticals: ["Sportsbook", "Casino"], regions: ["Spain", "LATAM"] },
  { id: "luckia", domain: "luckia.es", alt: "Luckia", color: "#43A047", verticals: ["Sportsbook", "Casino"], regions: ["Spain", "LATAM"] },
  { id: "sisal", domain: "sisal.it", alt: "Sisal", color: "#2E7D32", verticals: ["Lottery", "Sportsbook", "Casino"], regions: ["Italy"] },
  { id: "snai", domain: "snai.it", alt: "Snai", color: "#C62828", verticals: ["Sportsbook", "Casino", "Racing"], regions: ["Italy"] },
  { id: "lottomatica", domain: "lottomatica.it", alt: "Lottomatica", color: "#1565C0", verticals: ["Lottery", "Sportsbook", "Casino"], regions: ["Italy"] },
  { id: "winamax", domain: "winamax.fr", alt: "Winamax", color: "#0D47A1", verticals: ["Poker", "Sportsbook"], regions: ["France", "Spain", "Germany"] },
  { id: "fdj", domain: "fdj.fr", alt: "FDJ", color: "#1A237E", verticals: ["Lottery", "Sportsbook", "Poker"], regions: ["France"] },
  { id: "pmu", domain: "pmu.fr", alt: "PMU", color: "#2E7D32", verticals: ["Racing", "Sportsbook", "Poker"], regions: ["France"] },
  { id: "tipico", domain: "tipico.de", alt: "Tipico", color: "#E65100", verticals: ["Sportsbook", "Casino"], regions: ["Germany", "Austria"] },
  { id: "toto", domain: "toto.nl", alt: "TOTO", color: "#F9A825", verticals: ["Sportsbook", "Casino"], regions: ["Netherlands"] },
  { id: "hollandcasino", domain: "hollandcasino.nl", alt: "Holland Casino", color: "#B71C1C", verticals: ["Casino", "Poker", "Sportsbook"], regions: ["Netherlands"] },
  { id: "atg", domain: "atg.se", alt: "ATG", color: "#00695C", verticals: ["Racing", "Sportsbook", "Casino"], regions: ["Sweden"] },
  { id: "svenskaspel", domain: "svenskaspel.se", alt: "Svenska Spel", color: "#1565C0", verticals: ["Lottery", "Sportsbook", "Casino"], regions: ["Sweden"] },
  { id: "norsktipping", domain: "norsk-tipping.no", alt: "Norsk Tipping", color: "#C62828", verticals: ["Lottery", "Sportsbook", "Casino"], regions: ["Norway"] },
  { id: "veikkaus", domain: "veikkaus.fi", alt: "Veikkaus", color: "#1B5E20", verticals: ["Lottery", "Sportsbook", "Casino"], regions: ["Finland"] },
  { id: "sportsbet", domain: "sportsbet.com.au", alt: "Sportsbet", color: "#00C853", verticals: ["Sportsbook", "Racing"], regions: ["AU"] },
  { id: "tab", domain: "tab.com.au", alt: "TAB", color: "#1B5E20", verticals: ["Sportsbook", "Racing"], regions: ["AU", "NZ"] },
  { id: "pointsbet", domain: "pointsbet.com", alt: "PointsBet", color: "#E31837", verticals: ["Sportsbook", "Casino"], regions: ["AU", "Canada"] },
  { id: "sportybet", domain: "sportybet.com", alt: "SportyBet", color: "#FF6F00", verticals: ["Sportsbook"], regions: ["Africa"] },
  { id: "hollywoodbets", domain: "hollywoodbets.net", alt: "Hollywoodbets", color: "#D50000", verticals: ["Sportsbook", "Racing", "Casino"], regions: ["South Africa", "UK"] },
  { id: "caliente", domain: "caliente.mx", alt: "Caliente", color: "#E53935", localSrc: "/operators/caliente.svg", verticals: ["Sportsbook", "Casino"], regions: ["Mexico", "LATAM"] },
  { id: "betvictor", domain: "betvictor.com", alt: "BetVictor", color: "#E30613", localSrc: "/operators/betvictor.svg", verticals: ["Sportsbook", "Casino", "Racing"], regions: ["UK", "Europe"] },
  { id: "winna", domain: "winna.com", alt: "Winna", color: "#00455D", verticals: ["Casino", "Sportsbook"], regions: ["Global"] },
];

/** Rotating hero use-cases — full product surface, not “lobbies only”. */
export type HeadlineFrame = {
  id: string;
  /** Words before first logo */
  lead: string;
  /** Words between logo 1 and logo 2 */
  mid: string;
  /** Words after logo 3 */
  trail: string;
};

export const HEADLINE_FRAMES: HeadlineFrame[] = [
  {
    id: "chrome",
    lead: "Every",
    mid: "onboarding, home, and side nav",
    trail: "search, tab bars, empty states.",
  },
  {
    id: "casino",
    lead: "Build",
    mid: "casino lobbies with filters",
    trail: "sorting, rails, and game grids.",
  },
  {
    id: "vip",
    lead: "Ship",
    mid: "VIP rewards and promotions",
    trail: "side menus players actually use.",
  },
  {
    id: "sports",
    lead: "Match",
    mid: "betslips, odds, and in-play",
    trail: "cash-out trays and my-bets.",
  },
  {
    id: "cashier",
    lead: "Cover",
    mid: "deposit, KYC, and payments",
    trail: "limits, gates, and loaders.",
  },
];

/** Brandfetch Logo CDN — browser hotlink (build_logo_urls). Prefer over favicons. */
const BRANDFETCH_CLIENT = "1idQ7IGDkd8KcAbHDDk";

/**
 * HQ square icon for bubbles / marquee.
 * Prefer Brandfetch icon@256 (lettermark fallback) — not Google 16px favicons.
 */
export function logoSrc(op: OperatorLogo | string, size = 256) {
  if (typeof op !== "string" && op.localSrc) return op.localSrc;
  const domain = typeof op === "string" ? op : op.domain;
  // Light theme for white bubbles; icon fills edge-to-edge (no brand tile behind).
  return `https://cdn.brandfetch.io/${domain}/w/${size}/h/${size}/theme/light/fallback/lettermark?c=${BRANDFETCH_CLIENT}`;
}

const SCENARIO_TEMPLATES = [
  "Build our casino lobby like {name}",
  "We want the same filtering and sorting as {name}",
  "We want VIP Rewards like {name}",
  "Promotions in the side menu like {name}",
  "Design onboarding like {name}",
  "Build a home screen like {name}",
  "Make a side nav like {name}",
  "Design search like {name}",
  "Build me a betslip like {name}",
  "Build a live chat like {name}",
  "Build an activity feed like {name}",
  "Design a first-deposit flow like {name}",
  "Make an odds button row like {name}",
  "Build a horse racing section like {name}",
  "Design a KYC upload like {name}",
  "Build a cash-out tray like {name}",
  "Make a my-bets history like {name}",
  "Design an in-play event view like {name}",
  "Build a payment method picker like {name}",
  "Make a promotions carousel like {name}",
  "Design a poker lobby like {name}",
  "Build a responsible-gambling limits screen like {name}",
  "Make a loader + skeleton for casino lobby like {name}",
  "Design a mobile sportsbook tab bar like {name}",
  "Build a bet builder / SGP like {name}",
  "Design a geo-block / age gate like {name}",
  "Make a search results empty state like {name}",
  "Build a rewards missions hub like {name}",
  "Design a live wins feed like {name}",
  "Build a game tile grid like {name}",
  "Design a category rail for slots like {name}",
  "Make a casino search + filters like {name}",
  "Build a VIP tier ladder like {name}",
  "Design a sidebar nav with Promotions like {name}",
] as const;

const FEATURED_SCENARIO_OPS = [
  "casumo",
  "mrgreen",
  "stake",
  "leovegas",
  "winna",
  "pinnacle",
  "betfair",
  "draftkings",
  "fanduel",
  "pokerstars",
  "roobet",
  "bet365",
] as const;

/** Dozens of briefs across operators — not one brand story. */
export const SCENARIO_PROMPTS: string[] = (() => {
  const byId = new Map(OPERATOR_LOGOS.map((o) => [o.id, o]));
  const featured = FEATURED_SCENARIO_OPS.map((id) => byId.get(id)).filter(
    Boolean,
  ) as typeof OPERATOR_LOGOS;
  const out: string[] = [];

  // Lead with the patterns users ask for most, on crisp brands
  for (const tmpl of SCENARIO_TEMPLATES.slice(0, 4)) {
    for (const op of featured.slice(0, 6)) {
      out.push(tmpl.replace("{name}", op.alt));
    }
  }

  const pool = OPERATOR_LOGOS;
  for (let i = 0; i < SCENARIO_TEMPLATES.length; i++) {
    for (let j = 0; j < 3; j++) {
      const op = pool[(i * 3 + j * 17) % pool.length]!;
      out.push(SCENARIO_TEMPLATES[i]!.replace("{name}", op.alt));
    }
  }
  return [...new Set(out)];
})();

/** Headline rotation pool — prefer crisp local logos when available. */
export const HEADLINE_LOGOS: OperatorLogo[] = (() => {
  const prefer = [
    "caesars",
    "winna",
    "stake",
    "casumo",
    "mrgreen",
    "pinnacle",
    "betfair",
    "leovegas",
    "pokerstars",
    "fanduel",
    "draftkings",
    "bet365",
    "betmgm",
    "roobet",
    "bcgame",
    "unibet",
    "hardrock",
    "winamax",
    "betvictor",
    "pointsbet",
    "paddypower",
    "skybet",
    "tipico",
    "caliente",
  ];
  const byId = new Map(OPERATOR_LOGOS.map((o) => [o.id, o]));
  const picked = prefer.map((id) => byId.get(id)).filter(Boolean) as OperatorLogo[];
  const rest = OPERATOR_LOGOS.filter((o) => o.localSrc && !prefer.includes(o.id));
  return [...picked, ...rest];
})();
