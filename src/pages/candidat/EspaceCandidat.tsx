import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import EnTete from '../../components/EnTete';
import QuestionChamp from '../../components/QuestionChamp';
import refJson from '../../data/referentiel-v3.json';
import EncadreCharte from '../../components/EncadreCharte';
import MaFiche from './MaFiche';
import { CHARTE_VERSION } from '../../data/charte-deontologie';
import { api, type Dossier } from '../../lib/api';
import { bilanDossier, estAffichee, valeursChoisies } from '../../lib/scoring';
import type { Piece, Referentiel, Reponse, Reponses } from '../../lib/types';

const ref = refJson as Referentiel;

const libelleStatut: Record<Dossier['statut'], string> = {
  brouillon: 'En cours de saisie',
  envoye: 'Envoyé, en cours de vérification',
  complements: 'Compléments demandés',
  verification: 'Recevable, vérification par les experts',
  attente_commission: 'Recevable, en attente de commission',
  evaluation: 'En évaluation par la commission',
  deliberation: 'En délibération',
  accorde: 'Charte accordée',
  refuse: 'Charte refusée',
  suspendu: 'Charte suspendue',
  retire: 'Charte retirée',
};

function useDossier() {
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [reponses, setReponses] = useState<Reponses>({});
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [charge, setCharge] = useState(false);
  const [sauvegarde, setSauvegarde] = useState<'' | 'encours' | 'ok' | string>('');
  const minuteurs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const recharger = useCallback(async () => {
    const d = await api.monDossier();
    setDossier(d);
    if (d) {
      const [r, p] = await Promise.all([api.reponses(d.id), api.pieces(d.id)]);
      setReponses(r); setPieces(p);
    }
    setCharge(true);
  }, []);
  useEffect(() => { void recharger(); }, [recharger]);

  const repondre = (code: string, r: Reponse) => {
    if (!dossier) return;
    setReponses((prev) => ({ ...prev, [code]: r }));
    setSauvegarde('encours');
    clearTimeout(minuteurs.current[code]);
    minuteurs.current[code] = setTimeout(async () => {
      try { await api.enregistrer(dossier.id, code, r); setSauvegarde('ok'); }
      catch (e) { setSauvegarde((e as Error).message); }
    }, 500);
  };
  const deposer = async (code: string, f: File) => {
    if (!dossier) return;
    const p = await api.deposer(dossier.id, code, f);
    setPieces((prev) => [...prev, p]);
  };
  const retirer = async (p: Piece) => {
    await api.supprimerPiece(p);
    setPieces((prev) => prev.filter((x) => x.id !== p.id));
  };
  return { dossier, reponses, pieces, charge, sauvegarde, repondre, deposer, retirer, recharger };
}

type Etat = ReturnType<typeof useDossier>;

const modifiable = (d: Dossier, code?: string) =>
  d.statut === 'brouillon' || (d.statut === 'complements' && (!code || d.questions_rouvertes.includes(code)));

function EtatSauvegarde({ s }: { s: string }) {
  if (!s) return null;
  if (s === 'encours') return <span className="etat-sauvegarde" role="status">Enregistrement…</span>;
  if (s === 'ok') return <span className="etat-sauvegarde" role="status">Enregistré automatiquement</span>;
  return <span className="etat-sauvegarde" role="alert" style={{ color: 'var(--critique)' }}>{s}</span>;
}

function Sommaire({ e }: { e: Etat }) {
  const bilan = bilanDossier(ref, e.reponses, e.pieces, false);
  return (
    <nav className="sommaire" aria-label="Rubriques du dossier">
      <NavLink to="/candidat" end><span className="pastille" aria-hidden="true">≡</span><span>Tableau de bord</span><span /></NavLink>
      {ref.rubriques.map((r) => {
        const p = bilan.progression.find((x) => x.numero === r.numero)!;
        const etat = p.repondues > 0 && p.requisesFaites === p.requises ? 'faite' : p.repondues > 0 ? 'encours' : '';
        return (
          <NavLink key={r.numero} to={`/candidat/rubrique/${r.numero}`}>
            <span className={`pastille ${etat}`} aria-hidden="true">{etat === 'faite' ? '✓' : r.numero === 0 ? 'i' : r.numero}</span>
            <span>{r.titre}</span>
            <span className="petit discret num">{p.repondues}/{p.total}</span>
          </NavLink>
        );
      })}
      <NavLink to="/candidat/envoi"><span className="pastille" aria-hidden="true">→</span><span>Vérifier et envoyer</span><span /></NavLink>
      <NavLink to="/candidat/fiche"><span className="pastille" aria-hidden="true">◎</span><span>Ma fiche annuaire</span><span /></NavLink>
    </nav>
  );
}

function TableauDeBord({ e }: { e: Etat }) {
  const d = e.dossier!;
  const bilan = bilanDossier(ref, e.reponses, e.pieces, false);
  const total = bilan.progression.reduce((s, p) => s + p.requises, 0);
  const faites = bilan.progression.reduce((s, p) => s + p.requisesFaites, 0);
  const prochaine = ref.rubriques.find((r) => {
    const p = bilan.progression.find((x) => x.numero === r.numero)!;
    return p.requisesFaites < p.requises;
  });
  return (
    <div className="pile" style={{ gap: '1.5rem' }}>
      <div className="ligne" style={{ justifyContent: 'space-between' }}>
        <div className="pile" style={{ gap: '.3rem' }}>
          <h1 className="equerre">Mon dossier</h1>
          <p className="discret num">Dossier {d.numero} · Référentiel {ref.version.id}</p>
        </div>
        <span className={`badge ${d.statut === 'accorde' ? 'ok' : d.statut === 'refuse' ? 'ko' : d.statut === 'brouillon' ? 'info' : 'att'}`} style={{ fontSize: '.85rem' }}>
          {libelleStatut[d.statut]}
        </span>
      </div>

      {d.statut === 'complements' && (
        <div className="message att">
          <strong>Des compléments vous sont demandés.</strong> {d.message_complements}
          {' '}Seules les questions concernées sont rouvertes : {d.questions_rouvertes.join(', ')}.
        </div>
      )}

      <div className="grille-2">
        <div className="carte pile">
          <h2 style={{ fontSize: '1.05rem' }}>Progression</h2>
          <div className="score-bloc"><span className="grand num">{Math.round((faites / total) * 100)} %</span><span className="discret num">{faites} réponse{faites > 1 ? 's' : ''} obligatoire{faites > 1 ? 's' : ''} sur {total}</span></div>
          <div className={`jauge${faites === total ? ' complete' : ''}`}><span style={{ width: `${(faites / total) * 100}%` }} /></div>
          {d.statut === 'brouillon' && prochaine && (
            <Link className="bouton principal" to={`/candidat/rubrique/${prochaine.numero}`}>Continuer : {prochaine.titre}</Link>
          )}
          {d.statut === 'brouillon' && !prochaine && <Link className="bouton principal" to="/candidat/envoi">Vérifier et envoyer</Link>}
        </div>
        <div className="carte pile">
          <h2 style={{ fontSize: '1.05rem' }}>Score indicatif</h2>
          <div className="score-bloc">
            <span className="grand num">{bilan.scoreIndicatif.toLocaleString('fr-FR')}</span>
            <span className="discret">sur {ref.version.base_score}</span>
          </div>
          <div className="message info petit" style={{ margin: 0 }}>
            <strong>Ce score est une simple aide pour vous repérer, pas un résultat.</strong> Il est calculé automatiquement à partir de vos réponses,
            comme si elles étaient toutes justifiées.
          </div>
          <ul className="petit discret pile" style={{ gap: '.35rem', margin: 0, paddingLeft: '1.1rem' }}>
            <li>Les points ne sont validés qu'après l'étude des documents que vous envoyez : leur pertinence et leur véracité sont vérifiées.
              Une réponse sans justificatif valable peut ne pas rapporter de points.</li>
            <li>Certains points ne sont attribués qu'après l'étude du dossier par les experts de la commission, notamment le portfolio et le matériel
              (<span className="num">{bilan.pointsExperts}</span> points bruts). Ils ne sont pas comptés ici.</li>
            <li>Si la commission accordait la totalité de ces points, votre score pourrait atteindre <span className="num">{bilan.scoreMaxAtteignable.toLocaleString('fr-FR')}</span>.
              La Charte est accordée à partir de {ref.version.seuil_obtention} points, après décision de la commission.</li>
          </ul>
        </div>
      </div>

      {(bilan.eliminatoiresEchouees.length > 0 || bilan.justificatifsManquants.length > 0) && (
        <div className="carte pile">
          <h2 style={{ fontSize: '1.05rem' }}>À reprendre</h2>
          <ul className="pile" style={{ gap: '.4rem', margin: 0, paddingLeft: '1.1rem' }}>
            {bilan.eliminatoiresEchouees.map((q) => <li key={q.code}><span className="badge elim">Condition obligatoire</span> {q.code} {q.libelle}</li>)}
            {bilan.justificatifsManquants.map((q) => <li key={q.code}>Justificatif manquant : {q.code} {q.libelle}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function PageRubrique({ e }: { e: Etat }) {
  const { n } = useParams();
  const nav = useNavigate();
  const rub = ref.rubriques.find((r) => r.numero === Number(n));
  useEffect(() => { window.scrollTo?.(0, 0); }, [n]);
  if (!rub) return <p>Rubrique introuvable.</p>;
  const d = e.dossier!;
  const specialites = valeursChoisies(e.reponses['2.2']?.valeur);
  const visibles = rub.questions.filter((q) => estAffichee(q, e.reponses, ref));
  const suivante = ref.rubriques.find((r) => r.numero === rub.numero + 1);
  return (
    <div className="pile" style={{ gap: '1.25rem' }}>
      <div className="pile" style={{ gap: '.4rem' }}>
        <p className="petit discret num">{rub.numero === 0 ? 'Avant de commencer' : `Rubrique ${rub.numero} sur ${ref.rubriques.filter((r) => r.numero > 0).length}`}</p>
        <h1 className="equerre">{rub.titre}</h1>
        {rub.intro && <p className="discret">{rub.intro}</p>}
        <div className="ligne"><EtatSauvegarde s={e.sauvegarde} /></div>
      </div>
      {visibles.map((q) => (
        <QuestionChamp key={q.code} q={q} referentiel={ref} reponse={e.reponses[q.code]} toutesReponses={e.reponses} specialitesChoisies={specialites}
          pieces={e.pieces} verrouille={!modifiable(d, q.code)}
          onChange={(r) => e.repondre(q.code, r)} onDepot={(f) => e.deposer(q.code, f)} onRetirer={e.retirer} />
      ))}
      <div className="ligne" style={{ justifyContent: 'space-between' }}>
        {rub.numero > 0
          ? <button className="bouton secondaire" onClick={() => nav(`/candidat/rubrique/${rub.numero - 1}`)}>Rubrique précédente</button>
          : <span />}
        {suivante
          ? <button className="bouton principal" onClick={() => nav(`/candidat/rubrique/${suivante.numero}`)}>Rubrique suivante : {suivante.titre}</button>
          : <button className="bouton principal" onClick={() => nav('/candidat/envoi')}>Vérifier et envoyer</button>}
      </div>
    </div>
  );
}

function PageEnvoi({ e }: { e: Etat }) {
  const [coches, setCoches] = useState<boolean[]>(ref.attestation.map(() => false));
  const [phrase, setPhrase] = useState('');
  const [charteOk, setCharteOk] = useState(false);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const d = e.dossier!;
  const tout = coches.every(Boolean) && charteOk;
  const bilan = useMemo(() => bilanDossier(ref, e.reponses, e.pieces, tout), [e.reponses, e.pieces, tout]);
  const elimManquants = bilan.justificatifsManquants.filter((q) => q.statut === 'eliminatoire');
  const valoManquants = bilan.justificatifsManquants.filter((q) => q.statut !== 'eliminatoire');
  const lien = (code: string) => `/candidat/rubrique/${code.split('.')[0]}`;
  const vous = (e.reponses['0.1']?.valeur ?? {}) as Record<string, string>;
  const ent = (e.reponses['0.2']?.valeur ?? {}) as Record<string, string>;

  if (!modifiable(d)) {
    return (
      <div className="pile">
        <h1 className="equerre">Dossier envoyé</h1>
        <div className="message ok">
          Votre dossier {d.numero} a bien été envoyé{d.envoye_le ? ` le ${new Date(d.envoye_le).toLocaleDateString('fr-FR')}` : ''}.
          Nous vérifions vos pièces, puis il sera présenté à la prochaine commission. Vous serez prévenu par email à chaque étape.
        </div>
      </div>
    );
  }

  const envoyer = async () => {
    setErreur(''); setEnvoi(true);
    try { await api.envoyerDossier(d.id, bilan.scoreIndicatif, CHARTE_VERSION, phrase.trim()); await e.recharger(); }
    catch (err) { setErreur((err as Error).message); }
    setEnvoi(false);
  };

  return (
    <div className="pile" style={{ gap: '1.5rem' }}>
      <div className="pile" style={{ gap: '.4rem' }}>
        <h1 className="equerre">Vérifier et envoyer</h1>
        <p className="discret">Une fois envoyé, le dossier n'est plus modifiable, sauf si la commission vous demande des compléments.</p>
      </div>

      <div className="carte pile">
        <h2 style={{ fontSize: '1.05rem' }}>Ce qui bloque l'envoi</h2>
        {bilan.questionsSansReponse.length + bilan.eliminatoiresEchouees.length + elimManquants.length === 0
          ? <p className="message ok">Toutes les questions requises sont remplies et les conditions obligatoires sont validées.</p>
          : (
            <ul className="pile" style={{ gap: '.4rem', margin: 0, paddingLeft: '1.1rem' }}>
              {bilan.eliminatoiresEchouees.map((q) => <li key={`e${q.code}`}><Link to={lien(q.code)}>{q.code}</Link> Condition obligatoire non remplie : {q.libelle}</li>)}
              {elimManquants.map((q) => <li key={`j${q.code}`}><Link to={lien(q.code)}>{q.code}</Link> Justificatif requis : {q.libelle}</li>)}
              {bilan.questionsSansReponse.map((q) => <li key={`s${q.code}`}><Link to={lien(q.code)}>{q.code}</Link> Sans réponse : {q.libelle}</li>)}
            </ul>
          )}
        {valoManquants.length > 0 && (
          <div className="message att">
            {valoManquants.length} justificatif{valoManquants.length > 1 ? 's' : ''} manquant{valoManquants.length > 1 ? 's' : ''} sur des critères à points
            ({valoManquants.map((q) => q.code).join(', ')}). L'envoi reste possible, mais la commission pourra ne pas accorder ces points.
          </div>
        )}
      </div>

      <div className="carte pile">
        <h2 style={{ fontSize: '1.05rem' }}>Attestation sur l'honneur</h2>
        {ref.attestation.map((t, i) => (
          <label key={i} className="ligne" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
            <input type="checkbox" id={`attestation-${i}`} checked={coches[i]} style={{ marginTop: '.3rem', accentColor: 'var(--marine)' }}
              onChange={() => setCoches((c) => c.map((x, j) => (j === i ? !x : x)))} />
            <span>{t}</span>
          </label>
        ))}
      </div>

      <EncadreCharte accepte={charteOk} onChange={setCharteOk} phrase={phrase} setPhrase={setPhrase}
        signataire={[vous.prenom, vous.nom].filter(Boolean).join(' ')} entreprise={ent.denomination ?? ''} />

      <div className="ligne" style={{ justifyContent: 'space-between' }}>
        <p className="discret num" style={{ maxWidth: '60ch' }}>Score indicatif : {bilan.scoreIndicatif.toLocaleString('fr-FR')} sur {ref.version.base_score}. Simple base de repère : les points seront validés après étude de vos justificatifs et de votre dossier par les experts de la commission.</p>
        <button className="bouton principal" disabled={!bilan.envoyable || envoi} onClick={envoyer}>
          {envoi ? 'Envoi…' : 'Envoyer mon dossier'}
        </button>
      </div>
      {!tout && bilan.questionsSansReponse.length === 0 && <p className="petit discret" style={{ textAlign: 'right' }}>Cochez les quatre engagements de l'attestation et validez votre engagement à la charte de déontologie pour envoyer.</p>}
      {erreur && <div className="message erreur" role="alert">{erreur}</div>}
    </div>
  );
}

export default function EspaceCandidat() {
  const e = useDossier();
  return (
    <>
      <EnTete espace="candidat" />
      <main className="gouttiere">
        <div className="conteneur">
          {!e.charge && <p className="discret">Chargement du dossier…</p>}
          {e.charge && !e.dossier && (
            <div className="message att">Aucun dossier n'est associé à votre compte. Si vous venez de payer, le dossier apparaît en quelques minutes.</div>
          )}
          {e.dossier && (
            <div className="candidat-grille">
              <Sommaire e={e} />
              <div style={{ minWidth: 0 }}>
                <Routes>
                  <Route index element={<TableauDeBord e={e} />} />
                  <Route path="rubrique/:n" element={<PageRubrique e={e} />} />
                  <Route path="envoi" element={<PageEnvoi e={e} />} />
                  <Route path="fiche" element={<MaFiche reponses={e.reponses} statut={e.dossier?.statut ?? ''} />} />
                </Routes>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
