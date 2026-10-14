import { Link } from 'react-router-dom';
import Site, { BoutonDeposer, PDF_CHARTE, PDF_GUIDE } from '../../components/site/Site';
import ref from '../../data/referentiel-v3.json';
import type { Referentiel } from '../../lib/types';

const referentiel = ref as Referentiel;

export default function Accueil() {
  const questions = referentiel.rubriques.flatMap((r) => r.questions);
  const rubriques = referentiel.rubriques.filter((r) => r.questions.some((q) => q.points_max > 0));
  const nbElim = questions.filter((q) => q.statut === 'eliminatoire').length;

  return (
    <Site large documents={[PDF_GUIDE, PDF_CHARTE]}>
      <section className="accueil-tete">
        <div>
          <p className="espace-etiquette" style={{ color: 'var(--rouge)', padding: 0, marginBottom: '.75rem' }}>Charte Qualité FFPMI</p>
          <h1>Faites reconnaître la qualité de votre travail de photographe</h1>
          <p className="chapo">
            La Charte Qualité Photographe Professionnel de France atteste que votre entreprise respecte ses obligations,
            protège ses clients et maîtrise son métier. Elle est délivrée pour 2 ans par une commission d'experts de la profession.
          </p>
          <div className="ligne" style={{ marginTop: '1.5rem' }}>
            <BoutonDeposer className="bouton deposer grand" />
            <Link to="/a-quoi-ca-sert" className="bouton secondaire">Découvrir la Charte</Link>
          </div>
        </div>
        <div className="carte tarif">
          <div>
            <div className="prix num">199 €</div>
            <p className="discret">pour 2 ans · 149 € pour les adhérents FFPMI</p>
          </div>
          <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            <li>Dossier en ligne, environ 45 minutes</li>
            <li>Enregistrement automatique, reprise à tout moment</li>
            <li>Une commission tous les deux mois</li>
            <li>Votre fiche sur la carte des titulaires</li>
          </ul>
          <BoutonDeposer className="bouton deposer" />
          <Link to="/connexion" className="bouton secondaire">Reprendre mon dossier</Link>
        </div>
      </section>

      <section className="chiffres" aria-label="La Charte en chiffres">
        <div className="chiffre"><strong className="num">2 ans</strong>de validité, puis renouvellement</div>
        <div className="chiffre"><strong className="num">{nbElim}</strong>conditions obligatoires, issues de la loi et du métier</div>
        <div className="chiffre"><strong className="num">{referentiel.version.seuil_obtention} / {referentiel.version.base_score}</strong>points pour obtenir la Charte</div>
        <div className="chiffre"><strong className="num">6</strong>experts de la profession en commission</div>
      </section>

      <section className="pile">
        <h2 className="equerre">Tout savoir sur la Charte</h2>
        <div className="cartes-liens">
          <Link to="/a-quoi-ca-sert" className="carte-lien"><h3>À quoi ça sert</h3><p className="discret petit">Se distinguer, rassurer ses clients et faire progresser son entreprise.</p><span className="suite">Lire →</span></Link>
          <Link to="/pour-qui" className="carte-lien"><h3>Pour qui</h3><p className="discret petit">Les conditions pour candidater et ce qu'il faut avoir en place.</p><span className="suite">Lire →</span></Link>
          <Link to="/preparer" className="carte-lien"><h3>Bien préparer sa candidature</h3><p className="discret petit">Les documents à rassembler et les questions à se poser, rubrique par rubrique.</p><span className="suite">Lire →</span></Link>
          <Link to="/carte" className="carte-lien"><h3>Carte des titulaires</h3><p className="discret petit">Trouvez un photographe titulaire de la Charte près de chez vous.</p><span className="suite">Voir la carte →</span></Link>
          <Link to="/deontologie" className="carte-lien"><h3>Charte de déontologie</h3><p className="discret petit">Les engagements de chaque titulaire envers ses clients et sa profession.</p><span className="suite">Lire →</span></Link>
          <Link to="/questions" className="carte-lien"><h3>Questions fréquentes</h3><p className="discret petit">Prix, délais, recours, renouvellement, confidentialité.</p><span className="suite">Lire →</span></Link>
        </div>
      </section>

      <section className="pile">
        <h2 className="equerre">Comment ça se passe</h2>
        <div className="etapes">
          <div className="etape pile" style={{ gap: '.35rem' }}><h3>Votre inscription</h3><p className="discret">Vous créez votre compte et réglez en ligne. Votre dossier s'ouvre aussitôt.</p></div>
          <div className="etape pile" style={{ gap: '.35rem' }}><h3>Votre dossier</h3><p className="discret">{questions.length} questions, environ 45 minutes. Vous pouvez vous arrêter et reprendre quand vous voulez.</p></div>
          <div className="etape pile" style={{ gap: '.35rem' }}><h3>La vérification</h3><p className="discret">L'équipe MDI contrôle vos pièces, puis deux experts de votre spécialité les vérifient.</p></div>
          <div className="etape pile" style={{ gap: '.35rem' }}><h3>La commission</h3><p className="discret">Six experts notent vos galeries. Vous recevez une décision motivée, avec recours possible.</p></div>
        </div>
      </section>

      <section className="pile">
        <h2 className="equerre">Le référentiel</h2>
        <p style={{ maxWidth: '65ch' }}>
          {nbElim} conditions obligatoires et {questions.filter((q) => q.statut === 'valorise').length} critères qui rapportent des points.
          Le score est calculé sur les seules questions qui vous concernent.
        </p>
        <div className="rubriques-liste">
          {rubriques.map((r) => (
            <div key={r.numero}>
              <span>{r.titre}</span>
              <span className="num discret">{r.questions.reduce((t, q) => t + q.points_max, 0)} pts</span>
            </div>
          ))}
        </div>
      </section>
    </Site>
  );
}
