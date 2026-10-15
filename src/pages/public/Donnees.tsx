// Information relative au traitement des données personnelles (RGPD).
import { Link } from 'react-router-dom';
import Site from '../../components/site/Site';

// Informations à tenir à jour par la FFPMI
const MISE_A_JOUR = 'octobre 2026';
const HEBERGEURS = [
  { role: 'Base de données et justificatifs', nom: 'Supabase Inc.', detail: 'Région d\'hébergement des serveurs : Union européenne (à confirmer par la FFPMI)' },
  { role: 'Pages du site', nom: 'Vercel Inc.', detail: 'Diffuse les pages du site. Aucune donnée de candidature n\'y est stockée.' },
];

const FINALITES = [
  ['Enregistrer votre candidature', 'Créer et suivre votre dossier de candidature à la Charte Qualité.'],
  ['Vérifier les critères', 'Contrôler vos réponses et les justificatifs demandés par le référentiel.'],
  ['Échanger avec vous', 'Vous contacter en cas de dossier incomplet, de question, ou pour vous notifier la décision.'],
  ['Gérer le label', 'Assurer le suivi de l\'attribution, de la validité, du renouvellement, de la suspension ou du retrait.'],
  ['Publier votre fiche', 'Seulement si vous l\'acceptez : vous faire connaître sur la carte des titulaires.'],
];

const DONNEES = [
  ['Identité et coordonnées', 'Nom, prénom, e-mail, téléphone', 'Vous identifier et communiquer avec vous'],
  ['Informations professionnelles', 'Entreprise, SIRET, activité déclarée, statut, site et réseaux', 'Vérifier votre éligibilité professionnelle'],
  ['Réponses au référentiel', 'Réponses aux questions et précisions demandées', 'Évaluer la conformité aux critères'],
  ['Pièces justificatives', 'Attestations, assurances, contrats et autres preuves', 'Vérifier vos déclarations'],
  ['Engagement déontologique', 'Phrase d\'engagement recopiée, date, version de la charte', 'Prouver votre engagement'],
  ['Suivi du dossier', 'Dates, statut, avis, décision, historique des actions', 'Assurer le suivi administratif et la sécurité'],
  ['Fiche annuaire (facultative)', 'Photo, présentation, ville, spécialités, liens, contact public', 'Vous présenter au public, avec votre accord'],
];

const PARCOURS = [
  ['Dépôt du dossier', 'Vous remplissez le formulaire et transmettez les preuves demandées.'],
  ['Enregistrement sécurisé', 'Réponses et justificatifs sont stockés dans un espace privé.'],
  ['Instruction humaine', 'L\'équipe MDI, puis deux experts, consultent les réponses et les pièces.'],
  ['Décision', 'La commission accorde, refuse ou demande un complément.'],
  ['Fin de conservation', 'Les données devenues inutiles sont supprimées.'],
];

const DUREES = [
  ['Dossier commencé mais jamais envoyé', '6 mois après la dernière modification'],
  ['Dossier refusé', '2 mois après la décision, ou à la fin du recours s\'il y en a un'],
  ['Dossier accordé', 'Jusqu\'à la fin de validité de la Charte (2 ans)'],
  ['Fiche annuaire', 'Retirée de la carte à la fin de validité ou dès que vous le demandez'],
];

function Partie({ etiquette, titre, children, fond, id }: { etiquette: string; titre: string; children: React.ReactNode; fond?: boolean; id?: string }) {
  return (
    <section className={`rgpd-partie${fond ? ' fond' : ''}`} id={id}>
      <span className="rgpd-etiquette">{etiquette}</span>
      <h2>{titre}</h2>
      {children}
    </section>
  );
}

export default function Donnees() {
  return (
    <Site appel={false}>
      <header className="rgpd-bandeau">
        <span className="rgpd-etiquette clair">Protection des données</span>
        <h1>Information relative au traitement des données personnelles</h1>
        <p>La FFPMI accorde une importance particulière à la confidentialité et à la sécurité des informations confiées par les photographes candidats.
          Cette notice explique quelles données sont collectées, pourquoi, qui peut les consulter, combien de temps elles sont conservées et comment exercer vos droits.</p>
      </header>

      <Partie etiquette="Organisation" titre="1. Responsable du traitement" fond>
        <div className="deux-colonnes">
          <div className="rgpd-carte-marine">
            <strong>Fédération Française de la Photographie et des Métiers de l'Image (FFPMI)</strong>
            <span>Syndicat professionnel</span>
            <span>6 impasse Marthe Condat, 31200 Toulouse</span>
            <span>SIRET : 319 403 697 00067</span>
            <span>Téléphone : 01 59 08 04 04</span>
            <span>Courriel : <a href="mailto:charte-qualite@ffpmi.eu">charte-qualite@ffpmi.eu</a></span>
          </div>
          <div className="rgpd-carte">
            <strong>Gestion de la Charte</strong>
            <p>La FFPMI confie la gestion de la Charte à son organisme <strong>MDI - Métiers de l'Image</strong>, 111 avenue Victor Hugo, 75016 Paris,
              qui reçoit et instruit les dossiers pour son compte, dans le cadre défini par la FFPMI.</p>
          </div>
        </div>
      </Partie>

      <Partie etiquette="Utilisation" titre="2. Pourquoi collectons-nous vos données ?">
        <div className="rgpd-finalites">
          {FINALITES.map(([t, d], i) => (
            <div key={t} className="rgpd-finalite"><span className="rgpd-num">{i + 1}</span><strong>{t}</strong><p>{d}</p></div>
          ))}
        </div>
        <p className="petit discret">
          Base légale : le traitement est nécessaire à l'examen de la candidature que vous demandez. La publication de votre fiche sur la carte repose sur votre consentement,
          que vous pouvez retirer à tout moment depuis votre espace.
        </p>
      </Partie>

      <Partie etiquette="Informations" titre="3. Quelles données sont collectées ?" fond>
        <div className="guide-tableau">
          <table className="rgpd-table">
            <thead><tr><th>Catégorie</th><th>Exemples</th><th>Utilité</th></tr></thead>
            <tbody>{DONNEES.map(([a, b, c]) => <tr key={a}><td><strong>{a}</strong></td><td>{b}</td><td>{c}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="petit discret">La FFPMI s'engage à ne demander que les informations nécessaires à l'instruction et au suivi de la candidature.</p>
      </Partie>

      <section className="rgpd-alerte">
        <span className="rgpd-etiquette">Engagement</span>
        <h2>4. Aucun traitement par intelligence artificielle</h2>
        <p><strong>Aucune réponse, aucune donnée personnelle et aucune pièce justificative déposée dans une candidature n'est transmise à Claude, ChatGPT, Anthropic, OpenAI ou à tout autre service d'intelligence artificielle.</strong></p>
        <p>Les dossiers sont examinés exclusivement par des personnes habilitées. Aucune décision automatisée n'est prise. Le score indicatif affiché pendant la saisie est un simple calcul de points, qui ne décide de rien.</p>
      </section>

      <Partie etiquette="Confidentialité" titre="5. Qui peut accéder à votre dossier ?" fond>
        <p>Seules les personnes habilitées par la FFPMI peuvent consulter vos informations et vos pièces, dans la limite de leur mission :</p>
        <ul className="liste-nette">
          <li>l'équipe MDI chargée de la gestion de la Charte ;</li>
          <li>les deux experts vérificateurs attribués à votre dossier ;</li>
          <li>les experts de la commission qui examine votre dossier, pendant l'évaluation.</li>
        </ul>
        <p>Les experts sont tenus à la confidentialité et peuvent déclarer un lien avec un candidat : ils perdent alors l'accès à son dossier.</p>
        <div className="rgpd-note">
          <strong>Vos justificatifs ne sont jamais accessibles par une adresse publique.</strong> Leur consultation demande une connexion, un contrôle des droits,
          et passe par un lien temporaire valable 10 minutes.
        </div>
      </Partie>

      <Partie etiquette="Hébergement" titre="6. Où sont stockées vos données ?">
        <div className="deux-colonnes">
          {HEBERGEURS.map((h) => (
            <div key={h.nom} className="rgpd-carte-marine">
              <span className="rgpd-etiquette clair">{h.role}</span>
              <strong>{h.nom}</strong>
              <span>{h.detail}</span>
            </div>
          ))}
        </div>
        <p className="petit discret">
          Ces prestataires agissent comme sous-traitants. La FFPMI s'assure que tout transfert éventuel de données hors de l'Union européenne est encadré par les garanties
          prévues par le RGPD. La carte des titulaires utilise le fond de carte OpenStreetMap et le service de géolocalisation de l'IGN, qui ne reçoivent que le nom de la ville.
        </p>
      </Partie>

      <Partie etiquette="Parcours du dossier" titre="7. Comment votre dossier est-il traité ?" fond>
        <ol className="rgpd-parcours">
          {PARCOURS.map(([t, d]) => <li key={t}><strong>{t}</strong><span>{d}</span></li>)}
        </ol>
      </Partie>

      <Partie etiquette="Durée" titre="8. Combien de temps les données sont-elles conservées ?">
        <p>Les données sont conservées pendant la durée nécessaire à l'instruction de la candidature, à la gestion d'un éventuel recours et au suivi du label.</p>
        <div className="guide-tableau">
          <table className="rgpd-table">
            <thead><tr><th>Situation</th><th>Durée de conservation</th></tr></thead>
            <tbody>{DUREES.map(([a, b]) => <tr key={a}><td><strong>{a}</strong></td><td>{b}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="petit discret">À l'issue de la durée applicable, les réponses détaillées, les pièces justificatives et les fichiers associés sont supprimés.</p>
      </Partie>

      <Partie etiquette="Sécurité" titre="9. Comment vos données sont-elles protégées ?" fond>
        <ul className="liste-nette">
          <li>Toutes les connexions au site sont chiffrées.</li>
          <li>Les mots de passe ne sont jamais stockés en clair.</li>
          <li>Chaque personne n'accède qu'à ce que son rôle autorise : candidat, expert, équipe.</li>
          <li>Les justificatifs sont rangés dans un espace privé, séparé du site public.</li>
          <li>Les actions importantes (envoi, décision, changement de statut) sont tracées dans un journal.</li>
          <li>Le site n'utilise aucun cookie publicitaire ni outil de mesure d'audience. Seule votre connexion est mémorisée par votre navigateur.</li>
        </ul>
      </Partie>

      <Partie etiquette="Vos droits" titre="10. Comment exercer vos droits ?">
        <p>Vous pouvez à tout moment demander l'accès à vos données, leur rectification, leur effacement, la limitation de leur traitement, vous y opposer,
          ou demander à les recevoir dans un format lisible (portabilité). Vous pouvez aussi retirer votre accord de publication sur la carte, directement depuis votre espace.</p>
        <div className="rgpd-carte-marine" style={{ maxWidth: 560 }}>
          <strong>Écrivez à charte-qualite@ffpmi.eu</strong>
          <span>Nous vous répondons dans un délai d'un mois.</span>
        </div>
        <p className="petit discret">Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.</p>
      </Partie>

      <p className="petit discret">Dernière mise à jour : {MISE_A_JOUR}. Voir aussi la <Link to="/deontologie">charte de déontologie</Link>.</p>
    </Site>
  );
}
