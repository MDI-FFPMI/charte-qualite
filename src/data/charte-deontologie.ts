// Charte de déontologie - Photographe Professionnel de France
// Le texte est dans charte-deontologie.json. Après toute modification du texte :
// changer "version" dans le JSON, puis régénérer le PDF (python3 scripts/generer-charte-pdf.py).
import data from './charte-deontologie.json';

export interface Bloc { p?: string[]; liste?: string[]; ordonnee?: boolean; apres?: string[] }
export interface Article extends Bloc { titre: string }
export interface Partie { titre: string; intro?: Bloc; articles?: Article[] }

export const charte = data as { version: string; titre: string; parties: Partie[]; engagement: string[]; phrase: string };

/** Compare la phrase saisie à la phrase attendue, sans tenir compte des majuscules, accents, apostrophes et ponctuation */
export const normaliser = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[’‘`]/g, "'").replace(/[^a-z']+/g, ' ').trim();
export const phraseValide = (t: string) => normaliser(t) === normaliser(charte.phrase);
export const CHARTE_VERSION = charte.version;
export const CHARTE_PDF = '/charte-deontologie-ffpmi.pdf';
