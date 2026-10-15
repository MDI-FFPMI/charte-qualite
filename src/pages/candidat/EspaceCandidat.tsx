import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import EnTete from '../../components/EnTete';
import QuestionChamp from '../../components/QuestionChamp';
import refJson from '../../data/referentiel-v3.json';
import EncadreCharte from '../../components/EncadreCharte';
import MaFiche from './MaFiche';
import { CHARTE_VERSION } from '../../data/charte-deontologie';
import { api, lienPaiementPour, type Dossier } from '../../lib/api';
import { useSession } from '../../App';
import { bilanDossier, estAffichee, estRepondue, valeursChoisies } from '../../lib/scoring';
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

/** Pas encore de dossier : paiement de la candidature, puis ouverture automatique du dossier */
function PagePaiement({ recharger }: { recharger: () => Promise<boolean> }) {
  const { utilisateur } = useSession();
  const retour = typeof location !== 'undefined' && new URLSearchParams(location.search).get('paiement') === 'ok';
  const [attente, setAttente] = useState(retour);
  useEffect(() => {
    if (!attente) return;
    let essais = 0;
    const t = setInterval(async () => {
      essais++;
      if (await recharger() || essais >= 20) { clearInterval(t); setAttente(false); }
    }, 3000);
    return () => clearInterval(t);
  }, [attente, recharger]);
  const lien = utilisateur ? lienPaiementPour(utilisateur) : '';

  if (attente) return (
    <div className="carte pile" style={{ maxWidth: 640 }}>
      <h1 className="equerre">Merci, paiement reçu</h1>
      <p role="status">Votre dossier s'ouvre, cela prend quelques secondes…</p>
    </div>
  );
  return (
    <div className="pile" style={{ gap: '1.5rem', maxWidth: 720 }}>
      <div className="pile" style={{ gap: '.4rem' }}>
        <h1 className="equerre">Ouvrir mon dossier de candidature</h1>
        <p className="discret">Votre compte est créé. Il reste à régler la candidature : votre dossier s'ouvre dès le paiement validé, et vous le remplissez à votre rythme.</p>
      </div>
      {retour && <div className="message att">Le paiement n'est pas encore confirmé. Patientez une minute puis rechargez la page. Si rien ne change, écrivez à <a href="mailto:charte-qualite@ffpmi.eu">charte-qualite@ffpmi.eu</a>.</div>}
      <div className="carte pile">
        <div className="grille-2">
          <div className="pile" style={{ gap: '.2rem' }}><span className="grand num" style={{ fontSize: '2rem', fontWeight: 800 }}>199 €</span><span className="discret">Candidature, Charte valable 2 ans</span></div>
          <div className="pile" style={{ gap: '.2rem' }}><span className="grand num" style={{ fontSize: '2rem', fontWeight: 800 }}>149 €</span><span className="discret">Adhérents de la FFPMI, avec le code promo réservé aux adhérents</span></div>
        </div>
        {lien
          ? <a className="bouton principal" href={lien} style={{ alignSelf: 'flex-start' }}>Payer ma candidature</a>
          : <div className="message att">Le paiement en ligne n'est pas encore ouvert. Écrivez à <a href="mailto:charte-qualite@ffpmi.eu">charte-qualite@ffpmi.eu</a>.</div>}
        <p className="petit discret" style={{ margin: 0 }}>
          Paiement sécurisé par Stripe, par carte bancaire. Adhérent de la FFPMI : saisissez votre code dans le champ « Ajouter un code promotionnel » de la page de paiement.
          Utilisez de préférence l'adresse email de votre compte ({utilisateur?.email}).
        </p>
      </div>
    </div>
  );
}

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
    return !!d;
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
        // Verte seulement si tout est rempli, justificatifs compris
        const etat = p.saisies > 0 && p.requisesFaites === p.requises && p.repondues === p.saisies ? 'faite' : p.saisies > 0 ? 'encours' : '';
        return (
          <NavLink key={r.numero} to={`/candidat/rubrique/${r.numero}`}>
            <span className={`pastille ${etat}`} aria-hidden="true">{etat === 'faite' ? '✓' : r.numero === 0 ? 'i' : r.numero}</span>
            <span>{r.titre}</span>
            <span className="petit discret num" title={`${p.repondues} question${p.repondues > 1 ? 's' : ''} complète${p.repondues > 1 ? 's' : ''} (justificatif compris) sur ${p.total}`}>{p.repondues}/{p.total}</span>
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
            {[...bilan.justificatifsManquants].sort(parOrdre).map((q) => (
              <li key={q.code}>
                <span className={`etiquette-blocage ${q.statut === 'eliminatoire' ? 'justificatif' : 'points'}`}>{q.statut === 'eliminatoire' ? 'Justificatif requis' : 'Points non comptés'}</span>
                {' '}<Link to={`/candidat/rubrique/${q.code.split('.')[0]}`}>{q.code}</Link> {q.libelle}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Question qui dépend d'une autre réponse : rappelée à sa place pour que la numérotation reste lisible */
function QuestionMasquee({ q, reponses }: { q: Referentiel['rubriques'][number]['questions'][number]; reponses: Reponses }) {
  const parent = q.condition?.q ?? '';
  const tranchee = estRepondue(ref.rubriques.flatMap((r) => r.questions).find((x) => x.code === parent)!, reponses[parent]);
  return (
    <article className="question question-masquee" aria-label={`Question ${q.code}`}>
      <div className="ligne" style={{ justifyContent: 'space-between' }}>
        <span><span className="num discret">{q.code}</span> {q.libelle}</span>
        <span className={`badge ${tranchee ? 'ok' : 'info'}`}>{tranchee ? 'Non concerné' : 'Selon votre réponse'}</span>
      </div>
      <p className="petit discret" style={{ margin: '.3rem 0 0' }}>
        {tranchee
          ? `D'après votre réponse à la question ${parent}, cette question ne vous concerne pas. Elle est comptée comme complète.`
          : `Cette question s'affichera ou non selon votre réponse à la question ${parent}.`}
      </p>
    </article>
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
        {(() => {
          const p = bilanDossier(ref, e.reponses, e.pieces, false).progression.find((x) => x.numero === rub.numero)!;
          const sansImpact = rub.questions.filter((q) => q.statut === 'informatif').length;
          return p.total > 0 && (
            <p className="petit discret num" style={{ margin: 0 }}>
              {p.total} question{p.total > 1 ? 's' : ''}{sansImpact ? `, dont ${sansImpact} sans impact sur le score` : ''}
              {p.points > 0 && ` · ${p.points} point${p.points > 1 ? 's' : ''} possibles`}
              {' · '}{p.repondues} complète{p.repondues > 1 ? 's' : ''} sur {p.total}
              {p.saisies > p.repondues && <span style={{ color: 'var(--critique)' }}> · {p.saisies - p.repondues} justificatif{p.saisies - p.repondues > 1 ? 's' : ''} à déposer</span>}
            </p>
          );
        })()}
        <div className="ligne"><EtatSauvegarde s={e.sauvegarde} /></div>
      </div>
      {rub.questions.map((q) => !visibles.includes(q) ? (
        <QuestionMasquee key={q.code} q={q} reponses={e.reponses} />
      ) : (
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

const ORDRE = new Map(ref.rubriques.flatMap((r) => r.questions).map((q, i) => [q.code, i]));
const parOrdre = (a: { code: string }, b: { code: string }) => (ORDRE.get(a.code) ?? 0) - (ORDRE.get(b.code) ?? 0);
const ETIQUETTES = { condition: 'Condition non remplie', justificatif: 'Justificatif requis', reponse: 'Sans réponse' };

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
  const valoManquants = bilan.justificatifsManquants.filter((q) => q.statut !== 'eliminatoire').sort(parOrdre);
  const bloquants = [
    ...bilan.eliminatoiresEchouees.map((q) => ({ q, type: 'condition' as const })),
    ...elimManquants.map((q) => ({ q, type: 'justificatif' as const })),
    ...bilan.questionsSansReponse.map((q) => ({ q, type: 'reponse' as const })),
  ].sort((a, b) => parOrdre(a.q, b.q));
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
        {bloquants.length === 0
          ? <p className="message ok">Toutes les questions requises sont remplies et les conditions obligatoires sont validées, justificatifs compris.</p>
          : (
            <>
              <p className="petit discret" style={{ margin: 0 }}>Dans l'ordre du dossier. Cliquez sur un numéro pour y aller.</p>
              <ul className="liste-blocages">
                {bloquants.map(({ q, type }) => (
                  <li key={`${type}${q.code}`}>
                    <Link to={lien(q.code)} className="num">{q.code}</Link>
                    <span className={`etiquette-blocage ${type}`}>{ETIQUETTES[type]}</span>
                    <span>{q.libelle}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
      </div>

      {valoManquants.length > 0 && (
        <div className="carte pile">
          <h2 style={{ fontSize: '1.05rem' }}>Justificatifs manquants sur des critères à points</h2>
          <p className="petit discret" style={{ margin: 0 }}>
            L'envoi reste possible, mais sans justificatif les points de ces questions ne sont pas comptés.
          </p>
          <ul className="liste-blocages">
            {valoManquants.map((q) => (
              <li key={q.code}>
                <Link to={lien(q.code)} className="num">{q.code}</Link>
                <span className="etiquette-blocage points">Points non comptés</span>
                <span>{q.libelle}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
          {e.charge && !e.dossier && <PagePaiement recharger={e.recharger} />}
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
