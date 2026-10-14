// Fonction Supabase (Deno) appelée par Stripe quand un paiement est validé.
// Elle crée le compte du candidat (ou retrouve le sien), ouvre son dossier
// et lui envoie son lien de connexion. Aucune intervention manuelle.
//
// Variables à définir (supabase secrets set ...) :
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SITE_URL (ex. https://charte.ffpmi.eu)
// SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont fournies automatiquement.
//
// Côté Stripe : un endpoint webhook vers
//   https://<projet>.supabase.co/functions/v1/stripe-webhook
// sur l'événement checkout.session.completed.
// Tarifs : 199 € (standard), 149 € (adhérent FFPMI, via un code promo réservé aux adhérents).

import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});
const publique = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
  auth: { persistSession: false },
});
const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const corps = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      corps, signature!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!, undefined, cryptoProvider,
    );
  } catch (e) {
    return new Response(`Signature invalide : ${(e as Error).message}`, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response('Ignoré', { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== 'paid') return new Response('Non payé', { status: 200 });

  const email = session.customer_details?.email?.toLowerCase().trim();
  if (!email) return new Response('Email absent', { status: 400 });

  // Idempotence : Stripe peut renvoyer le même événement
  const { data: deja } = await admin.from('paiements').select('id').eq('stripe_session_id', session.id).maybeSingle();
  if (deja) return new Response('Déjà traité', { status: 200 });

  const montant = session.amount_total ?? 0;
  const tarif = montant <= 14900 ? 'adherent' : 'standard';

  // 1. Compte : existant (renouvellement, nouvelle candidature) ou nouveau
  const { data: profil } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
  let userId = profil?.id as string | undefined;

  if (!userId) {
    // Crée le compte et envoie l'email d'invitation (modèle "Invite user" à personnaliser en français)
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${SITE_URL}/candidat`,
    });
    if (error) return new Response(`Création du compte impossible : ${error.message}`, { status: 500 });
    userId = data.user.id;
  } else {
    // Compte existant : simple lien de connexion
    await publique.auth.signInWithOtp({
      email, options: { shouldCreateUser: false, emailRedirectTo: `${SITE_URL}/candidat` },
    });
  }

  // Prénom et nom saisis sur Stripe, si disponibles
  const nomComplet = session.customer_details?.name?.trim();
  if (nomComplet) {
    const [prenom, ...reste] = nomComplet.split(' ');
    await admin.from('profiles').update({ prenom, nom: reste.join(' ') || null }).eq('id', userId).is('prenom', null);
  }

  // 2. Paiement
  const { data: paiement, error: errPaiement } = await admin.from('paiements').insert({
    stripe_session_id: session.id, email, montant_centimes: montant, tarif,
  }).select('id').single();
  if (errPaiement) return new Response(errPaiement.message, { status: 500 });

  // 3. Dossier, prérempli en cas de renouvellement
  const { data: version } = await admin.from('referentiel_versions').select('id').eq('en_vigueur', true).single();
  const { data: precedent } = await admin.from('dossiers').select('id')
    .eq('candidat_id', userId).eq('statut', 'accorde')
    .order('decision_le', { ascending: false }).limit(1).maybeSingle();

  const { data: dossier, error: errDossier } = await admin.from('dossiers').insert({
    candidat_id: userId, version_id: version!.id, paiement_id: paiement.id,
    dossier_precedent_id: precedent?.id ?? null,
  }).select('id').single();
  if (errDossier) return new Response(errDossier.message, { status: 500 });

  await admin.from('paiements').update({ dossier_id: dossier.id }).eq('id', paiement.id);

  if (precedent) {
    // Les réponses sont recopiées ; les pièces, souvent expirées, sont à redéposer
    const { data: anciennes } = await admin.from('reponses').select('question_code, valeur, complements')
      .eq('dossier_id', precedent.id);
    if (anciennes?.length) {
      await admin.from('reponses').insert(anciennes.map((r) => ({ ...r, dossier_id: dossier.id })));
    }
  }

  await admin.from('journal').insert({
    action: 'paiement_recu', dossier_id: dossier.id, detail: { email, montant, tarif, renouvellement: !!precedent },
  });

  return new Response('OK', { status: 200 });
});
