-- Marcos: eventos de aceite (oficial ou publicação)

create table if not exists public.community_accept_events (
  id bigserial primary key,
  champion_id bigint not null references public.champions (id) on delete cascade,
  template_id text,
  submission_id bigint references public.community_campaign_submissions (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint community_accept_events_ref check (
    template_id is not null or submission_id is not null
  )
);

create index if not exists community_accept_events_template_idx
  on public.community_accept_events (template_id);

create index if not exists community_accept_events_submission_idx
  on public.community_accept_events (submission_id);
