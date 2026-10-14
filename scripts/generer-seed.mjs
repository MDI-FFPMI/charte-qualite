// Génère supabase/migrations/0002_referentiel_v3.sql à partir de src/data/referentiel-v3.json
// Usage : npm run seed
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const ref = JSON.parse(readFileSync(join(racine, 'src/data/referentiel-v3.json'), 'utf8'));

const lit = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const json = (o) => (o == null ? 'null' : `${lit(JSON.stringify(o))}::jsonb`);

const v = ref.version;
const lignes = [
  `-- Généré par scripts/generer-seed.mjs - ne pas modifier à la main`,
  `insert into referentiel_versions (id, libelle, seuil_obtention, base_score, validite_mois, en_vigueur, publie_le)`,
  `values (${lit(v.id)}, ${lit(v.libelle)}, ${v.seuil_obtention}, ${v.base_score}, ${v.validite_mois}, true, now())`,
  `on conflict (id) do nothing;`,
  ``,
];

let total = 0;
for (const r of ref.rubriques) {
  lignes.push(
    `insert into rubriques (version_id, numero, titre, intro) values (${lit(v.id)}, ${r.numero}, ${lit(r.titre)}, ${lit(r.intro)}) on conflict do nothing;`,
  );
  r.questions.forEach((q, i) => {
    total += q.points_max;
    lignes.push(
      `insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select ${lit(v.id)}, id, ${lit(q.code)}, ${i + 1}, ${lit(q.libelle)}, ${lit(q.aide)}, ${lit(q.type)}, ${json(q.options ?? [])}, ${lit(q.statut)}, ${q.points_max}, ${!!q.note_par_experts}, ${lit(q.justificatifs)}, ${!!q.preuve_attendue}, ${!!q.facultatif}, ${json(q.condition)}, ${json(q.complements ?? [])}, ${json(q.champs ?? [])}, ${lit(q.source)}
from rubriques where version_id = ${lit(v.id)} and numero = ${r.numero}
on conflict (version_id, code) do nothing;`,
    );
  });
  lignes.push('');
}

writeFileSync(join(racine, 'supabase/migrations/0002_referentiel_v3.sql'), lignes.join('\n'));
const nb = ref.rubriques.reduce((n, r) => n + r.questions.length, 0);
console.log(`${nb} questions, ${total} points bruts -> supabase/migrations/0002_referentiel_v3.sql`);
