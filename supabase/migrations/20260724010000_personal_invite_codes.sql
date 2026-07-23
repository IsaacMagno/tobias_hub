-- Convites pessoais: 1 código por campeão, 1 uso

alter table public.invite_codes
  add column if not exists owner_champion_id integer references public.champions(id) on delete cascade,
  add column if not exists redeemed_by_champion_id integer references public.champions(id) on delete set null;

create unique index if not exists invite_codes_one_per_owner_idx
  on public.invite_codes (owner_champion_id)
  where owner_champion_id is not null;

create index if not exists invite_codes_redeemed_by_idx
  on public.invite_codes (redeemed_by_champion_id)
  where redeemed_by_champion_id is not null;

-- Marca quem resgatou o convite após o cadastro
create or replace function public.complete_invite_redemption(
  p_invite_id bigint,
  p_champion_id integer
)
returns void
language plpgsql
as $$
begin
  update public.invite_codes
  set redeemed_by_champion_id = p_champion_id,
      active = case when used_count >= max_uses then false else active end
  where id = p_invite_id;
end;
$$;
