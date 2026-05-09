/**
 * GET /api/payments/card-decision?token=xxx&decision=approve|reject
 *
 * Étape 3 du flux de paiement carte :
 *  - Appelé quand l'admin clique sur VALIDER ou REFUSER dans son email
 *  - Pas besoin d'authentification : le token sécurise l'accès (64 chars aléatoires)
 *
 * Comportement :
 *  approve → Payment.status = 'completed', Booking.paymentStatus = 'paid', status = 'confirmed'
 *            → Email de confirmation envoyé au client
 *  reject  → Payment.status = 'failed',    Booking.paymentStatus = 'unpaid'
 *            → Email de refus envoyé au client
 *
 * Dans les deux cas, l'admin reçoit une page HTML de confirmation dans son navigateur.
 */

import dbConnect from '@/lib/db';
import OtpSession from '@/models/OtpSession';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';
import User from '@/models/User';
import Listing from '@/models/Listing';
import { sendEmail } from '@/lib/mail';
import {
  cardPaymentApprovedEmail,
  cardPaymentRejectedEmail,
} from '@/email-templates/card-payment-decision';

/** Renvoie une page HTML simple affichée dans le navigateur de l'admin */
function adminPage(title, message, color = '#16a34a') {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #f4f4f5; display: flex; align-items: center; justify-content: center;
           min-height: 100vh; }
    .card { background: #fff; border-radius: 16px; padding: 48px 40px; max-width: 440px;
            text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .icon { font-size: 56px; margin-bottom: 16px; }
    h1 { margin: 0 0 12px; font-size: 22px; color: ${color}; }
    p { color: #52525b; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${color === '#16a34a' ? '' : ''}</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  // On accepte GET (clic direct depuis email) et POST (appel programmatique)
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).end('Méthode non autorisée');
  }

  const { token, decision } = req.method === 'GET' ? req.query : req.body;

  if (!token || !['approve', 'reject'].includes(decision)) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(400).send(adminPage(
      'Lien invalide',
      'Ce lien est invalide ou mal formé.',
      '#dc2626'
    ));
  }

  await dbConnect();

  // ── Récupération de la session OTP via le token admin ─────────
  const session = await OtpSession.findOne({ adminToken: token });

  if (!session) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(404).send(adminPage(
      'Lien expiré',
      'Ce lien de validation a expiré (10 minutes) ou a déjà été utilisé.',
      '#dc2626'
    ));
  }

  // Empêche une double décision
  if (session.decision !== 'pending') {
    const alreadyLabel = session.decision === 'approved' ? 'validé' : 'refusé';
    res.setHeader('Content-Type', 'text/html');
    return res.status(409).send(adminPage(
      'Déjà traité',
      `Ce paiement a déjà été ${alreadyLabel}.`,
      '#ca8a04'
    ));
  }

  // ── Récupération du Payment lié ───────────────────────────────
  const payment = await Payment.findOne({
    booking: session.booking,
    user: session.user,
    method: 'card',
    status: 'pending',
  });

  if (!payment) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(404).send(adminPage(
      'Paiement introuvable',
      'Le paiement associé à cette session est introuvable.',
      '#dc2626'
    ));
  }

  // ── Application de la décision ────────────────────────────────
  const isApprove = decision === 'approve';

  // Mise à jour Payment
  payment.status = isApprove ? 'completed' : 'failed';
  if (isApprove) {
    payment.validatedAt = new Date();
    payment.notes = (payment.notes || '') + ' | admin_approved';
  }
  await payment.save();

  // Mise à jour Booking
  const bookingUpdate = isApprove
    ? { paymentStatus: 'paid', status: 'confirmed', expiresAt: null }
    : { paymentStatus: 'unpaid', expiresAt: new Date(Date.now() + 30 * 60 * 1000) };

  await Booking.findByIdAndUpdate(session.booking, bookingUpdate);

  // Marquer la session OTP comme traitée (on garde pour le polling)
  session.decision = isApprove ? 'approved' : 'rejected';
  await session.save();

  // ── Email de confirmation au client ───────────────────────────
  try {
    const [booking, user] = await Promise.all([
      Booking.findById(session.booking).populate('listing', 'title location'),
      User.findById(session.user).select('name email').lean(),
    ]);

    if (booking && user?.email) {
      const bookingUrl = `${process.env.NEXTAUTH_URL}/bookings/${booking._id}`;

      const { subject, html } = isApprove
        ? cardPaymentApprovedEmail({
            userName: user.name,
            booking,
            payment,
            listing: booking.listing,
            bookingUrl,
          })
        : cardPaymentRejectedEmail({
            userName: user.name,
            booking,
            listing: booking.listing,
            bookingUrl,
          });

      sendEmail({ to: user.email, subject, html }).catch((err) =>
        console.error('[card-decision] Erreur email client:', err.message)
      );
    }
  } catch (err) {
    console.error('[card-decision] Erreur récupération données pour email:', err.message);
  }

  // ── Page HTML de confirmation pour l'admin ────────────────────
  res.setHeader('Content-Type', 'text/html');
  if (isApprove) {
    return res.status(200).send(adminPage(
      'Paiement validé',
      'Le paiement a été approuvé. Le client a reçu un email de confirmation et sa réservation est confirmée.',
      '#16a34a'
    ));
  } else {
    return res.status(200).send(adminPage(
      'Paiement refusé',
      'Le paiement a été refusé. Le client a reçu un email l\'informant du refus et peut réessayer.',
      '#dc2626'
    ));
  }
}
