import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';
import { withAuth } from '@/middleware/withAuth';
import { errorHandler } from '@/middleware/errorHandler';
import mongoose from 'mongoose';
import crypto from 'crypto';

async function handler(req, res) {
  if (req.method === 'GET') return getPayment(req, res);
  if (req.method === 'POST') return postPayment(req, res);
  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}

async function getPayment(req, res) {
  await dbConnect();
  const { id } = req.query;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: 'ID invalide' });
  }

  const booking = await Booking.findById(id);
  if (!booking) return res.status(404).json({ success: false, error: 'Réservation introuvable' });
  if (booking.user.toString() !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Accès refusé' });
  }

  const payment = await Payment.findOne({ booking: id, method: 'bank_transfer' });
  if (!payment) return res.status(404).json({ success: false, error: 'Paiement introuvable' });

  const bankDetails = {
    iban: process.env.BANK_IBAN || 'FR76 0000 0000 0000 0000 0000 000',
    bic: process.env.BANK_BIC || 'XXXXXXXX',
    beneficiary: process.env.BANK_NAME || 'Restate SAS',
    reference: payment.transferReference,
    amount: booking.totalPrice,
  };

  return res.status(200).json({
    success: true,
    data: { bankDetails, proofs: payment.transferProofs || [] },
  });
}

async function postPayment(req, res) {

  await dbConnect();

  const { id } = req.query;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: 'ID invalide' });
  }

  const booking = await Booking.findById(id).populate('listing', 'title');
  if (!booking) return res.status(404).json({ success: false, error: 'Réservation introuvable' });

  if (booking.user.toString() !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Accès refusé' });
  }

  // Vérifier expiration
  if (booking.status === 'pending' && booking.expiresAt && new Date(booking.expiresAt) <= new Date()) {
    return res.status(410).json({ success: false, error: 'Cette réservation a expiré. Veuillez en créer une nouvelle.' });
  }

  if (booking.paymentStatus === 'paid') {
    return res.status(400).json({ success: false, error: 'Réservation déjà payée' });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({ success: false, error: 'Réservation annulée' });
  }

  // Prolonger le hold pendant que l'utilisateur procède au paiement
  if (booking.status === 'pending' && booking.expiresAt) {
    await Booking.extendHold(id, req.user.id);
  }

  // Générer une référence unique pour le virement
  const reference = `RESTATE-${booking._id.toString().slice(-6).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const payment = await Payment.findOneAndUpdate(
    { booking: id, method: 'bank_transfer' },
    {
      booking: id,
      user: req.user.id,
      amount: booking.totalPrice,
      method: 'bank_transfer',
      status: 'pending',
      transferReference: reference,
    },
    { upsert: true, new: true }
  );

  // Mettre à jour le statut de paiement de la réservation
  await Booking.findByIdAndUpdate(id, { paymentStatus: 'pending' });

  const bankDetails = {
    iban: process.env.BANK_IBAN || 'FR76 0000 0000 0000 0000 0000 000',
    bic: process.env.BANK_BIC || 'XXXXXXXX',
    beneficiary: process.env.BANK_NAME || 'Restate SAS',
    reference,
    amount: booking.totalPrice,
  };

  return res.status(200).json({ success: true, data: { payment, bankDetails } });
}

export default errorHandler(withAuth(handler));
