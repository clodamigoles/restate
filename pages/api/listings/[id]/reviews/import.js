import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Listing from '@/models/Listing';
import { withAdminOrAuth } from '@/middleware/withAdminOrAuth';
import { errorHandler } from '@/middleware/errorHandler';
import mongoose from 'mongoose';

async function importReviewsHandler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  await dbConnect();
  const { id } = req.query;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: 'ID invalide' });
  }

  const { reviews, source } = req.body;
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return res.status(400).json({ success: false, error: 'Tableau d\'avis requis' });
  }

  const docs = reviews
    .filter((r) => r.rating >= 1 && r.rating <= 10)
    .map((r) => ({
      listing: id,
      reviewerName: r.reviewerName || null,
      title:        r.title        || null,
      rating:       Number(r.rating),
      comment:      r.comment      || null,
      isImported:   true,
      source:       source         || null,
      subRatings: (r.subRatings && Object.values(r.subRatings).some((v) => v != null))
        ? {
            cleanliness:   r.subRatings.cleanliness   ?? null,
            communication: r.subRatings.communication ?? null,
            equipment:     r.subRatings.equipment     ?? null,
            valueForMoney: r.subRatings.valueForMoney ?? null,
          }
        : null,
    }));

  if (docs.length === 0) {
    return res.status(400).json({ success: false, error: 'Aucun avis valide (note 1–10 requise)' });
  }

  await Review.insertMany(docs, { ordered: false });

  // Recalculer averageRating et reviewCount
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

  return res.status(201).json({ success: true, imported: docs.length });
}

export default errorHandler(withAdminOrAuth(importReviewsHandler));
