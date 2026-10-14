// Données d'exemple pour l'aperçu. Personnes et studios fictifs.
import type { Reponses } from '../lib/types';
import type { DossierACompose, ExpertPool } from '../lib/composition';

export const exempleReponses: Reponses = {
  '1.1': { valeur: ['particuliers'] },
  '1.2': { valeur: 'principale' },
  '1.3': { valeur: 'oui' },
  '1.4': { valeur: 'oui', justification: '' },
  '1.5': { valeur: 'oui' },
  '1.6': { valeur: 'oui', justification: 'Mention en article 12 de mes CGV : médiateur CM2C' },
  '1.7': { valeur: 'oui' },
  '1.8': { valeur: 'non' },
  '2.1': { valeur: '2017' },
  '2.2': { valeur: { choisies: ['nouveau-ne', 'grossesse', 'famille'], principale: 'nouveau-ne' } },
};

export type StatutDemo = 'envoye' | 'attente_commission' | 'evaluation' | 'complements' | 'accorde' | 'refuse' | 'brouillon';

export interface DossierDemo extends DossierACompose {
  numero: string;
  candidat: string;
  ville: string;
  statut: StatutDemo;
  score: number;
  recu: string;
}

const d = (numero: string, candidat: string, ville: string, principale: string, autres: string[], statut: StatutDemo, score: number, recu: string): DossierDemo =>
  ({ id: numero, numero, candidat, ville, principale, autres, statut, score, recu });

export const dossiersDemo: DossierDemo[] = [
  d('PPF-2026-0012', 'Studio Lumière de Lune', 'Nantes', 'nouveau-ne', ['grossesse'], 'attente_commission', 104.2, '2026-09-02'),
  d('PPF-2026-0014', 'Atelier Grain d\'Argent', 'Lyon', 'mariage', ['portrait'], 'attente_commission', 98.6, '2026-09-04'),
  d('PPF-2026-0017', 'Photographies du Vieux Port', 'Marseille', 'corporate', ['evenementiel'], 'attente_commission', 111.0, '2026-09-08'),
  d('PPF-2026-0019', 'Petits Petons Studio', 'Lille', 'nouveau-ne', ['famille', 'grossesse'], 'attente_commission', 107.5, '2026-09-11'),
  d('PPF-2026-0021', 'Regard Boréal', 'Rennes', 'portrait', ['corporate'], 'attente_commission', 96.3, '2026-09-15'),
  d('PPF-2026-0023', 'Maison Blanc Studio', 'Bordeaux', 'famille', ['enfants'], 'attente_commission', 102.8, '2026-09-18'),
  d('PPF-2026-0026', 'Aqua Bébé Images', 'Toulouse', 'aquatique', ['nouveau-ne'], 'attente_commission', 99.1, '2026-09-22'),
  d('PPF-2026-0028', 'Les Ateliers de Clémence', 'Tours', 'mariage', ['famille'], 'attente_commission', 113.4, '2026-09-25'),
  d('PPF-2026-0031', 'Sillage Studio', 'Annecy', 'produit', ['culinaire'], 'attente_commission', 101.0, '2026-09-29'),
  d('PPF-2026-0033', 'Portraits de Garonne', 'Agen', 'portrait', ['identite'], 'envoye', 94.0, '2026-10-03'),
  d('PPF-2026-0035', 'Studio Ourson', 'Metz', 'nouveau-ne', ['enfants'], 'complements', 88.7, '2026-10-06'),
  d('PPF-2026-0038', 'Côté Jardin Photo', 'Angers', 'mariage', [], 'envoye', 0, '2026-10-09'),
];

export const expertsDemo: ExpertPool[] = [
  { id: 'e1', nom: 'Hélène Exemple', ville: 'Paris', specialites: [{ code: 'nouveau-ne', niveau: 'referent' }, { code: 'grossesse', niveau: 'referent' }, { code: 'famille', niveau: 'competent' }], titres: ['Portraitiste de France'], disponible: true, dernierPassage: '2026-06-10', conflits: [] },
  { id: 'e2', nom: 'Marc Exemple', ville: 'Lyon', specialites: [{ code: 'mariage', niveau: 'referent' }, { code: 'evenementiel', niveau: 'competent' }], titres: ['Maître artisan'], disponible: true, dernierPassage: '2026-08-12', conflits: ['PPF-2026-0014'] },
  { id: 'e3', nom: 'Sophie Exemple', ville: 'Lille', specialites: [{ code: 'portrait', niveau: 'referent' }, { code: 'corporate', niveau: 'referent' }, { code: 'identite', niveau: 'competent' }], titres: [], disponible: true, dernierPassage: '2026-04-02', conflits: [] },
  { id: 'e4', nom: 'Julien Exemple', ville: 'Nantes', specialites: [{ code: 'famille', niveau: 'referent' }, { code: 'enfants', niveau: 'referent' }, { code: 'nouveau-ne', niveau: 'competent' }], titres: [], disponible: true, dernierPassage: null, conflits: ['PPF-2026-0012'] },
  { id: 'e5', nom: 'Nadia Exemple', ville: 'Bordeaux', specialites: [{ code: 'produit', niveau: 'referent' }, { code: 'culinaire', niveau: 'referent' }, { code: 'architecture', niveau: 'competent' }], titres: ['Formatrice Qualiopi'], disponible: true, dernierPassage: '2026-02-20', conflits: [] },
  { id: 'e6', nom: 'Thomas Exemple', ville: 'Marseille', specialites: [{ code: 'mariage', niveau: 'referent' }, { code: 'portrait', niveau: 'competent' }, { code: 'famille', niveau: 'competent' }], titres: [], disponible: true, dernierPassage: '2026-08-12', conflits: [] },
  { id: 'e7', nom: 'Claire Exemple', ville: 'Toulouse', specialites: [{ code: 'nouveau-ne', niveau: 'referent' }, { code: 'aquatique', niveau: 'competent' }], titres: ['Meilleur Ouvrier de France'], disponible: false, dernierPassage: '2026-06-10', conflits: [] },
  { id: 'e8', nom: 'Bruno Exemple', ville: 'Rennes', specialites: [{ code: 'corporate', niveau: 'referent' }, { code: 'evenementiel', niveau: 'referent' }], titres: [], disponible: true, dernierPassage: '2026-06-10', conflits: [] },
  { id: 'e9', nom: 'Léa Exemple', ville: 'Strasbourg', specialites: [{ code: 'grossesse', niveau: 'referent' }, { code: 'famille', niveau: 'competent' }, { code: 'boudoir', niveau: 'referent' }], titres: [], disponible: true, dernierPassage: '2025-12-04', conflits: [] },
];
