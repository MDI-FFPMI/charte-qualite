// Accès aux données. Deux implémentations derrière la même interface :
//  - Supabase (production)
//  - Démo (aucun serveur, données d'exemple gardées dans le navigateur)
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Piece, Reponse, Reponses } from './types';
import { exempleReponses } from '../data/demo';

export type Role = 'candidat' | 'expert' | 'gestionnaire' | 'admin';
export type StatutDossier =
  | 'brouillon' | 'envoye' | 'complements' | 'verification' | 'attente_commission' | 'evaluation'
  | 'deliberation' | 'accorde' | 'refuse' | 'suspendu' | 'retire';

export interface Utilisateur { id: string; email: string; prenom?: string | null; nom?: string | null; role: Role }

export interface Dossier {
  id: string;
  numero: string;
  statut: StatutDossier;
  questions_rouvertes: string[];
  message_complements?: string | null;
  envoye_le?: string | null;
  valide_jusqu_au?: string | null;
  charte_version?: string | null;
  charte_acceptee_le?: string | null;
}

export interface Api {
  demo: boolean;
  utilisateur(): Promise<Utilisateur | null>;
  /** creerCompte : inscription sans paiement (phase de test) */
  envoyerLien(email: string, creerCompte?: boolean): Promise<void>;
  /** Connexion par mot de passe */
  connexion(email: string, motDePasse: string): Promise<void>;
  /** Création de compte candidat avec mot de passe (inscription libre) */
  inscription(email: string, motDePasse: string): Promise<{ aConfirmer: boolean }>;
  /** Connexion ou création de compte avec Google */
  connexionGoogle(): Promise<void>;
  /** Email de réinitialisation du mot de passe */
  motDePasseOublie(email: string): Promise<void>;
  /** Nouveau mot de passe pour l'utilisateur connecté */
  changerMotDePasse(motDePasse: string): Promise<void>;
  deconnexion(): Promise<void>;
  /** Prévient l'application quand la connexion change (retour par le lien email, déconnexion) */
  surChangement(cb: () => void): () => void;
  monDossier(): Promise<Dossier | null>;
  reponses(dossierId: string): Promise<Reponses>;
  enregistrer(dossierId: string, code: string, r: Reponse): Promise<void>;
  pieces(dossierId: string): Promise<Piece[]>;
  deposer(dossierId: string, code: string, fichier: File): Promise<Piece>;
  supprimerPiece(piece: Piece): Promise<void>;
  /** charte : version de la charte de déontologie acceptée ; phrase : engagement recopié par le candidat */
  envoyerDossier(dossierId: string, score: number, charte: string, phrase: string): Promise<void>;
  /** Démo seulement : changer d'espace pour visiter */
  changerRole?(role: Role): void;
}

// ---------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------
function apiSupabase(sb: SupabaseClient): Api {
  return {
    demo: false,
    async utilisateur() {
      const { data } = await sb.auth.getUser();
      if (!data.user) return null;
      const { data: p } = await sb.from('profiles').select('id,email,prenom,nom,role').eq('id', data.user.id).single();
      return p as Utilisateur;
    },
    async envoyerLien(email, creerCompte = false) {
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: creerCompte, emailRedirectTo: `${location.origin}/connexion` },
      });
      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes('signup') || m.includes('not found') || m.includes('not allowed'))
          throw new Error("Aucun compte n'est associé à cette adresse. Utilisez l'email saisi lors du paiement.");
        if (m.includes('rate limit') || error.status === 429)
          throw new Error("Trop de demandes de lien en peu de temps. Patientez quelques minutes avant de réessayer.");
        throw new Error(`La demande de lien a échoué : ${error.message}`);
      }
    },
    async connexion(email, motDePasse) {
      const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: motDePasse });
      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes('invalid')) throw new Error('Email ou mot de passe incorrect.');
        if (m.includes('not confirmed')) throw new Error("Votre adresse n'est pas encore confirmée : cliquez sur le lien reçu par email.");
        throw new Error(`Connexion impossible : ${error.message}`);
      }
    },
    async inscription(email, motDePasse) {
      const { data, error } = await sb.auth.signUp({
        email: email.trim().toLowerCase(), password: motDePasse,
        options: { emailRedirectTo: `${location.origin}/connexion` },
      });
      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes('already') || m.includes('registered')) throw new Error('Un compte existe déjà avec cette adresse. Connectez-vous avec votre mot de passe, ou utilisez « Mot de passe oublié ».');
        if (m.includes('password')) throw new Error('Mot de passe trop faible : 8 caractères au moins, avec lettres et chiffres.');
        throw new Error(`Création du compte impossible : ${error.message}`);
      }
      // Compte déjà existant (Supabase ne le signale pas pour ne pas révéler les adresses)
      if (data.user && !data.session && (data.user.identities ?? []).length === 0)
        throw new Error('Un compte existe déjà avec cette adresse. Connectez-vous avec votre mot de passe, ou utilisez « Mot de passe oublié ».');
      return { aConfirmer: !data.session };
    },
    async connexionGoogle() {
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${location.origin}/connexion`, queryParams: { prompt: 'select_account' } },
      });
      if (error) {
        if (error.message.toLowerCase().includes('not enabled')) throw new Error("La connexion avec Google n'est pas encore activée.");
        throw new Error(`Connexion Google impossible : ${error.message}`);
      }
    },
    async motDePasseOublie(email) {
      const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${location.origin}/mot-de-passe` });
      if (error) {
        if (error.status === 429 || error.message.toLowerCase().includes('rate limit'))
          throw new Error('Trop de demandes en peu de temps. Patientez quelques minutes avant de réessayer.');
        throw new Error(`Envoi impossible : ${error.message}`);
      }
    },
    async changerMotDePasse(motDePasse) {
      const { error } = await sb.auth.updateUser({ password: motDePasse });
      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes('same')) throw new Error("Choisissez un mot de passe différent de l'ancien.");
        if (m.includes('password')) throw new Error('Mot de passe trop faible : 8 caractères au moins, avec lettres et chiffres.');
        throw new Error(error.message);
      }
    },
    async deconnexion() { await sb.auth.signOut(); },
    surChangement(cb) {
      const { data } = sb.auth.onAuthStateChange(() => { setTimeout(cb, 0); });
      return () => data.subscription.unsubscribe();
    },
    async monDossier() {
      const lireDossier = async () => {
        const { data } = await sb.from('dossiers')
          .select('id,numero,statut,questions_rouvertes,message_complements,envoye_le,valide_jusqu_au')
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
        return data as Dossier | null;
      };
      const d = await lireDossier();
      if (d) return d;
      // Phase de test : ouverture d'un dossier sans paiement si l'inscription libre est active
      const { error } = await sb.rpc('ouvrir_mon_dossier');
      return error ? null : lireDossier();
    },
    async reponses(dossierId) {
      const { data } = await sb.from('reponses').select('question_code,valeur,complements,justification').eq('dossier_id', dossierId);
      const out: Reponses = {};
      for (const r of data ?? []) out[r.question_code] = { valeur: r.valeur, complements: r.complements, justification: r.justification };
      return out;
    },
    async enregistrer(dossierId, code, r) {
      const { error } = await sb.from('reponses').upsert({
        dossier_id: dossierId, question_code: code, valeur: r.valeur,
        complements: r.complements ?? {}, justification: r.justification ?? null, updated_at: new Date().toISOString(),
      });
      if (error) throw new Error("L'enregistrement a échoué. Vérifiez votre connexion, votre saisie est conservée sur cette page.");
    },
    async pieces(dossierId) {
      const { data } = await sb.from('pieces').select('id,question_code,nom_fichier,taille,storage_path').eq('dossier_id', dossierId);
      return (data ?? []) as Piece[];
    },
    async deposer(dossierId, code, fichier) {
      const propre = fichier.name.normalize('NFD').replace(/[^\w.-]+/g, '_');
      const chemin = `${dossierId}/${code}/${crypto.randomUUID()}-${propre}`;
      const up = await sb.storage.from('pieces').upload(chemin, fichier, { contentType: fichier.type });
      if (up.error) throw new Error('Fichier refusé. Formats acceptés : PDF, JPG, PNG, 10 Mo maximum.');
      const { data, error } = await sb.from('pieces').insert({
        dossier_id: dossierId, question_code: code, storage_path: chemin,
        nom_fichier: fichier.name, taille: fichier.size, mime: fichier.type,
      }).select('id,question_code,nom_fichier,taille,storage_path').single();
      if (error) throw new Error(error.message);
      return data as Piece;
    },
    async supprimerPiece(p) {
      if (p.storage_path) await sb.storage.from('pieces').remove([p.storage_path]);
      await sb.from('pieces').delete().eq('id', p.id);
    },
    async envoyerDossier(dossierId, score, charte, phrase) {
      const { error } = await sb.rpc('envoyer_dossier', { d: dossierId, score, charte, phrase });
      if (error) throw new Error(error.message);
    },
  };
}

// ---------------------------------------------------------------------
// Démo : stockage dans le navigateur, avec repli en mémoire
// ---------------------------------------------------------------------
const memoire: Record<string, string> = {};
const lire = <T,>(cle: string, defaut: T): T => {
  try {
    const v = localStorage.getItem(cle) ?? memoire[cle];
    return (v ? (JSON.parse(v) as T | null) : null) ?? defaut;
  } catch { return (memoire[cle] ? (JSON.parse(memoire[cle]) as T | null) : null) ?? defaut; }
};
const ecrire = (cle: string, v: unknown) => {
  const s = JSON.stringify(v);
  memoire[cle] = s;
  try { localStorage.setItem(cle, s); } catch { /* stockage indisponible : mémoire seule */ }
};

function apiDemo(): Api {
  const K = 'ppf-demo-v1';
  type Etat = { connecte: boolean; role: Role; dossier: Dossier; reponses: Reponses; pieces: Piece[] };
  const initial: Etat = {
    connecte: false,
    role: 'candidat',
    dossier: { id: 'demo', numero: 'PPF-2026-0042', statut: 'brouillon', questions_rouvertes: [] },
    reponses: exempleReponses,
    pieces: [
      { id: 'p1', question_code: '1.3', nom_fichier: 'Extrait-RNE-septembre-2026.pdf', taille: 184_220 },
      { id: 'p2', question_code: '1.5', nom_fichier: 'Attestation-RC-Pro-2026.pdf', taille: 96_410 },
    ],
  };
  const etat = (): Etat => lire(K, initial);
  const maj = (f: (e: Etat) => void) => { const e = etat(); f(e); ecrire(K, e); };
  return {
    demo: true,
    async utilisateur() {
      const e = etat();
      if (!e.connecte) return null;
      const noms: Record<Role, [string, string]> = { candidat: ['Camille', 'Exemple'], expert: ['Hélène', 'Exemple'], admin: ['Administratrice', ''], gestionnaire: ['Gestionnaire', ''] };
      return { id: 'demo', email: 'exemple@studio-photo.fr', prenom: noms[e.role][0], nom: noms[e.role][1], role: e.role };
    },
    async envoyerLien() { maj((e) => { e.connecte = true; e.role = 'candidat'; }); },
    async connexion() { maj((e) => { e.connecte = true; e.role = 'candidat'; }); },
    async inscription() { maj((e) => { e.connecte = true; e.role = 'candidat'; }); return { aConfirmer: false }; },
    async motDePasseOublie() {},
    async connexionGoogle() { maj((e) => { e.connecte = true; e.role = 'candidat'; }); },
    async changerMotDePasse() {},
    async deconnexion() { maj((e) => { e.connecte = false; }); },
    surChangement() { return () => {}; },
    async monDossier() { return etat().dossier; },
    async reponses() { return etat().reponses; },
    async enregistrer(_d, code, r) { maj((e) => { e.reponses[code] = r; }); },
    async pieces() { return etat().pieces; },
    async deposer(_d, code, f) {
      const p: Piece = { id: Math.random().toString(36).slice(2), question_code: code, nom_fichier: f.name, taille: f.size };
      maj((e) => { e.pieces.push(p); });
      return p;
    },
    async supprimerPiece(p) { maj((e) => { e.pieces = e.pieces.filter((x) => x.id !== p.id); }); },
    async envoyerDossier(_d, _s, charte, _phrase) { maj((e) => { e.dossier.statut = 'envoye'; e.dossier.envoye_le = new Date().toISOString(); e.dossier.charte_version = charte; e.dossier.charte_acceptee_le = new Date().toISOString(); }); },
    changerRole(role) { maj((e) => { e.connecte = true; e.role = role; }); },
  };
}

export function reinitialiserDemo() { ecrire('ppf-demo-v1', null); try { localStorage.removeItem('ppf-demo-v1'); } catch { /* */ } }

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const estDemo = import.meta.env.VITE_DEMO === '1' || !url || !cle;
export const sb: SupabaseClient | null = estDemo ? null : createClient(url!, cle!);
export const api: Api = sb ? apiSupabase(sb) : apiDemo();
export const lienPaiement = (import.meta.env.VITE_STRIPE_PAYMENT_LINK as string | undefined) ?? '';

/** Lien de paiement Stripe rattaché au compte : l'email est prérempli et l'identifiant du compte
 *  revient dans la confirmation de paiement, ce qui permet d'ouvrir le bon dossier sans erreur possible. */
export function lienPaiementPour(u: { id: string; email: string }): string {
  if (!lienPaiement) return '';
  const url = new URL(lienPaiement);
  url.searchParams.set('client_reference_id', u.id);
  url.searchParams.set('prefilled_email', u.email);
  url.searchParams.set('locale', 'fr');
  return url.toString();
}
