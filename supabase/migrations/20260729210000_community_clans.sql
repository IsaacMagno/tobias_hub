-- Clãs / duelos amigáveis (2–5, 7 dias)

create table if not exists public.community_clans (
  id bigserial primary key,
  name text not null,
  owner_id bigint not null references public.champions (id) on delete cascade,
  protocol_ref text not null,
  starts_on date not null,
  ends_on date not null,
  join_code text not null unique,
  max_members int not null default 5 check (max_members >= 2 and max_members <= 5),
  created_at timestamptz not null default now()
);

create table if not exists public.community_clan_members (
  clan_id bigint not null references public.community_clans (id) on delete cascade,
  champion_id bigint not null references public.champions (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (clan_id, champion_id)
);

create table if not exists public.community_clan_checkins (
  clan_id bigint not null references public.community_clans (id) on delete cascade,
  champion_id bigint not null references public.champions (id) on delete cascade,
  checkin_date date not null,
  created_at timestamptz not null default now(),
  primary key (clan_id, champion_id, checkin_date)
);

create index if not exists community_clans_owner_idx
  on public.community_clans (owner_id);

create index if not exists community_clans_join_code_idx
  on public.community_clans (join_code);
