// Annuaire public des titulaires : lecture publique (carte, fiches) et fiche du photographe.
import { sb, estDemo } from './api';

export interface Fiche {
  id: string;
  slug: string;
  publie: boolean;
  consentement_le?: string | null;
  nom_affiche: string;
  entreprise: string;
  ville: string;
  code_postal: string;
  departement: string;
  lat: number | null;
  lng: number | null;
  specialites: string[];
  principales: string[];
  presentation: string;
  site: string;
  instagram: string;
  telephone: string;
  email_contact: string;
  photo_path: string | null;
  photo_url?: string | null;
  logo_path: string | null;
  logo_url?: string | null;
  fin_validite?: string | null;
}

export type FicheSaisie = Omit<Fiche, 'id' | 'slug' | 'photo_url' | 'logo_url' | 'fin_validite' | 'lat' | 'lng' | 'departement'>;

export interface ApiAnnuaire {
  titulaires(): Promise<Fiche[]>;
  parSlug(slug: string): Promise<Fiche | null>;
  maFiche(): Promise<Fiche | null>;
  enregistrer(f: FicheSaisie): Promise<Fiche>;
  deposerPhoto(f: File): Promise<string>;
  deposerLogo(f: File): Promise<string>;
}

const vide = (f: Partial<Fiche>): Fiche => ({
  id: '', slug: '', publie: false, nom_affiche: '', entreprise: '', ville: '', code_postal: '', departement: '',
  lat: null, lng: null, specialites: [], principales: [], presentation: '', site: '', instagram: '', telephone: '',
  email_contact: '', photo_path: null, logo_path: null, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v != null)),
});

export const slugifier = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

/** Coordonnées d'une commune française (Géoplateforme de l'IGN, puis Base Adresse Nationale en secours) */
export async function geolocaliser(cp: string, ville: string): Promise<{ lat: number; lng: number; departement: string } | null> {
  const q = encodeURIComponent(`${cp} ${ville}`.trim());
  const sources = [
    `https://data.geopf.fr/geocodage/search?q=${q}&type=municipality&limit=1`,
    `https://api-adresse.data.gouv.fr/search/?q=${q}&type=municipality&limit=1`,
  ];
  for (const url of sources) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const j = await r.json();
      const f = j.features?.[0];
      if (!f) continue;
      const [lng, lat] = f.geometry.coordinates as [number, number];
      const contexte = String(f.properties?.context ?? '');
      return { lat, lng, departement: contexte.split(',').slice(0, 2).map((s: string) => s.trim()).join(' - ') };
    } catch { /* source suivante */ }
  }
  return null;
}

// ---------------------------------------------------------------------
function apiSupabase(): ApiAnnuaire {
  const c = sb!;
  const urlPublique = (chemin: string | null) => (chemin ? c.storage.from('annuaire').getPublicUrl(chemin).data.publicUrl : null);
  const avecPhoto = (f: Fiche): Fiche => ({ ...vide(f), photo_url: urlPublique(f.photo_path), logo_url: urlPublique(f.logo_path) });
  const deposer = async (fichier: File, nom: 'portrait' | 'logo') => {
    const { data: u } = await c.auth.getUser();
    const ext = fichier.type === 'image/png' ? 'png' : fichier.type === 'image/webp' ? 'webp' : 'jpg';
    const chemin = `${u.user!.id}/${nom}-${Date.now()}.${ext}`;
    const { error } = await c.storage.from('annuaire').upload(chemin, fichier, { contentType: fichier.type, upsert: true });
    if (error) throw new Error(`${nom === 'logo' ? 'Logo refusé' : 'Photo refusée'} : JPG, PNG ou WebP, 5 Mo maximum.`);
    return chemin;
  };
  return {
    async titulaires() {
      const { data, error } = await c.from('fiches_annuaire').select('*,fin_validite')
        .eq('publie', true).not('consentement_le', 'is', null).order('nom_affiche');
      if (error) throw new Error(error.message);
      return (data ?? []).map((f) => avecPhoto(f as Fiche));
    },
    async parSlug(slug) {
      const { data } = await c.from('fiches_annuaire').select('*,fin_validite').eq('slug', slug).maybeSingle();
      return data ? avecPhoto(data as Fiche) : null;
    },
    async maFiche() {
      const { data: u } = await c.auth.getUser();
      if (!u.user) return null;
      const { data } = await c.from('fiches_annuaire').select('*,fin_validite').eq('id', u.user.id).maybeSingle();
      return data ? avecPhoto(data as Fiche) : null;
    },
    async enregistrer(f) {
      const { data: u } = await c.auth.getUser();
      const id = u.user!.id;
      const geo = f.ville ? await geolocaliser(f.code_postal, f.ville) : null;
      const ligne = {
        ...f, id,
        slug: `${slugifier(`${f.nom_affiche} ${f.ville}`)}-${id.slice(0, 4)}`,
        consentement_le: f.publie ? (f.consentement_le ?? new Date().toISOString()) : null,
        ...(geo ? { lat: geo.lat, lng: geo.lng, departement: geo.departement } : {}),
      };
      const { data, error } = await c.from('fiches_annuaire').upsert(ligne).select('*,fin_validite').single();
      if (error) throw new Error(`Enregistrement impossible : ${error.message}`);
      return avecPhoto(data as Fiche);
    },
    deposerPhoto: (fichier) => deposer(fichier, 'portrait'),
    deposerLogo: (fichier) => deposer(fichier, 'logo'),
  };
}

// ---------------------------------------------------------------------
// Démo : titulaires fictifs
const D = (nom: string, entreprise: string, ville: string, cp: string, lat: number, lng: number, principales: string[], autres: string[], presentation: string): Fiche => vide({
  id: slugifier(nom), slug: slugifier(`${nom} ${ville}`), publie: true, consentement_le: '2026-09-01', nom_affiche: nom, entreprise, ville,
  code_postal: cp, lat, lng, principales, specialites: [...principales, ...autres], presentation,
  site: `https://${slugifier(entreprise)}.fr`, instagram: `@${slugifier(entreprise).replace(/-/g, '')}`, fin_validite: '2028-10-31',
});
const exemples: Fiche[] = [
  D('Camille Exemple', 'Studio Lumière de Lune', 'Nantes', '44000', 47.218, -1.553, ['nouveau-ne', 'grossesse'], ['famille'], 'Photographe de naissance et de maternité depuis 2014, dans un studio chauffé et pensé pour les tout-petits. Formée à la sécurité du nouveau-né.'),
  D('Hugo Exemple', 'Atelier Grain d\'Argent', 'Lyon', '69002', 45.757, 4.832, ['mariage', 'portrait'], [], 'Reportage de mariage au naturel et portrait en lumière douce. Je vous accompagne de la préparation au dernier pas de danse.'),
  D('Inès Exemple', 'Photographies du Vieux Port', 'Marseille', '13002', 43.297, 5.370, ['corporate', 'evenementiel'], ['portrait'], 'Portraits d\'équipe, événements d\'entreprise et images pour vos supports de communication.'),
  D('Louis Exemple', 'Petits Petons Studio', 'Lille', '59000', 50.629, 3.057, ['nouveau-ne', 'famille', 'enfants'], ['grossesse'], 'Studio familial au cœur de Lille : nouveau-nés, enfants et familles, en séance douce et sans pression.'),
  D('Margaux Exemple', 'Regard Boréal', 'Rennes', '35000', 48.117, -1.678, ['portrait'], ['corporate'], 'Portrait d\'auteur et portrait professionnel, en studio ou en lumière naturelle.'),
  D('Nina Exemple', 'Maison Blanc Studio', 'Bordeaux', '33000', 44.837, -0.579, ['famille', 'enfants'], [], 'Séances en famille à domicile ou en extérieur, pour garder une trace vraie de vos moments.'),
  D('Paul Exemple', 'Aqua Bébé Images', 'Toulouse', '31000', 43.604, 1.444, ['aquatique', 'nouveau-ne'], [], 'Photographie aquatique de bébés et d\'enfants, en bassin chauffé, avec un maître-nageur.'),
  D('Sarah Exemple', 'Les Ateliers de Clémence', 'Tours', '37000', 47.394, 0.684, ['mariage', 'famille'], [], 'Mariages et familles en Touraine, avec une attention particulière aux détails et aux émotions.'),
];

function apiDemo(): ApiAnnuaire {
  let mienne: Fiche | null = null;
  return {
    async titulaires() { return exemples; },
    async parSlug(slug) { return exemples.find((f) => f.slug === slug) ?? (mienne?.slug === slug ? mienne : null); },
    async maFiche() { return mienne; },
    async enregistrer(f) {
      mienne = vide({ ...f, id: 'demo', slug: slugifier(`${f.nom_affiche} ${f.ville}`), consentement_le: f.publie ? new Date().toISOString() : null, photo_url: f.photo_path, logo_url: f.logo_path });
      return mienne;
    },
    async deposerPhoto(f) { return URL.createObjectURL(f); },
    async deposerLogo(f) { return URL.createObjectURL(f); },
  };
}

export const annuaire: ApiAnnuaire = estDemo ? apiDemo() : apiSupabase();
