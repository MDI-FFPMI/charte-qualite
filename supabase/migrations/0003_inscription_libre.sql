-- Inscription sans paiement (phase de test / beta)
-- Tant que le paramètre 'inscription_libre' vaut true, un candidat connecté
-- sans dossier peut en ouvrir un lui-même. Pour fermer :
--   update parametres set valeur = 'false' where cle = 'inscription_libre';

create table if not exists parametres (
  cle text primary key,
  valeur jsonb not null,
  updated_at timestamptz not null default now()
);
alter table parametres enable row level security;
create policy "parametres: équipe" on parametres for all
  using (est_equipe()) with check (est_equipe());

insert into parametres (cle, valeur) values ('inscription_libre', 'true')
on conflict (cle) do nothing;

create or replace function public.ouvrir_mon_dossier() returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_version text;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise';
  end if;
  if (select role from profiles where id = auth.uid()) <> 'candidat' then
    raise exception 'Réservé aux candidats';
  end if;
  select id into v_id from dossiers where candidat_id = auth.uid()
    order by created_at desc limit 1;
  if v_id is not null then
    return v_id;
  end if;
  if not coalesce((select valeur = 'true'::jsonb from parametres where cle = 'inscription_libre'), false) then
    raise exception 'Inscription sans paiement fermée';
  end if;
  select id into v_version from referentiel_versions where en_vigueur order by publie_le desc nulls last limit 1;
  insert into dossiers (candidat_id, version_id) values (auth.uid(), v_version)
    returning id into v_id;
  insert into journal (dossier_id, acteur, action, detail)
    values (v_id, auth.uid(), 'dossier_ouvert', jsonb_build_object('mode', 'inscription_libre'));
  return v_id;
end $$;

revoke all on function public.ouvrir_mon_dossier() from public;
grant execute on function public.ouvrir_mon_dossier() to authenticated;
