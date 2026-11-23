# Capture media on Supabase Storage

Videos/posters are uploaded to bucket **`blaast-captures`** on the Scuup research project (`aierpcwlkmvyojnaksvr`) when you **Approve** a clip (or run the sync script).

## Bucket

- Name: `blaast-captures` (public read)
- Paths: `{sessionId}/{artifactId}.webm` + `.png`

## Approve → cloud

`publishApprovedArtifact` uploads local files, stores `videoUrl` / `posterUrl` on the published record, and upserts metadata to `blaast_published_clips` when that table exists.

## Sync existing local library

```bash
cd apps/web
npx tsx scripts/sync-captures-to-storage.ts
```

Requires `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY` in `.env.local`.

## Still required once

Run [`apps/web/supabase/migrations/20261123_blaast_published_clips_on_scuup.sql`](../apps/web/supabase/migrations/20261123_blaast_published_clips_on_scuup.sql) in the [Scuup SQL editor](https://supabase.com/dashboard/project/aierpcwlkmvyojnaksvr/sql/new) so metadata syncs for Vercel (empty local `.data`).
