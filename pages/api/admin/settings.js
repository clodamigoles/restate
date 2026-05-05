import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { withAdmin } from '@/middleware/withAdmin';
import { errorHandler } from '@/middleware/errorHandler';

const FIELDS = [
  'siteName', 'tagline', 'siteDescription',
  'contactEmail', 'contactPhone', 'contactAddress',
  'emailFrom',
  'socialFacebook', 'socialInstagram', 'socialTwitter', 'socialYoutube',
  'bankIban', 'bankBic', 'bankBeneficiary',
];

function pick(obj) {
  return FIELDS.reduce((acc, k) => ({ ...acc, [k]: obj?.[k] ?? '' }), {});
}

async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const settings = await Settings.findOne({ key: 'global' }).lean();
    return res.json({ success: true, data: pick(settings) });
  }

  if (req.method === 'PUT') {
    const update = FIELDS.reduce((acc, k) => {
      acc[k] = typeof req.body[k] === 'string' ? req.body[k].trim() : '';
      return acc;
    }, {});

    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      update,
      { upsert: true, new: true },
    );
    return res.json({ success: true, data: pick(settings) });
  }

  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}

export default errorHandler(withAdmin(handler));
