import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { withAdmin } from '@/middleware/withAdmin';
import { errorHandler } from '@/middleware/errorHandler';
import { sendEmail } from '@/lib/mail';
import { bookingReminderEmail } from '@/email-templates/booking-reminder';
import mongoose from 'mongoose';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  return withAdmin(sendReminder)(req, res);
}

async function sendReminder(req, res) {
  const { id } = req.query;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: 'ID invalide' });
  }

  await dbConnect();

  const booking = await Booking.findById(id)
    .populate('listing', 'title location slug checkInTime checkOutTime')
    .populate('user', 'name email');

  if (!booking) {
    return res.status(404).json({ success: false, error: 'Réservation introuvable' });
  }

  const user = booking.user;
  if (!user?.email) {
    return res.status(400).json({ success: false, error: 'Email client introuvable' });
  }

  const bookingUrl = `${process.env.NEXTAUTH_URL}/bookings/${booking._id}`;
  const { subject, html } = bookingReminderEmail({
    userName: user.name,
    listing: booking.listing,
    booking,
    bookingUrl,
  });

  await sendEmail({ to: user.email, subject, html });

  return res.status(200).json({ success: true, message: 'Rappel envoyé' });
}

export default errorHandler(handler);
