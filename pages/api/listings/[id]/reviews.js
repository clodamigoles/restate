import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Booking from '@/models/Booking';
import Listing from '@/models/Listing';
import { withAuth } from '@/middleware/withAuth';
import { errorHandler } from '@/middleware/errorHandler';
import mongoose from 'mongoose';

async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') return getReviews(req, res);
  if (req.method === 'POST') return withAuth(createReview)(req, res);

  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}

async function getReviews(req, res) {
  const { id } = req.query;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: 'ID invalide' });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ listing: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name avatar'),
    Review.countDocuments({ listing: id }),
  ]);

  return res.status(200).json({
    success: true,
    data: reviews,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

async function createReview(req, res) {
  const { id } = req.query;
  const { rating, comment, bookingId } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: 'ID invalide' });
  }
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: 'Note entre 1 et 5 requise' });
  }

  // Vérifier que l'utilisateur a bien séjourné (réservation complétée)
  const booking = await Booking.findOne({
    _id: bookingId,
    listing: id,
    user: req.user.id,
    status: 'completed',
  });
  if (!booking) {
    return res.status(403).json({ success: false, error: 'Seuls les séjours terminés peuvent être évalués' });
  }

  // Un seul avis par user par annonce
  const existing = await Review.findOne({ listing: id, user: req.user.id });
  if (existing) {
    return res.status(409).json({ success: false, error: 'Vous avez déjà laissé un avis pour cette annonce' });
  }

  const review = await Review.create({
    listing: id,
    user: req.user.id,
    booking: bookingId,
    rating,
    comment,
  });

  // Mettre à jour la note moyenne de l'annonce
  const stats = await Review.aggregate([
    { $match: { listing: new mongoose.Types.ObjectId(id) } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length) {
    await Listing.findByIdAndUpdate(id, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  }

  return res.status(201).json({ success: true, data: review });
}

export default errorHandler(handler);
