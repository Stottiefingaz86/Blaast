# Blaast MCP rebuild (exact chrome)

## Why 14 Stake videos still produce a wrong side nav

Videos alone are not a rebuild contract. Exact replication needs all of:

| Need | Have today? | Role |
|------|-------------|------|
| Approved still of the **exact nav state** (global vs nested My Casino) | Partial — side_nav clip contains both; must pick the frame | Layout IA |
| First-frame / tagged poster of that state | Yes if approved | Color + spacing ground truth |
| **Logged-in header** still (wallet / search / bell / panel) | Often missing as its own beat | Header chrome |
| Structure snapshot with **computed CSS** (bg, radius, gap, font) | Weak / often empty | Stops guessing hex |
| Hover/active as **paired frames or CSS** | Scene-detect only — not hover | Interaction |
| MCP returns **exact beat** (`…-ui-side-nav`), not journey | Fixed in code; must be live on Vercel | Agent sees right media |
| Agent skill: open still → sample → code | Skill exists; must be followed | Process |

Without structure CSS + a named state still, agents approximate. That is the product gap — not “missing Stake clips.”

## Required sequence

1. `search_ui` operator=stake query=`side nav`
2. Take `evidenceId` ending in `ui-side-nav` (not `first_deposit` / `home_tour`)
3. `get_evidence` — confirm `evidence.evidenceId` matches; open `poster_url` + `video_url`
4. Match the **same nav state** as the target screenshot (global ≠ nested)
5. Sample colours from the still; cite artifact id in a code comment

## Sandbox

`/blaast-test` — empty middle, chrome only. Target for Stake shell = **global** drawer + logged-in header (user reference still).
