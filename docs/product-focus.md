# Product focus (locked 2026-11-23)

## One-liner
**Blaast = Mobbin for iGaming.** Same job Mobbin does for general apps/web — screens, flows, search, collections, MCP — but for sportsbook / casino / poker / cashier / CRM journeys.

## Priority order

| Priority | Product surface | Status |
|----------|-----------------|--------|
| **P0 — Core** | iGaming reference library (screens, flows, UI, taxonomy) | **Build this first** — see `docs/igaming-taxonomy.md` |
| **P0.5 — Pattern intelligence** | Cross-operator fingerprints + MCP (`most_used_pattern`, `notable_flows`, …) | After publish index exists — corpus value layer |
| **P1 — Later** | Research / audits / benchmarks (Scuup-style reuse of the same journey evidence) | After library works |
| **P2 — Later** | Governed design studio (“make my betslip like bet365” → prototype via **our** MCP + customer site/tokens) | After MCP exists |

Do not build studio or full Scuup parity before the Mobbin core is real.

## What “Mobbin exactly, for iGaming” means (P0)

Ship the same *kinds of things* Mobbin ships:

| Mobbin | Blaast (iGaming) |
|--------|------------------|
| Apps / sites | **Operators** (brands), markets, products |
| Screens | High-quality screenshots of real operator UI |
| Flows | Ordered journeys (register, KYC, deposit, betslip, cashout, …) |
| Sections / patterns (later) | Recurring UI patterns tagged from captures |
| Browse + filter + search | By operator, market, product, journey, device, date |
| Collections | Save / compare sets (org-private first) |
| MCP | `search_screens`, `get_flow`, … over **our** library so other AIs can use it |
| Manual human capture | Chrome extension + upload (sites block automation) |
| Plans / credits / team / SCIM | Same commercial shell as Mobbin — see `docs/platform-offerings.md` |

**Not in P0:** copying Mobbin’s consumer apps, Lumen, BetOnline tokens, Browserbase-as-library-pipeline, or the design studio.

## Shared evidence (why Scuup comes second)
Every Mobbin-style flow we capture is also the raw material for Scuup-like audits/benchmarks later. Capture once → library first → analysis second. Same evidence graph.

## Studio (P2 sketch only)
User connects **their** site / tokens → asks via MCP/agent: “betslip like bet365” → agent pulls **our** bet365 (or comparable) flow evidence → generates a **prototype** under **their** design system (shadcn/customer tokens), not our old brand DS. Requires P0 MCP + library quality first.

## Platform UI
Blaast library frontend = **Mobbin-like** (same chrome, grid, mega-nav, search) with iGaming labels. Built with **shadcn** primitives, restyled to match Mobbin — not Lumen / BetOnline. See `docs/frontend-ui-brief.md` + `docs/references/mobbin-library-ui.jpg`.

## Capture
Human Chrome extension + extraction layers: [`docs/capture-architecture.md`](./capture-architecture.md).  
Scaffold: [`apps/capture-extension`](../apps/capture-extension). Schemas: [`packages/capture-schema`](../packages/capture-schema).

**Do what Mobbin does (required):** screenshots, ordered flows, taxonomy tags, browse/search, collections, then MCP over images + metadata. **Animations** = short video captures of motion (Mobbin’s Animations tab / discover autoplay) — Phase C after stills library works.

**Also useful (keep, don’t let it delay the library):** measured CSS / layout / tokens from the DOM when available — labeled measured vs inferred. Nice for research and later studio; **not** a substitute for the screenshot library.

**Admin capture desk (live):** add sites, tag products/markets, run standard playbook checklists so every operator is captured the same way — [`docs/admin-capture-desk.md`](./admin-capture-desk.md), app `/admin`.
