-- Cap. 9–13 Identity & Mundo (attrs, visibility, achievements)

-- Cap. 9: statistics + primary_stat
create table if not exists public.statistics (
  id bigserial primary key,
  strength integer not null default 0,
  agility integer not null default 0,
  inteligence integer not null default 0,
  vitality integer not null default 0,
  wisdom integer not null default 0,
  champion_id bigint not null unique references public.champions (id) on delete cascade
);

create index if not exists statistics_champion_id_idx
  on public.statistics (champion_id);

alter table public.campaigns
  add column if not exists primary_stat text;

update public.campaigns
set primary_stat = 'inteligence'
where primary_stat is null;

alter table public.campaigns
  alter column primary_stat set default 'inteligence';

alter table public.campaigns
  alter column primary_stat set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campaigns_primary_stat_check'
  ) then
    alter table public.campaigns
      add constraint campaigns_primary_stat_check
      check (primary_stat in ('strength', 'agility', 'inteligence', 'vitality'));
  end if;
end $$;

-- Cap. 10: visibility
alter table public.campaigns
  add column if not exists visibility text;

update public.campaigns
set visibility = 'private'
where visibility is null;

alter table public.campaigns
  alter column visibility set default 'private';

alter table public.campaigns
  alter column visibility set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campaigns_visibility_check'
  ) then
    alter table public.campaigns
      add constraint campaigns_visibility_check
      check (visibility in ('private', 'public'));
  end if;
end $$;

alter table public.champions
  add column if not exists profile_visibility text;

update public.champions
set profile_visibility = 'private'
where profile_visibility is null;

alter table public.champions
  alter column profile_visibility set default 'private';

alter table public.champions
  alter column profile_visibility set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'champions_profile_visibility_check'
  ) then
    alter table public.champions
      add constraint champions_profile_visibility_check
      check (profile_visibility in ('private', 'public'));
  end if;
end $$;

-- Cap. 13: achievements + pins
create table if not exists public.achievement_defs (
  id bigserial primary key,
  slug text not null unique,
  title text not null,
  description text not null,
  kind text not null default 'milestone'
);

create table if not exists public.champion_achievements (
  id bigserial primary key,
  champion_id bigint not null references public.champions (id) on delete cascade,
  achievement_id bigint not null references public.achievement_defs (id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (champion_id, achievement_id)
);

create index if not exists champion_achievements_champion_id_idx
  on public.champion_achievements (champion_id);

create table if not exists public.champion_pins (
  id bigserial primary key,
  champion_id bigint not null references public.champions (id) on delete cascade,
  achievement_id bigint not null references public.achievement_defs (id) on delete cascade,
  slot smallint not null check (slot between 1 and 3),
  unique (champion_id, slot),
  unique (champion_id, achievement_id)
);

create index if not exists champion_pins_champion_id_idx
  on public.champion_pins (champion_id);

insert into public.achievement_defs (slug, title, description, kind) values
  ('first_step', 'Primeiro passo', 'Concluiu o primeiro passo de uma missão.', 'milestone'),
  ('first_chapter', 'Capítulo fechado', 'Concluiu um capítulo inteiro.', 'milestone'),
  ('first_campaign_complete', 'Campanha concluída', 'Marcou uma campanha como completed.', 'milestone'),
  ('sessions_10', '10 sessões', 'Completou 10 sessões de trabalho.', 'milestone'),
  ('sessions_50', '50 sessões', 'Completou 50 sessões de trabalho.', 'milestone'),
  ('attr_str_10', 'Força 10', 'Alcançou 10 em Força.', 'milestone'),
  ('attr_int_10', 'Inteligência 10', 'Alcançou 10 em Inteligência.', 'milestone'),
  ('wis_5', 'Sabedoria 5', 'Alcançou 5 em Sabedoria (fazedor).', 'milestone'),
  ('first_public_campaign', 'Campanha pública', 'Tornou uma campanha pública.', 'milestone'),
  ('level_5', 'Nível 5', 'Alcançou o nível 5.', 'milestone')
on conflict (slug) do nothing;
