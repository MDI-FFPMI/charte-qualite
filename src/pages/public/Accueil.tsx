import { Link } from 'react-router-dom';
import Site, { BoutonDeposer, PDF_CHARTE, PDF_GUIDE } from '../../components/site/Site';
import photo from '../../assets/hero-photographe.jpg';

const GARANTIES = [
  ['Déclaré et assuré', 'Un photographe immatriculé, à jour de ses obligations et assuré en responsabilité civile professionnelle.'],
  ['Engagé envers ses clients', 'Des prix annoncés, un contrat écrit, des délais tenus, des images et des données protégées.'],
  ['Reconnu par ses pairs', 'Un dossier vérifié par deux experts de sa spécialité, puis examiné par une commission de six professionnels.'],
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
        <div className="hero-visuel" aria-hidden="true">
          <span className="hero-forme marine" />
          <span className="hero-forme rouge" />
          <img src={photo} alt="" className="hero-photo" />
        </div>
      </section>

      <section className="garanties">
        {GARANTIES.map(([titre, texte], i) => (
          <div key={titre} className="garantie">
            <span className="garantie-num num">0{i + 1}</span>
            <h2>{titre}</h2>
            <p>{texte}</p>
          </div>
        ))}
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
    </Site>
  );
}
