# Mobbin model → Blaast (manual capture)

**Decision:** copy Mobbin’s *product shape*, not their consumer apps. Capture is **human/manual** (Browserbase blocked on most targets).

## How Mobbin actually fills the library

Public/contributor evidence + job posts + product surface:

1. **People** (staff / contributors) sign into real apps/sites.  
2. They walk a **named journey** (e.g. “Subscribing to a plan”, “Complete purchase”).  
3. They **screenshot each meaningful step** (and states: error, empty, logged out).  
4. Content is **curated**: tagged with app/site, platform, flow/actions, UI patterns.  
5. Library exposes **screens**, **flows** (ordered screens), **sections**, filters, collections, MCP search.

They do **not** rely on “bot browses the whole internet.” Automation is blocked the same way yours is. Scale = process + many human captures.

Example flows (structure only): [Synthesia subscribe](https://mobbin.com/flows/2d402a9c-cce8-40d4-b129-20113b873958), [Zendesk purchase](https://mobbin.com/flows/ce8822b6-0317-4011-b787-11a8cb9b0a40), [lululemon purchase](https://mobbin.com/flows/0a9a45a0-7b9c-4e1c-b838-faa75bd1e3ed).

## What to copy for Blaast (iGaming)

| Mobbin idea | Blaast equivalent |
|-------------|-------------------|
| App / site | **Operator** (+ market, product: sportsbook/casino/…) |
| Flow | **Journey** (registration, KYC, deposit, bet, withdraw, …) |
| Screen | **Screen** in order, with viewport + capture time |
| Patterns / UI elements | Tags after review (optional early) |
| Collections | Private org collections; later rights-cleared shared library |
| MCP search | `search_screens` / `get_flow` / `get_evidence` over **your** captures |
| Presentation | Clean screenshots, operator attribution; no need to clone Mobbin chrome |

## Capture tooling (matches your constraint)

| Approach | Role |
|----------|------|
| **Chrome extension (primary)** | Start session → researcher browses normally → hotkey screenshot / step mark → stop → review/redact → upload |
| **Manual upload fallback** | Drop PNGs/video + order them into a flow (for phone or blocked extension cases) |
| **Browserbase / Scuup agent** | **Not** for the public-style library when sites block it; keep optional for rare open sites only |

## Governance (still applies)

- User-started, per-site permission  
- Redact secrets / payment entry before cloud  
- Distinguish measured vs inferred  
- Customer tokens for design work stay **theirs**; library is research evidence only  

## First build slice

Manual capture of **one operator · one journey · ≥3 screens** → library flow view → later MCP over that data.
