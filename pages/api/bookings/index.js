import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Listing from '@/models/Listing';
import User from '@/models/User';
import { withAdminOrAuth } from '@/middleware/withAdminOrAuth';
import { withAuth } from '@/middleware/withAuth';
import { errorHandler } from '@/middleware/errorHandler';
import { checkAvailability, calculatePrice } from '@/lib/availability';
import { sendEmail } from '@/lib/mail';
import { bookingConfirmationEmail } from '@/email-templates/booking-confirmation';

async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') return withAdminOrAuth(listBookings)(req, res);
  if (req.method === 'POST') return withAuth(createBooking)(req, res);

  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}

async function listBookings(req, res) {
  const { role, id: userId } = req.user;
  const { status, page = 1, limit = 10 } = req.query;

  const filter = role === 'admin' ? {} : { user: userId };
  if (status) filter.status = status;

  // Exclure les pending expirés pas encore nettoyés par le TTL
  if (!status || status === 'pending') {
    filter.$or = [
      { status: { $ne: 'pending' } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('listing', 'title images location slug')
      .populate('user', 'name email'),
    Booking.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: bookings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}

async function createBooking(req, res) {
  const { listingId, checkIn, checkOut, guests, specialRequests } = req.body;

  if (!listingId || !checkIn || !checkOut || !guests) {
    return res.status(400).json({ success: false, error: 'Champs requis manquants' });
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (isNaN(start) || isNaN(end) || end <= start) {
    return res.status(400).json({ success: false, error: 'Dates invalides' });
  }

  // 1. Récupérer le listing complet pour le calcul de prix
  const listing = await Listing.findById(listingId);
  if (!listing || !listing.isPublished) {
    return res.status(404).json({ success: false, error: 'Annonce introuvable' });
  }

  if (parseInt(guests) > listing.capacity) {
    return res.status(400).json({
      success: false,
      error: `Capacité maximale : ${listing.capacity} personnes`,
    });
  }

  // 2. Vérifier la disponibilité (inclut min/max nights, conflits, dates bloquées)
  const { available, reason, nights } = await checkAvailability(listingId, start, end);
  if (!available) {
    return res.status(409).json({ success: false, error: reason });
  }

  // 3. Calculer le prix dynamique
  const pricing = calculatePrice(listing, start, end);

  // 4. Double vérification des conflits avant création
  const lastCheck = await Booking.findConflicts(listingId, start, end);
  if (lastCheck.length > 0) {
    return res.status(409).json({ success: false, error: 'Ces dates viennent d\'être réservées par quelqu\'un d\'autre' });
  }

  const booking = await Booking.create({
    listing: listingId,
    user: req.user.id,
    checkIn: start,
    checkOut: end,
    guests: parseInt(guests),
    nights: pricing.nights,
    pricePerNight: pricing.pricePerNight,
    cleaningFee: pricing.cleaningFee,
    serviceFee: pricing.serviceFee,
    totalPrice: pricing.totalPrice,
    status: listing.instantBooking ? 'confirmed' : 'pending',
    specialRequests,
  });

  // 5. Populate pour la réponse
  await booking.populate('listing', 'title images location slug checkInTime checkOutTime');

  // 6. Email de confirmation (non bloquant)
  const user = await User.findById(req.user.id);
  if (user) {
    const bookingUrl = `${process.env.NEXTAUTH_URL}/bookings/${booking._id}`;
    const { subject, html } = bookingConfirmationEmail({
      userName: user.name,
      listing: booking.listing,
      booking,
      bookingUrl,
    });
    sendEmail({ to: user.email, subject, html }).catch((err) =>
      console.error('[BOOKING] Erreur email confirmation:', err.message)
    );
  }

  return res.status(201).json({
    success: true,
    data: booking,
    pricing: {
      nightlyBreakdown: pricing.nightlyBreakdown,
      subtotal: pricing.subtotal,
      cleaningFee: pricing.cleaningFee,
      serviceFee: pricing.serviceFee,
      totalPrice: pricing.totalPrice,
    },
  });
}

export default errorHandler(handler);
