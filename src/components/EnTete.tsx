import { Link, NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/logo-ppf.png';
import { api, estDemo, reinitialiserDemo, type Role } from '../lib/api';
import { accueilDuRole, useSession } from '../App';

export type Espace = 'public' | 'candidat' | 'expert' | 'admin';

const libelleEspace: Record<Espace, string> = {
  public: '',
  candidat: 'Espace candidat',
  expert: 'Espace expert',
  admin: 'Back-office',
};

function BarreDemo({ espace }: { espace: Espace }) {
  const { rafraichir } = useSession();
  const nav = useNavigate();
  const aller = async (role: Role) => {
    api.changerRole?.(role);
    await rafraichir();
    nav(accueilDuRole(role));
  };
  return (
    <div className="barre-demo gouttiere" role="region" aria-label="Aperçu de démonstration">
      <div className="conteneur">
        <strong>Aperçu avec des données d'exemple</strong>
        <span className="discret">Visiter :</span>
        <button aria-pressed={espace === 'public'} onClick={() => nav('/')}>Site public</button>
        <button aria-pressed={espace === 'candidat'} onClick={() => aller('candidat')}>Espace candidat</button>
        <button aria-pressed={espace === 'expert'} onClick={() => aller('expert')}>Espace expert</button>
        <button aria-pressed={espace === 'admin'} onClick={() => aller('admin')}>Back-office</button>
        <button style={{ marginLeft: 'auto' }} onClick={async () => { reinitialiserDemo(); await rafraichir(); nav('/'); }}>
          Réinitialiser l'exemple
        </button>
      </div>
    </div>
  );
}

export interface LienEspace { to: string; label: string; end?: boolean }

export default function EnTete({ espace, liens = [] }: { espace: Espace; liens?: LienEspace[] }) {
  const { utilisateur, rafraichir } = useSession();
  const nav = useNavigate();
  const deconnexion = async () => { await api.deconnexion(); await rafraichir(); nav('/'); };
  const nom = utilisateur ? [utilisateur.prenom, utilisateur.nom].filter(Boolean).join(' ') || utilisateur.email : '';

  return (
    <>
      {estDemo && <BarreDemo espace={espace} />}
      <header className="entete gouttiere">
        <div className="conteneur">
          <Link to={utilisateur ? accueilDuRole(utilisateur.role) : '/'} aria-label="Accueil Charte Qualité">
            <img src={logo} alt="Photographe Professionnel de France - FFPMI" className="logo" />
          </Link>
          {espace === 'candidat' && <span className="espace-etiquette" style={{ background: 'var(--accent-doux)', color: 'var(--accent)' }}>{libelleEspace.candidat}</span>}
          <nav aria-label="Navigation principale">
            {espace === 'candidat' && liens.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className="lien-nav">{l.label}</NavLink>
            ))}
            {espace === 'public' && !utilisateur && <NavLink to="/connexion" className="lien-nav">Reprendre mon dossier</NavLink>}
            {utilisateur && <span className="petit discret" style={{ padding: '0 .5rem' }}>{nom}</span>}
            {utilisateur && <button className="lien-nav" onClick={deconnexion}>Se déconnecter</button>}
          </nav>
        </div>
      </header>
      {(espace === 'expert' || espace === 'admin') && (
        <div className={`bandeau ${espace} gouttiere`}>
          <div className="conteneur">
            <span className="espace-etiquette">{libelleEspace[espace]}</span>
            <nav aria-label={libelleEspace[espace]} style={{ display: 'flex', gap: '.25rem', flexWrap: 'wrap' }}>
              {liens.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className="lien-nav">{l.label}</NavLink>)}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
