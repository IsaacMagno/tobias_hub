-- Recorrência em lançamentos financeiros

alter table public.finance_entries
  add column if not exists recurrence text
    check (recurrence is null or recurrence in ('daily', 'weekly', 'monthly', 'yearly'));

alter table public.finance_entries
  add column if not exists series_id uuid;

create index if not exists finance_entries_series_id_idx
  on public.finance_entries (series_id)
  where series_id is not null;
