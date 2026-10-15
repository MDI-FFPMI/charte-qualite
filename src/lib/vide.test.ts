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
