import { useId, useState, type ChangeEvent } from 'react';
import type { MaterielLigne, Piece, Question, Referentiel, Reponse, Reponses } from '../lib/types';
import { erreurChamp, estPositive, estRepondue, justificatifManquant, MAX_PRINCIPALES, principalesDe } from '../lib/scoring';

interface Props {
  q: Question;
  referentiel: Referentiel;
  reponse: Reponse | undefined;
  toutesReponses?: Reponses;
  specialitesChoisies: string[];
  pieces: Piece[];
  verrouille: boolean;
  onChange: (r: Reponse) => void;
  onDepot: (f: File) => Promise<void>;
  onRetirer: (p: Piece) => Promise<void>;
}

const taille = (o: number) => (o > 1e6 ? `${(o / 1e6).toFixed(1)} Mo` : `${Math.max(1, Math.round(o / 1e3))} Ko`);

export function BadgeStatut({ q }: { q: Question }) {
  if (q.statut === 'eliminatoire') return <span className="badge elim" title="Une réponse négative ne permet pas d'envoyer le dossier">Condition obligatoire</span>;
  if (q.statut === 'informatif') return <span className="badge info">Sans impact sur le score</span>;
  if (q.note_par_experts) return <span className="badge pts">{q.points_max} pts, notés par la commission</span>;
  return <span className="badge pts num">{q.points_max} pt{q.points_max > 1 ? 's' : ''}</span>;
}

export default function QuestionChamp({ q, referentiel: ref, reponse, toutesReponses = {}, specialitesChoisies, pieces, verrouille, onChange, onDepot, onRetirer }: Props) {
  const id = useId();
  const [depot, setDepot] = useState<'' | 'envoi' | string>('');
  const r: Reponse = reponse ?? { valeur: null };
  const maj = (p: Partial<Reponse>) => onChange({ ...r, ...p });
  const majComp = (cle: string, v: unknown) => maj({ complements: { ...(r.complements ?? {}), [cle]: v } });
  const mesPieces = pieces.filter((p) => p.question_code === q.code);
  const elimine = q.statut === 'eliminatoire' && estRepondue(q, r) && !estPositive(q, r);
  const manque = justificatifManquant(q, r, pieces);

  const fichier = async (e: ChangeEvent<HTMLInputElement>) => {
    const fichiers = Array.from(e.target.files ?? []);
    e.target.value = '';
    const erreurs: string[] = [];
    for (const f of fichiers) {
      if (f.size > 10 * 1024 * 1024) { erreurs.push(`${f.name} dépasse 10 Mo.`); continue; }
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)) { erreurs.push(`${f.name} : formats acceptés PDF, JPG ou PNG.`); continue; }
      setDepot('envoi');
      try { await onDepot(f); } catch (err) { erreurs.push(`${f.name} : ${(err as Error).message}`); }
    }
    setDepot(erreurs.join(' '));
  };

  const valeurTexte = typeof r.valeur === 'string' ? r.valeur : '';
  const valeursListe = Array.isArray(r.valeur) ? (r.valeur as string[]) : [];

  const champPrincipal = () => {
    switch (q.type) {
      case 'evaluation': {
        const src = ref.rubriques.flatMap((x) => x.questions).find((x) => x.code === q.source);
        const o = (toutesReponses[q.source ?? '']?.valeur ?? {}) as Record<string, string>;
        const remplis = (src?.champs ?? []).filter((c) => o[c.key]?.trim());
        return remplis.length ? (
          <div className="pile" style={{ gap: '.4rem' }}>
            <span className="petit discret">Liens qui seront examinés :</span>
            {remplis.map((c) => <div className="fichier" key={c.key}><span>{c.label}</span><span className="discret" style={{ flex: 'none' }}>{o[c.key]}</span></div>)}
          </div>
        ) : (
          <div className="message att">Aucun lien renseigné dans « Vos coordonnées ». Sans site ni réseau social, ce critère ne rapportera pas de points.</div>
        );
      }
      case 'coordonnees': {
        const o = (r.valeur && typeof r.valeur === 'object' && !Array.isArray(r.valeur) ? r.valeur : {}) as Record<string, string>;
        return (
          <div className="champs-grille">
            {(q.champs ?? []).map((c) => {
              const v = o[c.key] ?? '';
              const err = v.trim() ? erreurChamp(c, v) : '';
              const ident = `${id}-${c.key}`;
              const majChamp = (x: string) => maj({ valeur: { ...o, [c.key]: x } });
              return (
                <label key={c.key} className={`champ${c.largeur === 'pleine' ? ' pleine' : ''}`} htmlFor={ident}>
                  <span>{c.label}{c.requis && <span className="requis" style={{ color: 'var(--rouge)' }} aria-hidden="true"> *</span>}</span>
                  {c.type === 'select' ? (
                    <select id={ident} value={v} disabled={verrouille} required={c.requis} onChange={(e) => majChamp(e.target.value)}>
                      <option value="">Choisir…</option>
                      {(c.options ?? []).map((x) => <option key={x}>{x}</option>)}
                    </select>
                  ) : (
                    <input id={ident} value={v} disabled={verrouille} required={c.requis} aria-invalid={!!err}
                      className={c.type === 'siret' || c.type === 'cp' || c.type === 'tel' ? 'num' : undefined}
                      type={c.type === 'tel' ? 'tel' : c.type === 'url' ? 'url' : 'text'}
                      placeholder={c.type === 'url' ? 'https://' : c.type === 'instagram' ? '@votrecompte' : c.type === 'siret' ? '14 chiffres' : undefined}
                      inputMode={c.type === 'siret' || c.type === 'cp' ? 'numeric' : c.type === 'tel' ? 'tel' : undefined}
                      autoComplete={{ prenom: 'given-name', nom: 'family-name', telephone: 'tel', adresse: 'address-line1', complement: 'address-line2', cp: 'postal-code', ville: 'address-level2', denomination: 'organization' }[c.key]}
                      maxLength={c.type === 'siret' ? 17 : c.type === 'cp' ? 5 : undefined}
                      onChange={(e) => majChamp(c.type === 'cp' ? e.target.value.replace(/\D/g, '') : e.target.value)} />
                  )}
                  {err && <span className="petit" style={{ color: 'var(--critique)' }}>{err}</span>}
                </label>
              );
            })}
          </div>
        );
      }
      case 'yes_no':
        return (
          <div className="choix" role="radiogroup" aria-labelledby={`${id}-t`}>
            {[['oui', 'Oui'], ['non', 'Non']].map(([v, l]) => (
              <label key={v}>
                <input type="radio" name={`${id}-yn`} checked={r.valeur === v} disabled={verrouille} onChange={() => maj({ valeur: v })} /> {l}
              </label>
            ))}
          </div>
        );
      case 'choice':
        return (
          <div className="choix colonne" role="radiogroup" aria-labelledby={`${id}-t`}>
            {q.options!.map((o) => (
              <label key={o.value}>
                <input type="radio" name={`${id}-c`} checked={r.valeur === o.value} disabled={verrouille} onChange={() => maj({ valeur: o.value })} />
                {o.label}
                {q.statut !== 'informatif' && <span className="pts-option num">{o.points} pt{o.points > 1 ? 's' : ''}</span>}
              </label>
            ))}
          </div>
        );
      case 'multi_choice':
        return (
          <div className="choix colonne" role="group" aria-labelledby={`${id}-t`}>
            {q.options!.map((o) => {
              const coche = valeursListe.includes(o.value);
              const basculer = () => {
                let suite = coche ? valeursListe.filter((x) => x !== o.value) : [...valeursListe, o.value];
                if (!coche && o.exclusive) suite = [o.value];
                else if (!coche) suite = suite.filter((x) => !q.options!.find((p) => p.value === x)?.exclusive);
                maj({ valeur: suite });
              };
              return (
                <label key={o.value}>
                  <input type="checkbox" checked={coche} disabled={verrouille} onChange={basculer} />
                  {o.label}
                  {q.statut !== 'informatif' && o.points > 0 && <span className="pts-option num">+{o.points}</span>}
                </label>
              );
            })}
            {q.statut !== 'informatif' && <span className="aide">Plafonné à {q.points_max} point{q.points_max > 1 ? 's' : ''}.</span>}
          </div>
        );
      case 'year':
        return (
          <label className="champ" style={{ maxWidth: 200 }}>
            Année
            <input inputMode="numeric" maxLength={4} placeholder="ex. 2015" value={valeurTexte} disabled={verrouille}
              onChange={(e) => maj({ valeur: e.target.value.replace(/\D/g, '') })} />
          </label>
        );
      case 'text':
        return (
          <label className="champ">
            <span className="sr-only" style={{ position: 'absolute', left: -9999 }}>Réponse</span>
            <textarea value={valeurTexte} disabled={verrouille} onChange={(e) => maj({ valeur: e.target.value })} />
          </label>
        );
      case 'url_list': {
        const nb = q.code === '4.1' ? 3 : Math.max(1, valeursListe.length + (valeursListe.at(-1) ? 1 : 0));
        const lignes = Array.from({ length: q.code === '4.1' ? 3 : Math.min(nb, 5) }, (_, i) => valeursListe[i] ?? '');
        const doublon = valeursListe.filter(Boolean).length !== new Set(valeursListe.filter(Boolean)).size;
        return (
          <div className="pile" style={{ gap: '.5rem' }}>
            {lignes.map((v, i) => {
              const invalide = v && !/^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(v);
              return (
                <label className="champ" key={i}>
                  {q.code === '4.1' ? `Galerie ${i + 1}` : `Lien ${i + 1}`}
                  <input type="url" placeholder="https://" value={v} disabled={verrouille} aria-invalid={!!invalide}
                    onChange={(e) => { const s = [...lignes]; s[i] = e.target.value.trim(); maj({ valeur: s.filter((x, j) => x || j < lignes.length - 1) }); }} />
                  {invalide && <span className="petit" style={{ color: 'var(--critique)' }}>Ce lien doit commencer par https:// et être complet.</span>}
                </label>
              );
            })}
            {doublon && <div className="message erreur">Le même lien apparaît plusieurs fois. Chaque galerie doit être différente.</div>}
          </div>
        );
      }
      case 'specialites': {
        const v = (r.valeur && typeof r.valeur === 'object' && !Array.isArray(r.valeur) ? r.valeur : { choisies: [] }) as { choisies: string[]; principales?: string[]; principale?: string };
        const principales = principalesDe(v);
        const lib = (c: string) => ref.specialites.find((s) => s.value === c)?.label ?? c;
        const ecrire = (choisies: string[], princ: string[]) => {
          let pr = princ.filter((x) => choisies.includes(x)).slice(0, MAX_PRINCIPALES);
          if (!pr.length && choisies.length) pr = choisies.slice(0, 1);
          maj({ valeur: { choisies, principales: pr } });
        };
        return (
          <div className="pile" style={{ gap: '.75rem' }}>
            <div className="choix" role="group" aria-label="Spécialités pratiquées">
              {ref.specialites.map((s) => (
                <label key={s.value}>
                  <input type="checkbox" checked={v.choisies.includes(s.value)} disabled={verrouille}
                    onChange={() => {
                      const choisies = v.choisies.includes(s.value) ? v.choisies.filter((x) => x !== s.value) : [...v.choisies, s.value];
                      ecrire(choisies, principales);
                    }} />
                  {s.label}
                </label>
              ))}
            </div>
            {v.choisies.length > 0 && (
              <fieldset className="pile" style={{ gap: '.4rem', border: 0, padding: 0, margin: 0 }}>
                <legend style={{ fontWeight: 600, marginBottom: '.4rem' }}>
                  Vos spécialités principales <span className="discret" style={{ fontWeight: 400 }}>(1 à {MAX_PRINCIPALES}, {principales.length} choisie{principales.length > 1 ? 's' : ''})</span>
                </legend>
                <div className="choix" role="group" aria-label="Spécialités principales">
                  {v.choisies.map((c) => {
                    const coche = principales.includes(c);
                    const plein = !coche && principales.length >= MAX_PRINCIPALES;
                    return (
                      <label key={c} title={plein ? `${MAX_PRINCIPALES} spécialités principales au maximum` : undefined} style={plein ? { opacity: .5 } : undefined}>
                        <input type="checkbox" checked={coche} disabled={verrouille || plein || (coche && principales.length === 1)}
                          onChange={() => ecrire(v.choisies, coche ? principales.filter((x) => x !== c) : [...principales, c])} />
                        {lib(c)}
                      </label>
                    );
                  })}
                </div>
                {principales.length >= MAX_PRINCIPALES && v.choisies.length > MAX_PRINCIPALES && (
                  <span className="petit discret">Maximum atteint : décochez une spécialité principale pour en choisir une autre.</span>
                )}
              </fieldset>
            )}
          </div>
        );
      }
      case 'materiel': {
        const lignes = (Array.isArray(r.valeur) ? (r.valeur as MaterielLigne[]) : []).concat();
        const affichees = [...lignes, { type: 'Boîtier', modele: '', annee: '' }];
        const majLigne = (i: number, l: MaterielLigne) => {
          const s = [...lignes]; s[i] = l;
          maj({ valeur: s.filter((x) => x.modele.trim() || x.annee) });
        };
        return (
          <div className="tableau-wrap">
            <table className="tableau">
              <thead><tr><th>Type</th><th>Marque et modèle</th><th>Année d'achat</th></tr></thead>
              <tbody>
                {affichees.map((l, i) => (
                  <tr key={i}>
                    <td>
                      <select className="saisie" value={l.type} disabled={verrouille} onChange={(e) => majLigne(i, { ...l, type: e.target.value })} aria-label="Type de matériel">
                        {['Boîtier', 'Objectif', 'Éclairage', 'Autre'].map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </td>
                    <td><input className="saisie" style={{ width: '100%' }} value={l.modele} disabled={verrouille} placeholder={i === lignes.length ? 'Ajouter un matériel' : ''} aria-label="Marque et modèle" onChange={(e) => majLigne(i, { ...l, modele: e.target.value })} /></td>
                    <td><input className="saisie num" style={{ width: '6rem' }} inputMode="numeric" maxLength={4} value={l.annee} disabled={verrouille} aria-label="Année d'achat" onChange={(e) => majLigne(i, { ...l, annee: e.target.value.replace(/\D/g, '') })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }
  };

  const valeurPrincipale = typeof r.valeur === 'string' ? r.valeur : '';
  const complements = (q.complements ?? []).filter((c) => !c.si || c.si === valeurPrincipale);

  return (
    <article className={`question${elimine ? ' elimine' : ''}`} id={`q-${q.code}`}>
      <div className="question-tete">
        <h3 id={`${id}-t`}>
          <span className="discret num" style={{ fontWeight: 500, marginRight: '.4rem' }}>{q.code}</span>
          {q.libelle}
          {!q.facultatif && q.type !== 'evaluation' && <span className="requis" aria-label="réponse requise"> *</span>}
          {q.facultatif && <span className="discret petit" style={{ fontWeight: 400 }}> (facultatif)</span>}
        </h3>
        <BadgeStatut q={q} />
      </div>
      {q.aide && <p className="aide">{q.aide}</p>}
      {champPrincipal()}
      {elimine && (
        <div className="message erreur" role="status">
          Cette condition est obligatoire pour obtenir la Charte : le dossier ne pourra pas être envoyé avec une réponse négative.
        </div>
      )}
      {complements.map((c) => (
        c.type === 'par_specialite' ? (
          <div key={c.key} className="pile" style={{ gap: '.5rem' }}>
            <span className="petit" style={{ fontWeight: 600 }}>{c.label}</span>
            {specialitesChoisies.length === 0 && <span className="aide">Déclarez d'abord vos spécialités en rubrique 2.</span>}
            {specialitesChoisies.map((s) => {
              const delais = (r.complements?.[c.key] as Record<string, string> | undefined) ?? {};
              return (
                <label key={s} className="champ" style={{ maxWidth: 420 }}>
                  {ref.specialites.find((x) => x.value === s)?.label}
                  <input placeholder="ex. 3 semaines" value={delais[s] ?? ''} disabled={verrouille}
                    onChange={(e) => majComp(c.key, { ...delais, [s]: e.target.value })} />
                </label>
              );
            })}
          </div>
        ) : (
          <label key={c.key} className="champ" style={{ maxWidth: c.type === 'number' ? 260 : undefined }}>
            {c.label}
            {c.type === 'text'
              ? <textarea rows={2} value={(r.complements?.[c.key] as string) ?? ''} disabled={verrouille} onChange={(e) => majComp(c.key, e.target.value)} />
              : <input inputMode="decimal" className="num" value={(r.complements?.[c.key] as string) ?? ''} disabled={verrouille} onChange={(e) => majComp(c.key, e.target.value.replace(/[^\d.,]/g, ''))} />}
          </label>
        )
      ))}
      {q.justificatifs && estPositive(q, r) && q.type !== 'materiel' && (
        <div className="justif">
          <div className="justif-tete">
            Justificatif{q.preuve_attendue ? '' : ' (facultatif)'} : <span style={{ fontWeight: 400 }}>{q.justificatifs}</span>
          </div>
          {mesPieces.map((p) => (
            <div className="fichier" key={p.id}>
              <span title={p.nom_fichier}>{p.nom_fichier}</span>
              <span className="discret num" style={{ flex: 'none' }}>{taille(p.taille)}</span>
              {!verrouille && <button className="retirer" onClick={() => onRetirer(p)} aria-label={`Retirer ${p.nom_fichier}`}>Retirer</button>}
            </div>
          ))}
          {!verrouille && (
            <div className="ligne">
              <label className="depot">
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={fichier} />
                {mesPieces.length ? '+ Ajouter un autre fichier' : '+ Déposer un ou plusieurs fichiers'}
              </label>
              <span className="petit discret">PDF, JPG ou PNG, 10 Mo maximum par fichier</span>
            </div>
          )}
          {depot === 'envoi' && <span className="petit discret">Envoi en cours…</span>}
          {depot && depot !== 'envoi' && <span className="petit" style={{ color: 'var(--critique)' }}>{depot}</span>}
          <label className="champ">
            Ou indiquez un lien, une référence ou une description
            <input value={r.justification ?? ''} disabled={verrouille} onChange={(e) => maj({ justification: e.target.value })} />
          </label>
          {manque && <span className="petit" style={{ color: q.statut === 'eliminatoire' ? 'var(--critique)' : 'var(--attention)' }}>
            {q.statut === 'eliminatoire' ? 'Justificatif nécessaire pour envoyer le dossier.' : 'Sans justificatif, la commission pourra ne pas accorder ces points.'}
          </span>}
        </div>
      )}
    </article>
  );
}
