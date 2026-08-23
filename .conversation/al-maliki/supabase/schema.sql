-- ARAB ALI HOTEL Digital Menu
-- Run once in Supabase Dashboard → SQL Editor.

create table if not exists public.menu_items (
  id text primary key,
  name jsonb not null,
  description jsonb not null,
  price numeric(12, 2) not null default 0,
  category text not null,
  image text not null default '',
  hidden boolean not null default false,
  sort_order integer not null default 0
);

create table if not exists public.categories (
  id text primary key,
  name jsonb not null,
  "order" integer not null default 0
);

create table if not exists public.tables (
  id text primary key,
  number integer not null,
  location text not null default '',
  status text not null default 'available',
  active_order_count integer not null default 0
);

create table if not exists public.settings (
  key text primary key,
  value text
);

create index if not exists menu_items_sort_order_idx
  on public.menu_items (sort_order);

create index if not exists categories_order_idx
  on public.categories ("order");

create index if not exists tables_number_idx
  on public.tables (number);

-- The API server is the only component that talks to Supabase.
-- Keep these tables private to the API by default. The connected
-- Supabase service role can still read and write them server-side.
alter table public.menu_items enable row level security;
alter table public.categories enable row level security;
alter table public.tables enable row level security;
alter table public.settings enable row level security;