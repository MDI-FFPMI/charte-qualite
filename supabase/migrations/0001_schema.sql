-- =====================================================================
-- Charte Qualité Photographe Professionnel de France - schéma de base
-- Responsable de traitement : MDI - Métiers de l'Image
-- Projet Supabase à créer en région Europe (Paris ou Francfort)
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------
create type role_utilisateur as enum ('candidat', 'expert', 'gestionnaire', 'admin');

create type statut_question as enum ('eliminatoire', 'valorise', 'informatif');

create type type_question as enum (
  'yes_no', 'choice', 'multi_choice', 'text', 'year',
  'url_list', 'specialites', 'materiel', 'coordonnees', 'evaluation'
);

create type statut_dossier as enum (
  'brouillon',            -- en cours de saisie par le candidat
  'envoye',               -- envoyé, en attente de contrôle
  'complements',          -- compléments demandés, questions rouvertes
  'attente_commission',   -- recevable, en attente d'affectation
  'evaluation',           -- affecté à une session, experts en cours
  'deliberation',         -- examiné en séance
  'accorde',              -- Charte accordée (2 ans)
  'refuse',               -- refus motivé
  'suspendu',
  'retire'
);

create type statut_session as enum ('preparation', 'convoquee', 'evaluation', 'deliberation', 'close');

create type avis_justificatif as enum ('conforme', 'non_conforme', 'a_completer');

create type proposition_commission as enum ('accord', 'refus', 'complement');

-- ---------------------------------------------------------------------
-- Profils (1 ligne par compte Supabase Auth)
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  prenom text,
  nom text,
  telephone text,
  role role_utilisateur not null default 'candidat',
  created_at timestamptz not null default now()
);

-- Création automatique du profil à la création du compte
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, lower(new.email))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fonctions d'aide pour les règles d'accès
create function public.mon_role() returns role_utilisateur
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create function public.est_equipe() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('gestionnaire', 'admin') from profiles where id = auth.uid()), false)
$$;

create function public.est_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false)
$$;

-- ---------------------------------------------------------------------
-- Référentiel versionné
-- ---------------------------------------------------------------------
create table referentiel_versions (
  id text primary key,                 -- ex. 'V3'
  libelle text not null,
  seuil_obtention numeric not null default 100,   -- sur 150
  base_score numeric not null default 150,
  validite_mois int not null default 24,
  en_vigueur boolean not null default false,
  publie_le timestamptz
);

create table rubriques (
  id uuid primary key default gen_random_uuid(),
  version_id text not null references referentiel_versions (id),
  numero int not null,
  titre text not null,
  intro text,
  unique (version_id, numero)
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  version_id text not null references referentiel_versions (id),
  rubrique_id uuid not null references rubriques (id) on delete cascade,
  code text not null,                  -- '1.3', '10.2'...
  ordre int not null,
  libelle text not null,
  aide text,
  type type_question not null,
  options jsonb not null default '[]', -- [{value, label, points}]
  statut statut_question not null,
  points_max numeric not null default 0,
  note_par_experts boolean not null default false,  -- portfolio, liste de matériel
  justificatifs text,                  -- justificatifs acceptés, affichés au candidat
  preuve_attendue boolean not null default false,   -- justificatif attendu si réponse positive
  facultatif boolean not null default false,
  condition jsonb,                     -- {"q":"1.1","op":"includes_any","values":["particuliers"]}
  complements jsonb not null default '[]', -- champs annexes [{key,label,type}]
  champs jsonb not null default '[]',      -- champs d'un bloc de coordonnées [{key,label,type,requis}]
  source text,                             -- type evaluation : question dont les liens sont évalués
  unique (version_id, code)
);

-- ---------------------------------------------------------------------
-- Paiements (Stripe) et dossiers
-- ---------------------------------------------------------------------
create table paiements (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  email text not null,
  montant_centimes int not null,
  tarif text not null,                 -- 'standard' (199 €) ou 'adherent' (149 €)
  dossier_id uuid,
  recu_le timestamptz not null default now()
);

create sequence dossier_numero_seq start 1;

create table sessions (
  id uuid primary key default gen_random_uuid(),
  date_seance date not null,
  format text not null default 'visio',      -- 'visio' ou 'presentiel'
  max_dossiers int not null default 40,
  nb_experts int not null default 6,
  statut statut_session not null default 'preparation',
  date_limite_evaluation date,
  created_at timestamptz not null default now()
);

create table dossiers (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique default ('PPF-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('dossier_numero_seq')::text, 4, '0')),
  candidat_id uuid not null references profiles (id) on delete cascade,
  version_id text not null references referentiel_versions (id),
  statut statut_dossier not null default 'brouillon',
  paiement_id uuid references paiements (id),
  dossier_precedent_id uuid references dossiers (id),   -- renouvellement
  session_id uuid references sessions (id),
  questions_rouvertes text[] not null default '{}',      -- codes rouverts lors d'une demande de compléments
  message_complements text,
  score_indicatif numeric,
  score_final numeric,
  envoye_le timestamptz,
  decision_le timestamptz,
  valide_jusqu_au date,
  derniere_modif timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table paiements add constraint paiements_dossier_fk foreign key (dossier_id) references dossiers (id);

create table reponses (
  dossier_id uuid not null references dossiers (id) on delete cascade,
  question_code text not null,
  valeur jsonb,                        -- valeur principale
  complements jsonb not null default '{}', -- champs annexes (commentaire, délais...)
  justification text,                  -- justificatif sous forme de texte ou de lien
  updated_at timestamptz not null default now(),
  primary key (dossier_id, question_code)
);

create table pieces (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references dossiers (id) on delete cascade,
  question_code text not null,
  storage_path text not null unique,   -- '<dossier_id>/<question_code>/<uuid>-<nom>'
  nom_fichier text not null,
  taille int not null,
  mime text not null,
  depose_le timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Experts et commissions
-- ---------------------------------------------------------------------
create table experts (
  id uuid primary key references profiles (id) on delete cascade,
  ville text,
  departement text,
  specialites jsonb not null default '[]',  -- [{"code":"nouveau-ne","niveau":"referent"}]
  titres text[] not null default '{}',
  max_dossiers_rapportes int not null default 15,
  conflits text,                             -- liens déclarés (personnes, entreprises)
  nda_signe_le timestamptz,
  grille_prise_en_main_le timestamptz,
  statut text not null default 'actif',      -- actif, pause, retire
  dernier_passage date,
  created_at timestamptz not null default now()
);

create table session_experts (
  session_id uuid references sessions (id) on delete cascade,
  expert_id uuid references experts (id) on delete cascade,
  confirme boolean not null default false,
  president boolean not null default false,
  defraiement_euros numeric,
  primary key (session_id, expert_id)
);

create table disponibilites (
  expert_id uuid references experts (id) on delete cascade,
  session_id uuid references sessions (id) on delete cascade,
  disponible boolean not null,
  primary key (expert_id, session_id)
);

create table rapporteurs (
  session_id uuid references sessions (id) on delete cascade,
  dossier_id uuid references dossiers (id) on delete cascade,
  expert_id uuid references experts (id) on delete cascade,
  primary key (session_id, dossier_id, expert_id)
);

create table conflits_declares (
  session_id uuid references sessions (id) on delete cascade,
  dossier_id uuid references dossiers (id) on delete cascade,
  expert_id uuid references experts (id) on delete cascade,
  en_conflit boolean not null,
  declare_le timestamptz not null default now(),
  primary key (session_id, dossier_id, expert_id)
);

create table notes_portfolio (
  session_id uuid references sessions (id) on delete cascade,
  dossier_id uuid references dossiers (id) on delete cascade,
  expert_id uuid references experts (id) on delete cascade,
  technique numeric check (technique between 0 and 4),
  lumiere numeric check (lumiere between 0 and 4),
  composition numeric check (composition between 0 and 4),
  post_traitement numeric check (post_traitement between 0 and 4),
  constance numeric check (constance between 0 and 4),
  note_materiel numeric check (note_materiel between 0 and 3),
  note_site numeric check (note_site between 0 and 3),
  note_reseaux numeric check (note_reseaux between 0 and 2),
  commentaire text,
  updated_at timestamptz not null default now(),
  primary key (session_id, dossier_id, expert_id)
);

create table avis_justificatifs (
  dossier_id uuid references dossiers (id) on delete cascade,
  question_code text not null,
  expert_id uuid references experts (id) on delete cascade,
  avis avis_justificatif not null,
  commentaire text,
  updated_at timestamptz not null default now(),
  primary key (dossier_id, question_code, expert_id)
);

create table notes_seance (
  dossier_id uuid references dossiers (id) on delete cascade,
  session_id uuid references sessions (id) on delete cascade,
  notes text,
  proposition proposition_commission,
  courrier text,                       -- courrier généré, relu par l'administratrice
  valide_par uuid references profiles (id),
  valide_le timestamptz,
  primary key (dossier_id, session_id)
);

create table recours (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references dossiers (id) on delete cascade,
  motif text not null,
  depose_le timestamptz not null default now(),
  session_id uuid references sessions (id)
);

create table declarations_changement (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references dossiers (id) on delete cascade,
  objet text not null,                 -- fin d'assurance, cessation...
  detail text,
  declare_le timestamptz not null default now()
);

-- Journal : qui a fait quoi (consultations, décisions)
create table journal (
  id bigint generated always as identity primary key,
  acteur uuid references profiles (id),
  action text not null,
  dossier_id uuid references dossiers (id) on delete set null,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Fonctions d'accès aux dossiers
-- ---------------------------------------------------------------------
-- Le candidat peut modifier : brouillon, ou questions rouvertes en compléments
create function public.dossier_modifiable(d uuid, code text default null) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from dossiers
    where id = d and candidat_id = auth.uid()
      and (statut = 'brouillon'
           or (statut = 'complements' and (code is null or code = any(questions_rouvertes))))
  )
$$;

-- Un expert voit un dossier seulement pendant l'évaluation ou la délibération de sa session,
-- et seulement s'il n'a pas déclaré de conflit sur ce dossier
create function public.expert_voit_dossier(d uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from dossiers dos
    join sessions s on s.id = dos.session_id
    join session_experts se on se.session_id = s.id and se.expert_id = auth.uid() and se.confirme
    where dos.id = d
      and s.statut in ('evaluation', 'deliberation')
      and not exists (
        select 1 from conflits_declares c
        where c.dossier_id = d and c.expert_id = auth.uid() and c.session_id = s.id and c.en_conflit
      )
  )
$$;

create function public.est_rapporteur(d uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from rapporteurs r where r.dossier_id = d and r.expert_id = auth.uid())
$$;

-- ---------------------------------------------------------------------
-- Règles d'accès (RLS)
-- ---------------------------------------------------------------------
alter table profiles enable row level security;
alter table referentiel_versions enable row level security;
alter table rubriques enable row level security;
alter table questions enable row level security;
alter table paiements enable row level security;
alter table dossiers enable row level security;
alter table reponses enable row level security;
alter table pieces enable row level security;
alter table experts enable row level security;
alter table sessions enable row level security;
alter table session_experts enable row level security;
alter table disponibilites enable row level security;
alter table rapporteurs enable row level security;
alter table conflits_declares enable row level security;
alter table notes_portfolio enable row level security;
alter table avis_justificatifs enable row level security;
alter table notes_seance enable row level security;
alter table recours enable row level security;
alter table declarations_changement enable row level security;
alter table journal enable row level security;

-- Profils
create policy "profil: lecture soi-même ou équipe" on profiles for select
  using (id = auth.uid() or est_equipe());
create policy "profil: mise à jour soi-même (sans changer de rôle)" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and role = mon_role());
create policy "profil: gestion par l'admin" on profiles for all
  using (est_admin()) with check (est_admin());

-- Référentiel : lisible par tout utilisateur connecté, modifiable par l'admin
create policy "referentiel lecture" on referentiel_versions for select using (auth.role() = 'authenticated');
create policy "rubriques lecture" on rubriques for select using (auth.role() = 'authenticated');
create policy "questions lecture" on questions for select using (auth.role() = 'authenticated');
create policy "referentiel admin" on referentiel_versions for all using (est_admin()) with check (est_admin());
create policy "rubriques admin" on rubriques for all using (est_admin()) with check (est_admin());
create policy "questions admin" on questions for all using (est_admin()) with check (est_admin());

-- Paiements : équipe uniquement (écrits par la fonction Stripe avec la clé serveur)
create policy "paiements équipe" on paiements for select using (est_equipe());

-- Dossiers
create policy "dossier: le candidat lit le sien" on dossiers for select
  using (candidat_id = auth.uid());
create policy "dossier: l'expert lit ceux de sa session" on dossiers for select
  using (expert_voit_dossier(id));
create policy "dossier: équipe" on dossiers for all
  using (est_equipe()) with check (est_equipe());
-- Le candidat n'écrit pas directement dans dossiers : l'envoi passe par la fonction envoyer_dossier()

-- Réponses
create policy "réponses: lecture candidat" on reponses for select
  using (exists (select 1 from dossiers d where d.id = dossier_id and d.candidat_id = auth.uid()));
create policy "réponses: écriture candidat si modifiable" on reponses for insert
  with check (dossier_modifiable(dossier_id, question_code));
create policy "réponses: mise à jour candidat si modifiable" on reponses for update
  using (dossier_modifiable(dossier_id, question_code)) with check (dossier_modifiable(dossier_id, question_code));
create policy "réponses: suppression candidat si modifiable" on reponses for delete
  using (dossier_modifiable(dossier_id, question_code));
create policy "réponses: lecture expert" on reponses for select using (expert_voit_dossier(dossier_id));
create policy "réponses: équipe" on reponses for all using (est_equipe()) with check (est_equipe());

-- Pièces (métadonnées)
create policy "pièces: lecture candidat" on pieces for select
  using (exists (select 1 from dossiers d where d.id = dossier_id and d.candidat_id = auth.uid()));
create policy "pièces: ajout candidat si modifiable" on pieces for insert
  with check (dossier_modifiable(dossier_id, question_code));
create policy "pièces: suppression candidat si modifiable" on pieces for delete
  using (dossier_modifiable(dossier_id, question_code));
create policy "pièces: lecture expert" on pieces for select using (expert_voit_dossier(dossier_id));
create policy "pièces: équipe" on pieces for all using (est_equipe()) with check (est_equipe());

-- Experts
create policy "expert: lit et met à jour sa fiche" on experts for select using (id = auth.uid() or est_equipe());
create policy "expert: met à jour sa fiche" on experts for update using (id = auth.uid()) with check (id = auth.uid());
create policy "experts: équipe" on experts for all using (est_equipe()) with check (est_equipe());

create policy "sessions: équipe" on sessions for all using (est_equipe()) with check (est_equipe());
create policy "sessions: l'expert voit les siennes" on sessions for select
  using (exists (select 1 from session_experts se where se.session_id = id and se.expert_id = auth.uid()));

create policy "session_experts: équipe" on session_experts for all using (est_equipe()) with check (est_equipe());
create policy "session_experts: l'expert lit et confirme sa ligne" on session_experts for select using (expert_id = auth.uid());
create policy "session_experts: confirmation" on session_experts for update
  using (expert_id = auth.uid()) with check (expert_id = auth.uid());

create policy "disponibilités: l'expert gère les siennes" on disponibilites for all
  using (expert_id = auth.uid() or est_equipe()) with check (expert_id = auth.uid() or est_equipe());

create policy "rapporteurs: équipe" on rapporteurs for all using (est_equipe()) with check (est_equipe());
create policy "rapporteurs: l'expert voit ses affectations" on rapporteurs for select using (expert_id = auth.uid());

create policy "conflits: l'expert déclare" on conflits_declares for insert with check (expert_id = auth.uid());
create policy "conflits: lecture" on conflits_declares for select using (expert_id = auth.uid() or est_equipe());

create policy "notes portfolio: l'expert gère les siennes" on notes_portfolio for all
  using (expert_id = auth.uid() and expert_voit_dossier(dossier_id))
  with check (expert_id = auth.uid() and expert_voit_dossier(dossier_id));
create policy "notes portfolio: équipe" on notes_portfolio for select using (est_equipe());

create policy "avis: le rapporteur gère les siens" on avis_justificatifs for all
  using (expert_id = auth.uid() and est_rapporteur(dossier_id) and expert_voit_dossier(dossier_id))
  with check (expert_id = auth.uid() and est_rapporteur(dossier_id) and expert_voit_dossier(dossier_id));
create policy "avis: équipe" on avis_justificatifs for select using (est_equipe());

create policy "notes de séance: équipe" on notes_seance for all using (est_equipe()) with check (est_equipe());
create policy "notes de séance: experts de la session (lecture)" on notes_seance for select using (expert_voit_dossier(dossier_id));

create policy "recours: le candidat dépose" on recours for insert
  with check (exists (select 1 from dossiers d where d.id = dossier_id and d.candidat_id = auth.uid() and d.statut = 'refuse'));
create policy "recours: lecture" on recours for select
  using (est_equipe() or exists (select 1 from dossiers d where d.id = dossier_id and d.candidat_id = auth.uid()));

create policy "changements: le titulaire déclare" on declarations_changement for insert
  with check (exists (select 1 from dossiers d where d.id = dossier_id and d.candidat_id = auth.uid() and d.statut = 'accorde'));
create policy "changements: lecture" on declarations_changement for select
  using (est_equipe() or exists (select 1 from dossiers d where d.id = dossier_id and d.candidat_id = auth.uid()));

create policy "journal: équipe" on journal for select using (est_equipe());

-- ---------------------------------------------------------------------
-- Envoi du dossier par le candidat
-- Le contrôle complet (conditions obligatoires, pièces) est refait côté
-- application ; ici on verrouille le dossier et on trace l'envoi.
-- ---------------------------------------------------------------------
create function public.envoyer_dossier(d uuid, score numeric) returns void
language plpgsql security definer set search_path = public as $$
begin
  update dossiers
     set statut = 'envoye', envoye_le = now(), score_indicatif = score,
         questions_rouvertes = '{}', derniere_modif = now()
   where id = d and candidat_id = auth.uid() and statut in ('brouillon', 'complements');
  if not found then
    raise exception 'Dossier introuvable ou déjà envoyé';
  end if;
  insert into journal (acteur, action, dossier_id) values (auth.uid(), 'envoi_dossier', d);
end $$;

-- Date de dernière modification (pour la purge des brouillons à 6 mois)
create function public.touch_dossier() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update dossiers set derniere_modif = now() where id = new.dossier_id;
  return new;
end $$;

create trigger reponses_touch after insert or update on reponses
  for each row execute function public.touch_dossier();

-- ---------------------------------------------------------------------
-- Stockage des pièces : bucket privé, chemin '<dossier_id>/<code>/<fichier>'
-- Taille max par fichier à régler dans le tableau de bord (10 Mo conseillé)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pieces', 'pieces', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "pièces stockage: candidat dépose dans son dossier modifiable" on storage.objects for insert
  with check (bucket_id = 'pieces'
    and dossier_modifiable(((storage.foldername(name))[1])::uuid, (storage.foldername(name))[2]));

create policy "pièces stockage: candidat lit les siennes" on storage.objects for select
  using (bucket_id = 'pieces' and exists (
    select 1 from dossiers d where d.id = ((storage.foldername(name))[1])::uuid and d.candidat_id = auth.uid()));

create policy "pièces stockage: candidat supprime si modifiable" on storage.objects for delete
  using (bucket_id = 'pieces'
    and dossier_modifiable(((storage.foldername(name))[1])::uuid, (storage.foldername(name))[2]));

create policy "pièces stockage: expert de la session" on storage.objects for select
  using (bucket_id = 'pieces' and expert_voit_dossier(((storage.foldername(name))[1])::uuid));

create policy "pièces stockage: équipe" on storage.objects for all
  using (bucket_id = 'pieces' and est_equipe()) with check (bucket_id = 'pieces' and est_equipe());

-- ---------------------------------------------------------------------
-- Purge RGPD (à planifier chaque nuit avec pg_cron)
--   - brouillons jamais envoyés : 6 mois après la dernière modification
--   - dossiers refusés : après la décision définitive (délai de recours de 2 mois écoulé, sans recours)
--   - dossiers accordés : à la fin de validité de la Charte
-- Les fichiers du bucket sont à supprimer par la fonction planifiée 'purge'
-- (l'API Storage), avant la suppression des lignes.
-- ---------------------------------------------------------------------
create view public.dossiers_a_purger as
select id, statut from dossiers
where (statut = 'brouillon' and derniere_modif < now() - interval '6 months')
   or (statut = 'refuse' and decision_le < now() - interval '2 months'
       and not exists (select 1 from recours r where r.dossier_id = dossiers.id))
   or (statut in ('accorde', 'retire') and valide_jusqu_au < current_date);

revoke all on public.dossiers_a_purger from anon, authenticated;
