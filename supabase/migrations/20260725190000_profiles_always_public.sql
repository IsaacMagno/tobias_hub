-- Perfis públicos por padrão; o que pode ser privado é a campanha.
-- Admin continua oculto na listagem via app (username admin).

update public.champions c
set profile_visibility = 'public'
where exists (
  select 1
  from public.authentication a
  where a.champion_id = c.id
    and lower(a.username) <> 'admin'
);

alter table public.champions
  alter column profile_visibility set default 'public';
