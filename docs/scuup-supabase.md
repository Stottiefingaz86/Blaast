# Scuup research Supabase (where Blaast points)

Blaast reads **operator / research** data from the Scuup Postgres project — **not** the Playerscope sports/social app.

## Why the dashboard says “RingsAway”

Supabase **organization** = `RingsAway` (billing/container name).  
**Project** = `Stottiefingaz86's Project` / ref `aierpcwlkmvyojnaksvr`.  
That project is where Scuup research content lives (`ps_brands`, teardowns, showcase). The org/project title was never renamed to “Scuup” — the data is still Scuup’s. Older migrations may mention `padel_nerdz_*` from earlier reuse; they do not change that this is the research store Blaast uses.

## Do not confuse these two

| | Scuup research (Blaast) | Playerscope / local `~/surchly` |
|--|--|--|
| Supabase org | RingsAway | often padelnerdz / other |
| Supabase ref | `aierpcwlkmvyojnaksvr` | `asxqvytuzvnklptwoilj` (often what Cursor MCP is linked to) |
| URL | `https://aierpcwlkmvyojnaksvr.supabase.co` | `https://asxqvytuzvnklptwoilj.supabase.co` |
| Tables | `ps_brands`, `ps_showcase_snapshots`, `research_*`, … | `groups`, `sessions`, `dm_*`, `plan_catalog`, … |
| Dashboard | [Open research DB](https://supabase.com/dashboard/project/aierpcwlkmvyojnaksvr) | [Open Playerscope](https://supabase.com/dashboard/project/asxqvytuzvnklptwoilj) |

Local folder `~/surchly` is the **Playerscope** Next app. Research SQL for Blaast lives on **aierpcwlkmvyojnaksvr**.

## Project

| | |
|--|--|
| URL | `https://aierpcwlkmvyojnaksvr.supabase.co` |
| Existing research | `ps_projects`, `ps_brands`, `ps_sessions`, `ps_analyses`, `ps_design`, `ps_voc`, `ps_showcase_snapshots`, `research_workspace`, `research_teardown_jobs`, … |
| Blaast additive | `blaast_published_clips` (migration under `apps/web/supabase/migrations/`) — **must be applied on Scuup**; as of 2026-11-23 the table was still missing there (404) |

## Env (`apps/web/.env.local`)

Copy from Surchly (already wired in local env; **do not commit**):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://aierpcwlkmvyojnaksvr.supabase.co
SUPABASE_SECRET_KEY=…   # or SUPABASE_SERVICE_ROLE_KEY
```

## What Blaast reads today

- Unique operators from `ps_brands` + `ps_showcase_snapshots` → library catalogue (Brandfetch logos)
- Research workspace names / project counts → catalogue taglines
- Approve still writes local `.data/published-clips.json` and upserts `blaast_published_clips` when that table exists

## Apply Blaast migration on Scuup

Cursor’s Supabase MCP is currently linked to a **different** project (`asxqvytuzvnklptwoilj` — sports/social app). Research lives on **aierpcwlkmvyojnaksvr**.

To create `blaast_published_clips` on Scuup (one-time):

1. Open [SQL editor](https://supabase.com/dashboard/project/aierpcwlkmvyojnaksvr/sql/new) while signed in, paste `apps/web/supabase/migrations/20261123_blaast_published_clips_on_scuup.sql`, Run — or
2. Reconnect Cursor Supabase MCP to project **aierpcwlkmvyojnaksvr**, then ask the agent to `apply_migration` from that file.

Until that table exists, Approve still works locally; cloud upsert is a no-op / 404.

## APIs

- `GET /api/library/catalog` — published captures + Scuup operators
- `GET /api/research/scuup` — full research summary (brands, projects, showcase, workspace)
