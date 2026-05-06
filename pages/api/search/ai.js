import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import { searchListingsWithAI } from '@/lib/groq';
import { errorHandler } from '@/middleware/errorHandler';

const COMPACT_SELECT = 'title type location capacity bedrooms bathrooms amenities themes activities environment averageRating reviewCount pricePerNight description distances';

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { q } = req.query;
  if (!q?.trim()) return res.status(400).json({ success: false, error: 'Paramètre q requis' });

  await dbConnect();

  const listings = await Listing.find({ isPublished: true }).select(COMPACT_SELECT).lean();
  const result = await searchListingsWithAI(q.trim(), listings);

  return res.status(200).json({
    success: true,
    ids: result.ids,
    count: result.ids.length,
    interpretation: result.interpretation,
    message: result.message,
  });
}

export default errorHandler(handler);
