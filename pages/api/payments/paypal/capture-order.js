import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { withAuth } from '@/middleware/withAuth';
import { errorHandler } from '@/middleware/errorHandler';
import { capturePayPalOrder } from '@/lib/paypal';
import { sendEmail } from '@/lib/mail';
import { paymentReceivedEmail } from '@/email-templates/payment-received';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  await dbConnect();

  const { orderId, bookingId } = req.body;
  if (!orderId || !bookingId) {
    return res.status(400).json({ success: false, error: 'orderId et bookingId requis' });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ success: false, error: 'Réservation introuvable' });

  if (booking.user.toString() !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Accès refusé' });
  }

  const capture = await capturePayPalOrder(orderId);

  // Mettre à jour le paiement
  const payment = await Payment.findOneAndUpdate(
    { paypalOrderId: orderId },
    {
      status: 'completed',
      paypalCaptureId: capture.captureId,
    },
    { new: true }
  );

  // Mettre à jour la réservation
  await Booking.findByIdAndUpdate(bookingId, {
    paymentStatus: 'paid',
    status: 'confirmed',
  });

  // Email de confirmation paiement PayPal
  const populatedBooking = await Booking.findById(bookingId).populate('listing', 'title location');
  const user = await User.findById(req.user.id);
  if (populatedBooking && user && payment) {
    const bookingUrl = `${process.env.NEXTAUTH_URL}/bookings/${bookingId}`;
    const { subject, html } = paymentReceivedEmail({
      userName: user.name,
      booking: populatedBooking,
      payment,
      listing: populatedBooking.listing,
      bookingUrl,
    });
    await sendEmail({ to: user.email, subject, html });
  }

  return res.status(200).json({ success: true, data: { payment, capture } });
}

export default errorHandler(withAuth(handler));
