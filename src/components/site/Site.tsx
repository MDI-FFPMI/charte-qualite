// Gabarit du site public : en-tête avec menu et bouton de dépôt, pied avec logos et documents.
import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import logo from '../../assets/logo-ppf.png';
import logoFfpmi from '../../assets/logo-ffpmi.png';
import logoMdi from '../../assets/logo-mdi.png';
import { BarreDemo } from '../EnTete';
import { estDemo } from '../../lib/api';
import { accueilDuRole, useSession } from '../../App';

export const MENU = [
  { to: '/la-charte', label: 'La Charte Qualité', court: 'La Charte' },
  { to: '/preparer', label: 'Bien préparer sa candidature', court: 'Se préparer' },
  { to: '/carte', label: 'Carte des titulaires', court: 'Carte des titulaires' },
  { to: '/deontologie', label: 'Charte de déontologie', court: 'Déontologie' },
  { to: '/questions', label: 'Questions fréquentes', court: 'Questions' },
];

/** Bouton principal : création du compte (ou espace si déjà connecté). Le paiement se fait ensuite depuis l'espace candidat. */
export function BoutonDeposer({ className = 'bouton deposer', children = 'Je dépose mon dossier' }: { className?: string; children?: ReactNode }) {
  const { utilisateur } = useSession();
  return <Link className={className} to={utilisateur?.role === 'candidat' ? '/candidat' : '/connexion?espace=inscription'}>{children}</Link>;
}

function EnTeteSite() {
  const { utilisateur } = useSession();
  const [ouvert, setOuvert] = useState(false);
  const { pathname, hash } = useLocation();
  useEffect(() => {
    setOuvert(false);
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 60);
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return (
    <>
      {estDemo && <BarreDemo espace="public" />}
      <header className="site-entete gouttiere">
        <div className="conteneur">
          <Link to="/" aria-label="Accueil Photographe Professionnel de France"><img src={logo} alt="Photographe Professionnel de France" className="logo" /></Link>
          <button className="site-burger" aria-expanded={ouvert} aria-controls="site-menu" onClick={() => setOuvert((o) => !o)}>
            <span aria-hidden="true">{ouvert ? '✕' : '☰'}</span> Menu
          </button>
          <nav id="site-menu" className={`site-menu${ouvert ? ' ouvert' : ''}`} aria-label="Menu du site">
            {MENU.map((m) => <NavLink key={m.to} to={m.to} className="site-lien" title={m.label}><span className="court">{m.court}</span><span className="long">{m.label}</span></NavLink>)}
            <span className="site-actions">
              {utilisateur
                ? <Link to={accueilDuRole(utilisateur.role)} className="site-lien">Mon espace</Link>
                : <Link to="/connexion" className="site-lien">Mon dossier</Link>}
              <BoutonDeposer />
            </span>
          </nav>
        </div>
      </header>
    </>
  );
}

function PiedSite({ documents }: { documents?: { href: string; label: string }[] }) {
  return (
    <footer className="site-pied gouttiere">
      <div className="conteneur">
        {documents && documents.length > 0 && (
          <div className="site-documents">
            <span className="site-pied-titre">À télécharger</span>
            {documents.map((d) => (
              <a key={d.href} className="bouton secondaire petit-btn" href={d.href} target="_blank" rel="noopener noreferrer">↓ {d.label} (PDF)</a>
            ))}
          </div>
        )}
        <div className="site-pied-grille">
          <div className="pile" style={{ gap: '.75rem' }}>
            <img src={logo} alt="Photographe Professionnel de France" style={{ height: 44, width: 'auto', alignSelf: 'flex-start' }} />
            <p className="petit discret" style={{ margin: 0, maxWidth: '40ch' }}>La Charte Qualité qui atteste qu'un photographe est déclaré, assuré, compétent et engagé envers ses clients.</p>
          </div>
          <nav className="pile petit" style={{ gap: '.4rem' }} aria-label="Plan du site">
            {MENU.map((m) => <Link key={m.to} to={m.to}>{m.label}</Link>)}
          </nav>
          <div className="pile petit" style={{ gap: '.4rem' }}>
            <Link to="/connexion">Reprendre mon dossier</Link>
            <Link to="/connexion?espace=expert">Espace expert</Link>
            <Link to="/connexion?espace=admin">Back-office</Link>
            <Link to="/donnees-personnelles">Données personnelles</Link>
            <a href="mailto:charte-qualite@ffpmi.eu">charte-qualite@ffpmi.eu</a>
          </div>
        </div>
        <div className="site-partenaires">
          <img src={logoFfpmi} alt="FFPMI" style={{ height: 26 }} />
          <img src={logoMdi} alt="MDI - Métiers de l'Image" style={{ height: 36 }} />
          <span className="petit discret">Une charte de la Fédération Française de la Photographie et des Métiers de l'Image (FFPMI), gérée par son organisme MDI - Métiers de l'Image.</span>
        </div>
      </div>
    </footer>
  );
}

/** Bandeau d'appel en bas des pages */
export function AppelDepot({ titre = 'Prêt à faire reconnaître votre travail ?' }: { titre?: string }) {
  return (
    <section className="appel-depot">
      <div>
        <h2>{titre}</h2>
        <p>Un dossier en ligne d'environ 45 minutes, enregistré au fur et à mesure, examiné par des experts de votre spécialité.</p>
      </div>
      <div className="ligne">
        <BoutonDeposer className="bouton deposer grand" />
        <Link to="/preparer" className="bouton secondaire clair">Bien préparer sa candidature</Link>
      </div>
    </section>
  );
}

export default function Site({ titre, chapo, children, documents, appel = true, large }: {
  titre?: string; chapo?: ReactNode; children: ReactNode; documents?: { href: string; label: string }[]; appel?: boolean; large?: boolean;
}) {
  useEffect(() => { document.title = titre ? `${titre} - Photographe Professionnel de France` : 'Charte Qualité - Photographe Professionnel de France'; }, [titre]);
  return (
    <>
      <EnTeteSite />
      <main className="gouttiere site-main">
        <div className="conteneur pile" style={{ gap: '2.5rem' }}>
          {titre && (
            <header className="site-titre">
              <h1 className="equerre">{titre}</h1>
              {chapo && <p className="chapo">{chapo}</p>}
            </header>
          )}
          {children}
          {appel && <AppelDepot />}
        </div>
      </main>
      <PiedSite documents={documents} />
    </>
  );
}

export const PDF_GUIDE = { href: '/guide-preparation-charte-qualite.pdf', label: 'Guide de préparation' };
export const PDF_CHARTE = { href: '/charte-deontologie-ffpmi.pdf', label: 'Charte de déontologie' };

/** Photo dans les formes marine et rouge, comme sur l'accueil */
export function PhotoForme({ src, alt = '', credit, inverse }: { src: string; alt?: string; credit?: string; inverse?: boolean }) {
  return (
    <figure className={`forme-photo${inverse ? ' inverse' : ''}`}>
      <span className="forme marine" aria-hidden="true" />
      <span className="forme rouge" aria-hidden="true" />
      <img src={src} alt={alt} />
      {credit && <figcaption>© {credit}</figcaption>}
    </figure>
  );
}

/** Encart « vos données sont protégées », renvoie vers la page RGPD */
export function EncartDonnees() {
  return (
    <aside className="encart-donnees">
      <span className="encart-donnees-icone" aria-hidden="true">🔒</span>
      <div>
        <strong>Vos données sont protégées.</strong>{' '}
        Vos pièces ne sont visibles que des personnes habilitées, jamais par une adresse publique, et aucune n'est transmise à un service d'intelligence artificielle.{' '}
        <Link to="/donnees-personnelles">Notre politique de protection des données →</Link>
      </div>
    </aside>
  );
}
