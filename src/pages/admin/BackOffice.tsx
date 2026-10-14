// Back-office. Version actuelle : branchée sur les données d'exemple.
// La composition assistée (lib/composition.ts) est complète ; la lecture et
// l'écriture Supabase des dossiers, experts et sessions sont la prochaine étape.
import { useMemo, useState } from 'react';
import EnTete from '../../components/EnTete';
import { estDemo } from '../../lib/api';
import refJson from '../../data/referentiel-v3.json';
import { dossiersDemo, expertsDemo, type DossierDemo } from '../../data/demo';
import { composer } from '../../lib/composition';
import type { Referentiel } from '../../lib/types';

const ref = refJson as Referentiel;
const libSpe = (c: string) => ref.specialites.find((s) => s.value === c)?.label ?? c;
const nomExpert = (id: string) => expertsDemo.find((e) => e.id === id)?.nom ?? id;

const statuts: Record<DossierDemo['statut'], [string, string]> = {
  brouillon: ['En saisie', 'info'],
  envoye: ['À contrôler', 'att'],
  complements: ['Compléments demandés', 'att'],
  attente_commission: ['Recevable', 'pts'],
  evaluation: ['En évaluation', 'pts'],
  accorde: ['Accordée', 'ok'],
  refuse: ['Refusée', 'ko'],
};

const ONGLETS = ['Tableau de bord', 'Dossiers', 'Préparer une commission', "Pool d'experts"] as const;

function TableauDeBord() {
  const compte = (s: DossierDemo['statut']) => dossiersDemo.filter((d) => d.statut === s).length;
  return (
    <div className="pile" style={{ gap: '1.5rem' }}>
      <div className="tuiles">
        <div className="tuile"><div className="valeur num">{compte('envoye')}</div><div className="discret">dossiers à contrôler</div></div>
        <div className="tuile"><div className="valeur num">{compte('attente_commission')}</div><div className="discret">recevables, en attente de commission</div></div>
        <div className="tuile"><div className="valeur num">{compte('complements')}</div><div className="discret">en attente de compléments</div></div>
        <div className="tuile"><div className="valeur num">{expertsDemo.filter((e) => e.disponible).length}</div><div className="discret">experts disponibles sur {expertsDemo.length}</div></div>
      </div>
      <div className="grille-2">
        <div className="carte pile">
          <h2 style={{ fontSize: '1.05rem' }}>Prochaine commission</h2>
          <p><strong>Lundi 8 décembre 2026</strong>, en visio</p>
          <p className="discret">40 dossiers au plus, 6 experts. {compte('attente_commission')} dossiers prêts à ce jour.</p>
        </div>
        <div className="carte pile">
          <h2 style={{ fontSize: '1.05rem' }}>À faire</h2>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }} className="pile">
            <li>Contrôler {compte('envoye')} dossiers envoyés (pièces lisibles, dates valides)</li>
            <li>Composer la commission du 8 décembre</li>
            <li>Relancer 1 candidat en attente de compléments depuis plus de 7 jours</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Dossiers() {
  const [filtre, setFiltre] = useState<'' | DossierDemo['statut']>('');
  const liste = dossiersDemo.filter((d) => !filtre || d.statut === filtre);
  return (
    <div className="pile">
      <div className="ligne">
        <label className="champ" style={{ maxWidth: 280 }}>
          Statut
          <select value={filtre} onChange={(e) => setFiltre(e.target.value as DossierDemo['statut'])}>
            <option value="">Tous</option>
            {Object.entries(statuts).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>
      <div className="tableau-wrap">
        <table className="tableau">
          <thead><tr><th>Dossier</th><th>Candidat</th><th>Spécialité principale</th><th>Reçu le</th><th>Score indicatif</th><th>Statut</th></tr></thead>
          <tbody>
            {liste.map((d) => (
              <tr key={d.id}>
                <td className="num">{d.numero}</td>
                <td>{d.candidat}<br /><span className="petit discret">{d.ville}</span></td>
                <td>{libSpe(d.principale)}</td>
                <td className="num">{new Date(d.recu).toLocaleDateString('fr-FR')}</td>
                <td className="num">{d.score ? d.score.toLocaleString('fr-FR') : '-'}</td>
                <td><span className={`badge ${statuts[d.statut][1]}`}>{statuts[d.statut][0]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Commission() {
  const prets = dossiersDemo.filter((d) => d.statut === 'attente_commission');
  const [exclus, setExclus] = useState<string[]>([]);
  const pool = expertsDemo.map((e) => (exclus.includes(e.id) ? { ...e, disponible: false } : e));
  const p = useMemo(() => composer(prets, pool, 6, new Date('2026-10-14'), libSpe), [prets, pool]);
  const parId = Object.fromEntries(prets.map((d) => [d.id, d]));
  return (
    <div className="pile" style={{ gap: '1.5rem' }}>
      <div className="pile" style={{ gap: '.3rem' }}>
        <h2 className="equerre">Commission du 8 décembre 2026</h2>
        <p className="discret">{prets.length} dossiers recevables · 6 experts · chacun note tous les portfolios, 2 rapporteurs par dossier vérifient les justificatifs.</p>
      </div>

      {p.alertes.length > 0 && <div className="message att">{p.alertes.map((a) => <div key={a}>{a}</div>)}</div>}

      <div className="pile">
        <h3>Experts proposés</h3>
        <div className="grille-2">
          {p.experts.map((x) => {
            const e = expertsDemo.find((y) => y.id === x.id)!;
            return (
              <div className="carte expert-carte" key={x.id}>
                <div className="ligne" style={{ justifyContent: 'space-between' }}>
                  <strong>{e.nom}</strong>
                  <span className="badge pts num">{x.nbRapports} dossiers rapportés</span>
                </div>
                <span className="petit discret">{e.ville}{e.titres.length ? ` · ${e.titres.join(', ')}` : ''}</span>
                <div>{e.specialites.map((s) => <span key={s.code} className={`puce-spe${s.niveau === 'referent' ? ' ref' : ''}`}>{libSpe(s.code)}</span>)}</div>
                <p className="petit">{x.raison}</p>
                <button className="bouton secondaire petit-btn" style={{ alignSelf: 'flex-start' }} onClick={() => setExclus((l) => [...l, x.id])}>
                  Remplacer cet expert
                </button>
              </div>
            );
          })}
        </div>
        {exclus.length > 0 && (
          <p className="petit">Écartés : {exclus.map(nomExpert).join(', ')} · <button className="retirer" style={{ color: 'var(--accent)' }} onClick={() => setExclus([])}>Annuler</button></p>
        )}
      </div>

      <div className="pile">
        <h3>Rapporteurs par dossier</h3>
        <div className="tableau-wrap">
          <table className="tableau">
            <thead><tr><th>Dossier</th><th>Spécialités</th><th>Rapporteurs proposés</th></tr></thead>
            <tbody>
              {p.affectations.map((a) => {
                const d = parId[a.dossierId];
                return (
                  <tr key={a.dossierId}>
                    <td className="num">{d.numero}<br /><span className="petit discret">{d.candidat}</span></td>
                    <td><strong>{libSpe(d.principale)}</strong>{d.autres.length > 0 && <span className="discret"> · {d.autres.map(libSpe).join(', ')}</span>}</td>
                    <td>
                      {a.raisons.map((r) => <div key={r} className="petit">{r}</div>)}
                      {a.alerte && <span className="badge att" style={{ marginTop: '.3rem' }}>{a.alerte}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="ligne" style={{ justifyContent: 'flex-end' }}>
        <button className="bouton principal">Valider et envoyer les invitations</button>
      </div>
    </div>
  );
}

function Pool() {
  return (
    <div className="grille-2">
      {expertsDemo.map((e) => (
        <div className="carte expert-carte" key={e.id}>
          <div className="ligne" style={{ justifyContent: 'space-between' }}>
            <strong>{e.nom}</strong>
            <span className={`badge ${e.disponible ? 'ok' : 'info'}`}>{e.disponible ? 'Disponible le 8 déc.' : 'Indisponible'}</span>
          </div>
          <span className="petit discret">{e.ville}{e.titres.length ? ` · ${e.titres.join(', ')}` : ''}</span>
          <div>{e.specialites.map((s) => <span key={s.code} className={`puce-spe${s.niveau === 'referent' ? ' ref' : ''}`}>{libSpe(s.code)}{s.niveau === 'referent' ? ' · référent' : ''}</span>)}</div>
          <span className="petit discret">
            {e.dernierPassage ? `Dernière commission : ${new Date(e.dernierPassage).toLocaleDateString('fr-FR')}` : 'Jamais siégé'}
            {e.conflits.length > 0 && ` · conflit déclaré sur ${e.conflits.join(', ')}`}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function BackOffice() {
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]>('Tableau de bord');
  return (
    <>
      <EnTete espace="admin" liens={[{ to: '/admin', label: 'Charte Qualité', end: true }]} />
      <main className="gouttiere">
        <div className="conteneur">
          {!estDemo && (
            <div className="message att" style={{ marginBottom: '1.25rem' }}>
              Version de travail : cet espace affiche des données d'exemple et n'est pas encore relié à la base. Les dossiers réels apparaîtront ici à la prochaine étape.
            </div>
          )}
          <div className="onglets" role="tablist">
            {ONGLETS.map((o) => <button key={o} role="tab" aria-selected={onglet === o} onClick={() => setOnglet(o)}>{o}</button>)}
          </div>
          {onglet === 'Tableau de bord' && <TableauDeBord />}
          {onglet === 'Dossiers' && <Dossiers />}
          {onglet === 'Préparer une commission' && <Commission />}
          {onglet === "Pool d'experts" && <Pool />}
        </div>
      </main>
    </>
  );
}
