import type { CatalogOperator, CatalogUiElement } from "@/lib/library/catalog";

/** Focused replicate prompt — Blaast MCP + evidence IDs, not competitor pixel clone. */
export function buildElementPrompt(
  operator: CatalogOperator,
  el: CatalogUiElement,
  origin: string,
): string {
  const trim =
    el.clipWindow != null
      ? `${(el.clipWindow.startMs / 1000).toFixed(1)}s → ${(el.clipWindow.endMs / 1000).toFixed(1)}s`
      : el.atMs != null
        ? `moment @ ${(el.atMs / 1000).toFixed(1)}s`
        : "full clip";
  const region = el.region
    ? `${Math.round(el.region.w)}%×${Math.round(el.region.h)}% @ (${Math.round(el.region.x)}%, ${Math.round(el.region.y)}%)`
    : "full frame";
  const evidenceId = el.evidenceId ?? el.id;
  const media = [
    el.posterUrl ? `Poster: ${el.posterUrl}` : null,
    el.videoUrl ? `Video: ${el.videoUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `Use **Blaast MCP** to load measured evidence for this UI element, then rebuild it in **our** brand and design system.

## Reference (do not clone branding)
- Operator ID / slug: \`${operator.slug}\`
- Operator: ${operator.name} — ${operator.tagline}
- Element: **${el.name}**
- Evidence ID: \`${evidenceId}\`
- Category: ${el.category ?? operator.category}
- Platform: ${operator.platform}
- Playback window: ${trim}
- Focus region: ${region}
- Tags: ${(el.tags ?? []).join(", ") || "n/a"}

## What to mimic
Behaviour, hierarchy, motion (if present), and layout of **${el.name}** on ${operator.name} — e.g. lobby rows, carousels, order of content — **not** logos or proprietary assets.

## MCP (preferred)
1. \`get_evidence\` with evidence_id=\`${evidenceId}\`
2. Or \`search_ui\` query="${el.name}" (operator \`${operator.slug}\`)
3. Use returned media, clip windows, and regions as measured ground truth

## Measured media
${media || "none attached — fetch via MCP"}

## Library
${origin}/operators/${operator.slug}?tab=ui

## Constraints
1. Do **not** copy logos, trademarks, proprietary illustration, or verbatim marketing copy.
2. Prefer the measured trim window and region — ignore unrelated chrome.
3. Never invent payment credentials, KYC documents, or secret fields.
4. Cite evidence ID \`${evidenceId}\` when explaining decisions.

## Output
1. Element anatomy (regions + hierarchy).
2. Mapping to our design-system components (or flagged exceptions).
3. Interaction / state notes (idle, hover, loading, empty).
4. Motion notes if the capture shows motion.
5. Open questions / missing measured evidence.

Start with a 5-bullet summary, then implement.`;
}
