-- Logo du studio sur la fiche annuaire (facultatif).
-- Le fichier est rangé dans le même espace de stockage « annuaire » que la photo,
-- dans le dossier du photographe : les règles d'accès de 0007 s'appliquent telles quelles.
alter table public.fiches_annuaire add column if not exists logo_path text;
