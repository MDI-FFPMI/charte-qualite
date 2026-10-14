// Espace expert : vérification approfondie des justificatifs des dossiers attribués,
// et aperçu de la notation en commission.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import EnTete from '../../components/EnTete';
import VueDossier, { BadgeAvis, ChoixAvis, libSpe, questionsAVerifier } from '../../components/VueDossier';
import { equipe, type AvisGlobal, type DossierLigne, type Fiche, type Verif } from '../../lib/equipe';
import { estDemo } from '../../lib/api';
import { useSession } from '../../App';
import CommissionApercu from './CommissionApercu';

const dateFr = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '-');

function MesVerifications() {
  const nav = useNavigate();
  const [liste, setListe] = useState<(DossierLigne & { moi: Verif })[] | null>(null);
  const [erreur, setErreur] = useState('');
  const [onglet, setOnglet] = useState<'verif' | 'commission'>('verif');
  useEffect(() => { equipe.mesVerifications().then(setListe).catch((e) => setErreur((e as Error).message)); }, []);

  const aFaire = (liste ?? []).filter((d) => d.moi.statut === 'en_cours');
  const faites = (liste ?? []).filter((d) => d.moi.statut === 'termine');
  const Tableau = ({ l }: { l: typeof aFaire }) => (
    <div className="tableau-wrap">
      <table className="tableau">
        <thead><tr><th>Dossier</th><th>Candidat</th><th>Spécialités</th><th>Attribué le</th><th></th></tr></thead>
        <tbody>
          {l.map((d) => (
            <tr key={d.id} className="ligne-cliquable" onClick={() => nav(`/expert/dossier/${d.id}`)}>
              <td className="num"><Link to={`/expert/dossier/${d.id}`} onClick={(e) => e.stopPropagation()}>{d.numero}</Link></td>
              <td>{d.candidat || '-'}<br /><span className="petit discret">{d.ville}</span></td>
              <td>{d.principales.length ? <>{d.principales.map((a) => <span key={a} className="puce-spe ref">{libSpe(a)}</span>)}{d.autres.map((a) => <span key={a} className="puce-spe">{libSpe(a)}</span>)}</> : '-'}</td>
              <td className="num">{dateFr(d.moi.attribue_le)}</td>
              <td>{d.moi.statut === 'termine' ? <span className="badge ok">Rendu le {dateFr(d.moi.termine_le)}</span> : <span className="badge att">À vérifier</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="pile" style={{ gap: '1.5rem' }}>
      <div className="onglets" role="tablist">
        <button role="tab" aria-selected={onglet === 'verif'} onClick={() => setOnglet('verif')}>Mes vérifications{aFaire.length ? ` (${aFaire.length})` : ''}</button>
        <button role="tab" aria-selected={onglet === 'commission'} onClick={() => setOnglet('commission')}>Commission</button>
      </div>
      {onglet === 'commission' ? <CommissionApercu /> : (
        <>
          <div className="pile" style={{ gap: '.4rem' }}>
            <h1 className="equerre">Mes vérifications</h1>
            <p className="discret" style={{ maxWidth: '70ch' }}>
              Chaque dossier recevable est confié à deux experts. L'équipe FFPMI a déjà contrôlé que les pièces sont présentes et lisibles.
              Vous vérifiez le fond : les documents prouvent-ils vraiment ce que le candidat déclare ? Votre avis n'est pas visible par l'autre vérificateur.
            </p>
          </div>
          {erreur && <div className="message erreur">{erreur}</div>}
          {!liste ? <p className="discret">Chargement…</p> : (
            <>
              <section className="pile">
                <h2 style={{ fontSize: '1.1rem' }}>À vérifier</h2>
                {aFaire.length ? <Tableau l={aFaire} /> : <p className="encart discret">Aucun dossier à vérifier pour le moment. Vous serez prévenu dès qu'un dossier vous est attribué.</p>}
              </section>
              {faites.length > 0 && (
                <section className="pile">
                  <h2 style={{ fontSize: '1.1rem' }}>Vérifications rendues</h2>
                  <Tableau l={faites} />
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function FicheExpert() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { utilisateur } = useSession();
  const [f, setF] = useState<Fiche | null>(null);
  const [erreur, setErreur] = useState('');
  const [avisGlobal, setAvisGlobal] = useState<AvisGlobal | ''>('');
  const [commentaire, setCommentaire] = useState('');
  const [conflit, setConflit] = useState(false);
  const [motif, setMotif] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [vue, setVue] = useState<'justificatifs' | 'tout'>('justificatifs');

  const charger = useCallback(async () => {
    try { setF(await equipe.fiche(id)); } catch (e) { setErreur((e as Error).message); }
  }, [id]);
  useEffect(() => { void charger(); }, [charger]);

  const aVerif = useMemo(() => (f ? questionsAVerifier(f.reponses, f.pieces) : []), [f]);
  if (erreur) return <div className="message erreur">Ce dossier n'est pas accessible. {erreur}</div>;
  if (!f) return <p className="discret">Chargement du dossier…</p>;

  const monId = estDemo ? 'e1' : utilisateur?.id ?? '';
  const moi = f.dossier.verificateurs.find((v) => v.expert_id === monId);
  const mesAvis = f.n2[monId] ?? {};
  const ouvert = moi?.statut === 'en_cours';
  const restants = aVerif.filter((q) => !mesAvis[q.code]);
  const d = f.dossier;

  const terminer = async () => {
    if (!avisGlobal) return;
    setOccupe(true);
    try { await equipe.terminer(d.id, avisGlobal, commentaire.trim()); await charger(); }
    catch (e) { setErreur((e as Error).message); }
    setOccupe(false);
  };
  const declarerConflit = async () => {
    setOccupe(true);
    try { await equipe.conflit(d.id, motif.trim()); nav('/expert'); }
    catch (e) { setErreur((e as Error).message); setOccupe(false); }
  };

  return (
    <div className="pile" style={{ gap: '1.5rem' }}>
      <Link to="/expert" className="retour">← Mes vérifications</Link>
      <div className="carte pile">
        <div className="ligne" style={{ justifyContent: 'space-between' }}>
          <h1 className="equerre" style={{ fontSize: '1.5rem' }}>{d.numero}</h1>
          {ouvert ? <span className="badge att">À vérifier</span> : <span className="badge ok">Vérification rendue</span>}
        </div>
        <div className="champs-lecture">
          <span><span className="discret petit">Candidat</span><br /><strong>{d.candidat || '-'}</strong>{d.ville && <><br /><span className="petit">{d.ville}</span></>}</span>
          <span><span className="discret petit">Spécialités</span><br />{d.principales.length ? <>{d.principales.map((a) => <span key={a} className="puce-spe ref">{libSpe(a)}</span>)}{d.autres.map((a) => <span key={a} className="puce-spe">{libSpe(a)}</span>)}</> : '-'}</span>
          <span><span className="discret petit">Envoyé le</span><br /><span className="num">{dateFr(d.envoye_le)}</span></span>
        </div>
        {ouvert && (
          <div className="message att petit pile" style={{ gap: '.5rem' }}>
            <span>Avant de commencer, vérifiez que vous n'avez aucun lien avec ce candidat : associé, salarié, famille, client, concurrent direct. En cas de doute, déclarez-le.</span>
            {!conflit ? (
              <button className="bouton secondaire petit-btn" style={{ alignSelf: 'flex-start' }} onClick={() => setConflit(true)}>Je déclare un lien avec ce candidat</button>
            ) : (
              <div className="pile" style={{ gap: '.4rem' }}>
                <input className="saisie" placeholder="Nature du lien (visible par l'équipe uniquement)" value={motif} onChange={(e) => setMotif(e.target.value)} />
                <div className="ligne">
                  <button className="bouton principal petit-btn" disabled={!motif.trim() || occupe} onClick={declarerConflit}>Confirmer : le dossier sera retiré de ma liste</button>
                  <button className="bouton secondaire petit-btn" onClick={() => setConflit(false)}>Annuler</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
              <BadgeAvis a={f.n1[q.code]} />
            </div>
            <div className="pile" style={{ gap: '.3rem' }}>
              <span className="petit discret" style={{ fontWeight: 600 }}>Votre avis</span>
              <ChoixAvis key={`${q.code}-${mesAvis[q.code]?.avis ?? ''}`} valeur={mesAvis[q.code]} verrouille={!ouvert}
                onChange={async (a, c) => { await equipe.donnerAvis(d.id, q.code, a, c); await charger(); }} />
            </div>
          </>
        )} />

      <div className="carte pile bloc-etape">
        <h2 style={{ fontSize: '1.1rem' }}>Votre conclusion</h2>
        {ouvert ? (
          <>
            <p className="petit"><strong className="num">{aVerif.length - restants.length} / {aVerif.length}</strong> justificatifs vérifiés.
              {restants.length > 0 && <span className="discret"> Reste : {restants.map((q) => q.code).join(', ')}</span>}</p>
            <div className="ligne" role="radiogroup" aria-label="Avis global">
              {([['favorable', 'Favorable', 'ok'], ['reserve', 'Avec réserves', 'att'], ['defavorable', 'Défavorable', 'ko']] as const).map(([k, l, c]) => (
                <button key={k} type="button" className={`avis-btn ${c}`} aria-pressed={avisGlobal === k} onClick={() => setAvisGlobal(k)}>{l}</button>
              ))}
            </div>
            <label className="champ">
              Commentaire pour l'équipe et la commission
              <textarea rows={4} value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Points forts, réserves, éléments à demander au candidat" />
            </label>
            <div className="ligne">
              <button className="bouton principal" disabled={!avisGlobal || restants.length > 0 || occupe} onClick={terminer}>Rendre ma vérification</button>
              {restants.length > 0 && <span className="petit discret">Donnez un avis sur chaque justificatif pour rendre votre vérification.</span>}
            </div>
          </>
        ) : moi ? (
          <p>
            Rendue le {dateFr(moi.termine_le)} · avis <strong>{moi.avis_global === 'favorable' ? 'favorable' : moi.avis_global === 'defavorable' ? 'défavorable' : 'avec réserves'}</strong>
            {moi.commentaire && <><br /><span className="petit" style={{ whiteSpace: 'pre-wrap' }}>{moi.commentaire}</span></>}
          </p>
        ) : <p className="discret">Vous n'êtes pas vérificateur de ce dossier.</p>}
      </div>
    </div>
  );
}

export default function EspaceExpert() {
  return (
    <>
      <EnTete espace="expert" liens={[{ to: '/expert', label: 'Mes vérifications', end: true }]} />
      <main className="gouttiere">
        <div className="conteneur">
          <Routes>
            <Route index element={<MesVerifications />} />
            <Route path="dossier/:id" element={<FicheExpert />} />
          </Routes>
        </div>
      </main>
    </>
  );
}
