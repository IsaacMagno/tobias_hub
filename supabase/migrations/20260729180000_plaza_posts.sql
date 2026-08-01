-- Praça: 1 post por dia (TZ SP no app)

create table if not exists public.plaza_posts (
  id bigserial primary key,
  champion_id bigint not null references public.champions (id) on delete cascade,
  campaign_id bigint references public.campaigns (id) on delete set null,
  body text not null,
  post_date date not null,
  created_at timestamptz not null default now(),
  constraint plaza_posts_body_len check (char_length(body) <= 120),
  constraint plaza_posts_one_per_day unique (champion_id, post_date)
);

create index if not exists plaza_posts_created_idx
  on public.plaza_posts (created_at desc);

create index if not exists plaza_posts_champion_idx
  on public.plaza_posts (champion_id);
