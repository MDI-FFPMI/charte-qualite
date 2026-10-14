import { describe, expect, it } from 'vitest';
import refJson from '../data/referentiel-v3.json';
import { bilanDossier, estAffichee, estRepondue, pointsQuestion, siretValide, toutesQuestions } from './scoring';
import { composer } from './composition';
import { dossiersDemo, expertsDemo } from '../data/demo';
import type { Referentiel, Reponses } from './types';

const ref = refJson as Referentiel;
const q = (code: string) => toutesQuestions(ref).find((x) => x.code === code)!;

describe('référentiel V3', () => {
  it('62 questions (dont 2 de coordonnées), 136 points, 13 conditions obligatoires pour 33 points', () => {
    const qs = toutesQuestions(ref);
    expect(qs.length).toBe(62);
    expect(qs.reduce((s, x) => s + x.points_max, 0)).toBe(136);
    const elim = qs.filter((x) => x.statut === 'eliminatoire');
    expect(elim.length).toBe(13);
    expect(elim.reduce((s, x) => s + x.points_max, 0)).toBe(33);
  });
});

describe('barème', () => {
  it('ancienneté par paliers', () => {
    const y = new Date().getFullYear();
    expect(pointsQuestion(q('2.1'), { valeur: String(y - 1) })).toBe(0);
    expect(pointsQuestion(q('2.1'), { valeur: String(y - 3) })).toBe(2);
    expect(pointsQuestion(q('2.1'), { valeur: String(y - 7) })).toBe(4);
    expect(pointsQuestion(q('2.1'), { valeur: String(y - 15) })).toBe(5);
  });
  it('choix multiples plafonnés', () => {
    expect(pointsQuestion(q('10.2'), { valeur: ['qualiopi', 'independant', 'conferences'] })).toBe(5);
    expect(pointsQuestion(q('7.4'), { valeur: ['travail', 'locale', 'hors-site'] })).toBe(3);
    expect(pointsQuestion(q('7.4'), { valeur: ['travail', 'locale'] })).toBe(2);
    expect(pointsQuestion(q('6.2'), { valeur: ['especes'] })).toBe(0);
  });
  it('portfolio non compté dans le score déclaratif', () => {
    expect(pointsQuestion(q('4.1'), { valeur: ['https://a.fr/1', 'https://a.fr/2', 'https://a.fr/3'] })).toBe(0);
  });
});

describe('affichage conditionnel', () => {
  it('médiateur seulement avec des particuliers', () => {
    expect(estAffichee(q('1.6'), { '1.1': { valeur: ['professionnels'] } }, ref)).toBe(false);
    expect(estAffichee(q('1.6'), { '1.1': { valeur: ['particuliers'] } }, ref)).toBe(true);
  });
  it('IA et PMR', () => {
    expect(estAffichee(q('8.6'), { '8.5': { valeur: ['aucun'] } }, ref)).toBe(false);
    expect(estAffichee(q('8.6'), { '8.5': { valeur: ['retouche'] } }, ref)).toBe(true);
    expect(estAffichee(q('9.3'), { '9.2': { valeur: 'itinerant' } }, ref)).toBe(false);
  });
  it('photographe corporate itinérant sans IA : 124 points applicables', () => {
    const r: Reponses = {
      '1.1': { valeur: ['professionnels'] },
      '2.2': { valeur: { choisies: ['corporate'], principale: 'corporate' } },
      '8.5': { valeur: ['aucun'] },
      '9.2': { valeur: 'itinerant' },
    };
    expect(bilanDossier(ref, r, [], false).pointsApplicables).toBe(124);
  });
});

describe('envoi', () => {
  it("un non sur une condition obligatoire bloque l'envoi", () => {
    const b = bilanDossier(ref, { '1.5': { valeur: 'non' } }, [], true);
    expect(b.eliminatoiresEchouees.map((x) => x.code)).toContain('1.5');
    expect(b.envoyable).toBe(false);
  });
});

describe('composition de commission', () => {
  it('6 experts, 2 rapporteurs par dossier, conflits respectés', () => {
    const dossiers = dossiersDemo.filter((d) => d.statut === 'attente_commission');
    const p = composer(dossiers, expertsDemo, 6, new Date('2026-10-14'));
    expect(p.experts.length).toBe(6);
    expect(p.experts.map((e) => e.id)).not.toContain('e7'); // indisponible
    for (const a of p.affectations) {
      expect(a.rapporteurs.length).toBe(2);
      for (const id of a.rapporteurs) {
        expect(expertsDemo.find((e) => e.id === id)!.conflits).not.toContain(a.dossierId);
      }
    }
  });
});

describe('coordonnées', () => {
  it('SIRET contrôlé par la clé de Luhn', () => {
    expect(siretValide('829 509 967 00032')).toBe(true);   // ASCOM
    expect(siretValide('82950996700033')).toBe(false);
    expect(siretValide('1234')).toBe(false);
  });
  it('bloc entreprise complet seulement avec les champs requis valides', () => {
    const base = { denomination: 'Studio Exemple', forme: 'SARL', siret: '82950996700032', adresse: '1 rue de la Paix', cp: '75002', ville: 'Paris' };
    expect(estRepondue(q('0.2'), { valeur: base })).toBe(true);
    expect(estRepondue(q('0.2'), { valeur: { ...base, cp: '7500' } })).toBe(false);
    expect(estRepondue(q('0.2'), { valeur: { ...base, siret: '' } })).toBe(false);
  });
});

describe('présence en ligne', () => {
  it('notée par la commission, liens contrôlés', async () => {
    const { erreurChamp } = await import('./scoring');
    expect(q('9.1').note_par_experts).toBe(true);
    expect(pointsQuestion(q('9.1'), { valeur: null })).toBe(0);
    const insta = q('0.3').champs!.find((c) => c.key === 'instagram')!;
    expect(erreurChamp(insta, '@studio.lumiere')).toBe('');
    expect(erreurChamp(insta, 'https://www.instagram.com/studio.lumiere/')).toBe('');
    expect(erreurChamp(insta, 'mon insta')).not.toBe('');
  });
});

import { proposerVerificateurs, type ExpertCharge } from './composition';
describe('proposerVerificateurs', () => {
  const ex = (id: string, spe: [string, 'referent' | 'competent'][], enCours = 0, extra: Partial<ExpertCharge> = {}): ExpertCharge =>
    ({ id, nom: id, ville: '', titres: [], disponible: true, dernierPassage: null, conflits: [], max: 15, enCours,
       specialites: spe.map(([code, niveau]) => ({ code, niveau })), ...extra });
  const d = { id: 'D1', principale: 'nouveau-ne', autres: ['mariage'] };
  it('prend le référent puis couvre la spécialité secondaire', () => {
    const pool = [ex('A', [['nouveau-ne', 'referent']]), ex('B', [['nouveau-ne', 'competent']]), ex('C', [['nouveau-ne', 'competent'], ['mariage', 'referent']])];
    expect(proposerVerificateurs(d, pool).map((c) => c.id)).toEqual(['A', 'C']);
  });
  it('écarte conflits, indisponibles, déjà attribués et experts au plafond', () => {
    const pool = [ex('A', [['nouveau-ne', 'referent']], 0, { conflits: ['D1'] }), ex('B', [['nouveau-ne', 'referent']], 15),
      ex('C', [['nouveau-ne', 'referent']], 0, { disponible: false }), ex('E', [['nouveau-ne', 'referent']]), ex('F', [['portrait', 'referent']])];
    expect(proposerVerificateurs(d, pool, ['E']).map((c) => c.id)).toEqual(['F']);
  });
  it('à pertinence égale, le moins chargé passe devant', () => {
    const pool = [ex('A', [['nouveau-ne', 'referent']], 4), ex('B', [['nouveau-ne', 'referent']], 1)];
    expect(proposerVerificateurs(d, pool, [], 1)[0].id).toBe('B');
  });
});
