import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';
import User from '@/models/User';
import Listing from '@/models/Listing';
import { withAdmin } from '@/middleware/withAdmin';
import { errorHandler } from '@/middleware/errorHandler';
import { sendEmail } from '@/lib/mail';
import { paymentReceivedEmail } from '@/email-templates/payment-received';
import mongoose from 'mongoose';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  await dbConnect();

  const { id } = req.query;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: 'ID invalide' });
  }

  const payment = await Payment.findById(id);
  if (!payment) return res.status(404).json({ success: false, error: 'Paiement introuvable' });

  if (payment.method !== 'bank_transfer') {
    return res.status(400).json({ success: false, error: 'Seuls les virements peuvent être validés manuellement' });
  }
  if (payment.status === 'completed') {
    return res.status(400).json({ success: false, error: 'Ce paiement est déjà validé' });
  }

  payment.status = 'completed';
  payment.validatedBy = req.user.id;
  payment.validatedAt = new Date();
  if (req.body.notes) payment.notes = req.body.notes;
  await payment.save();

  // Mettre à jour le statut de la réservation
  await Booking.findByIdAndUpdate(payment.booking, {
    paymentStatus: 'paid',
    status: 'confirmed',
  });

  // Email de confirmation de paiement
  const booking = await Booking.findById(payment.booking).populate('listing', 'title location');
  const user = await User.findById(payment.user);
  if (booking && user) {
    const bookingUrl = `${process.env.NEXTAUTH_URL}/bookings/${booking._id}`;
    const { subject, html } = paymentReceivedEmail({
      userName: user.name,
      booking,
      payment,
      listing: booking.listing,
      bookingUrl,
    });
    await sendEmail({ to: user.email, subject, html });
  }

  return res.status(200).json({ success: true, data: payment });
}

export default errorHandler(withAdmin(handler));
