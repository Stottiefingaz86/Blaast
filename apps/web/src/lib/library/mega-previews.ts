/**
 * Hover preview sources for mega-browse — live published operators preferred.
 */

import type { CatalogOperator } from "@/lib/library/catalog";
import { resolveFocusHero } from "@/lib/library/focus-media";
import { logoCandidates } from "@/lib/marketing/operator-logos";
import { shuffle } from "@/lib/marketing/shuffle";

export type MegaPreview = {
  name: string;
  domain: string;
  /** Brand mark — preferred for mega hover */
  logoUrl?: string;
  posterUrl?: string;
  videoUrl?: string;
  kind: "logo" | "favicon" | "clip" | "poster";
};

export function faviconUrl(domain: string, size = 128) {
  return logoCandidates(domain, size)[0]!;
}

/** Soft match Scuup journey labels ↔ published flow / screen titles. */
function flowLabelMatch(hay: string, needle: string): boolean {
  if (hay.includes(needle) || needle.includes(hay)) return true;
  if (
    (needle.includes("onboard") || needle === "sign up" || needle === "signup") &&
    /onboard|sign\s*up|register|login|account/.test(hay)
  ) {
    return true;
  }
  if (
    needle.includes("deposit") &&
    /deposit|cashier|payment/.test(hay)
  ) {
    return true;
  }
  if (needle.includes("withdraw") && /withdraw/.test(hay)) return true;
  if (
    needle.includes("casino") &&
    /casino|lobby|game/.test(hay)
  ) {
    return true;
  }
  if (needle.includes("bingo") && /bingo/.test(hay)) return true;
  if (
    (needle.includes("betslip") || needle.includes("sports")) &&
    /betslip|place a bet|sports|odds/.test(hay)
  ) {
    return true;
  }
  if (
    (needle.includes("loyalty") || needle.includes("reward")) &&
    /vip|reward|loyalty|promo/.test(hay)
  ) {
    return true;
  }
  if (needle.includes("support") && /support|help|chat/.test(hay)) return true;
  if (
    needle.includes("my account") &&
    /account|profile|login/.test(hay)
  ) {
    return true;
  }
  if (
    needle.includes("leaderboard") &&
    /leaderboard|ranking|race|daily|weekly|monthly/.test(hay)
  ) {
    return true;
  }
  if (
    needle === "races" ||
    needle.includes("race")
  ) {
    return /race|raffle|leaderboard|daily|weekly|monthly/.test(hay);
  }
  return false;
}

function labelMatchesOperator(o: CatalogOperator, label: string): boolean {
  const needle = label.toLowerCase();
  if (
    needle === "sportsbook" &&
    (o.kind === "sportsbook" || o.category.toLowerCase().includes("sport"))
  ) {
    return true;
  }
  if (needle === "rewards & vip" || needle === "rewards" || needle === "vip") {
    return (
      /reward|vip|loyalty/i.test(o.category) ||
      o.screens.some((s) =>
        /vip|reward|loyalty|promo|bonus/i.test(
          `${s.title} ${s.category ?? ""} ${(s.tags ?? []).join(" ")}`,
        ),
      ) ||
      o.uiElements.some((u) =>
        /vip|reward|loyalty|promo|bonus/i.test(
          `${u.name} ${u.category ?? ""} ${(u.tags ?? []).join(" ")} ${u.searchText ?? ""}`,
        ),
      ) ||
      o.flows.some((f) => /loyalty|reward|vip/i.test(`${f.name} ${f.group}`))
    );
  }
  if (needle === "promotions") {
    return (
      o.category.toLowerCase().includes("promo") ||
      o.category.toLowerCase().includes("reward") ||
      o.screens.some((s) => /promo|bonus|offer/i.test(s.title)) ||
      o.uiElements.some((u) =>
        /promo|bonus|offer/i.test(
          `${u.name} ${(u.tags ?? []).join(" ")} ${u.searchText ?? ""}`,
        ),
      ) ||
      o.flows.some((f) => /promo|reward|loyalty/i.test(`${f.name} ${f.group}`))
    );
  }
  if (needle === "trust") {
    return (
      o.uiElements.some((u) =>
        /trust|compliance|licence|license|responsible|kyc|security/i.test(
          `${u.name} ${(u.tags ?? []).join(" ")} ${u.searchText ?? ""}`,
        ),
      ) ||
      o.screens.some((s) =>
        /trust|compliance|licence|license|responsible/i.test(
          `${s.title} ${(s.tags ?? []).join(" ")}`,
        ),
      )
    );
  }
  if (
    o.category.toLowerCase().includes(needle) ||
    o.kind.toLowerCase().includes(needle)
  ) {
    return true;
  }
  if (o.screens.some((s) => s.title.toLowerCase().includes(needle))) return true;
  if (
    o.uiElements.some((u) => {
      const hay =
        `${u.name} ${(u.tags ?? []).join(" ")} ${u.searchText ?? ""}`.toLowerCase();
      return (
        u.name.toLowerCase().includes(needle) || flowLabelMatch(hay, needle)
      );
    })
  ) {
    return true;
  }
  if (
    o.flows.some((f) =>
      flowLabelMatch(`${f.name} ${f.group}`.toLowerCase(), needle),
    )
  ) {
    return true;
  }
  // Journey chips can match screens/UI when no named flow yet
  if (
    o.screens.some((s) =>
      flowLabelMatch(
        `${s.title} ${(s.tags ?? []).join(" ")}`.toLowerCase(),
        needle,
      ),
    )
  ) {
    return true;
  }
  return false;
}

function previewFromOperator(
  o: CatalogOperator,
  label: string,
): MegaPreview {
  // Same focus resolver as discover cards — Rewards/VIP/Animation ≠ home hero.
  const hero = resolveFocusHero(o, label);
  const domain = o.hostname?.replace(/^https?:\/\//, "") ?? `${o.slug}.com`;
  return {
    name: o.name,
    domain,
    logoUrl: o.logoUrl,
    posterUrl: hero.posterUrl ?? o.posterUrl,
    videoUrl: hero.videoUrl ?? o.videoUrl,
    kind: o.logoUrl ? "logo" : "favicon",
  };
}

/** Prefer live published captures; empty if nothing matches. */
export function previewsForLabel(
  label: string,
  operators: CatalogOperator[] = [],
): MegaPreview[] {
  const live = operators
    .filter((o) => labelMatchesOperator(o, label))
    .map((o) => previewFromOperator(o, label));
  if (live.length) return shuffle(live);
  return [];
}

/** Taxonomy labels that have at least one published match. */
export function liveMegaLabels(
  items: readonly string[],
  operators: CatalogOperator[],
): string[] {
  if (!operators.length) return [];
  return items.filter((label) =>
    operators.some((o) => labelMatchesOperator(o, label)),
  );
}
