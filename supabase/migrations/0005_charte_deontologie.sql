-- Engagement à la charte de déontologie, enregistré à l'envoi du dossier
alter table dossiers add column if not exists charte_version text;
alter table dossiers add column if not exists charte_acceptee_le timestamptz;
alter table dossiers add column if not exists charte_phrase text;

-- L'envoi exige l'engagement à la charte : version acceptée et phrase recopiée par le candidat
drop function if exists public.envoyer_dossier(uuid, numeric);
drop function if exists public.envoyer_dossier(uuid, numeric, text);

create or replace function public.envoyer_dossier(d uuid, score numeric, charte text, phrase text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(trim(charte), '') = '' or length(coalesce(trim(phrase), '')) < 20 then
    raise exception 'Engagement à la charte de déontologie requis';
  end if;
  update dossiers
     set statut = 'envoye', envoye_le = now(), score_indicatif = score,
         questions_rouvertes = '{}', derniere_modif = now(),
         charte_version = trim(charte), charte_acceptee_le = now(), charte_phrase = trim(phrase)
   where id = d and candidat_id = auth.uid() and statut in ('brouillon', 'complements');
  if not found then
    raise exception 'Dossier introuvable ou déjà envoyé';
  end if;
  insert into journal (acteur, action, dossier_id, detail)
    values (auth.uid(), 'envoi_dossier', d, jsonb_build_object('charte_deontologie', trim(charte), 'phrase', trim(phrase)));
end $$;

revoke all on function public.envoyer_dossier(uuid, numeric, text, text) from public;
grant execute on function public.envoyer_dossier(uuid, numeric, text, text) to authenticated;
