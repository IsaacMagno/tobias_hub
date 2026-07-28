-- Streaks personalizadas (privadas por campeão)

create table if not exists public.habit_streaks (
  id bigserial primary key,
  champion_id bigint not null references public.champions (id) on delete cascade,
  title text not null,
  kind text not null default 'build'
    check (kind in ('build', 'break')),
  emoji text,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  last_log_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists habit_streaks_champion_id_idx
  on public.habit_streaks (champion_id);

create table if not exists public.habit_streak_logs (
  id bigserial primary key,
  streak_id bigint not null references public.habit_streaks (id) on delete cascade,
  log_date date not null,
  source text not null default 'manual'
    check (source in ('manual', 'campaign')),
  created_at timestamptz not null default now(),
  unique (streak_id, log_date)
);

create index if not exists habit_streak_logs_streak_id_idx
  on public.habit_streak_logs (streak_id);

create table if not exists public.habit_streak_campaigns (
  streak_id bigint not null references public.habit_streaks (id) on delete cascade,
  campaign_id bigint not null references public.campaigns (id) on delete cascade,
  primary key (streak_id, campaign_id)
);

create index if not exists habit_streak_campaigns_campaign_id_idx
  on public.habit_streak_campaigns (campaign_id);
