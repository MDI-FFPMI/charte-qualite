// Encadré de la charte de déontologie, à la fin du questionnaire.
// Le candidat lit la charte (ou ouvre le PDF), puis s'engage en recopiant une phrase et en validant.
import { charte, CHARTE_PDF, phraseValide, type Bloc } from '../data/charte-deontologie';

function Contenu({ b }: { b: Bloc }) {
  const Liste = b.ordonnee ? 'ol' : 'ul';
  return (
    <>
      {b.p?.map((t, i) => <p key={i}>{t}</p>)}
      {b.liste && <Liste>{b.liste.map((t, i) => <li key={i}>{t}</li>)}</Liste>}
      {b.apres?.map((t, i) => <p key={`a${i}`}>{t}</p>)}
    </>
  );
}

export function TexteCharte() {
  return (
    <>
      {charte.parties.map((p) => (
        <section key={p.titre}>
          <h3>{p.titre}</h3>
          {p.intro && <Contenu b={p.intro} />}
          {p.articles?.map((a) => (
            <div key={a.titre} className="charte-article">
              <h4>{a.titre}</h4>
              <Contenu b={a} />
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

export default function EncadreCharte({ signataire, entreprise, phrase, setPhrase, accepte, onChange }: {
  signataire: string; entreprise: string; phrase: string; setPhrase: (t: string) => void; accepte: boolean; onChange: (v: boolean) => void;
}) {
  const ok = phraseValide(phrase);
  return (
    <section className="encadre-charte" aria-labelledby="titre-charte">
      <div className="encadre-charte-tete">
        <div className="pile" style={{ gap: '.2rem' }}>
          <span className="encadre-charte-etiquette">Engagement obligatoire</span>
          <h2 id="titre-charte">Charte de déontologie</h2>
          <span className="petit">Photographe Professionnel de France · version {charte.version}</span>
        </div>
        <a className="bouton secondaire petit-btn" href={CHARTE_PDF} target="_blank" rel="noopener noreferrer">Télécharger le PDF</a>
      </div>

      <p className="encadre-charte-intro">
        La Charte Qualité est accordée à celui qui remplit les conditions du référentiel <strong>et</strong> s'engage à respecter cette charte.
        Lisez-la avant d'envoyer votre dossier.
      </p>

      <div className="encadre-charte-texte" tabIndex={0} aria-label="Texte de la charte de déontologie">
        <TexteCharte />
      </div>

      <div className="encadre-charte-engagement">
        {accepte ? (
          <div className="pile" style={{ gap: '.5rem' }}>
            <div className="message ok" role="status">
              <strong>Engagement validé.</strong> {signataire ? `${signataire}${entreprise ? ` (${entreprise})` : ''}, vous` : 'Vous'} acceptez les termes de la charte de déontologie et vous engagez à les respecter.
            </div>
            <button type="button" className="lien-texte" onClick={() => onChange(false)}>Modifier</button>
          </div>
        ) : (
          <>
            <label htmlFor="phrase-charte" style={{ fontWeight: 600 }}>Pour vous engager, recopiez la phrase suivante :</label>
            <blockquote className="encadre-charte-phrase">{charte.phrase}</blockquote>
            <input id="phrase-charte" className="saisie" value={phrase} onChange={(e) => setPhrase(e.target.value)}
              onPaste={(e) => e.preventDefault()} autoComplete="off" placeholder="Tapez la phrase ici" />
            <div className="ligne">
              <button type="button" className="bouton principal" disabled={!ok} onClick={() => onChange(true)}>Valider mon engagement</button>
              {phrase && !ok && <span className="petit discret">La phrase ne correspond pas encore.</span>}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
