import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { withAdminOrAuth } from '@/middleware/withAdminOrAuth';
import { errorHandler } from '@/middleware/errorHandler';
import { sendEmail } from '@/lib/mail';
import { bookingCancellationEmail } from '@/email-templates/booking-cancellation';
import mongoose from 'mongoose';

async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') return withAdminOrAuth(getBooking)(req, res);
  if (req.method === 'PUT') return withAdminOrAuth(updateBooking)(req, res);
  if (req.method === 'DELETE') return withAdminOrAuth(deleteBooking)(req, res);

  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}

/**
 * Vérifie qu'une réservation pending n'est pas expirée.
 * Si elle l'est, on la marque cancelled pour feedback immédiat
 * (le TTL la supprimera plus tard).
 */
function isExpired(booking) {
  return (
    booking.status === 'pending' &&
    booking.expiresAt &&
    new Date(booking.expiresAt) <= new Date()
  );
}

async function getBooking(req, res) {
  const { id } = req.query;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: 'ID invalide' });
  }

  const booking = await Booking.findById(id)
    .populate('listing', 'title images location slug pricePerNight cleaningFee checkInTime checkOutTime minNights maxNights')
    .populate('user', 'name email phone');

  if (!booking) return res.status(404).json({ success: false, error: 'Réservation introuvable' });

  // Vérifier expiration
  if (isExpired(booking)) {
    return res.status(410).json({ success: false, error: 'Cette réservation a expiré' });
  }

  const { role, id: userId } = req.user;
  // booking.user peut être null après populate si l'utilisateur a été supprimé
  const ownerId = booking.user?._id?.toString() ?? null;
  if (role !== 'admin' && ownerId !== userId) {
    return res.status(403).json({ success: false, error: 'Accès refusé' });
  }

  return res.status(200).json({ success: true, data: booking });
}

async function updateBooking(req, res) {
  const { id } = req.query;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: 'ID invalide' });
  }

  const booking = await Booking.findById(id);
  if (!booking) return res.status(404).json({ success: false, error: 'Réservation introuvable' });

  // Vérifier expiration
  if (isExpired(booking)) {
    return res.status(410).json({ success: false, error: 'Cette réservation a expiré' });
  }

  const { role, id: userId } = req.user;
  const isOwner = booking.user.toString() === userId;

  if (role !== 'admin' && !isOwner) {
    return res.status(403).json({ success: false, error: 'Accès refusé' });
  }

  const { status, cancellationReason } = req.body;

  // L'utilisateur ne peut qu'annuler sa propre réservation
  if (role !== 'admin' && status !== 'cancelled') {
    return res.status(403).json({ success: false, error: 'Action non autorisée' });
  }

  if (status === 'cancelled') {
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ success: false, error: 'Cette réservation ne peut pas être annulée' });
    }
    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason || '';
    booking.cancelledBy = role === 'admin' ? 'admin' : 'user';
  } else if (role === 'admin') {
    if (status) booking.status = status;
  }

  await booking.save();

  // Email d'annulation (non bloquant)
  if (status === 'cancelled') {
    await booking.populate('listing', 'title location');
    const bookingUser = await User.findById(booking.user);
    if (bookingUser) {
      const { subject, html } = bookingCancellationEmail({
        userName: bookingUser.name,
        listing: booking.listing,
        booking,
        cancelledBy: booking.cancelledBy,
        reason: booking.cancellationReason,
      });
      sendEmail({ to: bookingUser.email, subject, html }).catch((err) =>
        console.error('[BOOKING] Erreur email annulation:', err.message)
      );
    }
  }

  return res.status(200).json({ success: true, data: booking });
}

async function deleteBooking(req, res) {
  const { id } = req.query;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Réservé aux administrateurs' });
  }
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: 'ID invalide' });
  }
  await Booking.findByIdAndDelete(id);
  return res.status(200).json({ success: true, message: 'Réservation supprimée' });
}

export default errorHandler(handler);
