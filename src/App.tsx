import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { api, estDemo, type Role, type Utilisateur } from './lib/api';
import Accueil from './pages/public/Accueil';
import { Deontologie, LaCharte, Preparer, Questions } from './pages/public/PagesSite';
import Annuaire, { FichePublique } from './pages/public/Annuaire';
import Donnees from './pages/public/Donnees';
import Connexion, { MotDePasse } from './pages/public/Connexion';
import EspaceCandidat from './pages/candidat/EspaceCandidat';
import EspaceExpert from './pages/expert/EspaceExpert';
import BackOffice from './pages/admin/BackOffice';

interface Session { utilisateur: Utilisateur | null; charge: boolean; rafraichir: () => Promise<void> }
const SessionCtx = createContext<Session>({ utilisateur: null, charge: false, rafraichir: async () => {} });
export const useSession = () => useContext(SessionCtx);

function Garde({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { utilisateur, charge } = useSession();
  if (!charge) return <p className="gouttiere conteneur discret" style={{ paddingBlock: '3rem' }}>Chargement…</p>;
  if (!utilisateur) {
    const espace = roles.includes('expert') ? 'expert' : roles.includes('admin') ? 'admin' : 'candidat';
    return <Navigate to={`/connexion?espace=${espace}`} replace />;
  }
  if (!roles.includes(utilisateur.role)) return <Navigate to={accueilDuRole(utilisateur.role)} replace />;
  return <>{children}</>;
}

export const accueilDuRole = (r: Role) => (r === 'expert' ? '/expert' : r === 'candidat' ? '/candidat' : '/admin');

export default function App() {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [charge, setCharge] = useState(false);
  const rafraichir = useCallback(async () => {
    setUtilisateur(await api.utilisateur());
    setCharge(true);
  }, []);
  useEffect(() => {
    void rafraichir();
    return api.surChangement(() => { void rafraichir(); });
  }, [rafraichir]);

  const Routeur = estDemo ? MemoryRouter : BrowserRouter;
  return (
    <SessionCtx.Provider value={{ utilisateur, charge, rafraichir }}>
      <Routeur>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/la-charte" element={<LaCharte />} />
          <Route path="/a-quoi-ca-sert" element={<Navigate to="/la-charte" replace />} />
          <Route path="/pour-qui" element={<Navigate to="/la-charte#pour-qui" replace />} />
          <Route path="/preparer" element={<Preparer />} />
          <Route path="/deontologie" element={<Deontologie />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/carte" element={<Annuaire />} />
          <Route path="/donnees-personnelles" element={<Donnees />} />
          <Route path="/photographe/:slug" element={<FichePublique />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/mot-de-passe" element={<MotDePasse />} />
          <Route path="/candidat/*" element={<Garde roles={['candidat']}><EspaceCandidat /></Garde>} />
          <Route path="/expert/*" element={<Garde roles={['expert']}><EspaceExpert /></Garde>} />
          <Route path="/admin/*" element={<Garde roles={['admin', 'gestionnaire']}><BackOffice /></Garde>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Routeur>
    </SessionCtx.Provider>
  );
}
