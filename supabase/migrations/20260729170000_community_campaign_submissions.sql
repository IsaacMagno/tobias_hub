-- Publicações de campanha na Comunidade (com revisão)

create table if not exists public.community_campaign_submissions (
  id bigserial primary key,
  source_campaign_id bigint references public.campaigns (id) on delete set null,
  submitter_champion_id bigint not null references public.champions (id) on delete cascade,
  title text not null,
  blurb text not null,
  primary_stat text not null default 'inteligence',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewer_note text,
  reviewed_by bigint references public.champions (id) on delete set null,
  reviewed_at timestamptz,
  snapshot_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists community_submissions_status_idx
  on public.community_campaign_submissions (status);

create index if not exists community_submissions_submitter_idx
  on public.community_campaign_submissions (submitter_champion_id);
