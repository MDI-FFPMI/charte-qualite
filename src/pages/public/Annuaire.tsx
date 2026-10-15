// Carte de France des titulaires et fiche publique d'un photographe.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Site from '../../components/site/Site';
import { annuaire, type Fiche } from '../../lib/annuaire';
import ref from '../../data/referentiel-v3.json';
import type { Referentiel } from '../../lib/types';

const referentiel = ref as Referentiel;
const libSpe = (c: string) => referentiel.specialites.find((s) => s.value === c)?.label ?? c;
const initiales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]?.toUpperCase()).join('');
const lienWeb = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
const lienInsta = (u: string) => (u.includes('instagram.com') ? lienWeb(u) : `https://instagram.com/${u.replace(/^@/, '')}`);

export function Portrait({ f, taille = 64 }: { f: Pick<Fiche, 'photo_url' | 'nom_affiche'>; taille?: number }) {
  return f.photo_url
    ? <img src={f.photo_url} alt={`Portrait de ${f.nom_affiche}`} className="portrait" style={{ width: taille, height: taille }} />
    : <span className="portrait vide" style={{ width: taille, height: taille, fontSize: taille / 2.6 }} aria-hidden="true">{initiales(f.nom_affiche)}</span>;
}

function Carte({ fiches, choisie, onChoisir }: { fiches: Fiche[]; choisie: string; onChoisir: (id: string) => void }) {
  const boite = useRef<HTMLDivElement>(null);
  const carte = useRef<L.Map | null>(null);
  const calque = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!boite.current || carte.current) return;
    carte.current = L.map(boite.current, { scrollWheelZoom: false }).setView([46.6, 2.4], 5.4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; contributeurs OpenStreetMap',
    }).addTo(carte.current);
    calque.current = L.layerGroup().addTo(carte.current);
    return () => { carte.current?.remove(); carte.current = null; };
  }, []);

  const cadre = useRef(false);
  useEffect(() => {
    const c = calque.current;
    if (!c) return;
    c.clearLayers();
    const points = fiches.filter((f) => f.lat != null && f.lng != null).map((f) => [f.lat!, f.lng!] as [number, number]);
    if (!cadre.current && points.length > 1) { carte.current?.fitBounds(points, { padding: [40, 40], maxZoom: 9 }); cadre.current = true; }
    for (const f of fiches) {
      if (f.lat == null || f.lng == null) continue;
      const actif = f.id === choisie;
      L.circleMarker([f.lat, f.lng], {
        radius: actif ? 11 : 8, color: '#fff', weight: 2, fillColor: actif ? '#d43b43' : '#29336e', fillOpacity: 1,
      }).bindTooltip(`${f.nom_affiche} · ${f.ville}`).on('click', () => onChoisir(f.id)).addTo(c);
    }
  }, [fiches, choisie, onChoisir]);

  useEffect(() => {
    const f = fiches.find((x) => x.id === choisie);
    if (f?.lat != null && f.lng != null) carte.current?.flyTo([f.lat, f.lng], Math.max(carte.current.getZoom(), 8), { duration: .6 });
  }, [choisie, fiches]);

  return <div ref={boite} className="carte-france" role="application" aria-label="Carte de France des photographes titulaires" />;
}

export default function Annuaire() {
  const [fiches, setFiches] = useState<Fiche[] | null>(null);
  const [erreur, setErreur] = useState('');
  const [spe, setSpe] = useState('');
  const [cherche, setCherche] = useState('');
  const [choisie, setChoisie] = useState('');
  useEffect(() => { annuaire.titulaires().then(setFiches).catch((e) => setErreur((e as Error).message)); }, []);

  const liste = useMemo(() => (fiches ?? []).filter((f) => (!spe || f.specialites.includes(spe))
    && (!cherche || `${f.nom_affiche} ${f.entreprise} ${f.ville} ${f.code_postal} ${f.departement}`.toLowerCase().includes(cherche.toLowerCase()))), [fiches, spe, cherche]);
  const presentes = useMemo(() => new Set((fiches ?? []).flatMap((f) => f.specialites)), [fiches]);

  useEffect(() => {
    if (choisie) document.getElementById(`fiche-${choisie}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [choisie]);

  return (
    <Site titre="Carte des titulaires" large
      chapo="Les photographes titulaires de la Charte Qualité Photographe Professionnel de France, partout en France. Chaque photographe a choisi d'apparaître ici.">
      {erreur && <div className="message erreur">{erreur}</div>}
      {fiches && fiches.length === 0 ? (
        <div className="encart pile" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <h2 style={{ color: 'var(--accent)', margin: 0 }}>Les premiers titulaires arrivent bientôt</h2>
          <p className="discret" style={{ margin: 0 }}>La carte se remplira après la première commission. Vous êtes photographe ? Déposez votre dossier pour en faire partie.</p>
        </div>
      ) : (
        <>
          <div className="ligne">
            <label className="champ" style={{ maxWidth: 280 }}>
              Spécialité
              <select value={spe} onChange={(e) => setSpe(e.target.value)}>
                <option value="">Toutes</option>
                {referentiel.specialites.filter((s) => presentes.has(s.value)).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label className="champ" style={{ maxWidth: 320 }}>
              Ville, département ou nom
              <input value={cherche} onChange={(e) => setCherche(e.target.value)} placeholder="Ex. Nantes, 69, Studio…" />
            </label>
            <span className="discret petit" style={{ alignSelf: 'flex-end', paddingBottom: '.7rem' }}>{liste.length} photographe{liste.length > 1 ? 's' : ''}</span>
          </div>
          <div className="annuaire-grille">
            <Carte fiches={liste} choisie={choisie} onChoisir={setChoisie} />
            <div className="annuaire-liste" aria-live="polite">
              {!fiches ? <p className="discret">Chargement…</p> : liste.map((f) => (
                <Link key={f.id} id={`fiche-${f.id}`} to={`/photographe/${f.slug}`} className={`annuaire-carte${f.id === choisie ? ' choisie' : ''}`}
                  onMouseEnter={() => setChoisie(f.id)}>
                  <Portrait f={f} taille={56} />
                  <span className="pile" style={{ gap: '.15rem', minWidth: 0 }}>
                    <strong>{f.nom_affiche}</strong>
                    <span className="petit discret">{[f.entreprise, f.ville].filter(Boolean).join(' · ')}</span>
                    <span>{f.principales.slice(0, 3).map((s) => <span key={s} className="puce-spe ref">{libSpe(s)}</span>)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </Site>
  );
}

export function FichePublique() {
  const { slug = '' } = useParams();
  const [f, setF] = useState<Fiche | null | undefined>(undefined);
  useEffect(() => { annuaire.parSlug(slug).then(setF).catch(() => setF(null)); }, [slug]);

  if (f === undefined) return <Site appel={false}><p className="discret">Chargement…</p></Site>;
  if (!f) return (
    <Site titre="Fiche introuvable" appel={false}>
      <p>Cette fiche n'existe pas ou n'est plus publiée.</p>
      <p><Link to="/carte">← Retour à la carte des titulaires</Link></p>
    </Site>
  );
  const autres = f.specialites.filter((s) => !f.principales.includes(s));
  return (
    <Site appel={false}>
      <Link to="/carte" className="retour">← Carte des titulaires</Link>
      <article className="fiche-publique">
        <div className="fiche-tete">
          <Portrait f={f} taille={150} />
          <div className="pile" style={{ gap: '.5rem' }}>
            <span className="badge-charte">Titulaire de la Charte Qualité{f.fin_validite ? ` · jusqu'en ${new Date(f.fin_validite).getFullYear()}` : ''}</span>
            <h1 className="equerre">{f.nom_affiche}</h1>
            {(f.entreprise || f.logo_url) && (
              <div className="ligne" style={{ gap: '.75rem', alignItems: 'center' }}>
                {f.logo_url && <span className="logo-studio-cadre" style={{ width: 120, height: 60 }}><img src={f.logo_url} alt={`Logo ${f.entreprise || f.nom_affiche}`} /></span>}
                {f.entreprise && <p className="fiche-entreprise" style={{ margin: 0 }}>{f.entreprise}</p>}
              </div>
            )}
            <p className="discret" style={{ margin: 0 }}>{[f.ville, f.departement.split(' - ')[1]].filter(Boolean).join(', ')}</p>
            <div>
              {f.principales.map((s) => <span key={s} className="puce-spe ref">{libSpe(s)}</span>)}
              {autres.map((s) => <span key={s} className="puce-spe">{libSpe(s)}</span>)}
            </div>
          </div>
        </div>
        {f.presentation && <p className="fiche-presentation">{f.presentation}</p>}
        <div className="fiche-contacts">
          {f.site && <a className="bouton principal" href={lienWeb(f.site)} target="_blank" rel="noopener noreferrer">Voir son site</a>}
          {f.instagram && <a className="bouton secondaire" href={lienInsta(f.instagram)} target="_blank" rel="noopener noreferrer">Instagram</a>}
          {f.email_contact && <a className="bouton secondaire" href={`mailto:${f.email_contact}`}>{f.email_contact}</a>}
          {f.telephone && <a className="bouton secondaire" href={`tel:${f.telephone.replace(/\s/g, '')}`}>{f.telephone}</a>}
        </div>
        <aside className="encart petit">
          Ce photographe s'est engagé à respecter la <Link to="/deontologie">charte de déontologie</Link> : statut déclaré, assurance professionnelle,
          contrat écrit, prix connus à l'avance, sécurité des personnes photographiées et respect de vos données.
        </aside>
      </article>
    </Site>
  );
}
