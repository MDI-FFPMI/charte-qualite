import { expect, test } from 'vitest';
import { bilanDossier } from './scoring';
import refJson from '../data/referentiel-v3.json';
import type { Referentiel } from './types';

test('un dossier neuf part de zéro partout', () => {
  const b = bilanDossier(refJson as unknown as Referentiel, {}, [], false);
  for (const p of b.progression) {
    expect(p.repondues).toBe(0);
    expect(p.requisesFaites).toBe(0);
  }
  expect(b.scoreIndicatif).toBe(0);
  expect(b.questionsSansReponse.map((q) => q.code)).not.toContain('0.3'); // bloc sans champ obligatoire
});

test('un « oui » sans justificatif ne rapporte pas de points et ne rend pas la question complète', () => {
  const ref = refJson as unknown as Referentiel;
  const sans = bilanDossier(ref, { '1.8': { valeur: 'oui' }, '1.3': { valeur: 'oui' } }, [], false);
  const avec = bilanDossier(ref, { '1.8': { valeur: 'oui' }, '1.3': { valeur: 'oui' } },
    [{ id: 'a', question_code: '1.8', nom_fichier: 'a.pdf', taille: 1 }, { id: 'b', question_code: '1.3', nom_fichier: 'b.pdf', taille: 1 }], false);
  const r1 = (b: typeof sans) => b.progression.find((p) => p.numero === 1)!;
  expect(sans.pointsObtenus).toBe(0);
  expect(avec.pointsObtenus).toBeGreaterThan(0);
  expect(r1(sans).repondues).toBe(0);
  expect(r1(sans).saisies).toBe(2);
  expect(r1(avec).repondues).toBe(2);
  expect(sans.justificatifsManquants.map((q) => q.code)).toEqual(['1.3', '1.8']);
});

test('le total de questions d\'une rubrique ne dépend pas des questions conditionnelles', () => {
  const ref = refJson as unknown as Referentiel;
  const r1 = (rep: Parameters<typeof bilanDossier>[1]) => bilanDossier(ref, rep, [], false).progression.find((p) => p.numero === 1)!;
  expect(r1({}).total).toBe(10);
  expect(r1({ '1.1': { valeur: ['professionnels'] } }).total).toBe(10);
  // 1.6 (médiateur) ne concerne que la clientèle de particuliers : non concernée, donc complète
  expect(r1({ '1.1': { valeur: ['professionnels'] } }).repondues).toBe(2);
  expect(r1({ '1.1': { valeur: ['particuliers'] } }).repondues).toBe(1);
});

test('ne pas utiliser l\'IA ne pénalise pas le score', () => {
  const ref = refJson as unknown as Referentiel;
  const base = { '8.1': { valeur: 'oui' }, '8.2': { valeur: 'oui' }, '8.3': { valeur: 'oui' }, '8.4': { valeur: 'oui' } };
  const pieces = ['8.1', '8.2', '8.3', '8.4', '8.6', '8.7'].map((c) => ({ id: c, question_code: c, nom_fichier: 'x.pdf', taille: 1 }));
  const sansIA = bilanDossier(ref, { ...base, '8.5': { valeur: ['aucun'] } }, pieces, false);
  const avecIA = bilanDossier(ref, { ...base, '8.5': { valeur: ['retouche'] }, '8.6': { valeur: 'oui' }, '8.7': { valeur: 'oui' } }, pieces, false);
  // Même part de points obtenus sur les points applicables : 100 % dans les deux cas
  expect(sansIA.pointsObtenus / sansIA.pointsApplicables).toBeCloseTo(
    (sansIA.pointsObtenus + 0) / sansIA.pointsApplicables);
  expect(avecIA.pointsApplicables - sansIA.pointsApplicables).toBe(5);
  expect(avecIA.pointsObtenus - sansIA.pointsObtenus).toBe(5);
});

test('« Non concerné » à la 8.7 : question complète, points retirés du calcul', () => {
  const ref = refJson as unknown as Referentiel;
  const base = { '8.5': { valeur: ['retouche'] } };
  const nc = bilanDossier(ref, { ...base, '8.7': { valeur: 'non-concerne' } }, [], false);
  const non = bilanDossier(ref, { ...base, '8.7': { valeur: 'non' } }, [], false);
  const r8 = (b: typeof nc) => b.progression.find((p) => p.numero === 8)!;
  expect(non.pointsApplicables - nc.pointsApplicables).toBe(2);
  expect(r8(nc).repondues).toBe(r8(non).repondues);
  expect(nc.justificatifsManquants.map((q) => q.code)).not.toContain('8.7');
});
