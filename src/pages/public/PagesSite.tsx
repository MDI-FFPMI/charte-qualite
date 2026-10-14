// Pages d'information du site public.
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';
import Site, { BoutonDeposer, PDF_CHARTE, PDF_GUIDE } from '../../components/site/Site';
import { TexteCharte } from '../../components/EncadreCharte';
import { charte } from '../../data/charte-deontologie';
import guideMd from '../../../docs/guide-preparation.md?raw';
import ref from '../../data/referentiel-v3.json';
import type { Referentiel } from '../../lib/types';

const referentiel = ref as Referentiel;

// ---------------------------------------------------------------------
export function AQuoiCaSert() {
  return (
    <Site titre="À quoi sert la Charte Qualité" documents={[PDF_GUIDE, PDF_CHARTE]}
      chapo="Elle permet au public de reconnaître un photographe déclaré, assuré, compétent et engagé envers ses clients. Pour le photographe, c'est aussi un audit complet de son entreprise.">
      <div className="deux-colonnes">
        <section className="carte pile">
          <h2 style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>Pour vous, photographe</h2>
          <ul className="pile" style={{ gap: '.6rem', margin: 0, paddingLeft: '1.1rem' }}>
            <li><strong>Vous distinguer.</strong> La Charte est délivrée par la fédération de la profession, après examen de votre dossier par des experts.</li>
            <li><strong>Rassurer vos clients.</strong> Elle montre que vous êtes en règle, assuré, que vous travaillez avec un contrat clair et que vous protégez leurs images et leurs données.</li>
            <li><strong>Faire progresser votre entreprise.</strong> Le dossier passe en revue votre statut, votre relation client, votre gestion, la sécurité de vos fichiers. Chaque critère manqué est une piste d'amélioration concrète.</li>
            <li><strong>Être trouvé.</strong> Si vous le souhaitez, votre fiche apparaît sur la carte des titulaires, avec votre photo, vos spécialités et vos liens.</li>
            <li><strong>Avoir un retour d'experts.</strong> Vos galeries sont notées par des professionnels de votre spécialité.</li>
          </ul>
        </section>
        <section className="carte pile">
          <h2 style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>Pour vos clients</h2>
          <ul className="pile" style={{ gap: '.6rem', margin: 0, paddingLeft: '1.1rem' }}>
            <li><strong>Un professionnel déclaré.</strong> Immatriculé, à jour de ses cotisations, assuré en responsabilité civile professionnelle.</li>
            <li><strong>Des engagements écrits.</strong> Prix connus avant la séance, contrat, conditions de vente, délai de livraison, droits d'utilisation des images.</li>
            <li><strong>Des personnes protégées.</strong> Sécurité des modèles, en particulier des nouveau-nés et des enfants, et respect du droit à l'image.</li>
            <li><strong>Un recours.</strong> Un médiateur de la consommation en cas de litige, et la possibilité de signaler un manquement à la FFPMI.</li>
          </ul>
        </section>
      </div>
      <section className="texte-long">
        <h2>Ce que la Charte n'est pas</h2>
        <p>
          Ce n'est ni un concours ni un titre artistique. La Charte atteste un ensemble : le respect de la loi, la qualité de la relation client,
          la compétence et la constance du travail. Un photographe peut avoir un très beau portfolio et ne pas l'obtenir s'il ne protège pas ses clients,
          et inversement.
        </p>
        <h2>Qui la délivre</h2>
        <p>
          La Fédération Française de la Photographie et des Métiers de l'Image (FFPMI) a créé la Charte. Elle en confie la gestion à son organisme
          MDI - Métiers de l'Image : réception et vérification des dossiers, organisation des commissions, suivi des titulaires.
          Les décisions sont prises par une commission d'experts de la profession, réunie tous les deux mois.
        </p>
        <p><Link to="/pour-qui">Voir qui peut candidater →</Link></p>
      </section>
    </Site>
  );
}

// ---------------------------------------------------------------------
export function PourQui() {
  const elim = referentiel.rubriques.flatMap((r) => r.questions).filter((q) => q.statut === 'eliminatoire');
  return (
    <Site titre="Pour qui" documents={[PDF_GUIDE]}
      chapo="La Charte est ouverte à tous les photographes professionnels déclarés, adhérents de la FFPMI ou non, quelle que soit leur spécialité.">
      <section className="deux-colonnes">
        <div className="carte pile">
          <h2 style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>Vous pouvez candidater si</h2>
          <ul className="pile" style={{ gap: '.5rem', margin: 0, paddingLeft: '1.1rem' }}>
            <li>votre activité de photographe est <strong>immatriculée</strong>, quel que soit votre statut : micro-entreprise, entreprise individuelle ou société ;</li>
            <li>la photographie est votre activité <strong>principale ou secondaire</strong> ;</li>
            <li>vous travaillez pour des <strong>particuliers, des professionnels</strong>, ou les deux.</li>
          </ul>
          <p className="petit discret" style={{ margin: 0 }}>Aucune ancienneté minimale n'est exigée : l'expérience rapporte des points, elle n'est pas une condition.</p>
        </div>
        <div className="carte pile">
          <h2 style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>Toutes les spécialités</h2>
          <div>{referentiel.specialites.map((s) => <span key={s.value} className="puce-spe">{s.label}</span>)}</div>
          <p className="petit discret" style={{ margin: 0 }}>Vous indiquez jusqu'à 4 spécialités principales : les experts qui étudient votre dossier sont choisis en fonction d'elles.</p>
        </div>
      </section>
      <section className="texte-long">
        <h2>Les {elim.length} conditions obligatoires</h2>
        <p>Elles viennent de la loi et des fondamentaux du métier. Toutes doivent être remplies, justificatifs à l'appui, pour que le dossier puisse être envoyé.</p>
        <ol className="pile" style={{ gap: '.4rem' }}>{elim.map((q) => <li key={q.code}>{q.libelle}</li>)}</ol>
        <h2>Et ensuite, des points</h2>
        <p>
          Les autres critères rapportent des points : formation, qualité des galeries, relation client, sécurité des fichiers, accueil, transmission.
          La Charte est accordée à partir de {referentiel.version.seuil_obtention} points sur {referentiel.version.base_score}, calculés sur les seules questions qui vous concernent.
        </p>
        <p><Link to="/preparer">Préparer sa candidature, rubrique par rubrique →</Link></p>
      </section>
    </Site>
  );
}

// ---------------------------------------------------------------------
const ancre = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function Preparer() {
  const { html, titres } = useMemo(() => {
    const titres: { niveau: number; texte: string; id: string }[] = [];
    const rendu = new marked.Renderer();
    rendu.heading = ({ tokens, depth }) => {
      const texte = tokens.map((t) => ('text' in t ? t.text : '')).join('');
      const id = ancre(texte);
      titres.push({ niveau: depth, texte, id });
      return `<h${depth} id="${id}">${texte}</h${depth}>`;
    };
    rendu.paragraph = function (token) {
      const seul = token.tokens.length === 1 && token.tokens[0].type === 'strong';
      return seul ? `<p class="volet">${this.parser.parseInline(token.tokens)}</p>\n` : `<p>${this.parser.parseInline(token.tokens)}</p>\n`;
    };
    rendu.table = function (token) {
      const tete = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join('');
      const lignes = token.rows.map((r) => `<tr>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`).join('');
      return `<div class="guide-tableau"><table><thead><tr>${tete}</tr></thead><tbody>${lignes}</tbody></table></div>`;
    };
    const html = (marked.parse(guideMd, { renderer: rendu, gfm: true, async: false }) as string)
      .replace(/<input disabled="" type="checkbox">/g, '<input type="checkbox">')
      .replace(/<input (checked="" )?disabled="" type="checkbox">/g, '<input type="checkbox">');
    return { html, titres };
  }, []);

  return (
    <Site titre="Bien préparer sa candidature" large documents={[PDF_GUIDE]}
      chapo="Rassemblez vos documents, posez-vous les bonnes questions, puis remplissez votre dossier en une séance. Chaque rubrique indique aussi comment faire progresser votre entreprise.">
      <div className="guide-grille">
        <nav className="guide-sommaire" aria-label="Sommaire du guide">
          {titres.filter((t) => t.niveau <= 3).map((t) => (
            <a key={t.id} href={`#${t.id}`} className={`niveau-${t.niveau}`}
              onClick={(e) => { e.preventDefault(); document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth' }); }}>{t.texte}</a>
          ))}
        </nav>
        <article className="guide-contenu texte-long" style={{ maxWidth: 'none' }} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </Site>
  );
}

// ---------------------------------------------------------------------
export function Deontologie() {
  return (
    <Site titre="Charte de déontologie" documents={[PDF_CHARTE]}
      chapo={<>Les engagements de chaque photographe titulaire de la Charte Qualité, envers ses clients, les personnes qu'il photographie et sa profession. Version {charte.version}.</>}>
      <article className="texte-long charte-page">
        <TexteCharte />
        <section className="encadre-charte" style={{ marginTop: '2rem' }}>
          <div className="encadre-charte-engagement">
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Engagement du photographe</h2>
            <p>Le photographe s'engage en ligne, à la fin de son dossier de candidature, en recopiant et en validant la phrase suivante :</p>
            <blockquote className="encadre-charte-phrase">« {charte.phrase} »</blockquote>
            <p>Par cet engagement, il :</p>
            <ul>{charte.engagement.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </section>
        <p className="petit discret">Un manquement à signaler ? Écrivez à <a href="mailto:charte-qualite@ffpmi.eu">charte-qualite@ffpmi.eu</a>.</p>
      </article>
    </Site>
  );
}

// ---------------------------------------------------------------------
const FAQ: [string, string][] = [
  ['Combien coûte la Charte ?', '199 € pour 2 ans, ou 149 € pour les adhérents de la FFPMI. Le paiement se fait en ligne au moment de l\'inscription et ouvre aussitôt votre dossier.'],
  ['Combien de temps faut-il pour remplir le dossier ?', 'Environ 45 minutes si vos documents sont prêts. Vos réponses sont enregistrées au fur et à mesure : vous pouvez vous arrêter et reprendre quand vous voulez. Le guide de préparation liste tout ce qu\'il faut rassembler.'],
  ['Quand ai-je la réponse ?', 'Une commission se réunit tous les deux mois. Entre-temps, l\'équipe MDI contrôle vos pièces et deux experts de votre spécialité les vérifient. Vous recevez ensuite une décision motivée.'],
  ['Que se passe-t-il s\'il manque un document ?', 'Vous recevez une demande de compléments : seules les questions concernées sont rouvertes, vous les complétez et renvoyez votre dossier.'],
  ['Et si ma candidature est refusée ?', 'Le refus est motivé, point par point. Vous pouvez former un recours, examiné par la commission suivante, dans un délai de 2 mois.'],
  ['Combien de temps la Charte est-elle valable ?', '2 ans. Pendant cette période, vous signalez tout changement qui touche une condition obligatoire, par exemple la fin d\'une assurance. Vous pouvez ensuite la renouveler.'],
  ['Qui voit mes documents ?', 'Uniquement l\'équipe MDI et les experts chargés de votre dossier, tenus à la confidentialité. Vos pièces sont stockées dans un espace sécurisé, jamais partagées par email.'],
  ['Vais-je apparaître sur la carte des titulaires ?', 'Seulement si vous le souhaitez. Vous remplissez votre fiche (photo, présentation, liens) et cochez votre accord. Elle devient visible une fois la Charte accordée, et vous pouvez la retirer à tout moment.'],
  ['Les galeries doivent-elles être floutées ?', 'Non. Les galeries sont consultées sous confidentialité par les experts. Utilisez des séances pour lesquelles vos clients ont donné leur accord.'],
  ['Je ne suis pas adhérent de la FFPMI, puis-je candidater ?', 'Oui, la Charte est ouverte à tous les photographes professionnels déclarés. L\'adhésion donne seulement droit au tarif réduit.'],
];

export function Questions() {
  return (
    <Site titre="Questions fréquentes" documents={[PDF_GUIDE, PDF_CHARTE]}>
      <section className="faq">
        {FAQ.map(([q, r]) => <details key={q}><summary>{q}</summary><p>{r}</p></details>)}
      </section>
      <p>Une autre question ? Écrivez à <a href="mailto:charte-qualite@ffpmi.eu">charte-qualite@ffpmi.eu</a>.</p>
      <div className="ligne"><BoutonDeposer className="bouton deposer" /></div>
    </Site>
  );
}
