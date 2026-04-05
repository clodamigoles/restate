import Booking from '@/models/Booking';
import Listing from '@/models/Listing';

/**
 * Vérifie si un logement est disponible pour une période donnée.
 * Prend en compte :
 * - Les réservations actives (pending non expirées + confirmed)
 * - Les dates bloquées par le propriétaire
 * - Les contraintes de séjour min/max
 *
 * @returns {{ available: boolean, reason: string|null, nights: number }}
 */
export async function checkAvailability(listingId, checkIn, checkOut, excludeBookingId) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (isNaN(start) || isNaN(end) || end <= start) {
    return { available: false, reason: 'Dates invalides', nights: 0 };
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const nights = Math.round((end - start) / msPerDay);

  // 1. Récupérer le listing pour les règles
  const listing = await Listing.findById(listingId).select(
    'blockedDates minNights maxNights isPublished'
  );
  if (!listing) {
    return { available: false, reason: 'Annonce introuvable', nights };
  }
  if (!listing.isPublished) {
    return { available: false, reason: "Cette annonce n'est pas disponible", nights };
  }

  // 2. Vérifier séjour minimum / maximum
  if (nights < (listing.minNights || 1)) {
    return {
      available: false,
      reason: `Séjour minimum de ${listing.minNights} nuit${listing.minNights > 1 ? 's' : ''}`,
      nights,
    };
  }
  if (nights > (listing.maxNights || 90)) {
    return {
      available: false,
      reason: `Séjour maximum de ${listing.maxNights} nuits`,
      nights,
    };
  }

  // 3. Vérifier les conflits avec réservations actives (exclut les pending expirés)
  const conflicts = await Booking.findConflicts(listingId, start, end, excludeBookingId);
  if (conflicts.length > 0) {
    return { available: false, reason: 'Ces dates sont déjà réservées', nights };
  }

  // 4. Vérifier les dates bloquées par le propriétaire
  const blockedConflict = listing.blockedDates?.some(
    (b) => new Date(b.start) < end && new Date(b.end) > start
  );
  if (blockedConflict) {
    return { available: false, reason: 'Le propriétaire a bloqué ces dates', nights };
  }

  return { available: true, reason: null, nights };
}

/**
 * Calcule le prix total d'un séjour en tenant compte de :
 * - Prix de base par nuit
 * - Surcharge weekend (vendredi/samedi soir)
 * - Tarification saisonnière
 * - Frais de ménage
 *
 * Tous les montants sont en centimes.
 *
 * @returns {{ pricePerNight: number, nightlyBreakdown: Array, cleaningFee: number, serviceFee: number, totalPrice: number }}
 */
export function calculatePrice(listing, checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const msPerDay = 1000 * 60 * 60 * 24;
  const nights = Math.round((end - start) / msPerDay);

  const nightlyBreakdown = [];
  let subtotal = 0;

  for (let i = 0; i < nights; i++) {
    const nightDate = new Date(start.getTime() + i * msPerDay);
    const dayOfWeek = nightDate.getDay(); // 0=dim, 5=ven, 6=sam

    let price = listing.pricePerNight;
    let label = 'standard';

    // 1. Vérifier tarification saisonnière (prioritaire)
    const seasonalMatch = listing.seasonalPricing?.find((s) => {
      const sStart = new Date(s.start);
      const sEnd = new Date(s.end);
      return nightDate >= sStart && nightDate < sEnd;
    });

    if (seasonalMatch) {
      price = seasonalMatch.pricePerNight;
      label = seasonalMatch.label || 'saisonnier';
    }
    // 2. Sinon, vérifier surcharge weekend (vendredi ou samedi soir)
    else if (listing.weekendPricePerNight != null && (dayOfWeek === 5 || dayOfWeek === 6)) {
      price = listing.weekendPricePerNight;
      label = 'weekend';
    }

    nightlyBreakdown.push({ date: nightDate, price, label });
    subtotal += price;
  }

  const cleaningFee = listing.cleaningFee || 0;
  // Frais de service plateforme : 5% du subtotal
  const serviceFee = Math.round(subtotal * 0.05);
  const totalPrice = subtotal + cleaningFee + serviceFee;

  // Prix moyen par nuit (pour l'affichage)
  const avgPricePerNight = nights > 0 ? Math.round(subtotal / nights) : listing.pricePerNight;

  return {
    nights,
    pricePerNight: avgPricePerNight,
    nightlyBreakdown,
    cleaningFee,
    serviceFee,
    subtotal,
    totalPrice,
  };
}

/**
 * Retourne toutes les plages de dates réservées pour un logement
 * sur une période donnée (pour alimenter le calendrier côté client).
 * Exclut automatiquement les pending expirés.
 */
export async function getBookedRanges(listingId, from, to) {
  const now = new Date();

  const bookings = await Booking.find({
    listing: listingId,
    status: { $in: ['pending', 'confirmed'] },
    checkIn: { $lt: new Date(to) },
    checkOut: { $gt: new Date(from) },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  }).select('checkIn checkOut status');

  const listing = await Listing.findById(listingId).select('blockedDates');

  return {
    bookings: bookings.map((b) => ({
      start: b.checkIn,
      end: b.checkOut,
      status: b.status,
    })),
    blockedDates: listing?.blockedDates || [],
  };
}

/**
 * Génère un tableau de toutes les dates (Date) comprises dans une plage.
 */
export function expandDateRange(start, end) {
  const dates = [];
  const cur = new Date(start);
  const fin = new Date(end);
  while (cur < fin) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}
