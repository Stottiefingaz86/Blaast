---
name: blaast-mcp-rebuild
description: Rebuild operator shells and flows from Blaast MCP evidence with exact layout fidelity. Use when implementing /blaast-test, mimicking Stake/Whale/etc chrome, or any MCP-driven UI rebuild.
---

# Blaast MCP rebuild (exact chrome)

## Non-negotiable workflow

1. Call Blaast MCP `search_ui` / `search_screens` for the operator + component (e.g. `stake side_nav`).
2. **Open and visually inspect** every returned poster image (and video when motion/hover matters). Do not rebuild from memory or web search.
3. Call `get_evidence` with the **exact** `evidenceId` from the hit (e.g. `…-ui-side-nav`), not a journey umbrella.
4. Sample colors from the poster when possible; prefer measured hex over guessed Stake tokens.
5. Rebuild IA, spacing, active/hover states from what you see. Cite evidence IDs in code comments.

## What “close” means on `/blaast-test`

- Match chrome (header + side nav + product rail) as closely as the stills allow.
- Empty main is OK when the task is shell-only.
- Do **not** invent old Stake layouts. Prefer the newest library still for that beat.
- Use Blaast wordmark, not competitor logos.

## Video / motion

- Poster = layout ground truth.
- Video = hover, expand/collapse, scroll, loaders, transitions.
- If structure JSON has `motion.animations` / scene cuts, use those timings.
- If structure is missing, say so — do not invent easing.

## Anti-patterns

- Rebuilding from Mobbin or training memory while Blaast clips exist.
- Calling `get_evidence` for a journey and ignoring the specific nav beat.
- Treating ffmpeg scene-detect alone as “hover analysis.”
