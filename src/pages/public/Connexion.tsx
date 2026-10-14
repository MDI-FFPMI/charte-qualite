import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import EnTete from '../../components/EnTete';
import { api, estDemo } from '../../lib/api';
import { accueilDuRole, useSession } from '../../App';

type Mode = 'connexion' | 'inscription' | 'oubli' | 'lien';
const emailValide = (e: string) => /^\S+@\S+\.\S+$/.test(e);
const erreurMotDePasse = (m: string) =>
  m.length < 8 ? 'Le mot de passe doit faire au moins 8 caractères.'
    : !/[a-zA-Z]/.test(m) || !/\d/.test(m) ? 'Le mot de passe doit contenir des lettres et des chiffres.' : '';

function ChampMotDePasse({ id, label, valeur, onChange, nouveau }: { id: string; label: string; valeur: string; onChange: (v: string) => void; nouveau?: boolean }) {
  const [voir, setVoir] = useState(false);
  return (
    <label className="champ" htmlFor={id}>
      {label}
      <span className="ligne" style={{ flexWrap: 'nowrap', gap: '.4rem' }}>
        <input id={id} type={voir ? 'text' : 'password'} autoComplete={nouveau ? 'new-password' : 'current-password'}
          value={valeur} onChange={(e) => onChange(e.target.value)} required style={{ flex: 1 }} />
        <button type="button" className="bouton secondaire petit-btn" onClick={() => setVoir((v) => !v)} aria-pressed={voir}>{voir ? 'Masquer' : 'Afficher'}</button>
      </span>
    </label>
  );
}

export default function Connexion() {
  const { utilisateur, rafraichir } = useSession();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const espace = params.get('espace');
  const [mode, setMode] = useState<Mode>(espace === 'inscription' ? 'inscription' : 'connexion');
  const [email, setEmail] = useState(estDemo ? 'exemple@studio-photo.fr' : '');
  const [mdp, setMdp] = useState('');
  const [mdp2, setMdp2] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');

  if (utilisateur) return <Navigate to={accueilDuRole(utilisateur.role)} replace />;

  const titre = mode === 'inscription' ? 'Déposer ma candidature'
    : mode === 'oubli' ? 'Mot de passe oublié'
    : espace === 'admin' ? 'Connexion au back-office'
    : espace === 'expert' ? "Connexion à l'espace expert"
    : 'Reprendre mon dossier';

  const changer = (m: Mode) => { setMode(m); setErreur(''); setInfo(''); };

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(''); setInfo('');
    if (!emailValide(email)) { setErreur('Saisissez une adresse email valide.'); return; }
    if (mode === 'inscription') {
      const pb = erreurMotDePasse(mdp);
      if (pb) { setErreur(pb); return; }
      if (mdp !== mdp2) { setErreur('Les deux mots de passe ne sont pas identiques.'); return; }
    }
    if (mode === 'connexion' && !mdp && !api.demo) { setErreur('Saisissez votre mot de passe.'); return; }
    setOccupe(true);
    try {
      if (mode === 'connexion') { await api.connexion(email, mdp); await rafraichir(); }
      else if (mode === 'inscription') {
        const r = await api.inscription(email, mdp);
        if (r.aConfirmer) setInfo(`Compte créé. Cliquez sur le lien envoyé à ${email} pour l'activer, puis connectez-vous.`);
        else { await rafraichir(); nav('/candidat'); }
      } else if (mode === 'oubli') {
        await api.motDePasseOublie(email);
        setInfo(`Si un compte existe pour ${email}, un lien pour choisir un nouveau mot de passe vient d'être envoyé. Pensez à vérifier vos courriers indésirables.`);
      } else {
        await api.envoyerLien(email);
        if (api.demo) { await rafraichir(); nav('/candidat'); return; }
        setInfo(`Un lien de connexion vient d'être envoyé à ${email}. Il est valable une heure.`);
      }
    } catch (err) { setErreur((err as Error).message); }
    setOccupe(false);
  };

  const libelleBouton = mode === 'connexion' ? 'Me connecter' : mode === 'inscription' ? 'Créer mon compte et ouvrir mon dossier'
    : mode === 'oubli' ? 'Recevoir un lien de réinitialisation' : 'Recevoir un lien de connexion';

  return (
    <>
      <EnTete espace="public" />
      <main className="gouttiere">
        <div className="conteneur" style={{ maxWidth: 520 }}>
          <div className="carte pile">
            <h1 className="equerre" style={{ fontSize: '1.5rem' }}>{titre}</h1>
            {mode === 'inscription' && <p className="discret">Créez votre compte avec votre adresse email professionnelle. Vous pourrez revenir sur votre dossier à tout moment avec ce mot de passe.</p>}
            {mode === 'oubli' && <p className="discret">Saisissez votre adresse : vous recevrez un lien pour choisir un nouveau mot de passe.</p>}
            {mode === 'lien' && <p className="discret">Sans mot de passe : vous recevez un lien de connexion par email.</p>}
            {info ? <div className="message ok" role="status">{info}</div> : (
              <form className="pile" onSubmit={envoyer} noValidate>
                <label className="champ" htmlFor="email">
                  Adresse email
                  <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                {(mode === 'connexion' || mode === 'inscription') && (
                  <ChampMotDePasse id="mdp" label="Mot de passe" valeur={mdp} onChange={setMdp} nouveau={mode === 'inscription'} />
                )}
                {mode === 'inscription' && (
                  <>
                    <ChampMotDePasse id="mdp2" label="Confirmez le mot de passe" valeur={mdp2} onChange={setMdp2} nouveau />
                    <p className="petit discret" style={{ marginTop: '-.5rem' }}>8 caractères au moins, avec des lettres et des chiffres.</p>
                  </>
                )}
                {erreur && <div className="message erreur" role="alert">{erreur}</div>}
                <button className="bouton principal" disabled={occupe}>{occupe ? 'Patientez…' : libelleBouton}</button>
              </form>
            )}
            <div className="pile petit" style={{ gap: '.4rem' }}>
              {mode === 'connexion' && <button className="lien-texte" onClick={() => changer('oubli')}>Mot de passe oublié ?</button>}
              {mode === 'connexion' && espace !== 'admin' && espace !== 'expert' && <button className="lien-texte" onClick={() => changer('inscription')}>Pas encore de compte ? Déposer ma candidature</button>}
              {mode === 'inscription' && <button className="lien-texte" onClick={() => changer('connexion')}>J'ai déjà un compte : me connecter</button>}
              {(mode === 'oubli' || mode === 'lien') && <button className="lien-texte" onClick={() => changer('connexion')}>Retour à la connexion</button>}
              {mode === 'connexion' && <button className="lien-texte" onClick={() => changer('lien')}>Recevoir plutôt un lien par email</button>}
            </div>
          </div>
          <p className="petit discret" style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link to="/connexion">Candidat</Link> · <Link to="/connexion?espace=expert">Expert</Link> · <Link to="/connexion?espace=admin">Back-office</Link>
          </p>
        </div>
      </main>
    </>
  );
}

/** Choix d'un nouveau mot de passe (après le lien « mot de passe oublié », ou depuis son nom en haut de page) */
export function MotDePasse() {
  const { utilisateur, charge } = useSession();
  const nav = useNavigate();
  const [mdp, setMdp] = useState('');
  const [mdp2, setMdp2] = useState('');
  const [erreur, setErreur] = useState('');
  const [fait, setFait] = useState(false);
  const [occupe, setOccupe] = useState(false);

  const envoyer = async (e: FormEvent) => {
    e.preventDefault(); setErreur('');
    const pb = erreurMotDePasse(mdp);
    if (pb) { setErreur(pb); return; }
    if (mdp !== mdp2) { setErreur('Les deux mots de passe ne sont pas identiques.'); return; }
    setOccupe(true);
    try { await api.changerMotDePasse(mdp); setFait(true); } catch (err) { setErreur((err as Error).message); }
    setOccupe(false);
  };

  return (
    <>
      <EnTete espace="public" />
      <main className="gouttiere">
        <div className="conteneur" style={{ maxWidth: 520 }}>
          <div className="carte pile">
            <h1 className="equerre" style={{ fontSize: '1.5rem' }}>Choisir un mot de passe</h1>
            {!charge ? <p className="discret">Chargement…</p> : !utilisateur ? (
              <div className="pile">
                <div className="message att">Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.</div>
                <Link to="/connexion" className="bouton secondaire">Retour à la connexion</Link>
              </div>
            ) : fait ? (
              <div className="pile">
                <div className="message ok" role="status">Mot de passe enregistré. Utilisez-le pour vos prochaines connexions.</div>
                <button className="bouton principal" onClick={() => nav(accueilDuRole(utilisateur.role))}>Continuer</button>
              </div>
            ) : (
              <form className="pile" onSubmit={envoyer} noValidate>
                <p className="discret">Compte : <strong>{utilisateur.email}</strong></p>
                <ChampMotDePasse id="n1" label="Nouveau mot de passe" valeur={mdp} onChange={setMdp} nouveau />
                <ChampMotDePasse id="n2" label="Confirmez le mot de passe" valeur={mdp2} onChange={setMdp2} nouveau />
                <p className="petit discret" style={{ marginTop: '-.5rem' }}>8 caractères au moins, avec des lettres et des chiffres.</p>
                {erreur && <div className="message erreur" role="alert">{erreur}</div>}
                <button className="bouton principal" disabled={occupe}>{occupe ? 'Patientez…' : 'Enregistrer'}</button>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
