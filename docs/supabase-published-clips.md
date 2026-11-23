# Blaast published clips (Supabase)

Approved capture artifacts are indexed locally in `apps/web/.data/published-clips.json` and, when env is set, upserted to Supabase table `blaast_published_clips` on the **Scuup / Surchly** project (`aierpcwlkmvyojnaksvr`). See `docs/scuup-supabase.md`.

## Env (apps/web)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://aierpcwlkmvyojnaksvr.supabase.co
SUPABASE_SECRET_KEY=your_secret_or_service_role_key
# or SUPABASE_SERVICE_ROLE_KEY=…
```

Service role / secret is server-only (approve/publish path). Do not expose it to the browser. Copy from `~/surchly/.env.local`.

## Migration

SQL: `apps/web/supabase/migrations/20261123_blaast_published_clips_on_scuup.sql` (additive; does not touch `ps_*` / `research_*`). Media binaries still live under `.data/captures/` until R2/Storage wiring.

## Approve flow

Desk → **Approve & publish** → `reviewStatus=approved` → `publishApprovedArtifact` → local JSON + optional Supabase REST upsert. MCP / library search already prefer approved local captures.
