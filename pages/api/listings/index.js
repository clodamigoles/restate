import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import { withAdminOrAuth } from '@/middleware/withAdminOrAuth';
import { errorHandler } from '@/middleware/errorHandler';
import { createLocalizedField } from '@/lib/i18n';
import jwt from 'jsonwebtoken';

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

function isAdminRequest(req) {
  const token = req.cookies['admin-token'];
  if (!token) return false;
  try {
    jwt.verify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') return searchListings(req, res);
  if (req.method === 'POST') return withAdminOrAuth(createListing)(req, res);

  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}

// Normalise les champs i18n : accepte String ou Object { fr, en, ... }
function normalizeI18nField(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return createLocalizedField(value);
  return value;
}

async function searchListings(req, res) {
  const {
    city, type, minPrice, maxPrice,
    bedrooms, bathrooms, capacity, amenities,
    checkIn, checkOut,
    // Distances max en metres
    maxDistanceBeach, maxDistanceCenter, maxDistanceSki,
    maxDistanceLake, maxDistanceCoast, maxDistanceTransport,
    sort = 'newest',
    page = 1, limit = 12,
  } = req.query;

  const isAdmin = isAdminRequest(req);
  const query = isAdmin ? {} : { isPublished: true };

  if (city) query['location.city'] = { $regex: city, $options: 'i' };
  if (type) query.type = type;
  if (bedrooms) query.bedrooms = { $gte: parseInt(bedrooms) };
  if (bathrooms) query.bathrooms = { $gte: parseInt(bathrooms) };
  if (capacity) query.capacity = { $gte: parseInt(capacity) };

  // Filtres distances
  if (maxDistanceBeach)     query['distances.beach']     = { $lte: parseInt(maxDistanceBeach), $ne: null };
  if (maxDistanceCenter)    query['distances.center']    = { $lte: parseInt(maxDistanceCenter), $ne: null };
  if (maxDistanceSki)       query['distances.ski']       = { $lte: parseInt(maxDistanceSki), $ne: null };
  if (maxDistanceLake)      query['distances.lake']      = { $lte: parseInt(maxDistanceLake), $ne: null };
  if (maxDistanceCoast)     query['distances.coast']     = { $lte: parseInt(maxDistanceCoast), $ne: null };
  if (maxDistanceTransport) query['distances.transport'] = { $lte: parseInt(maxDistanceTransport), $ne: null };

  if (minPrice || maxPrice) {
    query.pricePerNight = {};
    if (minPrice) query.pricePerNight.$gte = parseInt(minPrice) * 100;
    if (maxPrice) query.pricePerNight.$lte = parseInt(maxPrice) * 100;
  }

  if (amenities) {
    const list = amenities.split(',').filter(Boolean);
    if (list.length) query.amenities = { $all: list };
  }

  // Exclure les annonces avec des réservations actives qui chevauchent les dates
  if (checkIn && checkOut) {
    const { default: Booking } = await import('@/models/Booking');
    const now = new Date();
    const bookedListingIds = await Booking.distinct('listing', {
      status: { $in: ['pending', 'confirmed'] },
      checkIn: { $lt: new Date(checkOut) },
      checkOut: { $gt: new Date(checkIn) },
      // Exclure les pending expirés pas encore nettoyés par le TTL
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    });
    query._id = { $nin: bookedListingIds };
  }

  const sortMap = {
    price_asc: { pricePerNight: 1 },
    price_desc: { pricePerNight: -1 },
    popular: { reviewCount: -1, averageRating: -1 },
    newest: { createdAt: -1 },
  };
  const sortOrder = sortMap[sort] || sortMap.newest;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [listings, total] = await Promise.all([
    Listing.find(query).sort(sortOrder).skip(skip).limit(parseInt(limit)).populate('owner', 'name'),
    Listing.countDocuments(query),
  ]);

  return res.status(200).json({
    success: true,
    data: listings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}

async function createListing(req, res) {
  const { role, id, isAdminCookie } = req.user;
  if (role !== 'admin' && role !== 'owner') {
    return res.status(403).json({ success: false, error: 'Acces refuse' });
  }

  // Normaliser les champs i18n (accepte String ou Object)
  const body = { ...req.body };
  if (body.title) body.title = normalizeI18nField(body.title);
  if (body.description) body.description = normalizeI18nField(body.description);
  if (body.rules) body.rules = normalizeI18nField(body.rules);

  // Admin cookie : pas d'ID utilisateur associe
  if (!isAdminCookie) body.owner = id;

  const listing = await Listing.create(body);
  return res.status(201).json({ success: true, data: listing });
}

export default errorHandler(handler);
