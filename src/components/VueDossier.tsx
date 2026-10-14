// Lecture d'un dossier envoyé, question par question, avec les pièces et un
// emplacement pour les avis (contrôle FFPMI ou vérification expert).
import { useState, type ReactNode } from 'react';
import refJson from '../data/referentiel-v3.json';
import { estAffichee, estPositive, principalesDe } from '../lib/scoring';
import { equipe, type Avis, type AvisLigne } from '../lib/equipe';
import type { MaterielLigne, Piece, Question, Referentiel, Reponse, Reponses } from '../lib/types';

export const referentiel = refJson as Referentiel;
export const libSpe = (c: string) => referentiel.specialites.find((s) => s.value === c)?.label ?? c;

export const LIB_AVIS: Record<Avis, [string, string]> = {
  conforme: ['Conforme', 'ok'],
  a_completer: ['À compléter', 'att'],
  non_conforme: ['Non conforme', 'ko'],
};

/** Questions dont le justificatif doit être vérifié */
export function aVerifier(q: Question, r: Reponse | undefined, pieces: Piece[]): boolean {
  if (!r) return false;
  if (q.preuve_attendue && estPositive(q, r)) return true;
  return pieces.some((p) => p.question_code === q.code) || !!r.justification?.trim();
}

export function questionsAVerifier(reponses: Reponses, pieces: Piece[]): Question[] {
  return referentiel.rubriques.flatMap((rb) => rb.questions)
    .filter((q) => estAffichee(q, reponses, referentiel) && aVerifier(q, reponses[q.code], pieces));
}

const lien = (u: string) => {
  const url = /^https?:\/\//i.test(u) ? u : `https://${u.replace(/^@/, 'instagram.com/')}`;
  return <a href={url} target="_blank" rel="noopener noreferrer">{u}</a>;
};

function Valeur({ q, r }: { q: Question; r: Reponse | undefined }) {
  const v = r?.valeur;
  if (v == null || v === '' || (Array.isArray(v) && !v.length)) return <span className="discret">Sans réponse</span>;
  const lib = (x: string) => q.options?.find((o) => o.value === x)?.label ?? x;
  switch (q.type) {
    case 'yes_no': return <strong>{v === 'oui' ? 'Oui' : v === 'non' ? 'Non' : String(v)}</strong>;
    case 'choice': return <strong>{lib(String(v))}</strong>;
    case 'multi_choice': return <span>{(v as string[]).map(lib).join(' · ')}</span>;
    case 'url_list': return <span className="pile" style={{ gap: '.2rem' }}>{(v as string[]).filter(Boolean).map((u) => <span key={u}>{lien(u)}</span>)}</span>;
    case 'specialites': {
      const s = v as { choisies?: string[] };
      const pr = principalesDe(v);
      const ordre = [...pr, ...(s.choisies ?? []).filter((c) => !pr.includes(c))];
      return <span>{ordre.map((c) => <span key={c} className={`puce-spe${pr.includes(c) ? ' ref' : ''}`}>{libSpe(c)}{pr.includes(c) ? ' · principale' : ''}</span>)}</span>;
    }
    case 'materiel':
      return <span className="pile" style={{ gap: '.15rem' }}>{(v as MaterielLigne[]).map((m, i) => <span key={i}>{[m.type, m.modele, m.annee && `(${m.annee})`].filter(Boolean).join(' ')}</span>)}</span>;
    case 'coordonnees': {
      const c = v as Record<string, string>;
      return (
        <span className="champs-lecture">
          {(q.champs ?? []).filter((f) => c[f.key]).map((f) => (
            <span key={f.key}><span className="discret petit">{f.label}</span><br />{f.type === 'url' || f.type === 'instagram' ? lien(c[f.key]) : c[f.key]}</span>
          ))}
        </span>
      );
    }
    case 'evaluation': return <span className="discret">Noté par la commission</span>;
    default: return <span style={{ whiteSpace: 'pre-wrap' }}>{String(v)}</span>;
  }
}

function Complements({ q, r }: { q: Question; r: Reponse | undefined }) {
  const lignes = (q.complements ?? []).map((c) => {
    const v = r?.complements?.[c.key];
    if (v == null || v === '') return null;
    const texte = typeof v === 'object'
      ? Object.entries(v as Record<string, string>).filter(([, x]) => x).map(([k, x]) => `${libSpe(k)} : ${x}`).join(' · ')
      : String(v);
    return texte ? <div key={c.key} className="petit"><span className="discret">{c.label} : </span>{texte}</div> : null;
  }).filter(Boolean);
  return lignes.length ? <>{lignes}</> : null;
}

export function BoutonPiece({ p }: { p: Piece }) {
  const [erreur, setErreur] = useState('');
  const ouvrir = async () => {
    setErreur('');
    const fenetre = window.open('', '_blank');
    try {
      const url = await equipe.urlPiece(p);
      if (fenetre) fenetre.location.href = url; else window.location.href = url;
    } catch (e) { fenetre?.close(); setErreur((e as Error).message); }
  };
  return (
    <span className="fichier">
      <span>{p.nom_fichier}</span>
      <button className="bouton secondaire petit-btn" onClick={ouvrir}>Ouvrir</button>
      {erreur && <span className="petit" style={{ color: 'var(--critique)' }}>{erreur}</span>}
    </span>
  );
}

export function BadgeAvis({ a, prefixe }: { a?: AvisLigne; prefixe?: string }) {
  if (!a) return <span className="badge info">{prefixe ? `${prefixe} : ` : ''}à vérifier</span>;
  return (
    <span className="pile" style={{ gap: '.15rem' }}>
      <span className={`badge ${LIB_AVIS[a.avis][1]}`}>{prefixe ? `${prefixe} : ` : ''}{LIB_AVIS[a.avis][0]}</span>
      {a.commentaire && <span className="petit discret">{a.commentaire}</span>}
    </span>
  );
}

/** Choix d'un avis et commentaire, enregistrés à chaque changement */
export function ChoixAvis({ valeur, onChange, verrouille }: {
  valeur?: AvisLigne; onChange: (avis: Avis | null, commentaire: string) => Promise<void>; verrouille?: boolean;
}) {
  const [com, setCom] = useState(valeur?.commentaire ?? '');
  const [etat, setEtat] = useState<'' | 'encours' | 'ok' | string>('');
  const envoyer = async (a: Avis | null, c: string) => {
    setEtat('encours');
    try { await onChange(a, c); setEtat('ok'); } catch (e) { setEtat((e as Error).message); }
  };
  if (verrouille) return <BadgeAvis a={valeur} />;
  return (
    <div className="pile choix-avis" style={{ gap: '.4rem' }}>
      <div className="ligne" style={{ gap: '.3rem' }} role="radiogroup" aria-label="Avis">
        {(Object.keys(LIB_AVIS) as Avis[]).map((a) => (
          <button key={a} type="button" className={`avis-btn ${LIB_AVIS[a][1]}`} aria-pressed={valeur?.avis === a}
            onClick={() => envoyer(valeur?.avis === a ? null : a, com)}>{LIB_AVIS[a][0]}</button>
        ))}
      </div>
      <input className="saisie petit" placeholder={valeur?.avis && valeur.avis !== 'conforme' ? 'Précisez ce qui ne va pas (visible par l\'équipe)' : 'Commentaire (facultatif)'}
        value={com} onChange={(e) => setCom(e.target.value)}
        onBlur={() => { if (valeur && com !== (valeur.commentaire ?? '')) void envoyer(valeur.avis, com); }} />
      {etat && etat !== 'ok' && <span className="petit discret" role="status">{etat === 'encours' ? 'Enregistrement…' : etat}</span>}
    </div>
  );
}

/** Le dossier, rubrique par rubrique. `panneau` ajoute la colonne d'avis sur les questions à justificatif. */
export default function VueDossier({ reponses, pieces, panneau, seulementJustificatifs }: {
  reponses: Reponses; pieces: Piece[]; panneau?: (q: Question) => ReactNode; seulementJustificatifs?: boolean;
}) {
  return (
    <div className="pile" style={{ gap: '1.25rem' }}>
      {referentiel.rubriques.map((rb) => {
        const qs = rb.questions.filter((q) => estAffichee(q, reponses, referentiel)
          && (!seulementJustificatifs || aVerifier(q, reponses[q.code], pieces)));
        if (!qs.length) return null;
        return (
          <section key={rb.numero} className="carte pile" style={{ gap: 0 }}>
            <h3 style={{ marginBottom: '.5rem' }}>{rb.numero}. {rb.titre}</h3>
            {qs.map((q) => {
              const r = reponses[q.code];
              const mesPieces = pieces.filter((p) => p.question_code === q.code);
              const verif = aVerifier(q, r, pieces);
              return (
                <div key={q.code} className={`ligne-question${verif && panneau ? ' avec-avis' : ''}`}>
                  <div className="pile" style={{ gap: '.35rem', minWidth: 0 }}>
                    <div>
                      <span className="num discret">{q.code}</span>{' '}{q.libelle}{' '}
                      {q.statut === 'eliminatoire' && <span className="badge elim">Obligatoire</span>}
                      {q.points_max > 0 && <span className="badge pts num">{q.points_max} pts</span>}
                    </div>
                    <div><Valeur q={q} r={r} /></div>
                    <Complements q={q} r={r} />
                    {verif && (
                      <div className="pile" style={{ gap: '.3rem' }}>
                        {q.justificatifs && <span className="petit discret">Attendu : {q.justificatifs}</span>}
                        {mesPieces.map((p) => <BoutonPiece key={p.id} p={p} />)}
                        {r?.justification?.trim() && <div className="encart petit" style={{ padding: '.5rem .75rem', whiteSpace: 'pre-wrap' }}>{r.justification}</div>}
                        {!mesPieces.length && !r?.justification?.trim() && <span className="badge att">Aucun justificatif fourni</span>}
                      </div>
                    )}
                  </div>
                  {verif && panneau && <div className="avis-col">{panneau(q)}</div>}
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
