import { Link } from 'react-router-dom';
import Site, { BoutonDeposer, EncartDonnees, PDF_CHARTE, PDF_GUIDE, PhotoForme } from '../../components/site/Site';
import photo from '../../assets/hero-photographe.jpg';

const POURQUOI = [
  ['Une reconnaissance officielle', 'La Charte Qualité permet d\'afficher un signe de reconnaissance. Elle valorise une démarche professionnelle fondée sur des engagements concrets.'],
  ['Un regard extérieur', 'Chaque dossier est examiné par une commission indépendante, selon une grille d\'évaluation identique pour tous les candidats.'],
  ['Une démarche volontaire', 'Aucun photographe n\'est obligé d\'y participer. La Charte s\'adresse à celles et ceux qui souhaitent faire reconnaître leur engagement professionnel.'],
  ['Des engagements vérifiables', 'La Charte ne repose pas sur une déclaration d\'intention. Les candidats fournissent les éléments qui prouvent qu\'ils respectent les critères définis.'],
  ['Un renouvellement régulier', 'La reconnaissance est accordée pour 2 ans. Son renouvellement permet de s\'assurer que les engagements sont toujours respectés.'],
  ['Une profession mieux valorisée', 'En mettant en avant les photographes qui s\'engagent, la Charte renforce la confiance du public et valorise l\'image de toute la profession.'],
];

const ETAPES = [
  ['Je me prépare', 'Le guide liste les documents à rassembler.'],
  ['Je remplis mon dossier', 'En ligne, environ 45 minutes, à mon rythme.'],
  ['Mon dossier est vérifié', 'Par l\'équipe MDI, puis par deux experts.'],
  ['La commission décide', 'Une décision motivée, valable 2 ans.'],
];

export default function Accueil() {
  return (
    <Site large documents={[PDF_GUIDE, PDF_CHARTE]}>
      <section className="hero">
        <div className="hero-texte">
          <h1>La Charte Qualité des photographes professionnels</h1>
          <p>La Charte Qualité distingue les photographes qui exercent leur métier dans le respect des bonnes pratiques professionnelles.</p>
          <div className="hero-boutons">
            <BoutonDeposer className="bouton deposer hero-btn">Je dépose ma candidature</BoutonDeposer>
            <Link to="/la-charte" className="bouton hero-btn hero-btn-contour">En savoir plus</Link>
          </div>
        </div>
        <PhotoForme src={photo} />
      </section>

      <section className="pourquoi">
        <div className="pourquoi-tete">
          <h2>Pourquoi la FFPMI crée cette Charte Qualité ?</h2>
          <p>Depuis des années, la FFPMI accompagne les photographes professionnels dans l'exercice de leur métier. Elle défend leurs intérêts, les représente et contribue à faire évoluer la profession.</p>
        </div>
        <div className="pourquoi-grille">
          {POURQUOI.map(([titre, texte], i) => (
            <div key={titre} className="pourquoi-item">
              <span className="pourquoi-num" aria-hidden="true">0{i + 1}.</span>
              <div>
                <h3>{titre}</h3>
                <p>{texte}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="double-entree">
        <div className="entree marine">
          <span className="entree-pour">Photographes</span>
          <h2>Faites reconnaître votre exigence</h2>
          <p>Le dossier passe en revue toute votre entreprise. Même avant la décision, il vous aide à progresser.</p>
          <div className="ligne">
            <Link to="/la-charte#pour-qui" className="bouton entree-btn">Qui peut candidater</Link>
            <Link to="/preparer" className="bouton entree-btn contour">Bien se préparer</Link>
          </div>
        </div>
        <div className="entree claire">
          <span className="entree-pour">Particuliers et entreprises</span>
          <h2>Trouvez un photographe titulaire</h2>
          <p>Chaque titulaire s'est engagé à respecter la charte de déontologie de la profession.</p>
          <div className="ligne">
            <Link to="/carte" className="bouton principal">Voir la carte</Link>
            <Link to="/deontologie" className="bouton secondaire">Ses engagements</Link>
          </div>
        </div>
      </section>

      <section className="pile">
        <h2 className="equerre">En quatre étapes</h2>
        <ol className="etapes-ligne">
          {ETAPES.map(([t, d]) => <li key={t}><strong>{t}</strong><span>{d}</span></li>)}
        </ol>
      </section>
      <EncartDonnees />
    </Site>
  );
}
