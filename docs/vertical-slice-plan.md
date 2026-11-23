# Vertical slice plan — Mobbin-for-iGaming first

**Product focus:** [`product-focus.md`](./product-focus.md)  
**Capture design:** [`capture-architecture.md`](./capture-architecture.md)

## Build order

### S0 — Foundation (Task 01)
Monorepo web app (shadcn, Mobbin-like shell), orgs/RLS, operators, private artifact storage.

### S1 — Capture → library (Task 02 Phase A)
**Scaffold ready:** `apps/capture-extension` + `packages/capture-schema`.

Wire: redact → upload → show flow in library grid (≥3 screens, one operator journey).

### S2 — Browse IA
Mega-nav + taxonomy ([`igaming-taxonomy.md`](./igaming-taxonomy.md)); filters Mobile|Web; collections.

### S3 — Measured tokens in UI (Task 02 Phase B)
Show CSS variables / layout from structure snapshots with measured badges.

### S4 — MCP (after library has real data)
`search_screens`, `get_flow`, `get_evidence`.

### Later P1/P2
Scuup-style research on same evidence; studio “betslip like X” via our MCP + customer tokens.

## Out of first POC
Browserbase library pipeline, Lumen/BetOnline assets, full motion/asset pipeline (Phase C), interactive behaviour clones.
