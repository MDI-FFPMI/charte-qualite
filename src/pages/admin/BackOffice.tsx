// Back-office : suivi des dossiers, contrôle de recevabilité (niveau 1),
// attribution des 2 experts vérificateurs au fil de l'eau (niveau 2), pool d'experts.
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import EnTete from '../../components/EnTete';
import VueDossier, { BadgeAvis, ChoixAvis, LIB_AVIS, libSpe, questionsAVerifier, referentiel } from '../../components/VueDossier';
import { equipe, type DossierLigne, type Expert, type Fiche, type NouvelExpert } from '../../lib/equipe';
import { composer, proposerVerificateurs, type ExpertCharge, type Niveau } from '../../lib/composition';
import { dossiersDemo, expertsDemo } from '../../data/demo';
import { useSession } from '../../App';

// ---------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------
function useDonnees<T>(charger: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [erreur, setErreur] = useState('');
  const recharger = useCallback(async () => {
    try { setData(await charger()); setErreur(''); } catch (e) { setErreur((e as Error).message); }
  }, [charger]);
  useEffect(() => { void recharger(); }, [recharger]);
  return { data, erreur, recharger };
}

const dateFr = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '-');
const actifs = (d: DossierLigne) => d.verificateurs.filter((v) => v.statut !== 'conflit');

type Etape = 'saisie' | 'controle' | 'complements' | 'attribuer' | 'verification' | 'a_valider' | 'commission' | 'decide';
export function etapeDe(d: DossierLigne): Etape {
  switch (d.statut) {
    case 'brouillon': return 'saisie';
    case 'envoye': return 'controle';
    case 'complements': return 'complements';
    case 'verification': {
      const a = actifs(d);
      if (a.length < 2) return 'attribuer';
      return a.every((v) => v.statut === 'termine') ? 'a_valider' : 'verification';
    }
    case 'attente_commission': case 'evaluation': case 'deliberation': return 'commission';
    default: return 'decide';
  }
}

const LIB_ETAPE: Record<Etape, [string, string]> = {
  saisie: ['En saisie', 'info'],
  controle: ['À contrôler', 'att'],
  complements: ['Compléments demandés', 'info'],
  attribuer: ['Vérificateurs à attribuer', 'att'],
  verification: ['Vérification en cours', 'pts'],
  a_valider: ['Vérifié, à valider', 'att'],
  commission: ['Prêt pour la commission', 'ok'],
  decide: ['Décidé', 'info'],
};
const LIB_DECIDE: Record<string, string> = { accorde: 'Charte accordée', refuse: 'Charte refusée', suspendu: 'Suspendue', retire: 'Retirée' };

function BadgeEtape({ d }: { d: DossierLigne }) {
  const e = etapeDe(d);
  const [l, c] = LIB_ETAPE[e];
  return <span className={`badge ${e === 'decide' && d.statut === 'accorde' ? 'ok' : c}`}>{e === 'decide' ? LIB_DECIDE[d.statut] ?? l : l}</span>;
}

const versPool = (e: Expert, conflits: string[] = []): ExpertCharge => ({
  id: e.id, nom: `${e.prenom} ${e.nom}`.trim() || e.email, ville: e.ville, specialites: e.specialites, titres: e.titres,
  disponible: e.statut === 'actif', dernierPassage: e.dernierPassage, conflits, enCours: e.enCours, max: e.max,
});

// ---------------------------------------------------------------------
// Tableau de bord
// ---------------------------------------------------------------------
function TableauDeBord({ dossiers, experts, aller }: { dossiers: DossierLigne[]; experts: Expert[]; aller: (f: Etape) => void }) {
  const n = (e: Etape) => dossiers.filter((d) => etapeDe(d) === e).length;
  const tuiles: [Etape, string][] = [
    ['controle', 'dossiers à contrôler'],
    ['attribuer', 'dossiers en attente de vérificateurs'],
    ['a_valider', 'dossiers vérifiés, à valider'],
    ['verification', 'vérifications en cours chez les experts'],
    ['complements', 'en attente de compléments du candidat'],
    ['commission', 'prêts pour la prochaine commission'],
  ];
  const surcharges = experts.filter((e) => e.statut === 'actif' && e.enCours >= e.max);
  return (
    <div className="pile" style={{ gap: '1.5rem' }}>
      <div className="tuiles">
        {tuiles.map(([e, l]) => (
          <button key={e} className="tuile ligne-cliquable" style={{ textAlign: 'left', background: 'var(--fond)', font: 'inherit', color: 'inherit' }} onClick={() => aller(e)}>
            <div className="valeur num">{n(e)}</div><div className="discret">{l}</div>
          </button>
        ))}
      </div>
      <div className="grille-2">
        <div className="carte pile">
          <h2 style={{ fontSize: '1.05rem' }}>Le circuit d'un dossier</h2>
          <ol style={{ margin: 0, paddingLeft: '1.2rem' }} className="pile petit">
            <li><strong>Contrôle de recevabilité</strong> par l'équipe : chaque justificatif est présent, lisible, au bon nom et à jour.</li>
            <li><strong>Deux experts vérificateurs</strong> sont attribués dès que le dossier est recevable. Ils vérifient le fond des justificatifs.</li>
            <li><strong>Validation</strong> par l'équipe une fois les deux vérifications rendues : le dossier part en commission.</li>
          </ol>
        </div>
        <div className="carte pile">
          <h2 style={{ fontSize: '1.05rem' }}>Experts</h2>
          <p><strong className="num">{experts.filter((e) => e.statut === 'actif').length}</strong> experts actifs, <strong className="num">{experts.reduce((s, e) => s + e.enCours, 0)}</strong> vérifications en cours.</p>
          {surcharges.length > 0 && <p className="message att petit">Au plafond : {surcharges.map((e) => `${e.prenom} ${e.nom}`).join(', ')}</p>}
          {!experts.length && <p className="discret petit">Aucun expert pour l'instant. Ajoutez-les dans l'onglet Pool d'experts.</p>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Liste des dossiers
// ---------------------------------------------------------------------
function ListeDossiers({ dossiers, filtre, setFiltre }: { dossiers: DossierLigne[]; filtre: string; setFiltre: (f: string) => void }) {
  const nav = useNavigate();
  const [cherche, setCherche] = useState('');
  const liste = dossiers.filter((d) => (!filtre || etapeDe(d) === filtre)
    && (!cherche || `${d.numero} ${d.candidat} ${d.email} ${d.ville}`.toLowerCase().includes(cherche.toLowerCase())));
  return (
    <div className="pile">
      <div className="ligne">
        <label className="champ" style={{ maxWidth: 280 }}>
          Étape
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">Toutes</option>
            {(Object.keys(LIB_ETAPE) as Etape[]).map((k) => <option key={k} value={k}>{LIB_ETAPE[k][0]}</option>)}
          </select>
        </label>
        <label className="champ" style={{ maxWidth: 280 }}>
          Rechercher
          <input value={cherche} onChange={(e) => setCherche(e.target.value)} placeholder="Numéro, nom, email, ville" />
        </label>
      </div>
      {!liste.length ? <p className="encart discret">Aucun dossier{filtre ? ' à cette étape' : ''}.</p> : (
        <div className="tableau-wrap">
          <table className="tableau">
            <thead><tr><th>Dossier</th><th>Candidat</th><th>Spécialité</th><th>Envoyé le</th><th>Score indicatif</th><th>Vérificateurs</th><th>Étape</th></tr></thead>
            <tbody>
              {liste.map((d) => {
                const a = actifs(d);
                return (
                  <tr key={d.id} className="ligne-cliquable" onClick={() => nav(`/admin/dossier/${d.id}`)}>
                    <td className="num"><Link to={`/admin/dossier/${d.id}`} onClick={(e) => e.stopPropagation()}>{d.numero}</Link></td>
                    <td>{d.candidat || <span className="discret">Non renseigné</span>}<br /><span className="petit discret">{d.ville || d.email}</span></td>
                    <td>{d.principale ? libSpe(d.principale) : '-'}</td>
                    <td className="num">{dateFr(d.envoye_le)}</td>
                    <td className="num">{d.score_indicatif ? Number(d.score_indicatif).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '-'}</td>
                    <td className="petit">{a.length ? `${a.filter((v) => v.statut === 'termine').length} / ${a.length} rendus` : '-'}</td>
                    <td><BadgeEtape d={d} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Fiche dossier
// ---------------------------------------------------------------------
function FicheAdmin({ experts, rechargerListe }: { experts: Expert[]; rechargerListe: () => Promise<void> }) {
  const { id = '' } = useParams();
  const charger = useCallback(() => equipe.fiche(id), [id]);
  const { data: f, erreur, recharger } = useDonnees<Fiche>(charger);
  const [vue, setVue] = useState<'justificatifs' | 'tout'>('justificatifs');
  const [action, setAction] = useState<'' | 'complements'>('');
  const [message, setMessage] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [occupe, setOccupe] = useState('');
  const [retour, setRetour] = useState('');
  const [choixManuel, setChoixManuel] = useState('');

  const aVerif = useMemo(() => (f ? questionsAVerifier(f.reponses, f.pieces) : []), [f]);
  if (erreur) return <div className="message erreur">{erreur}</div>;
  if (!f) return <p className="discret">Chargement du dossier…</p>;
  const d = f.dossier;
  const etape = etapeDe(d);
  const controles = aVerif.filter((q) => f.n1[q.code]);
  const problemes = aVerif.filter((q) => f.n1[q.code] && f.n1[q.code].avis !== 'conforme');
  const editableN1 = d.statut === 'envoye';

  const faire = async (libelle: string, fn: () => Promise<void>, ok: string) => {
    setOccupe(libelle); setRetour('');
    try { await fn(); await recharger(); await rechargerListe(); setRetour(ok); setAction(''); }
    catch (e) { setRetour(`Erreur : ${(e as Error).message}`); }
    setOccupe('');
  };

  const ouvrirComplements = (depuisExperts = false) => {
    const sources = depuisExperts
      ? aVerif.filter((q) => Object.values(f.n2).some((m) => m[q.code] && m[q.code].avis !== 'conforme'))
      : problemes;
    setCodes(sources.map((q) => q.code));
    const details = sources.map((q) => {
      const c = [f.n1[q.code]?.commentaire, ...Object.values(f.n2).map((m) => m[q.code]?.commentaire)].filter(Boolean).join(' ; ');
      return `- ${q.code} ${q.libelle}${c ? ` : ${c}` : ''}`;
    });
    setMessage(details.length ? `Merci de compléter les éléments suivants :\n${details.join('\n')}` : '');
    setAction('complements');
  };

  const actifsD = actifs(d);
  const pool = experts.map((e) => versPool(e, d.verificateurs.filter((v) => v.statut === 'conflit' && v.expert_id === e.id).map(() => d.id)));
  const proposition = proposerVerificateurs(d, pool, actifsD.map((v) => v.expert_id), Math.max(0, 2 - actifsD.length), libSpe);
  const nomExpert = (eid: string) => { const e = experts.find((x) => x.id === eid); return e ? `${e.prenom} ${e.nom}`.trim() || e.email : 'Expert'; };

  return (
    <div className="pile" style={{ gap: '1.5rem' }}>
      <Link to="/admin?onglet=dossiers" className="retour">← Tous les dossiers</Link>

      <div className="carte pile">
        <div className="ligne" style={{ justifyContent: 'space-between' }}>
          <h1 className="equerre" style={{ fontSize: '1.5rem' }}>{d.numero}</h1>
          <BadgeEtape d={d} />
        </div>
        <div className="champs-lecture">
          <span><span className="discret petit">Entreprise</span><br /><strong>{d.candidat || '-'}</strong></span>
          <span><span className="discret petit">Contact</span><br />{d.contact || '-'}<br /><a href={`mailto:${d.email}`} className="petit">{d.email}</a></span>
          <span><span className="discret petit">Spécialités</span><br />{d.principale ? <><span className="puce-spe ref">{libSpe(d.principale)}</span>{d.autres.map((a) => <span key={a} className="puce-spe">{libSpe(a)}</span>)}</> : '-'}</span>
          <span><span className="discret petit">Charte de déontologie</span><br />{d.charte_acceptee_le
            ? <><span className="badge ok">Acceptée le {dateFr(d.charte_acceptee_le)} · v{d.charte_version}</span>
              {d.charte_phrase && <><br /><span className="petit discret">« {d.charte_phrase} »</span></>}</>
            : <span className="badge info">Pas encore acceptée</span>}</span>
          <span><span className="discret petit">Envoyé le · score indicatif</span><br /><span className="num">{dateFr(d.envoye_le)} · {d.score_indicatif ? `${Number(d.score_indicatif).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} / ${referentiel.version.base_score}` : '-'}</span></span>
        </div>
      </div>

      {retour && <div className={`message ${retour.startsWith('Erreur') ? 'erreur' : 'ok'}`} role="status">{retour}</div>}

      {/* Étape en cours */}
      <div className="carte pile bloc-etape">
        {etape === 'saisie' && <><h2 style={{ fontSize: '1.1rem' }}>En cours de saisie</h2><p className="discret">Le candidat n'a pas encore envoyé son dossier.</p></>}

        {etape === 'controle' && (
          <>
            <h2 style={{ fontSize: '1.1rem' }}>1. Contrôle de recevabilité</h2>
            <p className="discret petit">Pour chaque justificatif : présent, lisible, au nom du candidat, à jour. Le fond est vérifié ensuite par deux experts.</p>
            <div className="progression" aria-hidden="true"><span style={{ width: `${aVerif.length ? (controles.length / aVerif.length) * 100 : 100}%` }} /></div>
            <p className="petit"><strong className="num">{controles.length} / {aVerif.length}</strong> justificatifs contrôlés{problemes.length > 0 && <>, dont <strong>{problemes.length}</strong> à reprendre</>}.</p>
            <div className="ligne">
              <button className="bouton principal" disabled={!!occupe || controles.length < aVerif.length || problemes.some((q) => f.n1[q.code].avis === 'a_completer')}
                onClick={() => faire('recevable', () => equipe.declarerRecevable(d.id), 'Dossier déclaré recevable. Attribuez maintenant ses deux vérificateurs.')}>
                Déclarer recevable
              </button>
              <button className="bouton secondaire" disabled={!!occupe} onClick={() => ouvrirComplements()}>Demander des compléments</button>
            </div>
            {controles.length < aVerif.length && <p className="petit discret">Contrôlez tous les justificatifs ci-dessous pour pouvoir déclarer le dossier recevable.</p>}
            {problemes.some((q) => f.n1[q.code].avis === 'non_conforme') && (
              <p className="message att petit">Un justificatif non conforme sur une condition obligatoire entraîne en principe un refus. Vous pouvez quand même transmettre le dossier aux experts.</p>
            )}
          </>
        )}

        {etape === 'complements' && (
          <>
            <h2 style={{ fontSize: '1.1rem' }}>En attente de compléments</h2>
            <p className="petit">Questions rouvertes : <strong>{d.questions_rouvertes.join(', ') || '-'}</strong></p>
            {d.message_complements && <div className="encart petit" style={{ whiteSpace: 'pre-wrap' }}>{d.message_complements}</div>}
            <p className="discret petit">Quand le candidat renvoie son dossier, il revient à l'étape « À contrôler ».</p>
          </>
        )}

        {(etape === 'attribuer' || etape === 'verification' || etape === 'a_valider') && (
          <>
            <h2 style={{ fontSize: '1.1rem' }}>2. Vérification par deux experts</h2>
            {d.verificateurs.length > 0 && (
              <div className="pile" style={{ gap: '.5rem' }}>
                {d.verificateurs.map((v) => (
                  <div key={v.expert_id} className="encart ligne" style={{ justifyContent: 'space-between' }}>
                    <span className="pile" style={{ gap: '.15rem' }}>
                      <strong>{v.nom || nomExpert(v.expert_id)}</strong>
                      <span className="petit discret">Attribué le {dateFr(v.attribue_le)}{v.termine_le && v.statut === 'termine' ? ` · rendu le ${dateFr(v.termine_le)}` : ''}</span>
                      {v.commentaire && <span className="petit" style={{ whiteSpace: 'pre-wrap' }}>{v.statut === 'conflit' ? 'Motif : ' : ''}{v.commentaire}</span>}
                    </span>
                    <span className="ligne" style={{ gap: '.5rem' }}>
                      {v.statut === 'en_cours' && <span className="badge pts">En cours</span>}
                      {v.statut === 'conflit' && <span className="badge info">Conflit d'intérêts déclaré</span>}
                      {v.statut === 'termine' && <span className={`badge ${v.avis_global === 'favorable' ? 'ok' : v.avis_global === 'defavorable' ? 'ko' : 'att'}`}>Avis {v.avis_global === 'favorable' ? 'favorable' : v.avis_global === 'defavorable' ? 'défavorable' : 'avec réserves'}</span>}
                      {v.statut === 'en_cours' && (
                        <button className="retirer" disabled={!!occupe} onClick={() => faire('retirer', () => equipe.retirerVerificateur(d.id, v.expert_id), 'Vérificateur retiré.')}>Retirer</button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {actifsD.length < 2 && (
              <div className="pile" style={{ gap: '.6rem' }}>
                <h3>{actifsD.length ? 'Second vérificateur' : 'Vérificateurs proposés'}</h3>
                {!experts.length && <p className="message att petit">Aucun expert dans le pool. Ajoutez-en dans l'onglet Pool d'experts.</p>}
                {proposition.length > 0 && (
                  <>
                    {proposition.map((p) => (
                      <div key={p.id} className="ligne petit"><strong>{nomExpert(p.id)}</strong><span className="discret">{p.raison}</span>
                        {p.pertinence < 2 && <span className="badge att">Pas de référent disponible</span>}</div>
                    ))}
                    <div className="ligne">
                      <button className="bouton principal" disabled={!!occupe}
                        onClick={() => faire('attribuer', () => equipe.attribuer(d.id, proposition.map((p) => p.id)), 'Vérificateurs attribués. Le dossier apparaît dans leur espace expert.')}>
                        Attribuer {proposition.length > 1 ? 'ces deux experts' : 'cet expert'}
                      </button>
                    </div>
                  </>
                )}
                {experts.length > 0 && (
                  <div className="ligne">
                    <select className="saisie" value={choixManuel} onChange={(e) => setChoixManuel(e.target.value)} aria-label="Choisir un autre expert">
                      <option value="">Ou choisir un autre expert…</option>
                      {experts.filter((e) => e.statut === 'actif' && !actifsD.some((v) => v.expert_id === e.id)).map((e) => (
                        <option key={e.id} value={e.id}>{`${e.prenom} ${e.nom}`.trim() || e.email} · {e.enCours} en cours</option>
                      ))}
                    </select>
                    <button className="bouton secondaire petit-btn" disabled={!choixManuel || !!occupe}
                      onClick={() => faire('attribuer', async () => { await equipe.attribuer(d.id, [choixManuel]); setChoixManuel(''); }, 'Expert attribué.')}>Attribuer</button>
                  </div>
                )}
              </div>
            )}

            {etape === 'a_valider' && (
              <div className="pile" style={{ gap: '.6rem' }}>
                <h3>3. Validation</h3>
                <p className="petit discret">Les deux vérifications sont rendues. Relisez les avis ci-dessous, puis décidez.</p>
                <div className="ligne">
                  <button className="bouton principal" disabled={!!occupe}
                    onClick={() => faire('valider', () => equipe.validerPourCommission(d.id), 'Dossier prêt pour la prochaine commission.')}>Valider pour la commission</button>
                  <button className="bouton secondaire" disabled={!!occupe} onClick={() => ouvrirComplements(true)}>Demander des compléments</button>
                </div>
              </div>
            )}
          </>
        )}

        {etape === 'commission' && <><h2 style={{ fontSize: '1.1rem' }}>Prêt pour la commission</h2><p className="discret">Recevable et vérifié par deux experts. Il sera proposé à la prochaine commission.</p></>}
        {etape === 'decide' && <><h2 style={{ fontSize: '1.1rem' }}>{LIB_DECIDE[d.statut] ?? 'Dossier clos'}</h2></>}

        {action === 'complements' && (
          <form className="pile encart" onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void faire('complements', () => equipe.demanderComplements(d.id, codes, message.trim()), 'Demande envoyée : le candidat peut modifier les questions rouvertes.');
          }}>
            <h3>Demande de compléments</h3>
            <p className="petit discret">Le candidat ne pourra modifier que les questions cochées. Prévenez-le par email : l'envoi automatique arrive avec l'adresse charte-qualite@ffpmi.eu.</p>
            <div className="pile" style={{ gap: '.3rem', maxHeight: 220, overflow: 'auto' }}>
              {aVerif.map((q) => (
                <label key={q.code} className="ligne petit" style={{ gap: '.5rem', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                  <input type="checkbox" checked={codes.includes(q.code)} onChange={(e) => setCodes((c) => e.target.checked ? [...c, q.code] : c.filter((x) => x !== q.code))} />
                  <span><span className="num discret">{q.code}</span> {q.libelle}</span>
                </label>
              ))}
            </div>
            <label className="champ">
              Message au candidat
              <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required />
            </label>
            <div className="ligne">
              <button className="bouton principal" disabled={!codes.length || !message.trim() || !!occupe}>Envoyer la demande</button>
              <button type="button" className="bouton secondaire" onClick={() => setAction('')}>Annuler</button>
            </div>
          </form>
        )}
      </div>

      {/* Le dossier */}
      <div className="ligne" style={{ justifyContent: 'space-between' }}>
        <h2 className="equerre" style={{ fontSize: '1.2rem' }}>Le dossier</h2>
        <div className="onglets" role="tablist" style={{ marginBottom: 0, borderBottom: 0 }}>
          <button role="tab" aria-selected={vue === 'justificatifs'} onClick={() => setVue('justificatifs')}>Justificatifs ({aVerif.length})</button>
          <button role="tab" aria-selected={vue === 'tout'} onClick={() => setVue('tout')}>Toutes les réponses</button>
        </div>
      </div>
      <VueDossier reponses={f.reponses} pieces={f.pieces} seulementJustificatifs={vue === 'justificatifs'}
        panneau={(q) => (
          <>
            <div className="pile" style={{ gap: '.3rem' }}>
              <span className="petit discret" style={{ fontWeight: 600 }}>Contrôle FFPMI</span>
              <ChoixAvis key={`${q.code}-${f.n1[q.code]?.avis ?? ''}`} valeur={f.n1[q.code]} verrouille={!editableN1}
                onChange={async (a, c) => { await equipe.controler(d.id, q.code, a, c); await recharger(); }} />
            </div>
            {d.verificateurs.filter((v) => v.statut !== 'conflit').map((v) => (
              <div key={v.expert_id} className="pile" style={{ gap: '.3rem' }}>
                <span className="petit discret" style={{ fontWeight: 600 }}>{v.nom || nomExpert(v.expert_id)}</span>
                <BadgeAvis a={f.n2[v.expert_id]?.[q.code]} />
              </div>
            ))}
          </>
        )} />
    </div>
  );
}

// ---------------------------------------------------------------------
// Pool d'experts
// ---------------------------------------------------------------------
const NIVEAUX: [Niveau | '', string][] = [['', '-'], ['competent', 'Compétent'], ['referent', 'Référent']];

function FormExpert({ initial, nouveau, onFini }: { initial?: Expert; nouveau?: boolean; onFini: (msg: string) => Promise<void> }) {
  const [v, setV] = useState<NouvelExpert>({
    email: initial?.email ?? '', prenom: initial?.prenom ?? '', nom: initial?.nom ?? '', ville: initial?.ville ?? '',
    specialites: initial?.specialites ?? [], titres: initial?.titres ?? [], max: initial?.max ?? 15,
  });
  const [statut, setStatut] = useState<Expert['statut']>(initial?.statut ?? 'actif');
  const [titres, setTitres] = useState((initial?.titres ?? []).join(', '));
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);
  const niv = (c: string) => v.specialites.find((s) => s.code === c)?.niveau ?? '';
  const setNiv = (c: string, n: Niveau | '') =>
    setV((x) => ({ ...x, specialites: [...x.specialites.filter((s) => s.code !== c), ...(n ? [{ code: c, niveau: n }] : [])] }));

  const envoyer = async (e: FormEvent) => {
    e.preventDefault(); setErreur('');
    if (nouveau && !/^\S+@\S+\.\S+$/.test(v.email)) { setErreur('Adresse email invalide.'); return; }
    if (!v.specialites.length) { setErreur('Indiquez au moins une spécialité.'); return; }
    setOccupe(true);
    const t = titres.split(',').map((x) => x.trim()).filter(Boolean);
    try {
      if (nouveau) {
        const r = await equipe.ajouterExpert({ ...v, titres: t });
        await onFini(r.emailEnvoye
          ? `${v.prenom} ${v.nom} est ajouté au pool. Il a reçu un lien par email pour choisir son mot de passe.`
          : `${v.prenom} ${v.nom} est ajouté au pool. Son compte existait déjà : il se connecte à l'espace expert avec son mot de passe.`);
      } else {
        await equipe.modifierExpert(initial!.id, { prenom: v.prenom, nom: v.nom, ville: v.ville, specialites: v.specialites, titres: t, max: v.max, statut });
        await onFini('Fiche expert mise à jour.');
      }
    } catch (err) { setErreur((err as Error).message); }
    setOccupe(false);
  };

  return (
    <form className="pile" onSubmit={envoyer}>
      <div className="champs-grille">
        {nouveau && <label className="champ">Email<input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} required /></label>}
        <label className="champ">Prénom<input value={v.prenom} onChange={(e) => setV({ ...v, prenom: e.target.value })} required /></label>
        <label className="champ">Nom<input value={v.nom} onChange={(e) => setV({ ...v, nom: e.target.value })} required /></label>
        <label className="champ">Ville<input value={v.ville} onChange={(e) => setV({ ...v, ville: e.target.value })} /></label>
        <label className="champ">Titres et distinctions<input value={titres} onChange={(e) => setTitres(e.target.value)} placeholder="Séparés par des virgules" /></label>
        <label className="champ">Vérifications en cours au maximum<input type="number" min={1} max={50} value={v.max} onChange={(e) => setV({ ...v, max: Number(e.target.value) || 1 })} /></label>
        {!nouveau && (
          <label className="champ">Statut
            <select value={statut} onChange={(e) => setStatut(e.target.value as Expert['statut'])}>
              <option value="actif">Actif</option><option value="pause">En pause</option><option value="retire">Retiré du pool</option>
            </select>
          </label>
        )}
      </div>
      <fieldset className="pile" style={{ border: 0, padding: 0, margin: 0, gap: '.4rem' }}>
        <legend className="petit" style={{ fontWeight: 600, marginBottom: '.4rem' }}>Spécialités</legend>
        <div className="champs-lecture">
          {referentiel.specialites.map((s) => (
            <label key={s.value} className="ligne petit" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
              <span>{s.label}</span>
              <select className="saisie petit" value={niv(s.value)} onChange={(e) => setNiv(s.value, e.target.value as Niveau | '')}>
                {NIVEAUX.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
          ))}
        </div>
      </fieldset>
      {erreur && <div className="message erreur" role="alert">{erreur}</div>}
      <div className="ligne">
        <button className="bouton principal" disabled={occupe}>{occupe ? 'Enregistrement…' : nouveau ? "Ajouter et envoyer l'invitation" : 'Enregistrer'}</button>
        <button type="button" className="bouton secondaire" onClick={() => onFini('')}>Annuler</button>
      </div>
    </form>
  );
}

function Pool({ experts, recharger }: { experts: Expert[]; recharger: () => Promise<void> }) {
  const { utilisateur } = useSession();
  const [edition, setEdition] = useState<string>('');
  const [retour, setRetour] = useState('');
  const fini = async (msg: string) => { setEdition(''); if (msg) { setRetour(msg); await recharger(); } };
  return (
    <div className="pile" style={{ gap: '1.25rem' }}>
      {retour && <div className="message ok" role="status">{retour}</div>}
      {edition === 'nouveau' ? (
        <div className="carte pile">
          <h2 style={{ fontSize: '1.1rem' }}>Ajouter un expert</h2>
          <p className="petit discret">Si vous avez déjà créé son compte dans Supabase avec un mot de passe provisoire, il se connecte directement. Sinon, son compte est créé ici et il reçoit un lien pour choisir son mot de passe.</p>
          <FormExpert nouveau onFini={fini} />
        </div>
      ) : (
        <div className="ligne" style={{ justifyContent: 'space-between' }}>
          <p className="discret">{experts.length} expert{experts.length > 1 ? 's' : ''} dans le pool.</p>
          {utilisateur?.role === 'admin' && <button className="bouton principal" onClick={() => { setRetour(''); setEdition('nouveau'); }}>Ajouter un expert</button>}
        </div>
      )}
      <div className="grille-2">
        {experts.map((e) => (
          <div className="carte expert-carte pile" key={e.id} style={{ gap: '.5rem' }}>
            {edition === e.id ? <FormExpert initial={e} onFini={fini} /> : (
              <>
                <div className="ligne" style={{ justifyContent: 'space-between' }}>
                  <strong>{`${e.prenom} ${e.nom}`.trim() || e.email}</strong>
                  <span className={`badge ${e.statut === 'actif' ? 'ok' : 'info'}`}>{e.statut === 'actif' ? 'Actif' : e.statut === 'pause' ? 'En pause' : 'Retiré'}</span>
                </div>
                <span className="petit discret">{[e.ville, e.email, ...e.titres].filter(Boolean).join(' · ')}</span>
                <div>{e.specialites.map((s) => <span key={s.code} className={`puce-spe${s.niveau === 'referent' ? ' ref' : ''}`}>{libSpe(s.code)}{s.niveau === 'referent' ? ' · référent' : ''}</span>)}</div>
                <div className="ligne" style={{ justifyContent: 'space-between' }}>
                  <span className="petit"><strong className="num">{e.enCours}</strong> / {e.max} vérifications en cours · <span className="num">{e.terminees}</span> rendues</span>
                  <button className="bouton secondaire petit-btn" onClick={() => { setRetour(''); setEdition(e.id); }}>Modifier</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Composition de commission (aperçu sur données d'exemple)
// ---------------------------------------------------------------------
function Commission() {
  const prets = dossiersDemo.filter((d) => d.statut === 'attente_commission');
  const p = useMemo(() => composer(prets, expertsDemo, 6, new Date('2026-10-14'), libSpe), [prets]);
  return (
    <div className="pile" style={{ gap: '1.5rem' }}>
      <div className="message att">Aperçu sur des dossiers et experts d'exemple. La composition des commissions sera reliée à la base à l'étape suivante.</div>
      <div className="pile" style={{ gap: '.3rem' }}>
        <h2 className="equerre">Commission du 8 décembre 2026</h2>
        <p className="discret">{prets.length} dossiers prêts · 6 experts proposés pour noter les galeries · les vérificateurs de chaque dossier le présentent en séance.</p>
      </div>
      {p.alertes.length > 0 && <div className="message att">{p.alertes.map((a) => <div key={a}>{a}</div>)}</div>}
      <div className="grille-2">
        {p.experts.map((x) => {
          const e = expertsDemo.find((y) => y.id === x.id)!;
          return (
            <div className="carte expert-carte" key={x.id}>
              <strong>{e.nom}</strong>
              <span className="petit discret">{e.ville}{e.titres.length ? ` · ${e.titres.join(', ')}` : ''}</span>
              <div>{e.specialites.map((s) => <span key={s.code} className={`puce-spe${s.niveau === 'referent' ? ' ref' : ''}`}>{libSpe(s.code)}</span>)}</div>
              <p className="petit">{x.raison}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
const ONGLETS = [['bord', 'Tableau de bord'], ['dossiers', 'Dossiers'], ['commission', 'Préparer une commission'], ['experts', "Pool d'experts"]] as const;
type Onglet = (typeof ONGLETS)[number][0];

function Accueil({ dossiers, experts, rechargerExperts }: { dossiers: DossierLigne[]; experts: Expert[]; rechargerExperts: () => Promise<void> }) {
  const [params, setParams] = useSearchParams();
  const onglet = (params.get('onglet') as Onglet) || 'bord';
  const filtre = params.get('etape') ?? '';
  const aller = (o: Onglet, etape = '') => setParams(etape ? { onglet: o, etape } : { onglet: o });
  return (
    <>
      <div className="onglets" role="tablist">
        {ONGLETS.map(([k, l]) => <button key={k} role="tab" aria-selected={onglet === k} onClick={() => aller(k)}>{l}</button>)}
      </div>
      {onglet === 'bord' && <TableauDeBord dossiers={dossiers} experts={experts} aller={(e) => aller('dossiers', e)} />}
      {onglet === 'dossiers' && <ListeDossiers dossiers={dossiers} filtre={filtre} setFiltre={(e) => aller('dossiers', e)} />}
      {onglet === 'commission' && <Commission />}
      {onglet === 'experts' && <Pool experts={experts} recharger={rechargerExperts} />}
    </>
  );
}

export default function BackOffice() {
  const chargerDossiers = useCallback(() => equipe.dossiers(), []);
  const chargerExperts = useCallback(() => equipe.experts(), []);
  const ds = useDonnees(chargerDossiers);
  const ex = useDonnees(chargerExperts);
  const toutRecharger = async () => { await Promise.all([ds.recharger(), ex.recharger()]); };
  return (
    <>
      <EnTete espace="admin" liens={[{ to: '/admin', label: 'Charte Qualité', end: true }]} />
      <main className="gouttiere">
        <div className="conteneur">
          {(ds.erreur || ex.erreur) && <div className="message erreur" style={{ marginBottom: '1rem' }}>{ds.erreur || ex.erreur}</div>}
          {!ds.data || !ex.data ? <p className="discret">Chargement…</p> : (
            <Routes>
              <Route index element={<Accueil dossiers={ds.data} experts={ex.data} rechargerExperts={toutRecharger} />} />
              <Route path="dossier/:id" element={<FicheAdmin experts={ex.data} rechargerListe={toutRecharger} />} />
            </Routes>
          )}
        </div>
      </main>
    </>
  );
}
