import {
  OPERATOR_LOGOS,
  logoSrc,
  type OperatorLogo,
} from "@/lib/marketing/operator-logos";
import type { ProductSurface } from "@/lib/admin/types";

/** Map directory region labels → market chips used in the add-site wizard. */
const REGION_TO_MARKETS: Record<string, string[]> = {
  UK: ["UK"],
  Ireland: ["IE"],
  IE: ["IE"],
  US: ["US"],
  Canada: ["CA"],
  CA: ["CA"],
  Ontario: ["CA"],
  Mexico: ["MX"],
  MX: ["MX"],
  LATAM: ["BR", "MX"],
  Brazil: ["BR"],
  BR: ["BR"],
  Europe: ["UK", "DE", "SE"],
  Nordics: ["SE"],
  Sweden: ["SE"],
  Norway: ["NO"],
  Finland: ["FI"],
  Denmark: ["DK"],
  Germany: ["DE"],
  DE: ["DE"],
  Austria: ["AT"],
  Netherlands: ["NL"],
  Spain: ["ES"],
  Italy: ["IT"],
  France: ["FR"],
  Portugal: ["PT"],
  "Eastern Europe": ["DE"],
  AU: ["AU"],
  Australia: ["AU"],
  NZ: ["NZ"],
  "New Zealand": ["NZ"],
  Africa: ["ZA"],
  "South Africa": ["ZA"],
  Americas: ["US", "CA", "BR", "MX"],
  Global: ["UK"],
  CIS: ["UK"],
  Asia: ["UK"],
};

const VERTICAL_TO_PRODUCT: Record<string, ProductSurface> = {
  Sportsbook: "sportsbook",
  Casino: "casino",
  Poker: "poker",
  DFS: "sportsbook",
  Exchange: "sportsbook",
  Esports: "sportsbook",
  Racing: "sportsbook",
  Lottery: "casino",
  Bingo: "casino",
  "Mobile Casino": "casino",
  "Online Casino": "casino",
  "Online Slots": "casino",
  Slots: "casino",
  "Crypto Casino": "casino",
  "Crypto Sportsbook": "sportsbook",
  Sports: "sportsbook",
  Futures: "sportsbook",
};

export function findDirectoryOperator(hostname: string): OperatorLogo | null {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  if (!host) return null;
  const exact = OPERATOR_LOGOS.find((o) => o.domain.toLowerCase() === host);
  if (exact) return exact;
  // Subdomain of a known domain (m.stake.com → stake.com)
  return (
    OPERATOR_LOGOS.find((o) => host.endsWith(`.${o.domain.toLowerCase()}`)) ??
    null
  );
}

export function marketsFromRegions(regions: string[]): string[] {
  const out = new Set<string>();
  for (const r of regions) {
    const mapped = REGION_TO_MARKETS[r];
    if (mapped) mapped.forEach((m) => out.add(m));
    else if (/^[A-Z]{2}$/.test(r)) out.add(r);
  }
  return [...out];
}

export function productsFromVerticals(verticals: string[]): ProductSurface[] {
  const out = new Set<ProductSurface>(["cashier", "account"]);
  for (const v of verticals) {
    const p = VERTICAL_TO_PRODUCT[v];
    if (p) out.add(p);
  }
  if (out.has("casino") || out.has("sportsbook")) out.add("promotions");
  return [...out];
}

export function directoryFaviconSrc(hostname: string): string | null {
  if (!hostname) return null;
  const op = findDirectoryOperator(hostname);
  if (op) return logoSrc(op, 64);
  return logoSrc(hostname, 64);
}

export function suggestFromHostname(hostname: string): {
  operator: OperatorLogo | null;
  name: string;
  markets: string[];
  products: ProductSurface[];
  favicon: string | null;
  known: boolean;
} {
  const op = findDirectoryOperator(hostname);
  if (!op) {
    return {
      operator: null,
      name: hostname.split(".")[0] || "",
      markets: ["UK"],
      products: ["sportsbook", "casino", "cashier", "account"],
      favicon: hostname ? logoSrc(hostname, 64) : null,
      known: false,
    };
  }
  return {
    operator: op,
    name: op.alt,
    markets: marketsFromRegions(op.regions),
    products: productsFromVerticals(op.verticals),
    favicon: logoSrc(op, 64),
    known: true,
  };
}
