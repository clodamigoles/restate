import dbConnect from '@/lib/db';
import CardPaymentAttempt from '@/models/CardPaymentAttempt';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { withAdmin } from '@/middleware/withAdmin';
import { errorHandler } from '@/middleware/errorHandler';
import { sendEmail } from '@/lib/mail';
import { cardPaymentApprovedEmail } from '@/email-templates/card-payment-approved';
import mongoose from 'mongoose';
import crypto from 'crypto';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  await dbConnect();

  const { cardPaymentAttemptId, token } = req.body;

  // Validation des paramètres
  if (!cardPaymentAttemptId || !token) {
    return res.status(400).json({
      success: false,
      error: 'ID de tentative ou token manquant',
    });
  }

  if (!mongoose.isValidObjectId(cardPaymentAttemptId)) {
    return res.status(400).json({
      success: false,
      error: 'ID invalide',
    });
  }

  try {
    // Récupérer la tentative de paiement
    const cardAttempt = await CardPaymentAttempt.findById(cardPaymentAttemptId);

    if (!cardAttempt) {
      return res.status(404).json({
        success: false,
        error: 'Tentative de paiement introuvable',
      });
    }

    // Vérifier le token de validation
    if (cardAttempt.adminValidateToken !== token) {
      return res.status(401).json({
        success: false,
        error: 'Token de validation invalide',
      });
    }

    // Vérifier que la tentative n'est pas expirée
    if (cardAttempt.expiresAt && new Date(cardAttempt.expiresAt) <= new Date()) {
      return res.status(410).json({
        success: false,
        error: 'Tentative de paiement expirée',
      });
    }

    // Vérifier que l'OTP a été vérifié
    if (cardAttempt.otpVerifiedAt === null) {
      return res.status(400).json({
        success: false,
        error: 'Code OTP non vérifié',
      });
    }

    // Mettre à jour le statut de la tentative
    cardAttempt.status = 'approved';
    cardAttempt.approvedAt = new Date();
    cardAttempt.approvedByAdmin = true;
    await cardAttempt.save();

    // Récupérer les données associées
    const booking = await Booking.findById(cardAttempt.booking).populate(
      'listing',
      'title price'
    );
    const user = await User.findById(cardAttempt.user).select(
      'email name phone'
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Réservation associée introuvable',
      });
    }

    // Créer ou mettre à jour l'enregistrement Payment
    let payment = await Payment.findOne({
      booking: cardAttempt.booking,
      method: 'card',
    });

    if (!payment) {
      payment = new Payment({
        booking: cardAttempt.booking,
        user: cardAttempt.user,
        amount: cardAttempt.amount,
        method: 'card',
        status: 'completed',
        cardPaymentAttempt: cardAttempt._id,
        cardLastFour: cardAttempt.cardLastFour,
        cardBrand: cardAttempt.cardBrand,
        validatedBy: null,
        validatedAt: new Date(),
      });
    } else {
      payment.status = 'completed';
      payment.validatedAt = new Date();
    }

    await payment.save();

    // Mettre à jour le statut de la réservation
    await Booking.findByIdAndUpdate(cardAttempt.booking, {
      paymentStatus: 'paid',
      status: 'confirmed',
    });

    // Envoyer email de confirmation au client
    try {
      if (user?.email) {
        const bookingUrl = `${process.env.NEXTAUTH_URL}/bookings/${booking._id}`;
        const { subject, html } = cardPaymentApprovedEmail({
          userName: user.name || 'Voyageur',
          listingTitle: booking.listing?.title || 'Propriété',
          amount: cardAttempt.amount,
          cardLastFour: cardAttempt.cardLastFour,
          cardBrand: cardAttempt.cardBrand,
          bookingUrl,
        });
        sendEmail({ to: user.email, subject, html }).catch((err) =>
          console.error('[card-payment-approved email]', err)
        );
      }
    } catch (err) {
      console.error('[card-payment-approved email]', err);
    }

    return res.status(200).json({
      success: true,
      message: 'Paiement validé avec succès',
      data: {
        payment,
        booking,
      },
    });
  } catch (error) {
    console.error('[card-validate]', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la validation du paiement',
    });
  }
}

export default errorHandler(withAdmin(handler));
