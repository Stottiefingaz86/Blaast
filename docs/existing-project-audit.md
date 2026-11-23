# Existing project audit — Scuup + Design Agent

**Mode:** READ-ONLY | **Date:** 2026-11-23 | **Gate:** G0  
**Repos untouched.** No dependency installs, migrations, or application code.

## Repositories located

| Role | Local path | Remote | HEAD |
|------|------------|--------|------|
| **Scuup** | `/Users/christopherhunt/surchly` | `github.com/Stottiefingaz86/scuup.git` | `20f513c` |
| **Design Agent** | `/Users/christopherhunt/Desktop/🤖 Design Agent/design-studio` | `github.com/Stottiefingaz86/DAGENT.git` | `9368a94` (`main`) |

**Also noted (not primary audit targets):**  
- `design-studio/_designagent/` — company-clean mirror toward `ft-unified-platform/DesignAgent`  
- `/Users/christopherhunt/agentic_design_build` — `AI-Design-Stream` (related lineage)  
- `Desktop/🤖 Design Agent/demo-site` — demo sibling  

---

## A. Design Agent / design-studio (primary governance engine)

### What it is
Single-tenant **design ops studio**: BRD → SpecKit → Lumen-governed prototype → HoD sign-off → handover package. Hard-wired to **Lumen** tokens/components and a BetOnline-style **live-site** shell.

Evidence: `README.md`, `docs/PIPELINE.md`, `PROJECT_STATE.md`, `CLAUDE.md`.

### Stack (verified)
| Layer | Tech | Path |
|-------|------|------|
| Studio worker + UI | Node HTTP server, Claude Agent SDK | `apps/studio/server.mjs`, `apps/studio/lib/claude-runner.mjs` |
| Prototype host | Next.js 14 | `apps/live-site/` |
| Token/component playground | Astro 6 + React 19 + Storybook 10 | root `package.json`, `.storybook/` |
| Tokens | Figma JSON → CSS vars | `tokens/`, `scripts/sync-tokens.mjs` |
| Parallel/legacy desk | Cursor SDK | `@cursor/sdk`; `apps/live-site/lib/agent/cursor-cloud.ts` |

### Capabilities with evidence

| Capability | Status | Evidence |
|------------|--------|----------|
| HTTP BRD intake | **VERIFIED** | `POST /api/intake` + bearer `STUDIO_INTAKE_TOKEN` — `apps/studio/server.mjs`, `docs/PIPELINE.md` |
| File-drop inbox | **VERIFIED** | `inbox/` watched → `inbox/processed/`; GH Action example `apps/studio/examples/send-brd-to-design-repo.yml` |
| Pipeline stages | **VERIFIED** | intake→spec→clarify→research→proposal→prototype→refine→signoff→handoff; jobs in `specs/<slug>/job.json` |
| Lumen-only governance | **VERIFIED** | `.specify/memory/constitution.md`; `.claude/skills/lumen-build/`; `scripts/lint-tokens.mjs` |
| Token lint | **VERIFIED** | Fails raw hex/rgb, unknown CSS vars, arbitrary Tailwind; escape `// lumen-allow` |
| Taste / learned rules | **VERIFIED** | `knowledge/chris-taste/*`, `knowledge/learned-rules.json`, `knowledge/taste-ledger.jsonl` |
| Gap / proposed components | **VERIFIED** | `knowledge/lumen/GAPS.md`, `apps/live-site/components/proposed/` |
| Independent design reviewer | **VERIFIED** | Subagent in `apps/studio/lib/claude-runner.mjs` |
| Handover package + API | **VERIFIED** | `docs/HANDOVER.md`; `GET /api/jobs/:slug/handover(.tar.gz)`; `POST …/dev-questions` |
| Team auth (local) | **VERIFIED** | scrypt + cookies; roles owner/lead/designer/viewer — `apps/studio/lib/auth.mjs`, `docs/TEAM.md` |
| Figma + Mobbin MCP (client) | **VERIFIED** | `.mcp.json`; skills under `.claude/skills/` |
| Multi-tenant / org RLS | **ABSENT** | One studio = one team / one DS |
| Arbitrary customer DS import | **ABSENT** | Lumen/BetOnline brands only in `tokens/` |
| Consumer MCP (M9 tools) | **ABSENT** | Does not expose search_screens / get_evidence etc. |
| Unit/integration tests | **ABSENT** | CI: `.github/workflows/verify.yml` (skills check, syntax, secret grep) |
| Durable DB for jobs | **ABSENT** | File/JSON + in-memory queue (`orchestrator.mjs`) |

### Integration surface (recommended)
**Call Design Studio via HTTP** (`/api/intake` → poll job → download handover). Do **not** fork Lumen as the shared product DS; treat it as a **governed generation engine + contract**.

---

## B. Scuup (`surchly` folder)

### What it is
SaaS **competitor CX intelligence** (agent + human live capture, journey scoring, reports) plus internal **Research** (IMAP/CRM/teardowns) and **Grace** VoC. UI branding: **Scuup**. Specs/prompts still say PlayerScope in places.

Evidence: `src/app/layout.tsx`, `src/components/scuup-mark.tsx`, `README.md` (stale), `PLAYERSCOPE_SPEC.md`.

### README accuracy
**STALE.** README still claims “Phase 1 mocked demo” / `mock-data.ts`. At `20f513c`, real Browserbase capture, Supabase projects, Stripe, IMAP research, and admin are shipped. Landing demos remain marketing-only (`src/lib/landing-demo.ts`).

### Stack (verified)
Next.js 16 + React 19 + Tailwind v4 + shadcn/Base UI; Supabase Auth + service-role DB; Browserbase + Stagehand + Playwright-core; Stripe; imapflow + mailparser; OpenAI; Sentry + PostHog.

### Capabilities with evidence

| Capability | Status | Evidence |
|------------|--------|----------|
| Supabase Auth (SSR cookies) | **VERIFIED** | `src/lib/auth-server.ts`, `src/proxy.ts`, `src/app/login/` |
| Project ownership + soft collab | **VERIFIED / PARTIAL** | `ps_projects.user_id`; `ps_project_members` — no organisations table |
| RLS policies in-repo | **ABSENT** | Comment in `supabase-server.ts`: RLS enabled with no policies; service role is the path |
| Live human capture (Browserbase) | **VERIFIED** | `src/app/api/capture/{start,tick,finish,stop}/`; `src/app/capture/`; `src/lib/capture-runtime.ts` |
| Agent analyze / Stagehand walks | **VERIFIED** | `src/app/api/analyze/`; `src/lib/analyst.ts`; research `teardown-runtime.ts` |
| Chrome MV3 extension | **ABSENT** | No extension package |
| Manual media upload | **ABSENT** | |
| Evidence storage | **VERIFIED / PARTIAL** | `.evidence/` + Supabase Storage bucket `evidence` — `src/lib/evidence-storage.ts`; public URLs, not signed private |
| Redaction before store/AI | **ABSENT** (UI claim only) | Copy in `live-capture-dialog.tsx`; no redact logic in capture/evidence paths |
| Journey / features / retention / cashier UI | **VERIFIED** | `src/app/projects/[id]/*`; scoring libs |
| Design API | **VERIFIED** (not M8) | `src/app/api/design/` — competitor site design review via DOM + OpenAI, not governed DS studio |
| Research IMAP + CRM cadence | **VERIFIED / PARTIAL** | `verification-inbox.ts`, `research/email-monitor.ts`; shared Gmail env; workspace blob `research_workspace` |
| EML upload | **ABSENT** | |
| Stripe billing + plans | **VERIFIED** | `src/lib/stripe.ts`, `src/app/api/billing/*`, `src/lib/plan.ts` |
| Admin mission control | **VERIFIED** | `src/app/admin/`, `src/app/api/admin/*` |
| MCP server | **ABSENT** | |
| In-repo SQL migrations | **ABSENT** | Schema inferred from `project-db.ts`, `admin-db.ts`, etc. |

### Tables touched (inferred)
`ps_projects`, `ps_brands`, `ps_analyses`, `ps_sessions`, `ps_action_plans`, `ps_voc`, `ps_design`, `ps_profiles`, `ps_project_members`, `ps_report_comments`, `ps_report_views`, `ps_run_log`, `ps_score_history`, `ps_brand_credentials`, `ps_nav_hints`, `ps_showcase_snapshots`, `research_workspace`.

---

## C. Cross-cutting unknowns (explicit)

1. Exact Supabase RLS state in the live Scuup project (no migrations in repo).  
2. Whether `_designagent` company mirror or `agentic_design_build` should be preferred for clean IP / brand-stripped integration.  
3. Whether Claude studio (`apps/studio`) or Cursor live-site desk is the long-term generation path (both present).  
4. Rights/licensing policy for publishing competitor captures (neither repo encodes a rights-status model).  
5. Whether Browserbase live capture can satisfy MVP G1 temporarily vs mandatory Chrome MV3 in Task 02.

---

## Bottom line

- **Design Studio** = strongest reuse for **M8 governed generation** (HTTP intake, Lumen lint, skills, handover, human gates). Needs a tenant DS adapter around it.  
- **Scuup** = strongest reuse for **capture/analysis/SaaS shell** (Browserbase, evidence, journeys, research IMAP, Stripe). Needs org/RLS, redaction, MV3 (or explicit deferral), and MCP built new.  
- Neither repo is multi-tenant research library + MCP out of the box. Integrate via **adapters**, do not merge/rewrite blindly.
