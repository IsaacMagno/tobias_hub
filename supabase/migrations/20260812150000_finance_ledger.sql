-- Ledger financeiro: categorias + lançamentos (sem carteiras ainda)

create table if not exists public.finance_categories (
  id bigserial primary key,
  champion_id bigint not null references public.champions (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (champion_id, name, kind)
);

create index if not exists finance_categories_champion_id_idx
  on public.finance_categories (champion_id);

create table if not exists public.finance_entries (
  id bigserial primary key,
  champion_id bigint not null references public.champions (id) on delete cascade,
  category_id bigint not null references public.finance_categories (id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  occurred_on date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_entries_champion_occurred_idx
  on public.finance_entries (champion_id, occurred_on desc);

create index if not exists finance_entries_champion_category_idx
  on public.finance_entries (champion_id, category_id);
