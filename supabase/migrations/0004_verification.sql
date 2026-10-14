-- Circuit de vérification des dossiers
--   1. Contrôle de recevabilité par l'équipe (niveau 1), justificatif par justificatif
--   2. Dossier recevable : 2 experts vérificateurs attribués au fil de l'eau (niveau 2)
--   3. Vérifications terminées : l'équipe valide le passage en commission

-- Nouveau statut entre « envoyé » et « attente de commission »
alter type statut_dossier add value if not exists 'verification' after 'complements';

-- Contrôle de niveau 1 (équipe)
create table controle_n1 (
  dossier_id uuid references dossiers (id) on delete cascade,
  question_code text not null,
  avis avis_justificatif not null,
  commentaire text,
  par uuid references profiles (id) default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (dossier_id, question_code)
);

-- Experts vérificateurs (niveau 2), indépendants des sessions
create table verificateurs (
  dossier_id uuid references dossiers (id) on delete cascade,
  expert_id uuid references experts (id) on delete cascade,
  statut text not null default 'en_cours' check (statut in ('en_cours', 'termine', 'conflit')),
  avis_global text check (avis_global in ('favorable', 'reserve', 'defavorable')),
  commentaire text,
  attribue_le timestamptz not null default now(),
  termine_le timestamptz,
  primary key (dossier_id, expert_id)
);
create index verificateurs_expert on verificateurs (expert_id);

alter table controle_n1 enable row level security;
alter table verificateurs enable row level security;

-- Fonctions d'accès
create or replace function public.est_verificateur(d uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from verificateurs v
    where v.dossier_id = d and v.expert_id = auth.uid() and v.statut <> 'conflit'
  )
$$;

-- Vérificateur pouvant encore écrire ses avis
create or replace function public.verification_ouverte(d uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from verificateurs v
    where v.dossier_id = d and v.expert_id = auth.uid() and v.statut = 'en_cours'
  )
$$;

-- L'expert voit un dossier : membre confirmé de sa session en évaluation, ou vérificateur
create or replace function public.expert_voit_dossier(d uuid) returns boolean
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
  ) or est_verificateur(d)
$$;

create or replace function public.est_rapporteur(d uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from rapporteurs r where r.dossier_id = d and r.expert_id = auth.uid())
      or verification_ouverte(d)
$$;

-- Règles d'accès
create policy "contrôle n1: équipe" on controle_n1 for all using (est_equipe()) with check (est_equipe());
create policy "contrôle n1: lecture vérificateur" on controle_n1 for select using (est_verificateur(dossier_id));

create policy "vérificateurs: équipe" on verificateurs for all using (est_equipe()) with check (est_equipe());
create policy "vérificateurs: l'expert voit les siennes" on verificateurs for select using (expert_id = auth.uid());

-- Avis des experts : lecture des siens à tout moment, écriture tant que la vérification est ouverte
drop policy if exists "avis: le rapporteur gère les siens" on avis_justificatifs;
create policy "avis: l'expert lit les siens" on avis_justificatifs for select using (expert_id = auth.uid());
create policy "avis: l'expert écrit" on avis_justificatifs for insert
  with check (expert_id = auth.uid() and est_rapporteur(dossier_id));
create policy "avis: l'expert modifie" on avis_justificatifs for update
  using (expert_id = auth.uid() and est_rapporteur(dossier_id))
  with check (expert_id = auth.uid() and est_rapporteur(dossier_id));
create policy "avis: l'expert retire" on avis_justificatifs for delete
  using (expert_id = auth.uid() and est_rapporteur(dossier_id));

-- L'expert termine sa vérification
create or replace function public.terminer_verification(d uuid, avis text, commentaire text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update verificateurs
     set statut = 'termine', avis_global = avis, commentaire = terminer_verification.commentaire, termine_le = now()
   where dossier_id = d and expert_id = auth.uid() and statut = 'en_cours';
  if not found then
    raise exception 'Vérification introuvable ou déjà terminée';
  end if;
  insert into journal (acteur, action, dossier_id, detail)
    values (auth.uid(), 'verification_terminee', d, jsonb_build_object('avis', avis));
end $$;

-- L'expert signale un conflit d'intérêts : il perd l'accès au dossier
create or replace function public.declarer_conflit_verification(d uuid, motif text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update verificateurs
     set statut = 'conflit', commentaire = motif, termine_le = now()
   where dossier_id = d and expert_id = auth.uid() and statut = 'en_cours';
  if not found then
    raise exception 'Vérification introuvable';
  end if;
  insert into journal (acteur, action, dossier_id, detail)
    values (auth.uid(), 'conflit_declare', d, jsonb_build_object('motif', motif));
end $$;

revoke all on function public.terminer_verification(uuid, text, text) from public;
revoke all on function public.declarer_conflit_verification(uuid, text) from public;
grant execute on function public.terminer_verification(uuid, text, text) to authenticated;
grant execute on function public.declarer_conflit_verification(uuid, text) to authenticated;

-- Journal automatique des changements de statut
create or replace function public.journal_statut() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.statut is distinct from old.statut then
    insert into journal (acteur, action, dossier_id, detail)
      values (auth.uid(), 'statut', new.id, jsonb_build_object('de', old.statut, 'vers', new.statut));
  end if;
  return new;
end $$;

create trigger dossiers_journal_statut after update of statut on dossiers
  for each row execute function public.journal_statut();
