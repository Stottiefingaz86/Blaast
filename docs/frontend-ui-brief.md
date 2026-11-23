# Frontend UI brief — Mobbin-like (iGaming)

**Locked:** Blaast’s library frontend should feel **just like Mobbin** — same layout grammar, discovery UX, and visual density. Content and labels are iGaming. Implementation stack: **Next.js + shadcn** (primitives only; skin to match Mobbin, not default shadcn marketing look).

**Reference screenshot:** `docs/references/mobbin-library-ui.jpg` (user-provided Mobbin Apps browse).

Also: Mobbin’s own light library chrome — [example screen](https://mobbin.com/screens/80b937b1-adaa-48d5-a531-99570b7bcaa2).

---

## Product chrome to mirror

| Mobbin | Blaast |
|--------|--------|
| Logo + **Apps** / **Sites** | Logo + **Operators** / **Web** (or Apps = mobile apps, Sites = operator web) |
| Center pill **Search** | Search operators, screens, flows, markets |
| Saved / notify / profile | Same roles (collections, account) |
| Platform toggle **iOS \| Web** | **Mobile \| Web** (and later Desktop if needed) |
| Sort: Latest / Popular / Top rated / Animations | Latest / Popular / (Animations later) |
| **Filter** | Market, product (sportsbook/casino/poker/cashier), device, date |
| Mega browse: Categories · Screens · UI Elements · Flows | **Products/Markets** · **Screen types** · **UI elements** · **Journeys** |
| Screenshot **card grid** with New/Updated | Same; phone/desktop frames as appropriate |
| App name + tagline under card | Operator name + market/product line |

### Mega-menu columns (iGaming copy)

Full catalogue (Mobbin-breadth) lives in **`docs/igaming-taxonomy.md`**. Includes everything in scope: betslips, casino lobby, casino/sports/global nav, activity feeds, leaderboards, rewards, sports offering, event views, cashier, onboarding, homes, search, headers/footers, my account, cards/tiles, etc.

Summary columns:

**Categories** — Sportsbook · Casino · Poker · Cashier · Account · Rewards/VIP · Promotions · RG · Cross-product  

**Screens** — Homes, lobbies, nav chrome, event views, betslip, cashier, onboarding, account, feeds, leaderboards, search, empty/error, …  

**UI elements** — Odds button, game card, event row, header/footer parts, chips, sheets, …  

**Flows** — Onboarding, first deposit, place bet, cash out, withdraw, bonus claim, KYC, …  

---

## Visual system (from reference)

- Near-black page (`#0a0a0a`–`#111`), elevated cards slightly lighter  
- Light mode also supported later (Mobbin has both); **dark library** first to match your shot  
- Large bold nav labels; small muted column headers  
- Pill search; soft round cards (~16–24px)  
- Screenshot is the hero of every card; metadata under or on card is minimal  
- shadcn for Button, Input, Dropdown, Dialog, Badge — **restyle tokens** so it reads Mobbin, not purple-AI default  

**Avoid:** Lumen, BetOnline tokens, Inter-as-brand-hero if we pick a distinct display/sans pair — keep it clean and product-like like Mobbin (neutral geometric sans is fine here because Mobbin itself is that language).

---

## Key screens (P0 UI)

1. **Discover / Apps (Operators)** — grid of operator cards (latest capture preview)  
2. **Screens browse** — mega filters + screenshot grid  
3. **Flows browse** — flow cards → ordered screen strip  
4. **Operator detail** — that brand’s screens + flows  
5. **Flow detail** — step-through like Mobbin flow viewer  
6. **Screen detail** — full bleed + metadata + “in this flow”  
7. **Collections / Saved**  
8. **Capture desk** (extension companion) — can be simpler; library chrome still Mobbin-like  

Studio and Scuup research UIs are **not** in this brief.

---

## Mobbin drill-down IA (mandatory)

Mobbin is **not** a flat screenshot grid. Hierarchy (mapped to Blaast):

| Depth | Mobbin | Blaast route | What you see |
|------|--------|--------------|--------------|
| L0 | Apps / Sites browse + 4-col mega (Categories · Screens · UI · Flows) | `/` | Operator cards; hover = journey scrub |
| L1 | App/site profile | `/operators/[slug]` | Hero (icon, title, rating, category, Save/Rate) + tabs **Screens · UI Elements · Flows**; Flows tab has **sidebar groups** |
| L2 | Flow theater (shareable URL) | `/flows/[id]` e.g. [Mobbin Fey onboarding](https://mobbin.com/flows/1328af10-c914-4e4b-bc85-46a057d3a81a) | Full-screen: **Screens \| Video**, scrubber, prev/next, Save, **Copy link**, version “Latest” |
| L3 | Agent / design handoff | Copy agent prompt | Structured prompt: operator, flow, ordered steps, Blaast URL — paste into Cursor/Claude to mimic (no proprietary assets) |

**Patterns observed (Mobbin MCP + product UI):**

- Flow = ordered screens + optional video capture of the same journey  
- Theater chrome: “{Flow group} in {App}”, close back to app, platform size metadata  
- Copy/share is first-class (link + Figma paste on Mobbin; Blaast adds **agent prompt**)  
- Browse mega menu is **always-visible text columns**, not only pill dropdowns  
- Capture / admin tooling stays **out** of customer library chrome  

Implemented demo catalog: `apps/web/src/lib/library/catalog.ts`.

---

## Implementation note

Treat Mobbin as **UX/visual reference**, not pixel-theft of their logo/mark or proprietary assets. Rebuild with our brand mark and iGaming taxonomy. Screenshots in the grid are **our** captures of operators.
