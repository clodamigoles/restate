import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { errorHandler } from '@/middleware/errorHandler';

// Champs publics uniquement — pas de coordonnées bancaires ni d'emailFrom
const PUBLIC_FIELDS = [
  'siteName', 'tagline', 'siteDescription',
  'contactEmail', 'contactPhone', 'contactAddress',
  'socialFacebook', 'socialInstagram', 'socialTwitter', 'socialYoutube',
];

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  await dbConnect();
  const settings = await Settings.findOne({ key: 'global' }).lean();

  const data = PUBLIC_FIELDS.reduce((acc, k) => ({ ...acc, [k]: settings?.[k] ?? '' }), {});

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return res.json({ success: true, data });
}

export default errorHandler(handler);
