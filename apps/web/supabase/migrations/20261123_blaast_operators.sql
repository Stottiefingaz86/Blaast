-- Additive Blaast operators table for durable admin Sites on Vercel.
-- Does not alter existing Scuup/Surchly tables.
-- Applied via Supabase MCP / SQL editor on the shared project.

create table if not exists public.blaast_operators (
  id text primary key,
  name text not null,
  url text not null,
  hostname text not null,
  markets text[] not null default '{}',
  products text[] not null default '{}',
  tags text[] not null default '{}',
  notes text,
  vertical text not null default 'other',
  regions text[] not null default '{}',
  reference_tier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blaast_operators_hostname_idx
  on public.blaast_operators (hostname);

create index if not exists blaast_operators_name_idx
  on public.blaast_operators (name);

alter table public.blaast_operators enable row level security;
