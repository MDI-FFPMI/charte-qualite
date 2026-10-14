// Espace expert. Version actuelle : branchée sur les données d'exemple.
// Prochaine étape : lecture des dossiers de la session (RLS expert_voit_dossier),
// écriture dans notes_portfolio et avis_justificatifs.
import { useMemo, useState } from 'react';
import EnTete from '../../components/EnTete';
import { estDemo } from '../../lib/api';
import refJson from '../../data/referentiel-v3.json';
import { dossiersDemo, expertsDemo } from '../../data/demo';
import { composer } from '../../lib/composition';
import type { Referentiel } from '../../lib/types';

const ref = refJson as Referentiel;
const libSpe = (c: string) => ref.specialites.find((s) => s.value === c)?.label ?? c;
const CRITERES = [
  ['technique', 'Technique (netteté, exposition, maîtrise du matériel)'],
  ['lumiere', 'Lumière'],
  ['composition', 'Composition et cadrage'],
  ['post', 'Post-traitement'],
  ['constance', "Constance d'une galerie à l'autre"],
] as const;
const MOI = 'e1';

type Notes = Record<string, Record<string, number>>;
type Avis = Record<string, Record<string, 'conforme' | 'non_conforme' | 'a_completer'>>;

export default function EspaceExpert() {
  const dossiers = dossiersDemo.filter((d) => d.statut === 'attente_commission');
  const proposition = useMemo(() => composer(dossiers, expertsDemo, 6, new Date('2026-10-14'), libSpe), [dossiers]);
  const mesRapports = proposition.affectations.filter((a) => a.rapporteurs.includes(MOI)).map((a) => a.dossierId);
  const [actif, setActif] = useState(mesRapports[0] ?? dossiers[0].id);
  const [notes, setNotes] = useState<Notes>({});
  const [avis, setAvis] = useState<Avis>({});
  const dossier = dossiers.find((d) => d.id === actif)!;
  const n = notes[actif] ?? {};
  const totalPortfolio = CRITERES.reduce((s, [k]) => s + (n[k] ?? 0), 0);
  const noteComplete = CRITERES.every(([k]) => n[k] !== undefined);
  const justificatifs = ref.rubriques.flatMap((r) => r.questions).filter((q) => q.preuve_attendue).slice(0, 8);
  const rapporteur = mesRapports.includes(actif);
  const fait = (id: string) => CRITERES.every(([k]) => notes[id]?.[k] !== undefined);

  return (
    <>
      <EnTete espace="expert" liens={[{ to: '/expert', label: 'Commission du 8 décembre 2026', end: true }]} />
      <main className="gouttiere">
        <div className="conteneur pile" style={{ gap: '1.5rem' }}>
          {!estDemo && (
            <div className="message att" style={{ marginBottom: '1.25rem' }}>
              Version de travail : cet espace affiche des données d'exemple et n'est pas encore relié à la base. Les dossiers réels apparaîtront ici à la prochaine étape.
            </div>
          )}
          <div className="ligne" style={{ justifyContent: 'space-between' }}>
            <div className="pile" style={{ gap: '.3rem' }}>
              <h1 className="equerre">Commission du 8 décembre 2026</h1>
              <p className="discret">Évaluation à rendre avant le 1er décembre · {dossiers.length} dossiers · vous êtes rapporteur de {mesRapports.length}</p>
            </div>
            <span className="badge att">{dossiers.filter((d) => fait(d.id)).length} / {dossiers.length} portfolios notés</span>
          </div>

          <div className="candidat-grille">
            <nav className="sommaire" aria-label="Dossiers de la session">
              {dossiers.map((d) => (
                <a key={d.id} href={`#${d.id}`} aria-current={d.id === actif ? 'page' : undefined}
                  onClick={(e) => { e.preventDefault(); setActif(d.id); }}>
                  <span className={`pastille ${fait(d.id) ? 'faite' : ''}`} aria-hidden="true">{fait(d.id) ? '✓' : ''}</span>
                  <span>{d.numero}<br /><span className="petit discret">{libSpe(d.principale)}</span></span>
                  {mesRapports.includes(d.id) ? <span className="badge pts">Rapporteur</span> : <span />}
                </a>
              ))}
            </nav>

            <div className="pile" style={{ gap: '1.25rem', minWidth: 0 }}>
              <div className="carte pile">
                <div className="ligne" style={{ justifyContent: 'space-between' }}>
                  <h2>{dossier.numero}</h2>
                  {rapporteur && <span className="badge pts">Vous êtes rapporteur</span>}
                </div>
                <p className="discret">
                  Spécialité principale : <strong>{libSpe(dossier.principale)}</strong>
                  {dossier.autres.length > 0 && <> · Autres : {dossier.autres.map(libSpe).join(', ')}</>}
                </p>
                <div className="message att petit">
                  Avant d'ouvrir les pièces, confirmez n'avoir aucun lien avec ce candidat (associé, salarié, famille, client).
                  En cas de conflit, le dossier est retiré de votre liste.
                </div>
              </div>

              <div className="carte pile">
                <h2 style={{ fontSize: '1.05rem' }}>Galeries (question 4.1)</h2>
                <div className="pile" style={{ gap: '.4rem' }}>
                  {[1, 2, 3].map((i) => <span key={i} className="fichier"><span>Galerie {i} · lien du candidat, ouvert dans un nouvel onglet</span><span className="discret petit">exemple</span></span>)}
                </div>
                <h3 style={{ marginTop: '.5rem' }}>Note du portfolio</h3>
                {CRITERES.map(([k, l]) => (
                  <div className="critere" key={k}>
                    <span>{l}</span>
                    <div className="notes" role="radiogroup" aria-label={l}>
                      {[0, 1, 2, 3, 4].map((v) => (
                        <button key={v} aria-pressed={n[k] === v} className="num"
                          onClick={() => setNotes((p) => ({ ...p, [actif]: { ...(p[actif] ?? {}), [k]: v } }))}>{v}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="ligne" style={{ justifyContent: 'space-between' }}>
                  <span className="discret">Les autres experts ne voient pas votre note.</span>
                  <strong className="num">{noteComplete ? `${totalPortfolio} / 20` : `${totalPortfolio} / 20 (incomplet)`}</strong>
                </div>
              </div>

              <div className="carte pile">
                <h2 style={{ fontSize: '1.05rem' }}>Présence en ligne (question 9.1)</h2>
                <div className="pile" style={{ gap: '.4rem' }}>
                  <span className="fichier"><span>Site internet · lien du candidat</span><span className="discret petit">exemple</span></span>
                  <span className="fichier"><span>Instagram · lien du candidat</span><span className="discret petit">exemple</span></span>
                </div>
                {([['site', 'Site : informations pratiques, mentions légales, cohérence avec le travail', 3], ['reseaux', 'Réseaux sociaux : régularité, qualité et cohérence des publications', 2]] as const).map(([k, l, max]) => (
                  <div className="critere" key={k}>
                    <span>{l}</span>
                    <div className="notes" role="radiogroup" aria-label={l}>
                      {Array.from({ length: max + 1 }, (_, v) => (
                        <button key={v} aria-pressed={n[k] === v} className="num"
                          onClick={() => setNotes((p) => ({ ...p, [actif]: { ...(p[actif] ?? {}), [k]: v } }))}>{v}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {rapporteur ? (
                <div className="carte pile">
                  <h2 style={{ fontSize: '1.05rem' }}>Vérification des justificatifs</h2>
                  <p className="discret petit">Un justificatif jugé non conforme retire les points de la question. Extrait des questions concernées.</p>
                  <div className="tableau-wrap">
                    <table className="tableau">
                      <thead><tr><th>Question</th><th>Pièce</th><th>Avis</th></tr></thead>
                      <tbody>
                        {justificatifs.map((q) => (
                          <tr key={q.code}>
                            <td><span className="num discret">{q.code}</span> {q.libelle}</td>
                            <td className="discret petit">{q.justificatifs}</td>
                            <td>
                              <select className="saisie" aria-label={`Avis sur ${q.code}`} value={avis[actif]?.[q.code] ?? ''}
                                onChange={(e) => setAvis((p) => ({ ...p, [actif]: { ...(p[actif] ?? {}), [q.code]: e.target.value as 'conforme' } }))}>
                                <option value="">À vérifier</option>
                                <option value="conforme">Conforme</option>
                                <option value="non_conforme">Non conforme</option>
                                <option value="a_completer">À compléter</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="encart discret">Les justificatifs de ce dossier sont vérifiés par ses deux rapporteurs. Vous notez uniquement le portfolio.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
