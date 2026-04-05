import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import { errorHandler } from '@/middleware/errorHandler';
import { checkAvailability, calculatePrice, getBookedRanges } from '@/lib/availability';
import mongoose from 'mongoose';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  await dbConnect();

  const { id, checkIn, checkOut, year, month } = req.query;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: 'ID invalide' });
  }

  const listing = await Listing.findById(id);
  if (!listing) return res.status(404).json({ success: false, error: 'Annonce non trouvée' });

  // Vérification de disponibilité + calcul de prix pour des dates précises
  if (checkIn && checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (end <= start) {
      return res.status(400).json({ success: false, error: 'Les dates sont invalides' });
    }

    const availability = await checkAvailability(id, start, end);

    // Si disponible, calculer le prix
    let pricing = null;
    if (availability.available) {
      pricing = calculatePrice(listing, start, end);
    }

    return res.status(200).json({
      success: true,
      data: {
        available: availability.available,
        reason: availability.reason,
        nights: availability.nights,
        pricing,
      },
    });
  }

  // Retourne les dates réservées d'un mois pour le calendrier
  if (year && month) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 1);

    const ranges = await getBookedRanges(id, start, end);

    return res.status(200).json({
      success: true,
      data: {
        ...ranges,
        minNights: listing.minNights,
        maxNights: listing.maxNights,
      },
    });
  }

  return res.status(400).json({ success: false, error: 'Paramètres manquants' });
}

export default errorHandler(handler);
