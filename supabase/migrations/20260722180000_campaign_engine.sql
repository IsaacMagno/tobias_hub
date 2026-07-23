-- Motor de campanha (Tobias Cap. 3)
-- Estados alinhados a PROGRESSION_SPEC.md

create table if not exists public.campaigns (
  id bigserial primary key,
  champion_id bigint not null references public.champions (id) on delete cascade,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  result text,
  why text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_champion_id_idx on public.campaigns (champion_id);

create table if not exists public.campaign_chapters (
  id bigserial primary key,
  campaign_id bigint not null references public.campaigns (id) on delete cascade,
  title text not null,
  status text not null default 'locked'
    check (status in ('locked', 'available', 'active', 'completed')),
  objective text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists campaign_chapters_campaign_id_idx
  on public.campaign_chapters (campaign_id);

create table if not exists public.missions (
  id bigserial primary key,
  chapter_id bigint not null references public.campaign_chapters (id) on delete cascade,
  title text not null,
  status text not null default 'locked'
    check (status in ('locked', 'available', 'active', 'in_progress', 'paused', 'completed', 'skipped')),
  why text,
  weekdays text[] default '{}',
  time_of_day text,
  planned_minutes int,
  order_index int not null default 0,
  resume_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists missions_chapter_id_idx on public.missions (chapter_id);
create index if not exists missions_status_idx on public.missions (status);

create table if not exists public.mission_steps (
  id bigserial primary key,
  mission_id bigint not null references public.missions (id) on delete cascade,
  surface text not null,
  detail text,
  planned_minutes int,
  status text not null default 'pending'
    check (status in ('pending', 'current', 'done', 'skipped')),
  order_index int not null default 0,
  resume_note text,
  created_at timestamptz not null default now()
);

create index if not exists mission_steps_mission_id_idx on public.mission_steps (mission_id);

create table if not exists public.mission_dependencies (
  id bigserial primary key,
  mission_id bigint not null references public.missions (id) on delete cascade,
  requires_mission_id bigint not null references public.missions (id) on delete cascade,
  allow_skip boolean not null default false,
  unique (mission_id, requires_mission_id)
);

create table if not exists public.work_sessions (
  id bigserial primary key,
  step_id bigint not null references public.mission_steps (id) on delete cascade,
  champion_id bigint not null references public.champions (id) on delete cascade,
  status text not null default 'running'
    check (status in ('running', 'completed', 'aborted')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  elapsed_seconds int not null default 0,
  planned_minutes int
);

create index if not exists work_sessions_champion_id_idx on public.work_sessions (champion_id);
create index if not exists work_sessions_step_id_idx on public.work_sessions (step_id);

create table if not exists public.user_focus (
  champion_id bigint primary key references public.champions (id) on delete cascade,
  active_mission_id bigint references public.missions (id) on delete set null,
  updated_at timestamptz not null default now()
);
