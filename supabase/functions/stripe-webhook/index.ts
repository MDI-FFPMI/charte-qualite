// Fonction Supabase appelée par Stripe quand un paiement de candidature est validé.
// Elle retrouve le compte du candidat, enregistre le paiement et ouvre son dossier.
//
// Parcours : le candidat crée son compte sur le site, puis paie depuis son espace.
// Le lien de paiement transmet l'identifiant du compte (client_reference_id),
// ce qui permet d'ouvrir le bon dossier même si l'email saisi sur Stripe est différent.
//
// Secrets à définir dans Supabase (Edge Functions > Secrets) :
//   STRIPE_SECRET_KEY      clé secrète Stripe (sk_test_... pour les essais, sk_live_... ensuite)
//   STRIPE_WEBHOOK_SECRET  secret de signature du webhook (whsec_...)
//   SITE_URL               adresse du site, ex. https://charte-qualite.ffpmi.eu
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournies automatiquement par Supabase.
//
// Côté Stripe : un webhook vers https://<projet>.supabase.co/functions/v1/stripe-webhook
// sur l'événement checkout.session.completed.
// Tarifs : 199 € (standard), 149 € (adhérent FFPMI, via un code promo réservé aux adhérents).

import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});
const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const reponse = (texte: string, status = 200) => new Response(texte, { status });

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return reponse('Signature absente', 400);
  const corps = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      corps, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!, undefined, cryptoProvider,
    );
  } catch (e) {
    return reponse(`Signature invalide : ${(e as Error).message}`, 400);
  }

  if (event.type !== 'checkout.session.completed') return reponse('Ignoré');
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== 'paid') return reponse('Non payé');

  const email = session.customer_details?.email?.toLowerCase().trim() ?? '';

  // Idempotence : Stripe peut renvoyer le même événement
  const { data: deja } = await admin.from('paiements').select('id').eq('stripe_session_id', session.id).maybeSingle();
  if (deja) return reponse('Déjà traité');

  const montant = session.amount_total ?? 0;
  const tarif = montant <= 14900 ? 'adherent' : 'standard';

  // 1. Compte : d'abord par l'identifiant transmis par le lien de paiement, sinon par l'email
  let userId: string | undefined;
  const ref = session.client_reference_id ?? '';
  if (UUID.test(ref)) {
    const { data } = await admin.from('profiles').select('id').eq('id', ref).maybeSingle();
    userId = data?.id;
  }
  if (!userId && email) {
    const { data } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
    userId = data?.id;
  }
  if (!userId) {
    if (!email) return reponse('Ni compte ni email', 400);
    // Paiement sans compte (lien utilisé directement) : on crée le compte et on invite le candidat
    // à choisir son mot de passe (modèle d'email « Invite user »).
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${SITE_URL}/mot-de-passe` });
    if (error) return reponse(`Création du compte impossible : ${error.message}`, 500);
    userId = data.user.id;
  }

  const nomComplet = session.customer_details?.name?.trim();
  if (nomComplet) {
    const [prenom, ...reste] = nomComplet.split(' ');
    await admin.from('profiles').update({ prenom, nom: reste.join(' ') || null }).eq('id', userId).is('prenom', null);
  }

  // 2. Paiement
  const { data: paiement, error: errPaiement } = await admin.from('paiements').insert({
    stripe_session_id: session.id, email: email || '(non communiqué)', montant_centimes: montant, tarif,
  }).select('id').single();
  if (errPaiement) return reponse(errPaiement.message, 500);

  // 3. Dossier : un brouillon déjà ouvert sans paiement (phase de test) est rattaché à ce paiement,
  //    sinon un nouveau dossier est créé, prérempli en cas de renouvellement.
  const { data: brouillon } = await admin.from('dossiers').select('id')
    .eq('candidat_id', userId).eq('statut', 'brouillon').is('paiement_id', null)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  let dossierId = brouillon?.id as string | undefined;
  let renouvellement = false;
  if (dossierId) {
    await admin.from('dossiers').update({ paiement_id: paiement.id }).eq('id', dossierId);
  } else {
    const { data: version } = await admin.from('referentiel_versions').select('id').eq('en_vigueur', true).single();
    const { data: precedent } = await admin.from('dossiers').select('id')
      .eq('candidat_id', userId).eq('statut', 'accorde')
      .order('decision_le', { ascending: false }).limit(1).maybeSingle();
    const { data: dossier, error: errDossier } = await admin.from('dossiers').insert({
      candidat_id: userId, version_id: version!.id, paiement_id: paiement.id, dossier_precedent_id: precedent?.id ?? null,
    }).select('id').single();
    if (errDossier) return reponse(errDossier.message, 500);
    dossierId = dossier.id;
    if (precedent) {
      renouvellement = true;
      // Les réponses sont recopiées ; les pièces, souvent expirées, sont à redéposer
      const { data: anciennes } = await admin.from('reponses').select('question_code, valeur, complements').eq('dossier_id', precedent.id);
      if (anciennes?.length) await admin.from('reponses').insert(anciennes.map((r) => ({ ...r, dossier_id: dossierId })));
    }
  }

  await admin.from('paiements').update({ dossier_id: dossierId }).eq('id', paiement.id);
  await admin.from('journal').insert({
    action: 'paiement_recu', dossier_id: dossierId, detail: { email, montant, tarif, renouvellement },
  });

  return reponse('OK');
});
