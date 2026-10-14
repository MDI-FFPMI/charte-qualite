// Composition assistée d'une commission :
//  1. choisir N experts (6 par défaut) qui couvrent au mieux les spécialités des dossiers
//  2. désigner 2 rapporteurs par dossier parmi eux
// Règles : conflits déclarés exclus, experts indisponibles exclus, charge équilibrée,
// rotation (priorité à qui a siégé le moins récemment). Pas d'exclusion géographique.

export type Niveau = 'referent' | 'competent';

export interface ExpertPool {
  id: string;
  nom: string;
  ville: string;
  specialites: { code: string; niveau: Niveau }[];
  titres: string[];
  disponible: boolean;
  dernierPassage: string | null; // date ISO de la dernière commission
  conflits: string[];            // ids de dossiers sur lesquels l'expert est en conflit
}

/** principale : la première spécialité principale ; principales : toutes (1 à 4), sinon [principale] */
export interface DossierACompose { id: string; principale: string; principales?: string[]; autres: string[] }

export interface Affectation { dossierId: string; rapporteurs: string[]; raisons: string[]; alerte?: string }
export interface Proposition {
  experts: { id: string; raison: string; nbRapports: number }[];
  affectations: Affectation[];
  alertes: string[];
}

const moisDepuis = (iso: string | null, ref: Date) =>
  iso ? Math.max(0, (ref.getTime() - Date.parse(iso)) / (30.44 * 864e5)) : 24;

/** Pertinence d'un expert pour un dossier : 3 référent d'une spécialité principale, 2 compétent, 1 autre spécialité */
const principalesDu = (d: DossierACompose) => (d.principales?.length ? d.principales : [d.principale]);

/** Spécialité principale du dossier que l'expert couvre le mieux (pour expliquer la proposition) */
export function speCouverte(e: ExpertPool, d: DossierACompose): string {
  const niv = (code: string) => e.specialites.find((s) => s.code === code)?.niveau;
  const ps = principalesDu(d);
  return ps.find((c) => niv(c) === 'referent') ?? ps.find((c) => niv(c) === 'competent') ?? d.principale;
}

export function pertinence(e: ExpertPool, d: DossierACompose): number {
  if (e.conflits.includes(d.id)) return -1;
  const niv = (code: string) => e.specialites.find((s) => s.code === code)?.niveau;
  const niveaux = principalesDu(d).map(niv);
  if (niveaux.includes('referent')) return 3;
  if (niveaux.includes('competent')) return 2;
  return d.autres.some((a) => niv(a)) ? 1 : 0;
}

export function composer(
  dossiers: DossierACompose[], pool: ExpertPool[], nbExperts = 6, maintenant = new Date(),
  libelle: (code: string) => string = (c) => c,
): Proposition {
  const candidats = pool.filter((e) => e.disponible);
  const alertes: string[] = [];
  if (candidats.length < nbExperts) alertes.push(`Seulement ${candidats.length} experts disponibles pour ${nbExperts} places.`);

  // 1. Sélection gloutonne : à chaque tour, l'expert qui améliore le plus la couverture
  const choisis: ExpertPool[] = [];
  const meilleur = new Map<string, number>(dossiers.map((d) => [d.id, 0]));
  while (choisis.length < Math.min(nbExperts, candidats.length)) {
    let top: { e: ExpertPool; gain: number } | null = null;
    for (const e of candidats) {
      if (choisis.includes(e)) continue;
      let gain = 0;
      for (const d of dossiers) gain += Math.max(0, pertinence(e, d) - (meilleur.get(d.id) ?? 0));
      gain += Math.min(moisDepuis(e.dernierPassage, maintenant), 12) * 0.05; // rotation, départage
      if (!top || gain > top.gain) top = { e, gain };
    }
    if (!top) break;
    choisis.push(top.e);
    for (const d of dossiers) meilleur.set(d.id, Math.max(meilleur.get(d.id) ?? 0, pertinence(top.e, d)));
  }

  // 2. Rapporteurs : 2 par dossier, charge plafonnée
  const plafond = Math.ceil((dossiers.length * 2) / Math.max(choisis.length, 1)) + 1;
  const charge = new Map<string, number>(choisis.map((e) => [e.id, 0]));
  // Les dossiers les plus difficiles à couvrir d'abord
  const ordre = [...dossiers].sort((a, b) =>
    choisis.filter((e) => pertinence(e, a) >= 2).length - choisis.filter((e) => pertinence(e, b) >= 2).length);

  const affectations: Affectation[] = ordre.map((d) => {
    const raisons: string[] = [];
    const dispo = choisis.filter((e) => !e.conflits.includes(d.id) && (charge.get(e.id) ?? 0) < plafond);
    const tri = (score: (e: ExpertPool) => number) =>
      [...dispo].sort((a, b) => score(b) - score(a) || (charge.get(a.id)! - charge.get(b.id)!));
    const premier = tri((e) => pertinence(e, d))[0];
    const second = tri((e) => {
      if (e === premier) return -9;
      const couvreAutre = d.autres.some((a) => e.specialites.some((s) => s.code === a)) ? 1.5 : 0;
      return pertinence(e, d) + couvreAutre;
    })[0];
    const rapporteurs = [premier, second].filter((e): e is ExpertPool => !!e && e !== undefined);
    const uniques = rapporteurs.filter((e, i) => rapporteurs.indexOf(e) === i);
    for (const e of uniques) {
      charge.set(e.id, (charge.get(e.id) ?? 0) + 1);
      const p = pertinence(e, d);
      raisons.push(`${e.nom} : ${p === 3 ? `référent ${libelle(speCouverte(e, d))}` : p === 2 ? `compétent ${libelle(speCouverte(e, d))}` : p === 1 ? 'couvre une spécialité secondaire' : 'complète le binôme'}`);
    }
    const alerte = uniques.some((e) => pertinence(e, d) === 3) ? undefined
      : `Aucun référent ${libelle(d.principale)} dans la commission`;
    return { dossierId: d.id, rapporteurs: uniques.map((e) => e.id), raisons, alerte };
  });

  for (const a of affectations) if (a.alerte && !alertes.includes(a.alerte)) alertes.push(a.alerte);

  const experts = choisis.map((e) => {
    const refs = [...new Set(dossiers.filter((d) => pertinence(e, d) === 3).map((d) => libelle(speCouverte(e, d))))];
    const mois = Math.round(moisDepuis(e.dernierPassage, maintenant));
    const rotation = e.dernierPassage ? `n'a pas siégé depuis ${mois} mois` : "n'a encore jamais siégé";
    return {
      id: e.id,
      raison: refs.length ? `Référent ${refs.join(', ')}, ${rotation}` : `Complète la couverture, ${rotation}`,
      nbRapports: charge.get(e.id) ?? 0,
    };
  });

  return { experts, affectations: dossiers.map((d) => affectations.find((a) => a.dossierId === d.id)!), alertes };
}

// ---------------------------------------------------------------------
// Vérificateurs d'un dossier (niveau 2), attribués au fil de l'eau
// ---------------------------------------------------------------------
export interface ExpertCharge extends ExpertPool { enCours: number; max: number }
export interface Candidature { id: string; raison: string; pertinence: number }

/**
 * Propose les experts vérificateurs d'un dossier, du plus adapté au moins adapté.
 * Tri : pertinence de spécialité, puis charge en cours la plus faible, puis rotation.
 * Le second choisi couvre de préférence une spécialité secondaire non couverte par le premier.
 */
export function proposerVerificateurs(
  d: DossierACompose, pool: ExpertCharge[], deja: string[] = [], nb = 2,
  libelle: (code: string) => string = (c) => c,
): Candidature[] {
  const possibles = pool.filter((e) => e.disponible && !deja.includes(e.id) && !e.conflits.includes(d.id) && e.enCours < e.max);
  const choisis: ExpertCharge[] = [];
  const score = (e: ExpertCharge) => {
    let s = pertinence(e, d) * 10 - e.enCours;
    const dejaCouvertes = choisis.flatMap((c) => c.specialites.map((x) => x.code));
    if (choisis.length && d.autres.some((a) => !dejaCouvertes.includes(a) && e.specialites.some((x) => x.code === a))) s += 5;
    return s;
  };
  while (choisis.length < nb) {
    const reste = possibles.filter((e) => !choisis.includes(e));
    if (!reste.length) break;
    reste.sort((a, b) => score(b) - score(a) || (a.dernierPassage ?? '').localeCompare(b.dernierPassage ?? ''));
    choisis.push(reste[0]);
  }
  return choisis.map((e) => {
    const p = pertinence(e, d);
    const spe = p === 3 ? `référent ${libelle(speCouverte(e, d))}` : p === 2 ? `compétent ${libelle(speCouverte(e, d))}`
      : p === 1 ? 'couvre une spécialité secondaire' : 'hors spécialité du dossier';
    return { id: e.id, pertinence: p, raison: `${spe}, ${e.enCours} vérification${e.enCours > 1 ? 's' : ''} en cours` };
  });
}
