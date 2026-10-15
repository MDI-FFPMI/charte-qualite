// Pages d'information du site public.
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';
import Site, { BoutonDeposer, EncartDonnees, PDF_CHARTE, PDF_GUIDE, PhotoForme } from '../../components/site/Site';
import photoFamille from '../../assets/cible-famille.jpg';
import photoAppareil from '../../assets/cible-appareil.jpg';
import photoCouple from '../../assets/cible-couple.jpg';
import photoEntreprise from '../../assets/cible-entreprise.jpg';
import { TexteCharte } from '../../components/EncadreCharte';
import { charte } from '../../data/charte-deontologie';
import guideMd from '../../../docs/guide-preparation.md?raw';
import ref from '../../data/referentiel-v3.json';
import type { Referentiel } from '../../lib/types';

const referentiel = ref as Referentiel;

// ---------------------------------------------------------------------
export function LaCharte() {
  const elim = referentiel.rubriques.flatMap((r) => r.questions).filter((q) => q.statut === 'eliminatoire');
  return (
    <Site documents={[PDF_GUIDE, PDF_CHARTE]}>
      <section className="hero hero-page">
        <div className="hero-texte">
          <h1>À qui s'adresse la Charte Qualité ?</h1>
          <p>Pensée pour les photographes professionnels, elle est aussi un repère pour les particuliers, les entreprises et les institutions à la recherche d'un photographe.</p>
        </div>
        <PhotoForme src={photoFamille} />
      </section>

      <section className="cibles" id="a-quoi-ca-sert">
        <article className="cible">
          <PhotoForme src={photoAppareil} />
          <div className="cible-texte">
            <span className="cible-pour">Photographes</span>
            <h2>Vous êtes photographe professionnel ?</h2>
            <p>Vous exercez depuis des années. Vous avez investi dans votre formation, votre matériel, votre relation client. Vous faites les choses bien, mais personne ne le voit vraiment, ou pas assez.</p>
            <p>La Charte Qualité est faite pour vous. Elle ne vous apprend rien : elle dit à vos clients ce que vous savez déjà. Mariage, nouveau-né, portrait, immobilier, mode, événementiel, reportage ou photographie d'auteur : elle s'adapte à votre pratique.</p>
            <ul className="liste-nette">
              <li>Une reconnaissance délivrée par la fédération de la profession</li>
              <li>Un regard d'experts de votre spécialité sur votre travail</li>
              <li>Votre fiche sur la carte des titulaires</li>
            </ul>
            <div className="ligne"><BoutonDeposer className="bouton deposer" /><Link to="/preparer" className="bouton secondaire">Bien se préparer</Link></div>
          </div>
        </article>
        <article className="cible inverse">
          <PhotoForme src={photoCouple} credit="Dorothée Machabert" inverse />
          <div className="cible-texte">
            <span className="cible-pour">Particuliers</span>
            <h2>Vous cherchez un photographe ?</h2>
            <p>Choisir un photographe n'est pas simple. Les sites sont beaux, les tarifs varient du simple au quintuple, et rien ne vous dit si le professionnel en face de vous est vraiment compétent, assuré et respectueux de ses engagements.</p>
            <p>Le logo Photographe Professionnel de France change cela : ce photographe a été évalué sur des critères objectifs, ses documents contractuels, ses assurances, son portfolio, ses pratiques de sauvegarde. Et si un problème survient, la FFPMI est là comme instance de recours.</p>
            <div className="ligne"><Link to="/carte" className="bouton deposer">La carte de France des photographes</Link></div>
          </div>
        </article>
        <article className="cible">
          <PhotoForme src={photoEntreprise} credit="Dorothée Machabert" />
          <div className="cible-texte">
            <span className="cible-pour">Entreprises et institutions</span>
            <h2>Vous commandez des prestations photo ?</h2>
            <p>Événements, portraits corporate, reportages, photographies de produits : travailler avec un photographe titulaire de la Charte, c'est sécuriser votre relation commerciale et valoriser votre propre démarche qualité.</p>
            <p>Contrat écrit, droits d'utilisation précisés, devis et factures conformes, assurance professionnelle : les bases sont vérifiées avant même votre premier échange.</p>
            <div className="ligne"><Link to="/carte" className="bouton principal">Trouver un photographe</Link><Link to="/deontologie" className="bouton secondaire">Ses engagements</Link></div>
          </div>
        </article>
      </section>

      <section className="pile" id="pour-qui">
        <h2 className="equerre">Pour qui</h2>
        <div className="deux-colonnes">
          <div className="carte pile">
            <h3 style={{ color: 'var(--accent)', margin: 0 }}>Tous les photographes professionnels déclarés</h3>
            <ul className="liste-nette">
              <li>Quel que soit le statut : micro-entreprise, entreprise individuelle ou société.</li>
              <li>En activité principale ou secondaire.</li>
              <li>Pour des particuliers, des professionnels, ou les deux.</li>
              <li>Adhérent de la FFPMI ou non.</li>
              <li>Sans ancienneté minimale : l'expérience rapporte des points, elle n'est pas exigée.</li>
            </ul>
          </div>
          <div className="carte pile">
            <h3 style={{ color: 'var(--accent)', margin: 0 }}>Toutes les spécialités</h3>
            <div>{referentiel.specialites.map((s) => <span key={s.value} className="puce-spe">{s.label}</span>)}</div>
            <p className="petit discret" style={{ margin: 0 }}>Le candidat indique jusqu'à 4 spécialités principales : les experts qui étudient son dossier sont choisis en fonction d'elles.</p>
          </div>
        </div>
      </section>

      <section className="texte-long" id="conditions">
        <h2 className="equerre">Les {elim.length} conditions obligatoires</h2>
        <p>Elles viennent de la loi et des fondamentaux du métier. Toutes doivent être remplies, justificatifs à l'appui.</p>
        <ol className="pile" style={{ gap: '.35rem' }}>{elim.map((q) => <li key={q.code}>{q.libelle}</li>)}</ol>
        <p>
          Les autres critères rapportent des points : formation, qualité des galeries, relation client, sécurité des fichiers, accueil, transmission.
          La Charte est accordée à partir de {referentiel.version.seuil_obtention} points sur {referentiel.version.base_score}, calculés sur les seules questions qui concernent le candidat.
        </p>
        <h2 className="equerre">Ce qu'elle n'est pas</h2>
        <p>
          Ni un concours, ni un titre artistique. La Charte atteste un ensemble : le respect de la loi, la qualité de la relation client,
          la compétence et la constance du travail.
        </p>
        <h2 className="equerre">Qui la délivre</h2>
        <p>
          La Fédération Française de la Photographie et des Métiers de l'Image (FFPMI) a créé la Charte et en confie la gestion à son organisme
          MDI - Métiers de l'Image. Les décisions sont prises par une commission d'experts de la profession, réunie tous les deux mois.
          La Charte est valable 2 ans.
        </p>
        <p><Link to="/preparer">Bien préparer sa candidature →</Link></p>
      </section>
      <EncartDonnees />
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
      titres.push({ niveau: depth, texte: texte.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'), id });
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
    let html = (marked.parse(guideMd, { renderer: rendu, gfm: true, async: false }) as string)
      .replace(/<input (checked="" )?disabled="" type="checkbox">/g, '<input type="checkbox">');
    // Volets colorés : étiquette + contenu qui suit
    const classe = (t: string) => (/questions/i.test(t) ? 'q' : /commission|indispensable/i.test(t) ? 'c' : /progresser|gagner/i.test(t) ? 'p' : 'n');
    html = html.replace(/<p class="volet">(.*?)<\/p>\s*(<(ul|p|div)[^>]*>[\s\S]*?<\/\3>)/g,
      (_m, etiquette: string, contenu: string) => `<div class="guide-volet ${classe(etiquette)}"><p class="volet">${etiquette}</p>${contenu}</div>`);
    // Une carte par rubrique
    html = html.replace(/(<h3 id="[^"]*">[\s\S]*?)(?=<h3 |<h2 |$)/g, '<div class="guide-rubrique">$1</div>');
    // Une section par partie, numérotée
    let n = 0;
    html = html.replace(/(<h2 id="[^"]*">)([\s\S]*?)(?=<h2 |$)/g, (_m, h2: string, reste: string) =>
      `<section class="guide-partie">${h2.replace('>', `><span class="guide-partie-num">${++n}</span>`)}${reste}</section>`);
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
        <div className="pile" style={{ gap: '2rem', minWidth: 0 }}>
          <article className="guide-contenu" dangerouslySetInnerHTML={{ __html: html }} />
          <EncartDonnees />
        </div>
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
      <EncartDonnees />
      <div className="ligne"><BoutonDeposer className="bouton deposer" /></div>
    </Site>
  );
}
