import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import { errorHandler } from '@/middleware/errorHandler';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  await dbConnect();

  const listings = await Listing.find({ isPublished: true, isFeatured: true })
    .sort({ averageRating: -1, createdAt: -1 })
    .limit(8)
    .populate('owner', 'name');

  return res.status(200).json({ success: true, data: listings });
}

export default errorHandler(handler);
