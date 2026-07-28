-- Proteção de sequência (escudos) + dias perdidos cobertos

alter table public.habit_streaks
  add column if not exists shields integer not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'habit_streaks_shields_check'
  ) then
    alter table public.habit_streaks
      add constraint habit_streaks_shields_check
      check (shields >= 0 and shields <= 2);
  end if;
end $$;

create table if not exists public.habit_streak_shield_gaps (
  id bigserial primary key,
  streak_id bigint not null references public.habit_streaks (id) on delete cascade,
  gap_date date not null,
  created_at timestamptz not null default now(),
  unique (streak_id, gap_date)
);

create index if not exists habit_streak_shield_gaps_streak_id_idx
  on public.habit_streak_shield_gaps (streak_id);
