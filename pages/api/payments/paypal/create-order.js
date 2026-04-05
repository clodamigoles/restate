import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';
import { withAuth } from '@/middleware/withAuth';
import { errorHandler } from '@/middleware/errorHandler';
import { createPayPalOrder } from '@/lib/paypal';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  await dbConnect();

  const { bookingId } = req.body;
  if (!bookingId) {
    return res.status(400).json({ success: false, error: 'bookingId requis' });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ success: false, error: 'Réservation introuvable' });

  if (booking.user.toString() !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Accès refusé' });
  }

  if (booking.paymentStatus === 'paid') {
    return res.status(400).json({ success: false, error: 'Cette réservation est déjà payée' });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({ success: false, error: 'Réservation annulée' });
  }

  const orderId = await createPayPalOrder(booking.totalPrice, 'EUR', bookingId);

  // Créer/mettre à jour le Payment en attente
  await Payment.findOneAndUpdate(
    { booking: bookingId, method: 'paypal' },
    {
      booking: bookingId,
      user: req.user.id,
      amount: booking.totalPrice,
      method: 'paypal',
      status: 'pending',
      paypalOrderId: orderId,
    },
    { upsert: true, new: true }
  );

  return res.status(200).json({ success: true, data: { orderId } });
}

export default errorHandler(withAuth(handler));
