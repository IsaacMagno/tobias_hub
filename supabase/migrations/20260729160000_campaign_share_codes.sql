-- Códigos de compartilhamento de campanha (clone por código)

create table if not exists public.campaign_share_codes (
  id bigserial primary key,
  code text not null unique,
  source_campaign_id bigint not null references public.campaigns (id) on delete cascade,
  owner_champion_id bigint not null references public.champions (id) on delete cascade,
  max_uses integer not null default 10,
  use_count integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  check (max_uses > 0),
  check (use_count >= 0)
);

create index if not exists campaign_share_codes_owner_idx
  on public.campaign_share_codes (owner_champion_id);

create index if not exists campaign_share_codes_source_idx
  on public.campaign_share_codes (source_campaign_id);
