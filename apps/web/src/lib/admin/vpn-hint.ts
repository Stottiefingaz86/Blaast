/**
 * Suggested VPN exit for capture — derived from brand regions / markets.
 * Research guidance only; does not bypass geo blocks automatically.
 */

export type VpnHint = {
  /** Short chip label e.g. "UK" or "US · NJ" */
  label: string;
  /** One-line instruction for the researcher */
  detail: string;
};

/** Prefer these exits when a region label matches (first hit wins priority). */
const REGION_VPN: Array<{ match: RegExp; label: string; detail: string; priority: number }> = [
  { match: /^UK$|^United Kingdom$|^GB$/i, label: "UK", detail: "VPN → United Kingdom", priority: 10 },
  { match: /^IE$|^Ireland$/i, label: "Ireland", detail: "VPN → Ireland", priority: 20 },
  { match: /^US$|^United States$|^America/i, label: "US", detail: "VPN → United States (NJ / PA / MI sports states)", priority: 25 },
  { match: /^Ontario$/i, label: "Ontario", detail: "VPN → Canada · Ontario", priority: 28 },
  { match: /^CA$|^Canada$/i, label: "Canada", detail: "VPN → Canada (Ontario if offered)", priority: 30 },
  { match: /^AU$|^Australia$/i, label: "Australia", detail: "VPN → Australia", priority: 50 },
  { match: /^NZ$|^New Zealand$/i, label: "NZ", detail: "VPN → New Zealand", priority: 55 },
  { match: /^SE$|^Sweden$|^Nordics$/i, label: "Sweden", detail: "VPN → Sweden", priority: 60 },
  { match: /^NO$|^Norway$/i, label: "Norway", detail: "VPN → Norway", priority: 61 },
  { match: /^FI$|^Finland$/i, label: "Finland", detail: "VPN → Finland", priority: 62 },
  { match: /^DK$|^Denmark$/i, label: "Denmark", detail: "VPN → Denmark", priority: 63 },
  { match: /^DE$|^Germany$/i, label: "Germany", detail: "VPN → Germany", priority: 70 },
  { match: /^AT$|^Austria$/i, label: "Austria", detail: "VPN → Austria", priority: 71 },
  { match: /^NL$|^Netherlands$/i, label: "Netherlands", detail: "VPN → Netherlands", priority: 72 },
  { match: /^ES$|^Spain$/i, label: "Spain", detail: "VPN → Spain", priority: 80 },
  { match: /^IT$|^Italy$/i, label: "Italy", detail: "VPN → Italy", priority: 81 },
  { match: /^FR$|^France$/i, label: "France", detail: "VPN → France", priority: 82 },
  { match: /^PT$|^Portugal$/i, label: "Portugal", detail: "VPN → Portugal", priority: 83 },
  { match: /^BR$|^Brazil$|^LATAM$/i, label: "Brazil", detail: "VPN → Brazil", priority: 90 },
  { match: /^MX$|^Mexico$/i, label: "Mexico", detail: "VPN → Mexico", priority: 91 },
  { match: /^ZA$|^South Africa$|^Africa$/i, label: "South Africa", detail: "VPN → South Africa", priority: 100 },
  { match: /^JP$|^Japan$/i, label: "Japan", detail: "VPN → Japan", priority: 110 },
  { match: /^IN$|^India$/i, label: "India", detail: "VPN → India", priority: 111 },
  { match: /^Europe$/i, label: "UK / EU", detail: "VPN → UK (or DE / SE for local brands)", priority: 120 },
  { match: /^Americas$/i, label: "US / CA", detail: "VPN → US or Canada", priority: 121 },
  { match: /^Global$/i, label: "UK", detail: "VPN → UK (default for global crypto brands)", priority: 200 },
];

/** Domain TLD / known-brand overrides when regions are too vague. */
const DOMAIN_VPN: Array<{ match: RegExp; label: string; detail: string }> = [
  { match: /\.co\.uk$/i, label: "UK", detail: "VPN → United Kingdom" },
  { match: /\.uk$/i, label: "UK", detail: "VPN → United Kingdom" },
  { match: /\.ie$/i, label: "Ireland", detail: "VPN → Ireland" },
  { match: /\.com\.au$|\.au$/i, label: "Australia", detail: "VPN → Australia" },
  { match: /\.ca$/i, label: "Canada", detail: "VPN → Canada" },
  { match: /\.se$/i, label: "Sweden", detail: "VPN → Sweden" },
  { match: /\.no$/i, label: "Norway", detail: "VPN → Norway" },
  { match: /\.fi$/i, label: "Finland", detail: "VPN → Finland" },
  { match: /\.de$/i, label: "Germany", detail: "VPN → Germany" },
  { match: /\.nl$/i, label: "Netherlands", detail: "VPN → Netherlands" },
  { match: /\.es$/i, label: "Spain", detail: "VPN → Spain" },
  { match: /\.it$/i, label: "Italy", detail: "VPN → Italy" },
  { match: /\.fr$/i, label: "France", detail: "VPN → France" },
  { match: /\.br$/i, label: "Brazil", detail: "VPN → Brazil" },
  { match: /\.mx$/i, label: "Mexico", detail: "VPN → Mexico" },
  { match: /\.za$/i, label: "South Africa", detail: "VPN → South Africa" },
  { match: /\.lv$|\.ag$|\.eu$/i, label: "US", detail: "VPN → United States (offshore .lv/.ag brands)" },
];

function resolveRegion(token: string): (typeof REGION_VPN)[number] | null {
  const t = token.trim();
  if (!t) return null;
  for (const row of REGION_VPN) {
    if (row.match.test(t)) return row;
  }
  return null;
}

/**
 * Pick a primary VPN exit from brand regions + markets + hostname.
 */
export function vpnHintForBrand(input: {
  domain?: string;
  regions?: string[];
  markets?: string[];
}): VpnHint {
  const tokens = [
    ...(input.regions ?? []),
    ...(input.markets ?? []),
  ];

  let best: (typeof REGION_VPN)[number] | null = null;
  for (const token of tokens) {
    const hit = resolveRegion(token);
    if (!hit) continue;
    if (!best || hit.priority < best.priority) best = hit;
  }

  if (best) {
    // Surface a second option when US + Canada both listed
    const labels = new Set<string>();
    for (const token of tokens) {
      const hit = resolveRegion(token);
      if (hit) labels.add(hit.label);
    }
    if (labels.size > 1) {
      const extras = [...labels].filter((l) => l !== best!.label).slice(0, 2);
      return {
        label: best.label,
        detail: `${best.detail}${extras.length ? ` · also try ${extras.join(", ")}` : ""}`,
      };
    }
    return { label: best.label, detail: best.detail };
  }

  const host = (input.domain ?? "").replace(/^www\./, "").toLowerCase();
  for (const row of DOMAIN_VPN) {
    if (row.match.test(host)) {
      return { label: row.label, detail: row.detail };
    }
  }

  return {
    label: "UK",
    detail: "VPN → UK (default — confirm market before capture)",
  };
}
