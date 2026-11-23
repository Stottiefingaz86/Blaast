# Vercel deploy (Blaast)

## Project

- Vercel project: `chris-projects-e99bc8f6/blaast`
- Root directory: `apps/web`
- Env vars (Production / Preview / Development):  
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BLAAST_AUTH_SECRET`

## Blocker (Hobby)

A full App Router build creates **more than 12 serverless functions** (API routes + dynamic admin pages). Hobby plan max is **12**.

**Fix:** upgrade the Vercel team to **Pro**, then:

```bash
cd apps/web && vercel --prod --yes
```

`.vercelignore` excludes `.data/` so capture WebMs are not uploaded.

## After Pro deploy — known limits

- Auth users + admin sessions still live in **local `.data` JSON** today. On Vercel that filesystem is **ephemeral** — login/captures reset between deploys until we move users + media to Supabase/R2.
- Scuup research read (`ps_brands`, …) works via env URL `aierpcwlkmvyojnaksvr`.
- Apply `blaast_published_clips` migration on that project (still missing — 404 today).

## Git

Folder was not a git repo until `git init`. Push your new remote, then in Vercel → Project → Settings → Git → connect the repo (Root Directory `apps/web`).
