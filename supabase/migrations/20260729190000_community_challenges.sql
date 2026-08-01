-- Desafios semanais oficiais

create table if not exists public.community_challenges (
  id bigserial primary key,
  slug text not null unique,
  title text not null,
  blurb text not null,
  starts_on date not null,
  ends_on date not null,
  protocol_json jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.community_challenge_members (
  challenge_id bigint not null references public.community_challenges (id) on delete cascade,
  champion_id bigint not null references public.champions (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, champion_id)
);

create table if not exists public.community_challenge_checkins (
  challenge_id bigint not null references public.community_challenges (id) on delete cascade,
  champion_id bigint not null references public.champions (id) on delete cascade,
  checkin_date date not null,
  created_at timestamptz not null default now(),
  primary key (challenge_id, champion_id, checkin_date)
);

create index if not exists community_challenges_status_idx
  on public.community_challenges (status);

create index if not exists community_challenge_checkins_date_idx
  on public.community_challenge_checkins (challenge_id, checkin_date);
