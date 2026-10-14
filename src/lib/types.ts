export type StatutQuestion = 'eliminatoire' | 'valorise' | 'informatif';
export type TypeQuestion =
  | 'yes_no' | 'choice' | 'multi_choice' | 'text' | 'year'
  | 'url_list' | 'specialites' | 'materiel' | 'coordonnees' | 'evaluation';

export interface Option { value: string; label: string; points: number; exclusive?: boolean }

export interface Condition {
  q: string;
  op: 'includes_any' | 'eq' | 'in' | 'has_other_than';
  values?: string[];
  value?: string;
}

export interface Complement {
  key: string;
  label: string;
  type: 'text' | 'number' | 'par_specialite';
  si?: string; // affiché seulement si la valeur principale vaut ceci
}

export interface ChampCoordonnees {
  key: string;
  label: string;
  type: 'text' | 'tel' | 'select' | 'siret' | 'cp' | 'url' | 'instagram';
  requis?: boolean;
  options?: string[];
  largeur?: 'pleine';
}

export interface Question {
  code: string;
  libelle: string;
  aide?: string;
  type: TypeQuestion;
  options?: Option[];
  statut: StatutQuestion;
  points_max: number;
  note_par_experts?: boolean;
  justificatifs?: string;
  preuve_attendue?: boolean;
  facultatif?: boolean;
  condition?: Condition;
  complements?: Complement[];
  champs?: ChampCoordonnees[];
  source?: string; // question dont les réponses sont affichées (type evaluation)
}

export interface Rubrique { numero: number; titre: string; intro?: string; questions: Question[] }

export interface Referentiel {
  version: { id: string; libelle: string; seuil_obtention: number; base_score: number; validite_mois: number };
  specialites: { value: string; label: string }[];
  rubriques: Rubrique[];
  attestation: string[];
}

/** Valeur principale d'une réponse selon le type de question */
export type Valeur =
  | string                                   // yes_no ('oui'|'non'), choice, text, year ('2014')
  | string[]                                 // multi_choice, url_list
  | { choisies: string[]; principale?: string } // specialites
  | MaterielLigne[]                          // materiel
  | Record<string, string>                   // coordonnees
  | null;

export interface MaterielLigne { type: string; modele: string; annee: string }

export interface Reponse {
  valeur: Valeur;
  complements?: Record<string, unknown>;
  justification?: string;
}

export interface Piece { id: string; question_code: string; nom_fichier: string; taille: number; storage_path?: string }

export type Reponses = Record<string, Reponse | undefined>;
