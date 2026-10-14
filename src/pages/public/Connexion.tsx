import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import EnTete from '../../components/EnTete';
import { api, estDemo } from '../../lib/api';
import { accueilDuRole, useSession } from '../../App';

export default function Connexion() {
  const { utilisateur, rafraichir } = useSession();
  const nav = useNavigate();
  const [email, setEmail] = useState(estDemo ? 'exemple@studio-photo.fr' : '');
  const [etat, setEtat] = useState<'saisie' | 'envoi' | 'envoye'>('saisie');
  const [erreur, setErreur] = useState('');

  if (utilisateur) return <Navigate to={accueilDuRole(utilisateur.role)} replace />;

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErreur('Saisissez une adresse email valide.'); return; }
    setEtat('envoi');
    try {
      await api.envoyerLien(email);
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
            <h1 className="equerre" style={{ fontSize: '1.5rem' }}>Reprendre mon dossier</h1>
            {etat === 'envoye' ? (
              <div className="message ok">
                Un lien de connexion vient d'être envoyé à <strong>{email}</strong>. Il est valable une heure.
                Pensez à vérifier vos courriers indésirables.
              </div>
            ) : (
              <form className="pile" onSubmit={envoyer} noValidate>
                <p className="discret">
                  Saisissez l'adresse email utilisée lors du paiement. Vous recevrez un lien de connexion, sans mot de passe.
                </p>
                <label className="champ" htmlFor="email">
                  Adresse email
                  <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                {erreur && <div className="message erreur" role="alert">{erreur}</div>}
                <button className="bouton principal" disabled={etat === 'envoi'}>
                  {etat === 'envoi' ? 'Envoi…' : api.demo ? 'Ouvrir le dossier d\'exemple' : 'Recevoir mon lien de connexion'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
