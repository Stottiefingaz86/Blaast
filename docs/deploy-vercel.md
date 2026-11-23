# Vercel deploy (Blaast)

## Project

- Vercel project: `chris-projects-e99bc8f6/blaast`
- **Production:** https://blaast-five.vercel.app
- Root directory: `apps/web`
- Env vars (Production / Preview / Development):  
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BLAAST_AUTH_SECRET`

## Hobby limit (resolved)

All `/api/*` handlers are consolidated into one serverless function: `src/app/api/[[...path]]/route.ts` (rebuild with `node scripts/build-api-gateway.mjs`). That keeps the deploy under Hobby’s 12-function cap.

```bash
cd apps/web && vercel --prod --yes
```

`.vercelignore` excludes `.data/` so capture WebMs are not uploaded.

## After Pro deploy — known limits

- Auth users + admin sessions still live in **local `.data` JSON** today. On Vercel that filesystem is **ephemeral** — login/captures reset between deploys until we move users + media to Supabase/R2.
- Scuup research read (`ps_brands`, …) works via env URL `aierpcwlkmvyojnaksvr`.
- Apply `blaast_published_clips` migration on that project (still missing — 404 today).

## Git

- Remote: https://github.com/Stottiefingaz86/Blaast
- Vercel Git connected; **Root Directory** = `apps/web`
- Push to `main` triggers production builds
