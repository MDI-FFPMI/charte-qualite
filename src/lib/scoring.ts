import type { ChampCoordonnees, Condition, Piece, Question, Referentiel, Reponse, Reponses, Valeur } from './types';

const anneeCourante = () => new Date().getFullYear();

/** Liste des valeurs sélectionnées, quel que soit le type */
export function valeursChoisies(v: Valeur | undefined): string[] {
  if (v == null) return [];
  if (typeof v === 'string') return v ? [v] : [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  if ('choisies' in v && Array.isArray(v.choisies)) return v.choisies as string[];
  return [];
}

export function conditionRemplie(c: Condition | undefined, reponses: Reponses): boolean {
  if (!c) return true;
  const choisies = valeursChoisies(reponses[c.q]?.valeur);
  switch (c.op) {
    case 'includes_any':
    case 'in':
      return (c.values ?? []).some((v) => choisies.includes(v));
    case 'eq':
      return choisies.length === 1 && choisies[0] === c.value;
    case 'has_other_than':
      return choisies.some((v) => v !== c.value);
  }
}

/** Une question est affichée si sa condition est remplie (et celle de sa question parente) */
export function estAffichee(q: Question, reponses: Reponses, ref: Referentiel): boolean {
  if (!q.condition) return true;
  const parent = toutesQuestions(ref).find((x) => x.code === q.condition!.q);
  if (parent && !estAffichee(parent, reponses, ref)) return false;
  return conditionRemplie(q.condition, reponses);
}

export function toutesQuestions(ref: Referentiel): Question[] {
  return ref.rubriques.flatMap((r) => r.questions);
}

/** SIRET : 14 chiffres et clé de Luhn (exception La Poste : somme multiple de 5) */
export function siretValide(s: string): boolean {
  const c = s.replace(/\s/g, '');
  if (!/^\d{14}$/.test(c)) return false;
  if (c.startsWith('356000000')) return [...c].reduce((t, d) => t + Number(d), 0) % 5 === 0;
  let somme = 0;
  for (let i = 0; i < 14; i++) {
    let d = Number(c[13 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    somme += d;
  }
  return somme % 10 === 0;
}

/** Message d'erreur d'un champ de coordonnées, ou chaîne vide si valide */
export function erreurChamp(c: ChampCoordonnees, v: string | undefined): string {
  const x = (v ?? '').trim();
  if (!x) return c.requis ? 'Champ requis' : '';
  if (c.type === 'siret' && !siretValide(x)) return 'SIRET invalide : vérifiez les 14 chiffres';
  if (c.type === 'cp' && !/^\d{5}$/.test(x)) return 'Code postal à 5 chiffres';
  if (c.type === 'tel' && x.replace(/[^\d]/g, '').length < 10) return 'Numéro de téléphone incomplet';
  if (c.type === 'url' && !/^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(x)) return 'Lien complet attendu, commençant par https://';
  if (c.type === 'instagram' && !/^(@?[\w.]{1,30}|https?:\/\/(www\.)?instagram\.com\/[\w.]{1,30}\/?)$/i.test(x)) return 'Indiquez @votrecompte ou le lien instagram.com';
  return '';
}

const urlValide = (s: string) => /^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(s.trim());

export function estRepondue(q: Question, r: Reponse | undefined): boolean {
  const v = r?.valeur;
  if (q.type === 'evaluation') return true;
  if (v == null) return false;
  switch (q.type) {
    case 'yes_no':
    case 'choice':
    case 'text':
      return typeof v === 'string' && v.trim() !== '';
    case 'year':
      return typeof v === 'string' && /^\d{4}$/.test(v);
    case 'multi_choice':
      return Array.isArray(v) && v.length > 0;
    case 'url_list':
      return Array.isArray(v) && (v as string[]).filter(urlValide).length > 0;
    case 'specialites':
      return typeof v === 'object' && !Array.isArray(v) && 'choisies' in v && v.choisies.length > 0 && !!v.principale;
    case 'materiel':
      return Array.isArray(v) && v.some((l) => typeof l === 'object' && l && (l as { modele: string }).modele?.trim());
    case 'coordonnees': {
      const o = (typeof v === 'object' && !Array.isArray(v) ? v : {}) as Record<string, string>;
      return (q.champs ?? []).every((c) => !erreurChamp(c, o[c.key]));
    }
  }
}

/** Points obtenus sur une question, hors appréciation des experts */
export function pointsQuestion(q: Question, r: Reponse | undefined): number {
  if (q.statut === 'informatif' || q.note_par_experts || !r) return 0;
  const v = r.valeur;
  switch (q.type) {
    case 'yes_no':
      return v === 'oui' ? q.points_max : 0;
    case 'choice':
      return q.options?.find((o) => o.value === v)?.points ?? 0;
    case 'multi_choice': {
      const somme = valeursChoisies(v).reduce((s, x) => s + (q.options?.find((o) => o.value === x)?.points ?? 0), 0);
      return Math.min(somme, q.points_max);
    }
    case 'year': {
      if (typeof v !== 'string' || !/^\d{4}$/.test(v)) return 0;
      const annees = anneeCourante() - Number(v);
      const paliers = [...(q.options ?? [])].sort((a, b) => Number(b.value) - Number(a.value));
      return paliers.find((p) => annees >= Number(p.value))?.points ?? 0;
    }
    case 'url_list':
      return Array.isArray(v) && (v as string[]).some(urlValide) ? q.points_max : 0;
    default:
      return 0;
  }
}

/** Réponse "positive" : celle qui rapporte des points ou valide une condition */
export function estPositive(q: Question, r: Reponse | undefined): boolean {
  if (!r) return false;
  if (q.type === 'yes_no') return r.valeur === 'oui';
  if (q.type === 'choice' || q.type === 'multi_choice') return pointsQuestion(q, r) > 0;
  return estRepondue(q, r);
}

export function justificatifManquant(q: Question, r: Reponse | undefined, pieces: Piece[]): boolean {
  if (!q.preuve_attendue || !estPositive(q, r)) return false;
  const aPiece = pieces.some((p) => p.question_code === q.code);
  const aTexte = !!r?.justification?.trim();
  return !aPiece && !aTexte;
}

export interface Bilan {
  pointsObtenus: number;          // hors questions notées par les experts
  pointsApplicables: number;      // toutes questions affichées, y compris experts
  pointsExperts: number;          // part notée par la commission (portfolio, matériel)
  scoreIndicatif: number;         // ramené sur la base (150), en supposant 0 sur la part experts
  scoreMaxAtteignable: number;    // si la commission donne tous ses points
  questionsSansReponse: Question[];
  eliminatoiresEchouees: Question[];
  justificatifsManquants: Question[];
  progression: { numero: number; total: number; repondues: number }[];
  envoyable: boolean;
}

export function bilanDossier(ref: Referentiel, reponses: Reponses, pieces: Piece[], attestationsCochees: boolean): Bilan {
  const base = ref.version.base_score;
  let obtenus = 0, applicables = 0, experts = 0;
  const sansReponse: Question[] = [];
  const eliminatoires: Question[] = [];
  const manquants: Question[] = [];
  const progression = ref.rubriques.map((rub) => {
    let total = 0, repondues = 0;
    for (const q of rub.questions) {
      if (!estAffichee(q, reponses, ref)) continue;
      const r = reponses[q.code];
      total++;
      const repondue = estRepondue(q, r);
      if (repondue || q.facultatif) repondues++;
      if (!repondue && !q.facultatif) sansReponse.push(q);
      applicables += q.points_max;
      if (q.note_par_experts) experts += q.points_max;
      obtenus += pointsQuestion(q, r);
      if (q.statut === 'eliminatoire' && repondue && !estPositive(q, r)) eliminatoires.push(q);
      if (justificatifManquant(q, r, pieces)) manquants.push(q);
    }
    return { numero: rub.numero, total, repondues };
  });
  const eliminatoireManquantes = manquants.filter((q) => q.statut === 'eliminatoire');
  return {
    pointsObtenus: obtenus,
    pointsApplicables: applicables,
    pointsExperts: experts,
    scoreIndicatif: applicables ? Math.round((obtenus / applicables) * base * 10) / 10 : 0,
    scoreMaxAtteignable: applicables ? Math.round(((obtenus + experts) / applicables) * base * 10) / 10 : 0,
    questionsSansReponse: sansReponse,
    eliminatoiresEchouees: eliminatoires,
    justificatifsManquants: manquants,
    progression,
    envoyable: sansReponse.length === 0 && eliminatoires.length === 0 && eliminatoireManquantes.length === 0 && attestationsCochees,
  };
}

/** Score final après évaluation : points déclaratifs validés + moyenne des notes experts */
export function scoreFinal(pointsValides: number, noteExperts: number, applicables: number, base = 150): number {
  return applicables ? Math.round(((pointsValides + noteExperts) / applicables) * base * 10) / 10 : 0;
}
