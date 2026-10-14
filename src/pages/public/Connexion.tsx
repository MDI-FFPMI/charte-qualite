import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import EnTete from '../../components/EnTete';
import { api, estDemo } from '../../lib/api';
import { accueilDuRole, useSession } from '../../App';

export default function Connexion() {
  const { utilisateur, rafraichir } = useSession();
  const nav = useNavigate();
  const [email, setEmail] = useState(estDemo ? 'exemple@studio-photo.fr' : '');
  const [etat, setEtat] = useState<'saisie' | 'envoi' | 'envoye'>('saisie');
  const [erreur, setErreur] = useState('');
  const [params] = useSearchParams();
  const espace = params.get('espace');
  const inscription = espace === 'inscription';
  const textes = inscription
    ? { titre: 'Déposer ma candidature', aide: "Saisissez votre adresse email professionnelle. Vous recevrez un lien pour ouvrir votre dossier, sans mot de passe. Gardez la même adresse pour revenir plus tard." }
    : espace === 'admin'
    ? { titre: 'Connexion au back-office', aide: 'Saisissez votre adresse email professionnelle. Vous recevrez un lien de connexion, sans mot de passe.' }
    : espace === 'expert'
      ? { titre: "Connexion à l'espace expert", aide: "Saisissez l'adresse email sur laquelle vous avez reçu votre invitation. Vous recevrez un lien de connexion, sans mot de passe." }
      : { titre: 'Reprendre mon dossier', aide: "Saisissez l'adresse email utilisée lors du paiement. Vous recevrez un lien de connexion, sans mot de passe." };

  if (utilisateur) return <Navigate to={accueilDuRole(utilisateur.role)} replace />;

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErreur('Saisissez une adresse email valide.'); return; }
    setEtat('envoi');
    try {
      await api.envoyerLien(email, inscription);
      if (api.demo) { await rafraichir(); nav('/candidat'); return; }
      setEtat('envoye');
    } catch (err) {
      setErreur((err as Error).message);
      setEtat('saisie');
    }
  };

  return (
    <>
      <EnTete espace="public" />
      <main className="gouttiere">
        <div className="conteneur" style={{ maxWidth: 520 }}>
          <div className="carte pile">
            <h1 className="equerre" style={{ fontSize: '1.5rem' }}>{textes.titre}</h1>
            {etat === 'envoye' ? (
              <div className="message ok">
                Un lien de connexion vient d'être envoyé à <strong>{email}</strong>. Il est valable une heure.
                Pensez à vérifier vos courriers indésirables.
              </div>
            ) : (
              <form className="pile" onSubmit={envoyer} noValidate>
                <p className="discret">{textes.aide}</p>
                <label className="champ" htmlFor="email">
                  Adresse email
                  <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                {erreur && <div className="message erreur" role="alert">{erreur}</div>}
                <button className="bouton principal" disabled={etat === 'envoi'}>
                  {etat === 'envoi' ? 'Envoi…' : api.demo ? 'Ouvrir le dossier d\'exemple' : inscription ? 'Recevoir le lien de mon dossier' : 'Recevoir mon lien de connexion'}
                </button>
              </form>
            )}
          </div>
          <p className="petit discret" style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link to="/connexion">Candidat</Link> · <Link to="/connexion?espace=expert">Expert</Link> · <Link to="/connexion?espace=admin">Back-office</Link>
          </p>
        </div>
      </main>
    </>
  );
}
