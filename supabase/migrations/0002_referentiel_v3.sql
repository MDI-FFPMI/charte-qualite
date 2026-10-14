-- Généré par scripts/generer-seed.mjs - ne pas modifier à la main
insert into referentiel_versions (id, libelle, seuil_obtention, base_score, validite_mois, en_vigueur, publie_le)
values ('V3', 'Référentiel V3 - octobre 2026', 100, 150, 24, true, now())
on conflict (id) do nothing;

insert into rubriques (version_id, numero, titre, intro) values ('V3', 0, 'Vos coordonnées', 'Ces informations figurent sur votre attestation, vos courriers et, si vous l''acceptez, dans l''annuaire des titulaires. Elles ne rapportent pas de points.') on conflict do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '0.1', 1, 'Vous', 'La personne qui représente l''entreprise. Votre adresse email est celle de votre compte.', 'coordonnees', '[]'::jsonb, 'informatif', 0, false, null, false, false, null, '[]'::jsonb, '[{"key":"prenom","label":"Prénom","type":"text","requis":true},{"key":"nom","label":"Nom","type":"text","requis":true},{"key":"telephone","label":"Téléphone","type":"tel","requis":true},{"key":"fonction","label":"Fonction (gérant, président...)","type":"text"}]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 0
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '0.2', 2, 'Votre entreprise', null, 'coordonnees', '[]'::jsonb, 'informatif', 0, false, null, false, false, null, '[]'::jsonb, '[{"key":"denomination","label":"Dénomination de l''entreprise","type":"text","requis":true},{"key":"nom_commercial","label":"Nom commercial (si différent)","type":"text"},{"key":"forme","label":"Forme juridique","type":"select","requis":true,"options":["Micro-entreprise","Entreprise individuelle (EI)","EURL","SARL","SASU","SAS","Autre"]},{"key":"siret","label":"Numéro SIRET","type":"siret","requis":true},{"key":"adresse","label":"Adresse","type":"text","requis":true,"largeur":"pleine"},{"key":"complement","label":"Complément d''adresse","type":"text","largeur":"pleine"},{"key":"cp","label":"Code postal","type":"cp","requis":true},{"key":"ville","label":"Ville","type":"text","requis":true}]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 0
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '0.3', 3, 'Votre présence en ligne', 'Ces liens figureront dans l''annuaire des titulaires. La commission les consultera aussi pour apprécier votre présence professionnelle (rubrique 9).', 'coordonnees', '[]'::jsonb, 'informatif', 0, false, null, false, false, null, '[]'::jsonb, '[{"key":"site","label":"Site internet","type":"url"},{"key":"instagram","label":"Instagram","type":"instagram"},{"key":"facebook","label":"Facebook","type":"url"},{"key":"autre","label":"Autre lien (LinkedIn, Pinterest...)","type":"url"}]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 0
on conflict (version_id, code) do nothing;

insert into rubriques (version_id, numero, titre, intro) values ('V3', 1, 'Statut juridique et assurances', 'Votre statut, vos assurances et vos obligations légales.') on conflict do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '1.1', 1, 'Quelle est votre clientèle ?', null, 'multi_choice', '[{"value":"particuliers","label":"Particuliers","points":0},{"value":"professionnels","label":"Professionnels (entreprises, institutions)","points":0}]'::jsonb, 'informatif', 0, false, null, false, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 1
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '1.2', 2, 'Exercez-vous la photographie en activité principale ou secondaire ?', null, 'choice', '[{"value":"principale","label":"Activité principale","points":0},{"value":"secondaire","label":"Activité secondaire","points":0}]'::jsonb, 'informatif', 0, false, null, false, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 1
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '1.3', 3, 'Votre entreprise est-elle immatriculée avec une activité de photographie déclarée ?', 'Ce document sert aussi à établir votre ancienneté : il ne vous sera pas redemandé.', 'yes_no', '[]'::jsonb, 'eliminatoire', 4, false, 'Extrait Kbis, extrait RNE ou avis de situation INSEE de moins de 3 mois', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 1
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '1.4', 4, 'Êtes-vous à jour de vos obligations sociales ?', null, 'yes_no', '[]'::jsonb, 'eliminatoire', 2, false, 'Attestation de vigilance URSSAF de moins de 6 mois', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 1
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '1.5', 5, 'Êtes-vous assuré en responsabilité civile professionnelle ?', null, 'yes_no', '[]'::jsonb, 'eliminatoire', 3, false, 'Attestation RC Pro en cours de validité', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 1
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '1.6', 6, 'Avez-vous désigné un médiateur de la consommation ?', 'Obligatoire dès que vous travaillez avec des particuliers.', 'yes_no', '[]'::jsonb, 'eliminatoire', 2, false, 'Attestation d''adhésion ou mention dans vos CGV', true, false, '{"q":"1.1","op":"includes_any","values":["particuliers"]}'::jsonb, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 1
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '1.7', 7, 'Disposez-vous d''un compte bancaire professionnel dédié ?', 'Déclaration sur l''honneur : aucun RIB n''est demandé.', 'yes_no', '[]'::jsonb, 'valorise', 1, false, null, false, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 1
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '1.8', 8, 'Disposez-vous d''une assurance matériel (bris, vol) ?', null, 'yes_no', '[]'::jsonb, 'valorise', 1, false, 'Attestation d''assurance', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 1
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '1.9', 9, 'Disposez-vous d''une prévoyance professionnelle (arrêt de travail, invalidité) ?', null, 'yes_no', '[]'::jsonb, 'valorise', 2, false, 'Attestation de contrat de prévoyance', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 1
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '1.10', 10, 'Travaillez-vous avec des salariés ou des collaborateurs réguliers (assistant, retoucheur, second photographe) ?', null, 'yes_no', '[]'::jsonb, 'informatif', 0, false, null, false, false, null, '[{"key":"detail","label":"Nombre et fonctions","type":"text","si":"oui"}]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 1
on conflict (version_id, code) do nothing;

insert into rubriques (version_id, numero, titre, intro) values ('V3', 2, 'Expérience et activité', 'Votre parcours et vos spécialités. Elles adaptent la suite du questionnaire.') on conflict do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '2.1', 1, 'En quelle année avez-vous démarré votre activité de photographe professionnel ?', 'Moins de 2 ans : 0 point - 2 à 4 ans : 2 points - 5 à 9 ans : 4 points - 10 ans et plus : 5 points.', 'year', '[{"value":"0","label":"moins de 2 ans","points":0},{"value":"2","label":"2 à 4 ans","points":2},{"value":"5","label":"5 à 9 ans","points":4},{"value":"10","label":"10 ans et plus","points":5}]'::jsonb, 'valorise', 5, false, 'Aucun nouveau document si la date figure sur le justificatif de la question 1.3. Activité antérieure sous une autre structure ou en salariat : attestation ou certificat de travail.', false, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 2
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '2.2', 2, 'Quelles spécialités pratiquez-vous régulièrement ? Indiquez votre spécialité principale.', null, 'specialites', '[]'::jsonb, 'informatif', 0, false, null, false, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 2
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '2.3', 3, 'Dans quels lieux réalisez-vous vos prises de vue ?', null, 'multi_choice', '[{"value":"studio","label":"Studio","points":0},{"value":"domicile","label":"Domicile du client","points":0},{"value":"exterieur","label":"Extérieur","points":0},{"value":"reception","label":"Lieux de réception","points":0},{"value":"entreprise","label":"Locaux d''entreprise","points":0},{"value":"sante","label":"Maternité ou établissement de santé","points":0},{"value":"autre","label":"Autre","points":0}]'::jsonb, 'informatif', 0, false, null, false, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 2
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '2.4', 4, 'Combien de séances ou prestations réalisez-vous par an ?', null, 'choice', '[{"value":"lt20","label":"Moins de 20","points":0},{"value":"20-50","label":"20 à 50","points":0},{"value":"51-100","label":"51 à 100","points":0},{"value":"101-200","label":"101 à 200","points":0},{"value":"gt200","label":"Plus de 200","points":0}]'::jsonb, 'informatif', 0, false, null, false, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 2
on conflict (version_id, code) do nothing;

insert into rubriques (version_id, numero, titre, intro) values ('V3', 3, 'Formation et qualifications', 'Votre formation initiale, vos titres et votre formation continue.') on conflict do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '3.1', 1, 'Quel est votre parcours de formation en photographie ?', null, 'choice', '[{"value":"diplome","label":"Diplôme ou titre en photographie (CAP, BP, BTS, école, titre RNCP)","points":3},{"value":"certification","label":"Certification professionnelle","points":2},{"value":"autodidacte","label":"Autodidacte","points":0}]'::jsonb, 'valorise', 3, false, 'Copie du ou des diplômes (plusieurs fichiers possibles)', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 3
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '3.2', 2, 'Détenez-vous un titre de l''artisanat ?', null, 'multi_choice', '[{"value":"artisan-art","label":"Artisan d''art","points":1},{"value":"maitre-artisan","label":"Maître artisan","points":2},{"value":"maitre-artisan-art","label":"Maître artisan d''art","points":2},{"value":"aucun","label":"Aucun","points":0,"exclusive":true}]'::jsonb, 'valorise', 2, false, 'Copie du titre ou attestation de la Chambre de métiers', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 3
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '3.3', 3, 'Avez-vous suivi au moins 16 heures de formation professionnelle au cours des 24 derniers mois ?', null, 'yes_no', '[]'::jsonb, 'valorise', 4, false, 'Attestations de formation (plusieurs fichiers possibles)', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 3
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '3.4', 4, 'Avez-vous suivi une formation à la sécurité propre à votre spécialité (sécurité et manipulation du nouveau-né, sécurité aquatique, premiers secours) ?', null, 'yes_no', '[]'::jsonb, 'valorise', 2, false, 'Attestation de formation', true, false, '{"q":"2.2","op":"includes_any","values":["nouveau-ne","grossesse","aquatique"]}'::jsonb, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 3
on conflict (version_id, code) do nothing;

insert into rubriques (version_id, numero, titre, intro) values ('V3', 4, 'Portfolio et reconnaissance', 'Votre travail, jugé par la commission sur des galeries complètes.') on conflict do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '4.1', 1, 'Partagez trois galeries complètes de séances récentes (moins de 24 mois), telles que livrées à vos clients', 'Pas de sélection de vos meilleures images : la commission juge la constance de votre travail. Si vous déclarez plusieurs spécialités, au moins deux doivent être représentées. Aucun floutage n''est nécessaire, les galeries sont consultées sous confidentialité. Utilisez des galeries pour lesquelles vous avez l''accord de vos clients.', 'url_list', '[]'::jsonb, 'valorise', 20, true, '3 liens différents, avec mot de passe si besoin', false, false, null, '[{"key":"mot_de_passe","label":"Mot de passe éventuel des galeries","type":"text"}]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 4
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '4.2', 2, 'Avez-vous exposé votre travail dans un cadre professionnel (exposition, salon, festival) ?', null, 'yes_no', '[]'::jsonb, 'valorise', 2, false, 'Article de presse, affiche ou invitation, photo du vernissage, lien', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 4
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '4.3', 3, 'Avez-vous participé à des concours ou obtenu des distinctions professionnelles ?', null, 'multi_choice', '[{"value":"participation","label":"Participation à un concours professionnel","points":1},{"value":"medaille","label":"Médaille ou classement","points":2},{"value":"qualification","label":"Titre de qualification professionnelle (ex. Portraitiste de France)","points":2},{"value":"mof","label":"Meilleur Ouvrier de France","points":3},{"value":"aucun","label":"Aucun","points":0,"exclusive":true}]'::jsonb, 'valorise', 4, false, 'Diplôme, palmarès, certificat ou lien (plusieurs fichiers possibles)', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 4
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '4.4', 4, 'Vos clients peuvent-ils laisser des avis sur une plateforme indépendante ?', 'Seuls les liens vers une plateforme indépendante sont acceptés (Google, par exemple). Les avis hébergés sur votre propre site ne comptent pas.', 'yes_no', '[]'::jsonb, 'valorise', 2, false, 'Lien vers la page d''avis', true, false, null, '[{"key":"nb_avis","label":"Nombre d''avis","type":"number","si":"oui"},{"key":"note","label":"Note moyenne (sur 5)","type":"number","si":"oui"}]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 4
on conflict (version_id, code) do nothing;

insert into rubriques (version_id, numero, titre, intro) values ('V3', 5, 'Relation client', 'Vos documents contractuels et la façon dont vous accompagnez vos clients.') on conflict do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '5.1', 1, 'Faites-vous signer un contrat ou un bon de commande écrit à vos clients ?', null, 'yes_no', '[]'::jsonb, 'eliminatoire', 3, false, 'Modèle vierge, ou exemple avec les données du client masquées', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 5
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '5.2', 2, 'Vos conditions générales de vente sont-elles communiquées avant toute commande ?', null, 'yes_no', '[]'::jsonb, 'eliminatoire', 2, false, 'Lien ou document', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 5
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '5.3', 3, 'Vos clients connaissent-ils vos prix ou leur mode de calcul avant de commander ?', null, 'yes_no', '[]'::jsonb, 'eliminatoire', 2, false, 'Lien vers la page tarifs de votre site, grille, brochure ou modèle de devis', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 5
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '5.4', 4, 'Vos devis et factures comportent-ils les mentions obligatoires ?', null, 'yes_no', '[]'::jsonb, 'eliminatoire', 2, false, 'Un devis et une facture, données du client masquées', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 5
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '5.5', 5, 'Le délai de livraison figure-t-il dans votre contrat ou vos CGV ?', null, 'yes_no', '[]'::jsonb, 'eliminatoire', 1, false, 'Extrait du contrat ou des CGV', true, false, null, '[{"key":"delais","label":"Votre délai habituel pour chaque spécialité","type":"par_specialite","si":"oui"}]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 5
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '5.6', 6, 'Comment une réservation est-elle confirmée ?', null, 'choice', '[{"value":"acompte","label":"Acompte","points":1},{"value":"integral","label":"Paiement intégral de la séance","points":1},{"value":"frais-seance","label":"Frais de séance réglés, produits commandés ensuite","points":1},{"value":"devis-signe","label":"Devis signé sans versement (entreprises)","points":1},{"value":"aucune","label":"Aucune formalité","points":0}]'::jsonb, 'valorise', 1, false, 'Extrait du contrat ou des CGV', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 5
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '5.7', 7, 'Avez-vous des conditions écrites d''annulation et de report ?', null, 'yes_no', '[]'::jsonb, 'valorise', 2, false, 'Extrait du contrat ou des CGV', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 5
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '5.8', 8, 'Utilisez-vous un logiciel de gestion client (CRM, logiciel de studio) ?', null, 'yes_no', '[]'::jsonb, 'valorise', 1, false, null, false, false, null, '[{"key":"outil","label":"Nom de l''outil (facultatif)","type":"text","si":"oui"}]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 5
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '5.9', 9, 'Comment préparez-vous vos clients avant la séance ?', null, 'choice', '[{"value":"document","label":"Document ou guide écrit","points":2},{"value":"appel","label":"Appel ou rendez-vous préalable systématique","points":2},{"value":"aucune","label":"Pas de préparation","points":0}]'::jsonb, 'valorise', 2, false, 'Document, ou description de votre démarche', true, false, null, '[{"key":"commentaire","label":"Commentaire","type":"text"}]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 5
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '5.10', 10, 'Comment gérez-vous une réclamation ou une insatisfaction client ?', null, 'choice', '[{"value":"procedure","label":"Procédure écrite","points":2},{"value":"cas-par-cas","label":"Au cas par cas, avec appel systématique","points":1},{"value":"aucune","label":"Pas de démarche définie","points":0}]'::jsonb, 'valorise', 2, false, 'Procédure, ou description', true, false, null, '[{"key":"commentaire","label":"Commentaire","type":"text"}]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 5
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '5.11', 11, 'Comment livrez-vous les images à vos clients ?', null, 'multi_choice', '[{"value":"galerie","label":"Galerie en ligne privée","points":2},{"value":"transfert","label":"Transfert sécurisé de fichiers","points":2},{"value":"produits","label":"Tirages, albums ou supports après visionnage","points":2},{"value":"autre","label":"Autre","points":0}]'::jsonb, 'valorise', 2, false, 'Lien vers un exemple de galerie de livraison (facultatif)', false, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 5
on conflict (version_id, code) do nothing;

insert into rubriques (version_id, numero, titre, intro) values ('V3', 6, 'Gestion financière', 'Votre comptabilité et vos moyens de paiement. Le chiffre d''affaires et la TVA ne rapportent aucun point.') on conflict do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '6.1', 1, 'Tenez-vous une comptabilité conforme à votre statut (livre des recettes pour les micro-entrepreneurs, comptabilité complète pour les sociétés) ?', null, 'yes_no', '[]'::jsonb, 'eliminatoire', 3, false, 'Attestation de l''expert-comptable, capture du logiciel ou attestation sur l''honneur', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 6
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '6.2', 2, 'Quels moyens de paiement proposez-vous ?', null, 'multi_choice', '[{"value":"cb","label":"Carte bancaire","points":1},{"value":"virement","label":"Virement","points":1},{"value":"en-ligne","label":"Paiement en ligne","points":1},{"value":"cheque","label":"Chèque","points":1},{"value":"especes","label":"Espèces","points":0}]'::jsonb, 'valorise', 1, false, null, false, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 6
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '6.3', 3, 'Quelle est votre tranche de chiffre d''affaires annuel ?', 'Utilisé uniquement pour des statistiques anonymes, jamais transmis à la commission.', 'choice', '[{"value":"lt20k","label":"Moins de 20 000 €","points":0},{"value":"20-40k","label":"20 000 à 40 000 €","points":0},{"value":"40-80k","label":"40 000 à 80 000 €","points":0},{"value":"80-150k","label":"80 000 à 150 000 €","points":0},{"value":"gt150k","label":"Plus de 150 000 €","points":0}]'::jsonb, 'informatif', 0, false, null, false, true, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 6
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '6.4', 4, 'Êtes-vous assujetti à la TVA ?', 'Répondez non si vous êtes en franchise en base de TVA.', 'yes_no', '[]'::jsonb, 'informatif', 0, false, null, false, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 6
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '6.5', 5, 'Appliquez-vous un taux de TVA réduit (5,5 % ou 10 %) sur certaines ventes, par exemple œuvres d''art ou cession de droits ?', null, 'yes_no', '[]'::jsonb, 'informatif', 0, false, null, false, false, '{"q":"6.4","op":"eq","value":"oui"}'::jsonb, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 6
on conflict (version_id, code) do nothing;

insert into rubriques (version_id, numero, titre, intro) values ('V3', 7, 'Matériel et sécurité des fichiers', 'Votre équipement et la protection des images de vos clients. Vos déclarations sont couvertes par l''attestation sur l''honneur et peuvent être contrôlées.') on conflict do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '7.1', 1, 'Listez votre matériel principal : boîtiers, objectifs, éclairage, avec l''année d''achat approximative', 'La commission apprécie l''adéquation à vos spécialités et l''état du matériel. Les factures sont facultatives.', 'materiel', '[]'::jsonb, 'valorise', 3, true, 'La liste suffit', false, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 7
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '7.2', 2, 'Quelle solution avez-vous en cas de panne de matériel pendant une séance ?', null, 'choice', '[{"value":"second-boitier","label":"Un second boîtier","points":3},{"value":"location","label":"Location ou prêt garanti","points":2},{"value":"aucune","label":"Aucune","points":0}]'::jsonb, 'valorise', 3, false, null, false, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 7
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '7.3', 3, 'Comment sécurisez-vous les fichiers pendant la prise de vue ?', null, 'multi_choice', '[{"value":"double-carte","label":"Enregistrement simultané sur deux cartes","points":3},{"value":"transfert","label":"Transfert immédiat (ordinateur, partage)","points":3},{"value":"argentique","label":"Argentique","points":3},{"value":"aucune","label":"Aucune sécurisation particulière","points":0,"exclusive":true}]'::jsonb, 'valorise', 3, false, 'Description (photo facultative)', false, false, null, '[{"key":"nb_boitiers","label":"Nombre de boîtiers","type":"number"},{"key":"nb_double_slot","label":"Dont équipés d''un double emplacement de carte","type":"number"},{"key":"description","label":"Description","type":"text"}]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 7
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '7.4', 4, 'Combien de copies de vos fichiers conservez-vous après la séance, et où ?', 'Deux copies : 2 points. Avec une copie hors site ou dans le cloud : 3 points.', 'multi_choice', '[{"value":"travail","label":"Copie de travail","points":0},{"value":"locale","label":"Seconde copie locale (disque, NAS)","points":2},{"value":"hors-site","label":"Copie hors site ou dans le cloud","points":1}]'::jsonb, 'valorise', 3, false, 'Description (photo facultative)', false, false, null, '[{"key":"description","label":"Description","type":"text"}]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 7
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '7.5', 5, 'Avez-vous prévu une solution en cas d''incident (perte de fichiers, empêchement le jour de la séance) ?', null, 'yes_no', '[]'::jsonb, 'valorise', 1, false, null, false, false, null, '[{"key":"description","label":"Décrivez-la","type":"text","si":"oui"}]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 7
on conflict (version_id, code) do nothing;

insert into rubriques (version_id, numero, titre, intro) values ('V3', 8, 'Droits, données et intelligence artificielle', 'Vos droits d''auteur, la protection des données de vos clients et votre usage de l''IA.') on conflict do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '8.1', 1, 'Vos contrats ou CGV précisent-ils les droits d''utilisation accordés au client sur les images (usages autorisés, supports, durée) ?', null, 'yes_no', '[]'::jsonb, 'eliminatoire', 3, false, 'Extrait du contrat ou des CGV', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 8
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '8.2', 2, 'Disposez-vous d''une politique de confidentialité conforme au RGPD ?', null, 'yes_no', '[]'::jsonb, 'eliminatoire', 3, false, 'Lien ou document', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 8
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '8.3', 3, 'Informez-vous vos clients de la durée de conservation de leurs fichiers ?', null, 'yes_no', '[]'::jsonb, 'valorise', 2, false, 'Extrait du contrat, des CGV ou de la politique de confidentialité', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 8
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '8.4', 4, 'Recueillez-vous une autorisation écrite avant toute diffusion des images (portfolio, réseaux sociaux, publicité), signée par les titulaires de l''autorité parentale pour les mineurs ?', null, 'yes_no', '[]'::jsonb, 'eliminatoire', 3, false, 'Modèle d''autorisation ou clause du contrat', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 8
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '8.5', 5, 'Utilisez-vous des outils d''intelligence artificielle dans votre production ?', null, 'multi_choice', '[{"value":"aucun","label":"Aucun","points":0,"exclusive":true},{"value":"retouche","label":"Retouche assistée par IA (ex. Evoto, outils IA de Lightroom ou Photoshop)","points":0},{"value":"generation-elements","label":"Génération ou remplacement d''éléments (fond, décor)","points":0},{"value":"generation-images","label":"Images entièrement générées","points":0}]'::jsonb, 'informatif', 0, false, null, false, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 8
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '8.6', 6, 'Informez-vous vos clients de cet usage de l''IA ?', null, 'yes_no', '[]'::jsonb, 'valorise', 3, false, 'Mention dans le contrat, les CGV ou sur votre site', true, false, '{"q":"8.5","op":"has_other_than","value":"aucun"}'::jsonb, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 8
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '8.7', 7, 'Vérifiez-vous vous-même chaque image retouchée avec un outil d''IA avant de la livrer ?', null, 'yes_no', '[]'::jsonb, 'valorise', 2, false, null, false, false, '{"q":"8.5","op":"has_other_than","value":"aucun"}'::jsonb, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 8
on conflict (version_id, code) do nothing;

insert into rubriques (version_id, numero, titre, intro) values ('V3', 9, 'Présence professionnelle et accueil', 'Votre visibilité et l''accueil de vos clients.') on conflict do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '9.1', 1, 'Présence en ligne : site et réseaux sociaux', 'Aucune saisie : la commission apprécie les liens donnés dans « Vos coordonnées ». Site (3 points) : informations pratiques, mentions légales, tarifs ou modalités, cohérence avec votre travail. Réseaux sociaux (2 points) : régularité des publications, qualité et cohérence des images.', 'evaluation', '[]'::jsonb, 'valorise', 5, true, null, false, false, null, '[]'::jsonb, '[]'::jsonb, '0.3'
from rubriques where version_id = 'V3' and numero = 9
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '9.2', 2, 'Où recevez-vous vos clients ?', null, 'choice', '[{"value":"studio","label":"Studio ou bureau dédié","points":2},{"value":"domicile","label":"Espace aménagé à domicile","points":1},{"value":"itinerant","label":"Uniquement chez le client ou en extérieur","points":0}]'::jsonb, 'valorise', 2, false, 'Adresse et 2 à 3 photos du lieu', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 9
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '9.3', 3, 'Votre lieu d''accueil est-il accessible aux personnes à mobilité réduite ?', 'Un lieu qui reçoit du public est soumis à des règles d''accessibilité (registre public d''accessibilité notamment).', 'choice', '[{"value":"entierement","label":"Entièrement accessible","points":3},{"value":"avec-aide","label":"Avec aide ou aménagement ponctuel","points":2},{"value":"non","label":"Non accessible","points":0}]'::jsonb, 'valorise', 3, false, 'Photo(s) de l''accès', true, false, '{"q":"9.2","op":"in","values":["studio","domicile"]}'::jsonb, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 9
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '9.4', 4, 'Adaptez-vous votre accueil ou vos séances aux personnes en situation de handicap ?', null, 'yes_no', '[]'::jsonb, 'valorise', 2, false, null, false, false, null, '[{"key":"description","label":"Décrivez comment","type":"text","si":"oui"}]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 9
on conflict (version_id, code) do nothing;

insert into rubriques (version_id, numero, titre, intro) values ('V3', 10, 'Engagement et transmission', 'Votre engagement dans la profession et au-delà.') on conflict do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '10.1', 1, 'Êtes-vous membre d''une organisation professionnelle de la photographie ?', null, 'yes_no', '[]'::jsonb, 'valorise', 3, false, 'Attestation d''adhésion de l''année en cours', true, false, null, '[{"key":"organisation","label":"Laquelle ?","type":"text","si":"oui"}]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 10
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '10.2', 2, 'Transmettez-vous votre savoir-faire ?', null, 'multi_choice', '[{"value":"qualiopi","label":"Formateur pour un organisme certifié Qualiopi","points":3},{"value":"independant","label":"Formateur indépendant","points":2},{"value":"stagiaires","label":"Accueil de stagiaires ou d''alternants","points":2},{"value":"conferences","label":"Conférences ou interventions","points":1},{"value":"mentorat","label":"Mentorat","points":1},{"value":"publications","label":"Publications (livre, articles)","points":1},{"value":"aucun","label":"Non","points":0,"exclusive":true}]'::jsonb, 'valorise', 5, false, 'Attestation ou contrat de l''organisme, programme, affiche, convention de stage, lien', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 10
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '10.3', 3, 'Avez-vous un engagement solidaire (séances caritatives, dons, bénévolat) ?', null, 'yes_no', '[]'::jsonb, 'valorise', 2, false, 'Justificatif, lien ou description', true, false, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 10
on conflict (version_id, code) do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '10.4', 4, 'Quelles pratiques éco-responsables avez-vous mises en place ?', null, 'multi_choice', '[{"value":"reconditionne","label":"Matériel reconditionné ou réparé","points":1},{"value":"impression","label":"Impression éco-labellisée ou locale","points":1},{"value":"dechets","label":"Réduction des emballages et déchets","points":1},{"value":"energie","label":"Sobriété énergétique du studio","points":1},{"value":"mobilite","label":"Mobilité douce","points":1},{"value":"autre","label":"Autre","points":1},{"value":"aucune","label":"Aucune pour l''instant","points":0,"exclusive":true}]'::jsonb, 'valorise', 2, false, null, false, false, null, '[{"key":"commentaire","label":"Commentaire (facultatif)","type":"text"}]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 10
on conflict (version_id, code) do nothing;

insert into rubriques (version_id, numero, titre, intro) values ('V3', 11, 'Motivations et attestation', 'Dernière étape avant l''envoi.') on conflict do nothing;
insert into questions (version_id, rubrique_id, code, ordre, libelle, aide, type, options, statut, points_max, note_par_experts, justificatifs, preuve_attendue, facultatif, condition, complements, champs, source)
select 'V3', id, '11.1', 1, 'Pourquoi souhaitez-vous rejoindre la Charte Qualité Photographe Professionnel de France ?', null, 'text', '[]'::jsonb, 'informatif', 0, false, null, false, true, null, '[]'::jsonb, '[]'::jsonb, null
from rubriques where version_id = 'V3' and numero = 11
on conflict (version_id, code) do nothing;
