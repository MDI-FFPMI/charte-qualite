# Charte Qualité - Photographe Professionnel de France

Plateforme de candidature et d'évaluation de la Charte Qualité FFPMI, gérée par MDI - Métiers de l'Image.

- **Site public** : présentation, référentiel, paiement (Stripe) et reprise de dossier.
- **Espace candidat** : dossier en 11 rubriques, enregistrement automatique, justificatifs, score indicatif, envoi.
- **Espace expert** : notation des portfolios par les 6 experts, vérification des justificatifs par les 2 rapporteurs.
- **Back-office** : tableau de bord, dossiers, composition assistée des commissions, pool d'experts.

## État d'avancement

| Partie | État |
| --- | --- |
| Modèle de données, règles d'accès, stockage privé | Terminé (`supabase/migrations/0001_schema.sql`) |
| Référentiel V3 (60 questions, 136 points) | Terminé, chargé en base (`0002_referentiel_v3.sql`) |
| Paiement Stripe vers création du compte et du dossier | Terminé (`supabase/functions/stripe-webhook`) |
| Espace candidat | Terminé, branché sur Supabase |
| Calcul du score et composition des commissions | Terminé, testé (`npm test`) |
| Espace expert et back-office | Écrans et logique en place sur données d'exemple ; branchement Supabase à faire |
| Emails transactionnels, courriers de décision, purge RGPD planifiée | À faire |

## Mise en route

1. **Supabase** : créer un projet au nom de MDI, région Europe (Paris ou Francfort), offre Pro pour les sauvegardes quotidiennes.
   Exécuter dans l'ordre `supabase/migrations/0001_schema.sql` puis `0002_referentiel_v3.sql` (éditeur SQL ou `supabase db push`).
2. **Authentification** : activer la connexion par email (lien magique), désactiver les inscriptions libres, traduire en français
   les modèles "Invite user" et "Magic link", et définir l'expéditeur `charte-qualite@ffpmi.eu` (SMTP personnalisé).
3. **Stripe** :
   - créer un produit "Candidature Charte Qualité" à 199 € et un lien de paiement ;
   - créer un code promo réservé aux adhérents ramenant le prix à 149 € ;
   - déployer la fonction : `supabase functions deploy stripe-webhook --no-verify-jwt` ;
   - secrets : `supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... SITE_URL=https://charte.ffpmi.eu` ;
   - dans Stripe, ajouter un endpoint webhook vers `https://<projet>.supabase.co/functions/v1/stripe-webhook`, événement `checkout.session.completed`.
4. **Application** : copier `.env.example` en `.env`, renseigner les valeurs, puis `npm install` et `npm run dev`.
5. **Mise en ligne** : relier le dépôt GitHub (privé) à Vercel ou Netlify, avec les mêmes variables, sur `charte.ffpmi.eu`.
6. **Premier compte administrateur** : après votre première connexion, dans l'éditeur SQL :
   `update profiles set role = 'admin' where email = 'amelie.soubrie@ffpmi.eu';`

## Commandes

- `npm run dev` : développement local
- `npm test` : tests du barème, de l'affichage conditionnel et de la composition des commissions
- `npm run seed` : régénère le SQL du référentiel à partir de `src/data/referentiel-v3.json`
- `npm run build:demo` : aperçu autonome sur données d'exemple (un seul fichier HTML)

## Sécurité et RGPD

- Aucune donnée de candidat dans Google Drive ni dans GitHub : le dépôt ne contient que le code.
- Chaque candidat ne voit que son dossier ; un expert ne voit que les dossiers de sa session, pendant l'évaluation, sauf conflit déclaré.
- Pièces dans un bucket privé (PDF, JPG, PNG, 10 Mo), accessibles uniquement par liens temporaires.
- Durées de conservation : brouillon 6 mois, dossier refusé jusqu'à la décision définitive, dossier accordé pendant la validité de la Charte (vue `dossiers_a_purger`, à planifier).
