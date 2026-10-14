import { useState } from 'react';
import { Link } from 'react-router-dom';
import EnTete from '../../components/EnTete';
import logoFfpmi from '../../assets/logo-ffpmi.png';
import logoMdi from '../../assets/logo-mdi.png';
import ref from '../../data/referentiel-v3.json';
import { lienPaiement, estDemo } from '../../lib/api';
import type { Referentiel } from '../../lib/types';

const referentiel = ref as Referentiel;

export default function Accueil() {
  const [paiementFerme, setPaiementFerme] = useState(false);
  const rubriques = referentiel.rubriques.filter((r) => r.questions.some((q) => q.points_max > 0));
  const total = rubriques.reduce((s, r) => s + r.questions.reduce((t, q) => t + q.points_max, 0), 0);
  const nbElim = referentiel.rubriques.flatMap((r) => r.questions).filter((q) => q.statut === 'eliminatoire').length;
  const nbValo = referentiel.rubriques.flatMap((r) => r.questions).filter((q) => q.statut === 'valorise').length;

  return (
    <>
      <EnTete espace="public" />
      <main className="gouttiere">
        <div className="conteneur pile" style={{ gap: '3rem' }}>
          <section className="accueil-tete">
            <div>
              <p className="espace-etiquette" style={{ color: 'var(--rouge)', padding: 0, marginBottom: '.75rem' }}>Charte Qualité FFPMI</p>
              <h1>Faites reconnaître la qualité de votre travail de photographe</h1>
              <p className="chapo">
                La Charte Qualité Photographe Professionnel de France atteste que votre entreprise respecte ses obligations,
                protège ses clients et maîtrise son métier. Elle est délivrée pour 2 ans par une commission d'experts de la profession.
              </p>
            </div>
            <div className="carte tarif">
              <div>
                <div className="prix num">199 €</div>
                <p className="discret">149 € pour les adhérents FFPMI</p>
              </div>
              {!lienPaiement && !estDemo ? (
                <Link to="/connexion?espace=inscription" className="bouton principal">Déposer ma candidature</Link>
              ) : (
                <a className="bouton principal" href={lienPaiement || '#paiement'} onClick={(e) => { if (!lienPaiement) { e.preventDefault(); setPaiementFerme(true); } }}>
                  Déposer ma candidature
                </a>
              )}
              {paiementFerme && (
                <div className="message att" role="status">
                  Les candidatures en ligne ouvrent prochainement. {estDemo ? 'Dans cet aperçu, utilisez « Reprendre mon dossier ».' : 'Inscrivez-vous comme beta-testeur pour être prévenu de l\'ouverture.'}
                </div>
              )}
              <Link to="/connexion" className="bouton secondaire">Reprendre mon dossier</Link>
            </div>
          </section>

          <section className="pile">
            <h2 className="equerre">Comment ça se passe</h2>
            <div className="etapes">
              <div className="pile" style={{ gap: '.35rem' }}><h3>Paiement en ligne</h3><p className="discret">Vous recevez aussitôt par email le lien d'accès à votre dossier.</p></div>
              <div className="pile" style={{ gap: '.35rem' }}><h3>Votre dossier</h3><p className="discret">{referentiel.rubriques.flatMap((r) => r.questions).length} questions, environ 45 minutes. Enregistrement automatique, reprise à tout moment.</p></div>
              <div className="pile" style={{ gap: '.35rem' }}><h3>La commission</h3><p className="discret">Une commission tous les deux mois. Six experts notent vos galeries, deux rapporteurs vérifient vos justificatifs.</p></div>
              <div className="pile" style={{ gap: '.35rem' }}><h3>La décision</h3><p className="discret">Un courrier motivé. En cas de refus, un recours est possible à la commission suivante.</p></div>
            </div>
          </section>

          <section className="pile">
            <h2 className="equerre">Le référentiel</h2>
            <p style={{ maxWidth: '65ch' }}>
              {nbElim} conditions obligatoires, issues de la loi et des fondamentaux du métier, et {nbValo} critères qui rapportent des points.
              La Charte est accordée à partir de {referentiel.version.seuil_obtention} points sur {referentiel.version.base_score},
              calculés sur les seules questions qui vous concernent.
            </p>
            <div className="rubriques-liste">
              {rubriques.map((r) => (
                <div key={r.numero}>
                  <span>{r.titre}</span>
                  <span className="num discret">{r.questions.reduce((t, q) => t + q.points_max, 0)} pts</span>
                </div>
              ))}
            </div>
            <p className="petit discret">Total brut : {total} points, ramené sur {referentiel.version.base_score}.</p>
          </section>
        </div>
      </main>
      <footer className="gouttiere" style={{ borderTop: '1px solid var(--trait)', paddingBlock: '1.25rem' }}>
        <div className="conteneur ligne petit discret" style={{ justifyContent: 'space-between' }}>
          <span className="ligne" style={{ gap: '.9rem', flexWrap: 'nowrap' }}>
            <img src={logoFfpmi} alt="FFPMI" style={{ height: 22 }} />
            <img src={logoMdi} alt="MDI - Métiers de l'Image" style={{ height: 30 }} />
            <span>Une charte de la FFPMI, gérée par son organisme MDI - Métiers de l'Image</span>
          </span>
          <span className="ligne" style={{ gap: '1rem' }}>
            <Link to="/connexion?espace=expert">Espace expert</Link>
            <Link to="/connexion?espace=admin">Back-office</Link>
          </span>
        </div>
      </footer>
    </>
  );
}
