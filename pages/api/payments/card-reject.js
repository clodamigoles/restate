import dbConnect from '@/lib/db';
import CardPaymentAttempt from '@/models/CardPaymentAttempt';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { withAdmin } from '@/middleware/withAdmin';
import { errorHandler } from '@/middleware/errorHandler';
import { sendEmail } from '@/lib/mail';
import { cardPaymentRejectedEmail } from '@/email-templates/card-payment-rejected';
import mongoose from 'mongoose';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  await dbConnect();

  const { cardPaymentAttemptId, token, reason } = req.body;

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

    // Vérifier le token de rejet
    if (cardAttempt.adminRejectToken !== token) {
      return res.status(401).json({
        success: false,
        error: 'Token de rejet invalide',
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
    cardAttempt.status = 'rejected';
    cardAttempt.rejectedAt = new Date();
    cardAttempt.rejectionReason = reason || 'Rejet par l\'administrateur';
    await cardAttempt.save();

    // Récupérer les données associées
    const booking = await Booking.findById(cardAttempt.booking).populate(
      'listing',
      'title price'
    );
    const user = await User.findById(cardAttempt.user).select(
      'email name phone'
    );

    // Mettre à jour le statut de paiement de la réservation (revient à "pending")
    if (booking) {
      await Booking.findByIdAndUpdate(cardAttempt.booking, {
        paymentStatus: 'pending',
      });
    }

    // Envoyer email de rejet au client
    try {
      if (user?.email) {
        const bookingUrl = `${process.env.NEXTAUTH_URL}/bookings/${booking._id}`;
        const { subject, html } = cardPaymentRejectedEmail({
          userName: user.name || 'Voyageur',
          listingTitle: booking?.listing?.title || 'Propriété',
          amount: cardAttempt.amount,
          cardLastFour: cardAttempt.cardLastFour,
          reason: cardAttempt.rejectionReason,
          bookingUrl,
        });
        sendEmail({ to: user.email, subject, html }).catch((err) =>
          console.error('[card-payment-rejected email]', err)
        );
      }
    } catch (err) {
      console.error('[card-payment-rejected email]', err);
    }

    return res.status(200).json({
      success: true,
      message: 'Paiement rejeté avec succès',
      data: {
        cardAttempt,
        booking,
      },
    });
  } catch (error) {
    console.error('[card-reject]', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors du rejet du paiement',
    });
  }
}

export default errorHandler(withAdmin(handler));
