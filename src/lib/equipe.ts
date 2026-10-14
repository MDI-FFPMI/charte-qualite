// Accès aux données du back-office (équipe) et de l'espace expert.
// Deux implémentations : Supabase (production) et démo (données d'exemple en mémoire).
import { sb, estDemo, type StatutDossier } from './api';
import type { Piece, Reponses } from './types';
import type { Niveau } from './composition';
import { dossiersDemo, expertsDemo, exempleReponses } from '../data/demo';

export type Avis = 'conforme' | 'non_conforme' | 'a_completer';
export type AvisGlobal = 'favorable' | 'reserve' | 'defavorable';
export type StatutVerif = 'en_cours' | 'termine' | 'conflit';

export interface Verif {
  expert_id: string;
  nom: string;
  statut: StatutVerif;
  avis_global?: AvisGlobal | null;
  commentaire?: string | null;
  attribue_le: string;
  termine_le?: string | null;
}

export interface DossierLigne {
  id: string;
  numero: string;
  statut: StatutDossier;
  envoye_le?: string | null;
  score_indicatif?: number | null;
  questions_rouvertes: string[];
  message_complements?: string | null;
  candidat: string;   // dénomination ou nom
  contact: string;    // prénom nom
  email: string;
  ville: string;
  principale: string;
  autres: string[];
  verificateurs: Verif[];
  charte_version?: string | null;
  charte_acceptee_le?: string | null;
  charte_phrase?: string | null;
}

export interface AvisLigne { avis: Avis; commentaire?: string | null }

export interface Fiche {
  dossier: DossierLigne;
  reponses: Reponses;
  pieces: Piece[];
  n1: Record<string, AvisLigne>;
  /** avis des vérificateurs, par expert puis par question (l'expert ne reçoit que les siens) */
  n2: Record<string, Record<string, AvisLigne>>;
}

export interface Expert {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  ville: string;
  specialites: { code: string; niveau: Niveau }[];
  titres: string[];
  statut: 'actif' | 'pause' | 'retire';
  max: number;
  conflits: string;
  dernierPassage: string | null;
  enCours: number;
  terminees: number;
}

export type NouvelExpert = Pick<Expert, 'email' | 'prenom' | 'nom' | 'ville' | 'specialites' | 'titres' | 'max'>;

export interface ApiEquipe {
  dossiers(): Promise<DossierLigne[]>;
  fiche(id: string): Promise<Fiche>;
  urlPiece(p: Piece): Promise<string>;
  controler(dossierId: string, code: string, avis: Avis | null, commentaire: string): Promise<void>;
  demanderComplements(dossierId: string, codes: string[], message: string): Promise<void>;
  declarerRecevable(dossierId: string): Promise<void>;
  validerPourCommission(dossierId: string): Promise<void>;
  attribuer(dossierId: string, expertIds: string[]): Promise<void>;
  retirerVerificateur(dossierId: string, expertId: string): Promise<void>;
  experts(): Promise<Expert[]>;
  /** emailEnvoye : un lien a été envoyé (compte créé à l'instant) ; false si le compte existait déjà */
  ajouterExpert(e: NouvelExpert): Promise<{ emailEnvoye: boolean }>;
  modifierExpert(id: string, e: Partial<Pick<Expert, 'prenom' | 'nom' | 'ville' | 'specialites' | 'titres' | 'max' | 'statut' | 'conflits'>>): Promise<void>;
  // Espace expert
  mesVerifications(): Promise<(DossierLigne & { moi: Verif })[]>;
  donnerAvis(dossierId: string, code: string, avis: Avis | null, commentaire: string): Promise<void>;
  terminer(dossierId: string, avis: AvisGlobal, commentaire: string): Promise<void>;
  conflit(dossierId: string, motif: string): Promise<void>;
}

const nomComplet = (p?: { prenom?: string | null; nom?: string | null; email?: string | null } | null) =>
  [p?.prenom, p?.nom].filter(Boolean).join(' ') || p?.email || '';

const verifier = (error: { message: string } | null, msg?: string) => {
  if (error) throw new Error(msg ? `${msg} (${error.message})` : error.message);
};

// ---------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------
type LigneDossier = {
  id: string; numero: string; statut: StatutDossier; envoye_le: string | null; score_indicatif: number | null;
  questions_rouvertes: string[]; message_complements: string | null;
  charte_version?: string | null; charte_acceptee_le?: string | null; charte_phrase?: string | null;
  profiles: { email: string; prenom: string | null; nom: string | null } | null;
};
type LigneVerif = Omit<Verif, 'nom'> & { dossier_id: string };
const CHAMPS_DOSSIER = 'id,numero,statut,envoye_le,score_indicatif,questions_rouvertes,message_complements,charte_version,charte_acceptee_le,charte_phrase,profiles(email,prenom,nom)';

function apiEquipeSupabase(): ApiEquipe {
  const c = sb!;

  /** Assemble les lignes de dossiers avec identité, spécialités et vérificateurs */
  async function assembler(lignes: LigneDossier[], verifs: LigneVerif[], noms: Record<string, string>): Promise<DossierLigne[]> {
    const ids = lignes.map((d) => d.id);
    const infos: Record<string, Record<string, unknown>> = {};
    if (ids.length) {
      const { data } = await c.from('reponses').select('dossier_id,question_code,valeur')
        .in('dossier_id', ids).in('question_code', ['0.1', '0.2', '2.2']);
      for (const r of data ?? []) (infos[r.dossier_id] ??= {})[r.question_code] = r.valeur;
    }
    return lignes.map((d) => {
      const i = infos[d.id] ?? {};
      const ent = (i['0.2'] ?? {}) as Record<string, string>;
      const vous = (i['0.1'] ?? {}) as Record<string, string>;
      const spe = (i['2.2'] ?? {}) as { choisies?: string[]; principale?: string };
      const principale = spe.principale ?? spe.choisies?.[0] ?? '';
      return {
        id: d.id, numero: d.numero, statut: d.statut, envoye_le: d.envoye_le, score_indicatif: d.score_indicatif,
        questions_rouvertes: d.questions_rouvertes ?? [], message_complements: d.message_complements,
        charte_version: d.charte_version, charte_acceptee_le: d.charte_acceptee_le, charte_phrase: d.charte_phrase,
        candidat: ent.nom_commercial || ent.denomination || nomComplet(vous) || nomComplet(d.profiles) || d.profiles?.email || '',
        contact: nomComplet(vous) || nomComplet(d.profiles),
        email: d.profiles?.email ?? '',
        ville: ent.ville ?? '',
        principale,
        autres: (spe.choisies ?? []).filter((x) => x !== principale),
        verificateurs: verifs.filter((v) => v.dossier_id === d.id).map((v) => ({ ...v, nom: noms[v.expert_id] ?? 'Expert' })),
      };
    });
  }

  async function nomsExperts(): Promise<Record<string, string>> {
    const { data } = await c.from('experts').select('id,profiles(email,prenom,nom)');
    return Object.fromEntries((data ?? []).map((e) => [e.id, nomComplet(e.profiles as unknown as LigneDossier['profiles'])]));
  }

  async function reponsesEtPieces(id: string) {
    const [{ data: rep }, { data: pie }] = await Promise.all([
      c.from('reponses').select('question_code,valeur,complements,justification').eq('dossier_id', id),
      c.from('pieces').select('id,question_code,nom_fichier,taille,storage_path').eq('dossier_id', id),
    ]);
    const reponses: Reponses = {};
    for (const r of rep ?? []) reponses[r.question_code] = { valeur: r.valeur, complements: r.complements, justification: r.justification };
    return { reponses, pieces: (pie ?? []) as Piece[] };
  }

  const majStatut = async (id: string, champs: Record<string, unknown>) => {
    const { error } = await c.from('dossiers').update(champs).eq('id', id);
    verifier(error, 'Mise à jour du dossier impossible');
  };

  return {
    async dossiers() {
      const [{ data, error }, { data: v }, noms] = await Promise.all([
        c.from('dossiers').select(CHAMPS_DOSSIER).order('envoye_le', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }),
        c.from('verificateurs').select('dossier_id,expert_id,statut,avis_global,commentaire,attribue_le,termine_le'),
        nomsExperts(),
      ]);
      verifier(error);
      return assembler((data ?? []) as unknown as LigneDossier[], (v ?? []) as LigneVerif[], noms);
    },

    async fiche(id) {
      const [{ data, error }, { data: v }, noms, rp, { data: n1 }, { data: n2 }] = await Promise.all([
        c.from('dossiers').select(CHAMPS_DOSSIER).eq('id', id).single(),
        c.from('verificateurs').select('dossier_id,expert_id,statut,avis_global,commentaire,attribue_le,termine_le').eq('dossier_id', id),
        nomsExperts(),
        reponsesEtPieces(id),
        c.from('controle_n1').select('question_code,avis,commentaire').eq('dossier_id', id),
        c.from('avis_justificatifs').select('expert_id,question_code,avis,commentaire').eq('dossier_id', id),
      ]);
      verifier(error, 'Dossier introuvable');
      const [dossier] = await assembler([data as unknown as LigneDossier], (v ?? []) as LigneVerif[], noms);
      const parExpert: Fiche['n2'] = {};
      for (const a of n2 ?? []) (parExpert[a.expert_id] ??= {})[a.question_code] = { avis: a.avis, commentaire: a.commentaire };
      return {
        dossier, ...rp,
        n1: Object.fromEntries((n1 ?? []).map((a) => [a.question_code, { avis: a.avis, commentaire: a.commentaire }])),
        n2: parExpert,
      };
    },

    async urlPiece(p) {
      const { data, error } = await c.storage.from('pieces').createSignedUrl(p.storage_path!, 600);
      verifier(error, 'Pièce inaccessible');
      return data!.signedUrl;
    },

    async controler(dossierId, code, avis, commentaire) {
      if (!avis) {
        const { error } = await c.from('controle_n1').delete().eq('dossier_id', dossierId).eq('question_code', code);
        return verifier(error);
      }
      const { error } = await c.from('controle_n1').upsert({
        dossier_id: dossierId, question_code: code, avis, commentaire: commentaire || null, updated_at: new Date().toISOString(),
      });
      verifier(error, "L'avis n'a pas été enregistré");
    },

    async demanderComplements(id, codes, message) {
      await majStatut(id, { statut: 'complements', questions_rouvertes: codes, message_complements: message });
    },

    async declarerRecevable(id) {
      await majStatut(id, { statut: 'verification', questions_rouvertes: [] });
      // Retour après compléments : les vérificateurs déjà attribués revérifient
      const { error } = await c.from('verificateurs').update({ statut: 'en_cours', termine_le: null })
        .eq('dossier_id', id).eq('statut', 'termine');
      verifier(error);
    },

    async validerPourCommission(id) { await majStatut(id, { statut: 'attente_commission' }); },

    async attribuer(dossierId, expertIds) {
      if (!expertIds.length) return;
      const { error } = await c.from('verificateurs').upsert(
        expertIds.map((expert_id) => ({ dossier_id: dossierId, expert_id, statut: 'en_cours', attribue_le: new Date().toISOString() })),
      );
      verifier(error, "L'attribution a échoué");
    },

    async retirerVerificateur(dossierId, expertId) {
      const { error } = await c.from('verificateurs').delete().eq('dossier_id', dossierId).eq('expert_id', expertId);
      verifier(error);
    },

    async experts() {
      const [{ data, error }, { data: v }] = await Promise.all([
        c.from('experts').select('id,ville,specialites,titres,max_dossiers_rapportes,conflits,statut,dernier_passage,profiles(email,prenom,nom)'),
        c.from('verificateurs').select('expert_id,statut'),
      ]);
      verifier(error);
      return (data ?? []).map((e) => {
        const p = e.profiles as unknown as LigneDossier['profiles'];
        const mes = (v ?? []).filter((x) => x.expert_id === e.id);
        return {
          id: e.id, email: p?.email ?? '', prenom: p?.prenom ?? '', nom: p?.nom ?? '', ville: e.ville ?? '',
          specialites: e.specialites ?? [], titres: e.titres ?? [], statut: e.statut, max: e.max_dossiers_rapportes,
          conflits: e.conflits ?? '', dernierPassage: e.dernier_passage,
          enCours: mes.filter((x) => x.statut === 'en_cours').length,
          terminees: mes.filter((x) => x.statut === 'termine').length,
        };
      }).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    },

    async ajouterExpert(e) {
      const email = e.email.trim().toLowerCase();
      let { data: p } = await c.from('profiles').select('id,role').eq('email', email).maybeSingle();
      let emailEnvoye = false;
      if (!p) {
        // Pas encore de compte : création et envoi d'un lien de connexion
        const { error: errLien } = await c.auth.signInWithOtp({
          email, options: { shouldCreateUser: true, emailRedirectTo: `${location.origin}/mot-de-passe` },
        });
        ({ data: p } = await c.from('profiles').select('id,role').eq('email', email).maybeSingle());
        if (!p) {
          throw new Error("Le compte de cet expert n'existe pas encore et n'a pas pu être créé automatiquement"
            + `${errLien ? ` (${errLien.message})` : ''}. Créez-le dans Supabase : Authentication, Users, Add user, `
            + 'avec un mot de passe provisoire et « Auto Confirm User » coché. Puis réessayez ici.');
        }
        emailEnvoye = !errLien;
      }
      const role = p.role === 'admin' || p.role === 'gestionnaire' ? p.role : 'expert';
      const { error: e1 } = await c.from('profiles').update({ role, prenom: e.prenom, nom: e.nom }).eq('id', p.id);
      verifier(e1, 'Seule une administratrice peut nommer un expert');
      const { error: e2 } = await c.from('experts').upsert({
        id: p.id, ville: e.ville, specialites: e.specialites, titres: e.titres, max_dossiers_rapportes: e.max, statut: 'actif',
      });
      verifier(e2);
      return { emailEnvoye };
    },

    async modifierExpert(id, e) {
      const { prenom, nom, max, ...reste } = e;
      if (prenom !== undefined || nom !== undefined) {
        const { error } = await c.from('profiles').update({ prenom, nom }).eq('id', id);
        verifier(error);
      }
      const champs: Record<string, unknown> = { ...reste };
      if (max !== undefined) champs.max_dossiers_rapportes = max;
      if (Object.keys(champs).length) {
        const { error } = await c.from('experts').update(champs).eq('id', id);
        verifier(error);
      }
    },

    async mesVerifications() {
      const { data: u } = await c.auth.getUser();
      const { data: v } = await c.from('verificateurs')
        .select('dossier_id,expert_id,statut,avis_global,commentaire,attribue_le,termine_le').eq('expert_id', u.user?.id ?? '');
      const actives = (v ?? []).filter((x) => x.statut !== 'conflit') as LigneVerif[];
      if (!actives.length) return [];
      const { data } = await c.from('dossiers').select('id,numero,statut,envoye_le,score_indicatif,questions_rouvertes,message_complements')
        .in('id', actives.map((x) => x.dossier_id));
      const lignes = await assembler((data ?? []).map((d) => ({ ...d, profiles: null })) as LigneDossier[], actives, {});
      return lignes.map((d) => ({ ...d, moi: { ...actives.find((x) => x.dossier_id === d.id)!, nom: '' } }));
    },

    async donnerAvis(dossierId, code, avis, commentaire) {
      const { data: u } = await c.auth.getUser();
      const expert_id = u.user!.id;
      if (!avis) {
        const { error } = await c.from('avis_justificatifs').delete().eq('dossier_id', dossierId).eq('question_code', code).eq('expert_id', expert_id);
        return verifier(error);
      }
      const { error } = await c.from('avis_justificatifs').upsert({
        dossier_id: dossierId, question_code: code, expert_id, avis, commentaire: commentaire || null, updated_at: new Date().toISOString(),
      });
      verifier(error, "L'avis n'a pas été enregistré");
    },

    async terminer(dossierId, avis, commentaire) {
      const { error } = await c.rpc('terminer_verification', { d: dossierId, avis, commentaire });
      verifier(error);
    },

    async conflit(dossierId, motif) {
      const { error } = await c.rpc('declarer_conflit_verification', { d: dossierId, motif });
      verifier(error);
    },
  };
}

// ---------------------------------------------------------------------
// Démo : données d'exemple en mémoire
// ---------------------------------------------------------------------
function apiEquipeDemo(): ApiEquipe {
  const MOI = 'e1';
  const statutDemo = (s: string): StatutDossier => (s === 'attente_commission' ? 'verification' : s as StatutDossier);
  const verifs: (Verif & { dossier_id: string })[] = [
    { dossier_id: 'PPF-2026-0012', expert_id: 'e1', nom: '', statut: 'en_cours', attribue_le: '2026-09-05' },
    { dossier_id: 'PPF-2026-0012', expert_id: 'e9', nom: '', statut: 'termine', avis_global: 'favorable', attribue_le: '2026-09-05', termine_le: '2026-09-20' },
    { dossier_id: 'PPF-2026-0019', expert_id: 'e1', nom: '', statut: 'termine', avis_global: 'reserve', commentaire: 'CGV à mettre à jour', attribue_le: '2026-09-12', termine_le: '2026-09-30' },
    { dossier_id: 'PPF-2026-0019', expert_id: 'e4', nom: '', statut: 'termine', avis_global: 'favorable', attribue_le: '2026-09-12', termine_le: '2026-10-02' },
  ];
  const experts: Expert[] = expertsDemo.map((e) => {
    const [prenom, ...nom] = e.nom.split(' ');
    return {
      id: e.id, email: `${prenom.toLowerCase()}@exemple.fr`, prenom, nom: nom.join(' '), ville: e.ville, specialites: e.specialites,
      titres: e.titres, statut: e.disponible ? 'actif' : 'pause', max: 15, conflits: '', dernierPassage: e.dernierPassage, enCours: 0, terminees: 0,
    };
  });
  const dossiers = dossiersDemo.map((d) => ({ ...d, statut: statutDemo(d.statut), questions_rouvertes: [] as string[], message_complements: null as string | null }));
  const n1: Record<string, Record<string, AvisLigne>> = {};
  const n2: Record<string, Fiche['n2']> = {};
  const nomDe = (id: string) => { const e = experts.find((x) => x.id === id); return e ? `${e.prenom} ${e.nom}` : id; };
  const ligne = (d: (typeof dossiers)[number]): DossierLigne => ({
    id: d.id, numero: d.numero, statut: d.statut, envoye_le: d.recu, score_indicatif: d.score || null,
    questions_rouvertes: d.questions_rouvertes, message_complements: d.message_complements,
    charte_version: d.statut === 'brouillon' ? null : '2026-10', charte_acceptee_le: d.statut === 'brouillon' ? null : d.recu,
    candidat: d.candidat, contact: 'Camille Exemple', email: 'exemple@studio-photo.fr', ville: d.ville,
    principale: d.principale, autres: d.autres,
    verificateurs: verifs.filter((v) => v.dossier_id === d.id).map((v) => ({ ...v, nom: nomDe(v.expert_id) })),
  });
  const trouver = (id: string) => dossiers.find((d) => d.id === id)!;
  const pieces: Piece[] = [
    { id: 'p1', question_code: '1.3', nom_fichier: 'Extrait-RNE-septembre-2026.pdf', taille: 184_220 },
    { id: 'p2', question_code: '1.5', nom_fichier: 'Attestation-RC-Pro-2026.pdf', taille: 96_410 },
  ];
  return {
    async dossiers() { return dossiers.map(ligne); },
    async fiche(id) {
      const d = ligne(trouver(id));
      return { dossier: d, reponses: exempleReponses, pieces, n1: n1[id] ?? {}, n2: n2[id] ?? {} };
    },
    async urlPiece() { return 'data:text/plain;charset=utf-8,Pi%C3%A8ce%20d%27exemple'; },
    async controler(id, code, avis, commentaire) {
      const m = (n1[id] ??= {});
      if (avis) m[code] = { avis, commentaire }; else delete m[code];
    },
    async demanderComplements(id, codes, message) { Object.assign(trouver(id), { statut: 'complements', questions_rouvertes: codes, message_complements: message }); },
    async declarerRecevable(id) {
      Object.assign(trouver(id), { statut: 'verification', questions_rouvertes: [] });
      for (const v of verifs) if (v.dossier_id === id && v.statut === 'termine') Object.assign(v, { statut: 'en_cours', termine_le: null });
    },
    async validerPourCommission(id) { trouver(id).statut = 'attente_commission'; },
    async attribuer(id, ids) {
      for (const e of ids) if (!verifs.some((v) => v.dossier_id === id && v.expert_id === e))
        verifs.push({ dossier_id: id, expert_id: e, nom: '', statut: 'en_cours', attribue_le: new Date().toISOString() });
    },
    async retirerVerificateur(id, e) { const i = verifs.findIndex((v) => v.dossier_id === id && v.expert_id === e); if (i >= 0) verifs.splice(i, 1); },
    async experts() {
      return experts.map((e) => ({
        ...e,
        enCours: verifs.filter((v) => v.expert_id === e.id && v.statut === 'en_cours').length,
        terminees: verifs.filter((v) => v.expert_id === e.id && v.statut === 'termine').length,
      }));
    },
    async ajouterExpert(e) {
      experts.push({ ...e, id: `e${experts.length + 1}`, statut: 'actif', conflits: '', dernierPassage: null, enCours: 0, terminees: 0 });
      return { emailEnvoye: true };
    },
    async modifierExpert(id, e) { Object.assign(experts.find((x) => x.id === id)!, e); },
    async mesVerifications() {
      return verifs.filter((v) => v.expert_id === MOI && v.statut !== 'conflit')
        .map((v) => ({ ...ligne(trouver(v.dossier_id)), moi: { ...v, nom: '' } }));
    },
    async donnerAvis(id, code, avis, commentaire) {
      const m = ((n2[id] ??= {})[MOI] ??= {});
      if (avis) m[code] = { avis, commentaire }; else delete m[code];
    },
    async terminer(id, avis, commentaire) {
      Object.assign(verifs.find((v) => v.dossier_id === id && v.expert_id === MOI)!, { statut: 'termine', avis_global: avis, commentaire, termine_le: new Date().toISOString() });
    },
    async conflit(id, motif) {
      Object.assign(verifs.find((v) => v.dossier_id === id && v.expert_id === MOI)!, { statut: 'conflit', commentaire: motif });
    },
  };
}

export const equipe: ApiEquipe = estDemo ? apiEquipeDemo() : apiEquipeSupabase();
