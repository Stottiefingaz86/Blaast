-- Additive Blaast tables on the Scuup / Surchly Supabase project.
-- Does not alter ps_* or research_* tables.
-- Apply via Supabase SQL editor on project aierpcwlkmvyojnaksvr
-- or: reconnect Cursor Supabase MCP to that project and apply_migration.

create table if not exists public.blaast_published_clips (
  id text primary key,
  session_id text not null,
  artifact_id text not null unique,
  operator_id text not null,
  operator_hostname text not null,
  operator_name text not null,
  coverage_step_id text not null,
  instruction text not null,
  taxonomy text not null,
  tags text[] not null default '{}',
  annotations jsonb not null default '[]'::jsonb,
  duration_ms integer,
  page_url text,
  platform text not null,
  market text,
  video_path text,
  poster_path text,
  structure_path text,
  evidence_id text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists blaast_published_clips_operator_idx
  on public.blaast_published_clips (operator_hostname);

create index if not exists blaast_published_clips_tags_idx
  on public.blaast_published_clips using gin (tags);

alter table public.blaast_published_clips enable row level security;

-- Service role bypasses RLS; no anon policies (private until product auth).
