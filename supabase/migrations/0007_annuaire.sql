-- Annuaire public des titulaires (carte de France et fiches)
-- Une fiche par photographe. Elle n'est visible du public que si :
--   - le photographe a donné son accord (consentement_le renseigné, publie = true),
--   - il détient une Charte accordée et en cours de validité,
--   - l'équipe ne l'a pas masquée.

create table fiches_annuaire (
  id uuid primary key references profiles (id) on delete cascade,
  slug text unique,
  publie boolean not null default false,          -- accord du photographe
  consentement_le timestamptz,
  masquee boolean not null default false,         -- modération par l'équipe
  nom_affiche text,
  entreprise text,
  ville text,
  code_postal text,
  departement text,
  lat double precision,
  lng double precision,
  specialites text[] not null default '{}',
  principales text[] not null default '{}',
  presentation text check (char_length(presentation) <= 600),
  site text,
  instagram text,
  telephone text,
  email_contact text,
  photo_path text,                                -- chemin dans le stockage « annuaire »
  updated_at timestamptz not null default now()
);

alter table fiches_annuaire enable row level security;

-- Titulaire : Charte accordée et encore valide
create or replace function public.est_titulaire(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from dossiers
    where candidat_id = u and statut::text = 'accorde'
      and (valide_jusqu_au is null or valide_jusqu_au >= current_date)
  )
$$;

grant execute on function public.est_titulaire(uuid) to anon, authenticated;

create policy "annuaire: lecture publique des titulaires consentants" on fiches_annuaire for select
  using (publie and consentement_le is not null and not masquee and est_titulaire(id));
create policy "annuaire: le photographe lit sa fiche" on fiches_annuaire for select using (id = auth.uid());
create policy "annuaire: le photographe crée sa fiche" on fiches_annuaire for insert with check (id = auth.uid() and not masquee);
create policy "annuaire: le photographe modifie sa fiche" on fiches_annuaire for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy "annuaire: équipe" on fiches_annuaire for all using (est_equipe()) with check (est_equipe());

-- Date de fin de validité de la Charte, lisible comme une colonne de la fiche (select=*,fin_validite)
create or replace function public.fin_validite(f fiches_annuaire) returns date
language sql stable security definer set search_path = public as $$
  select max(valide_jusqu_au) from dossiers where candidat_id = f.id and statut::text = 'accorde'
$$;
grant execute on function public.fin_validite(fiches_annuaire) to anon, authenticated;

-- Le photographe ne peut pas lever lui-même une modération
create or replace function public.garder_moderation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not est_equipe() then
    new.masquee := old.masquee;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger fiches_annuaire_moderation before update on fiches_annuaire
  for each row execute function public.garder_moderation();

-- Photos : stockage public en lecture, chaque photographe écrit dans son dossier « <id>/ »
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('annuaire', 'annuaire', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "annuaire stockage: lecture publique" on storage.objects for select using (bucket_id = 'annuaire');
create policy "annuaire stockage: le photographe dépose sa photo" on storage.objects for insert
  with check (bucket_id = 'annuaire' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "annuaire stockage: le photographe remplace sa photo" on storage.objects for update
  using (bucket_id = 'annuaire' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "annuaire stockage: le photographe supprime sa photo" on storage.objects for delete
  using (bucket_id = 'annuaire' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "annuaire stockage: équipe" on storage.objects for all
  using (bucket_id = 'annuaire' and est_equipe()) with check (bucket_id = 'annuaire' and est_equipe());
