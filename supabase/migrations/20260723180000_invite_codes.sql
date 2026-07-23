-- Convites para registro (uso limitado)

create table if not exists public.invite_codes (
  id bigserial primary key,
  code text not null unique,
  max_uses integer not null default 20 check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (used_count <= max_uses)
);

create index if not exists invite_codes_code_idx
  on public.invite_codes (lower(code));

-- Reserva atômica de 1 uso do convite; retorna id ou null
create or replace function public.claim_invite_code(p_code text)
returns bigint
language plpgsql
as $$
declare
  v_id bigint;
begin
  update public.invite_codes
  set used_count = used_count + 1
  where lower(code) = lower(trim(p_code))
    and active = true
    and used_count < max_uses
  returning id into v_id;

  return v_id;
end;
$$;

-- Libera 1 uso se o registro falhar depois do claim
create or replace function public.release_invite_code(p_id bigint)
returns void
language plpgsql
as $$
begin
  update public.invite_codes
  set used_count = greatest(used_count - 1, 0)
  where id = p_id;
end;
$$;

insert into public.invite_codes (code, max_uses, used_count, active)
values ('tobiasinvite', 20, 0, true)
on conflict (code) do nothing;

-- Username único
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'authentication_username_key'
  ) then
    alter table public.authentication
      add constraint authentication_username_key unique (username);
  end if;
end $$;
