# Exact chrome replication — what actually works

## Do we need an LLM on the videos?

**Not as the measurement source.** An LLM watching webm will invent spacing, radius, and hover colours — that is why shells stay “far off.”

**Yes as an optional compiler** *after* measured data exists:

```
DOM structure (getComputedStyle) + stills + hover before/after
        ↓
 chrome schema (boxes, CSS, IA, transition ms)
        ↓
 LLM or template codegen → React/CSS
```

We already capture DOM structure in the extension (`apps/capture-extension/content/structure.js`). Most Stake chrome beats still lack usable structure on publish, so agents fall back to guessing from posters.

## What “extracted from their site” requires

1. **Structure snapshot on chrome beats** (header, side_nav, tab_bar) — measured bg, radius, gap, font, boxes.
2. **Hover / open-close states** — either force `:hover` in extension and re-snapshot, or tagged before/after frames with transition ms.
3. **Named nav state** — `global` vs `nested_casino` (mixing these is why shells looked random).
4. **Exact-beat MCP** — `get_evidence(…-ui-side-nav)` must not expand to a journey.
5. **Codegen from schema** — agent applies schema; LLM does not invent layout.

Videos remain for motion timing. Posters remain for visual QA. Neither replaces computed CSS.

## Sandbox check

`/blaast-test` — wallet **centered** in header grid; side width animates 200ms on menu toggle.
