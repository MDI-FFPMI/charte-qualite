// Fiche annuaire du photographe, préremplie depuis son dossier.
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { annuaire, type Fiche, type FicheSaisie } from '../../lib/annuaire';
import { principalesDe } from '../../lib/scoring';
import { Portrait } from '../public/Annuaire';
import ref from '../../data/referentiel-v3.json';
import type { Referentiel, Reponses } from '../../lib/types';

const referentiel = ref as Referentiel;
const libSpe = (c: string) => referentiel.specialites.find((s) => s.value === c)?.label ?? c;
const MAX = 600;

function depuisDossier(r: Reponses): FicheSaisie {
  const vous = (r['0.1']?.valeur ?? {}) as Record<string, string>;
  const ent = (r['0.2']?.valeur ?? {}) as Record<string, string>;
  const web = (r['0.3']?.valeur ?? {}) as Record<string, string>;
  const spe = (r['2.2']?.valeur ?? {}) as { choisies?: string[] };
  return {
    publie: false, nom_affiche: [vous.prenom, vous.nom].filter(Boolean).join(' '), entreprise: ent.nom_commercial || ent.denomination || '',
    ville: ent.ville ?? '', code_postal: ent.cp ?? '', specialites: spe.choisies ?? [], principales: principalesDe(r['2.2']?.valeur),
    presentation: '', site: web.site ?? '', instagram: web.instagram ?? '', telephone: '', email_contact: '', photo_path: null,
  };
}

export default function MaFiche({ reponses, statut }: { reponses: Reponses; statut: string }) {
  const [f, setF] = useState<FicheSaisie | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [enregistree, setEnregistree] = useState<Fiche | null>(null);
  const [etat, setEtat] = useState<'' | 'encours' | 'ok' | string>('');
  const [photoEtat, setPhotoEtat] = useState('');

  useEffect(() => {
    annuaire.maFiche().then((m) => {
      if (m) { setF(m); setPhotoUrl(m.photo_url ?? null); setEnregistree(m); } else setF(depuisDossier(reponses));
    }).catch(() => setF(depuisDossier(reponses)));
  }, [reponses]);

  if (!f) return <p className="discret">Chargement…</p>;
  const maj = (champ: keyof FicheSaisie) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [champ]: e.target.value });

  const photo = async (e: ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    e.target.value = '';
    if (!fichier) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(fichier.type)) { setPhotoEtat('Format accepté : JPG, PNG ou WebP.'); return; }
    if (fichier.size > 5 * 1024 * 1024) { setPhotoEtat('La photo dépasse 5 Mo.'); return; }
    setPhotoEtat('Envoi…');
    try {
      const chemin = await annuaire.deposerPhoto(fichier);
      setF({ ...f, photo_path: chemin });
      setPhotoUrl(URL.createObjectURL(fichier));
      setPhotoEtat('Photo ajoutée. Pensez à enregistrer la fiche.');
    } catch (err) { setPhotoEtat((err as Error).message); }
  };

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.nom_affiche.trim() || !f.ville.trim()) { setEtat('Indiquez au moins votre nom et votre ville.'); return; }
    setEtat('encours');
    try { const r = await annuaire.enregistrer(f); setEnregistree(r); setF(r); setEtat('ok'); }
    catch (err) { setEtat((err as Error).message); }
  };

  const visible = enregistree?.publie && statut === 'accorde';
  return (
    <form className="pile" style={{ gap: '1.5rem' }} onSubmit={enregistrer}>
      <div className="pile" style={{ gap: '.4rem' }}>
        <h1 className="equerre">Ma fiche annuaire</h1>
        <p className="discret" style={{ maxWidth: '65ch' }}>
          Les titulaires de la Charte qui le souhaitent apparaissent sur la carte de France du site, avec une fiche à leur nom.
          Votre fiche ne devient visible qu'une fois la Charte accordée, et seulement si vous donnez votre accord.
        </p>
        <span className={`badge ${visible ? 'ok' : 'info'}`} style={{ alignSelf: 'flex-start' }}>
          {visible ? 'Visible sur la carte' : enregistree?.publie ? 'Accord donné : visible dès que la Charte sera accordée' : 'Non publiée'}
        </span>
      </div>

      <div className="carte pile">
        <h2 style={{ fontSize: '1.05rem' }}>Votre photo</h2>
        <div className="ligne" style={{ gap: '1.25rem' }}>
          <Portrait f={{ photo_url: photoUrl, nom_affiche: f.nom_affiche || '?' }} taille={110} />
          <div className="pile" style={{ gap: '.4rem' }}>
            <label className="depot" style={{ alignSelf: 'flex-start' }}>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={photo} />
              {photoUrl ? 'Changer de photo' : '+ Ajouter une photo'}
            </label>
            <span className="petit discret">Un portrait de vous, de face, cadré épaules. Format carré conseillé, JPG ou PNG, 5 Mo maximum.</span>
            {photoEtat && <span className="petit" role="status">{photoEtat}</span>}
          </div>
        </div>
      </div>

      <div className="carte pile">
        <h2 style={{ fontSize: '1.05rem' }}>Ce qui apparaîtra sur votre fiche</h2>
        <div className="champs-grille">
          <label className="champ">Nom affiché<input value={f.nom_affiche} onChange={maj('nom_affiche')} required /></label>
          <label className="champ">Nom de votre studio ou entreprise<input value={f.entreprise} onChange={maj('entreprise')} /></label>
          <label className="champ">Ville<input value={f.ville} onChange={maj('ville')} required /></label>
          <label className="champ">Code postal<input value={f.code_postal} onChange={maj('code_postal')} inputMode="numeric" maxLength={5} /></label>
          <label className="champ">Site internet<input value={f.site} onChange={maj('site')} placeholder="www.monstudio.fr" /></label>
          <label className="champ">Instagram<input value={f.instagram} onChange={maj('instagram')} placeholder="@monstudio" /></label>
          <label className="champ">Email de contact public (facultatif)<input type="email" value={f.email_contact} onChange={maj('email_contact')} /></label>
          <label className="champ">Téléphone public (facultatif)<input type="tel" value={f.telephone} onChange={maj('telephone')} /></label>
        </div>
        <label className="champ">
          Présentation <span className="discret petit">({f.presentation.length} / {MAX} caractères)</span>
          <textarea rows={5} maxLength={MAX} value={f.presentation} onChange={maj('presentation')}
            placeholder="Votre approche, vos spécialités, votre lieu de prise de vue. Écrivez pour vos futurs clients." />
        </label>
        <div className="pile" style={{ gap: '.3rem' }}>
          <span className="petit" style={{ fontWeight: 600 }}>Spécialités (reprises de votre dossier, question 2.2)</span>
          <div>
            {f.principales.map((s) => <span key={s} className="puce-spe ref">{libSpe(s)}</span>)}
            {f.specialites.filter((s) => !f.principales.includes(s)).map((s) => <span key={s} className="puce-spe">{libSpe(s)}</span>)}
            {!f.specialites.length && <span className="petit discret">Renseignez la question 2.2 de votre dossier.</span>}
          </div>
        </div>
      </div>

      <label className="encadre-charte-case">
        <input type="checkbox" checked={f.publie} onChange={(e) => setF({ ...f, publie: e.target.checked })} />
        <span>
          J'accepte que cette fiche, avec ma photo, soit publiée sur la carte des titulaires du site Photographe Professionnel de France,
          dès que la Charte m'est accordée et tant qu'elle est valide. Je peux retirer mon accord à tout moment en décochant cette case.
        </span>
      </label>

      <div className="ligne">
        <button className="bouton principal" disabled={etat === 'encours'}>{etat === 'encours' ? 'Enregistrement…' : 'Enregistrer ma fiche'}</button>
        {etat === 'ok' && <span className="message ok petit" role="status">Fiche enregistrée.</span>}
        {etat && etat !== 'ok' && etat !== 'encours' && <span className="message erreur petit" role="alert">{etat}</span>}
      </div>
    </form>
  );
}
