# Decisions log + remaining choices (plain language)

**Updated:** 2026-11-23 after Chris feedback.

---

## Decided

| # | Decision | Meaning |
|---|----------|---------|
| 1 | **Repos** | Scuup = `/Users/christopherhunt/surchly`. Design Agent = `…/design-studio`. |
| 2 | **No Lumen / no BetOnline / no old brand tokens** | Those belong to another brand. Do not copy tokens, components, shell, or brand assets into Blaast. |
| 3 | **Platform UI = shadcn** | Blaast’s own app chrome uses shadcn — not Lumen. |
| 4 | **Reuse from Design Studio = governance only** | Keep the *rules and flow*: intake → clarify → proposal → prototype → human sign-off → handover; “customer system wins”; lint/validation ideas; ask-before-inventing components. Do **not** reuse the Lumen library or BetOnline live-site. |
| 5 | **Customer design systems** | Customers (or their agents) bring **their own** tokens/components, or they use MCP with **their own AI**. We are not shipping Chris’s previous DS as the product default. |
| 6 | **Capture = manual / human-led** | Sites block Browserbase. Do **not** rely on cloud browser automation for the library. Follow a Mobbin-style manual capture model (researcher browses; extension or curated upload). |
| 7 | **Product = Mobbin for iGaming first** | Core = operators, screens, flows, search, collections, MCP. Scuup-like research = P1 reuse of same evidence. Design studio (“betslip like bet365”) = P2 after our MCP exists. |
| 8 | **Frontend = look like Mobbin** | Same discovery UI (header, search, mega Categories/Screens/UI/Flows, platform toggle, screenshot card grid). iGaming taxonomy. shadcn under the hood. Reference: `docs/references/mobbin-library-ui.jpg`. |
| 9 | **Capture stack** | Chrome MV3. **Mobbin parity first** (screens, flows, tags, browse, MCP). **CSS/tokens also useful** as measured add-on — keep capturing them, don’t block the library on them. Not Browserbase for library. |

---

## What “design runtime” meant (explained)

That was jargon. It only meant: **which engine builds the prototype?**

In Design Studio today there are two workers:

- **Studio app** (`apps/studio`) — Claude agent that builds prototypes  
- **Older Cursor path** on the live-site desk  

**Given your answer, we do not need you to pick a BetOnline “runtime.”**

For Blaast, the product shape is closer to:

1. **Research + evidence + MCP** (the library agents can query), and  
2. **Governance rules** customers apply when *their* agent designs (tokens they upload, or MCP + their AI).

We are **not** rebuilding “Lumen Design Studio for BetOnline” inside Blaast.

---

## Remaining questions — rewritten simply

You only need rough answers. Defaults below are fine if you want to move on.

### A. How do researchers capture screens first?

When someone researches a competitor site, how do screens get into Blaast?

| Choice | Plain English |
|--------|----------------|
| **1 — Remote browser (what Scuup does now)** | Opens a cloud browser; person (or agent) walks the site; screenshots saved. Faster to reuse. |
| **2 — Chrome extension (what the PRD describes)** | Extension in the researcher’s Chrome; they click start/stop on pages they visit. More “human-led,” new build. |
| **3 — Both later** | Start with Scuup’s remote capture for a pilot; add extension later. |

**Suggested default if unsure:** **3** — reuse Scuup capture for the first working demo, plan extension after.

### B. Who can see whose data?

| Choice | Plain English |
|--------|----------------|
| **1 — Companies (orgs) from day one** | Company A never sees Company B’s captures. Right for a real SaaS. |
| **2 — Single workspace first** | One shared pilot workspace; add company walls later. Faster demo, more rework. |

**Suggested default:** **1** if this will be sold; **2** only for a private Chris-only pilot.

### C. Where do screenshot files live?

| Choice | Plain English |
|--------|----------------|
| **1 — Private storage + temporary links** | Only logged-in people with access get a short-lived link. |
| **2 — Public links like some Scuup evidence today** | Easier, weaker privacy. |

**Suggested default:** **1**.

### D. First goal of the product (so we don’t build everything)

What should the first demo prove?

| Choice | Plain English |
|--------|----------------|
| **1 — Capture + library** | Capture a journey, browse/search screens with evidence. |
| **2 — Capture + audit** | Same, plus one written finding that links to those screens. |
| **3 — MCP for other AIs** | Approved research queryable by Cursor/Claude via MCP (needs some library first). |

**Suggested default:** **2**, then **3**.

---

## Still open until you say otherwise

- Exact pilot operators / markets (legal)  
- Product public name (Blaast vs Scuup vs something else)  
- Whether research money deposits (Scuup teardown style) are in scope at all → **default: out of scope for Blaast MVP**

---

## Next step after you answer A–D (or accept defaults)

Update architecture + Task 01 plan for: **shadcn app + governance patterns + Scuup adapters + customer-owned tokens/MCP** — still **no implementation** until you say go.
