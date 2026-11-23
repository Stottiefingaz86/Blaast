# Admin capture desk

**App:** `apps/web` → `/admin`  
**Purpose:** Add sites, then run **the same guided coverage pack** on every brand so taxonomy coverage stays consistent. Each beat: instruction → **3-2-1** → short tab video (+ poster) → next.

## Flow

1. **Sites** (`/admin/operators`) — wizard: identity → products/markets → ready.  
2. Site detail → **Brand E2E coverage** cards:
   - **Start Desktop E2E** first (1440×900 window).
   - When Desktop journeys are done → **Start Mobile E2E** (390×844 phone window).
   - Same journey checklist both times. Do **not** switch viewport mid-session.
3. **Capture window** (`/admin/capture/[id]/stage`) — opens from the desk:
   - Blaast control dock: **Start recording**, **Stop**, **Comment**, **Tag**  
   - Operator site opens as a **real browser window** sized for the session platform (most iGaming sites refuse iframes — we don’t proxy/strip that)  
   - Start → when Chrome asks, share the **operator window** → Stop → clip plays in the dock and on the desk  
4. Approve / Reject on the desk. Tags/comments ride into MCP evidence on approve.
5. **Add-on flows** (VIP, cashier gap) are optional under “More options” after brand E2E is underway.

### Freelancer quick script

| Step | Action |
|------|--------|
| 1 | Open operator in `/admin/operators/[id]` |
| 2 | Click **Start Desktop E2E** → allow popups |
| 3 | Share the desktop site window when prompted; walk required journeys; Stop/tag/approve |
| 4 | **Mark coverage done** when required journeys are complete |
| 5 | Click **Start Mobile E2E** → use the phone-sized window (same journeys) |
| 6 | Mark mobile done. Library filters Desktop / Mobile separately |

Never flip DevTools mobile mid-desktop session — start a dedicated Mobile session instead.

## Coverage pack (every brand)

Canonical beats live in `apps/web/src/lib/admin/coverage-pack.ts`, filtered by the site’s products:

| Taxonomy | Examples |
|----------|----------|
| Screens | Home, Betslip, Casino lobby, Event, Deposit, Login, My account |
| UI elements | Odds button, Game card, Header, Tab bar, Activity feed, Method row |
| Flows | Place a bet (add → place), Casino browse → launch, Cash out, Bonus claim, Withdrawal |

Missing products → those beats are not queued. Skip/N/A still shows as a gap on the scoreboard.

## Extension

Load unpacked: `apps/capture-extension`.

- Paste Admin session ID + API base (`http://localhost:3000`)  
- Start session on the operator tab  
- Polls guide phase from admin; on `recording` starts tab MediaRecorder (falls back to still PNG)  
- Uploads to `POST /api/admin/sessions/:id/artifacts`

## Data

- Meta: `apps/web/.data/admin-store.json` (gitignored)  
- Binaries: `apps/web/.data/captures/{sessionId}/…`  
- Swap for Supabase/R2 when Task 01 auth/orgs land.

## Publish → MCP (agent handoff)

Approved artifacts are indexed for MCP automatically (no extra click yet):

1. Capture beat (clip + structure JSON + motion sample)  
2. **Approve** in guided desk  
3. MCP tools prefer reviewed captures over the demo catalog:
   - `search_screens` / `search_ui` / `search_flows`
   - `get_motion` — loaders / skeletons / spinners with clip + measured timings
   - `get_evidence` / `get_flow` — steps, measured regions, motion, media URLs, replicate prompt

Agents should **not** get a bare screenshot. They get tags + structure regions + motion hints + poster/video URLs, then implement under the customer design system.

## Run

```bash
cd apps/web && npm run dev
```

Open http://localhost:3000/admin  
Load extension from `apps/capture-extension`.
