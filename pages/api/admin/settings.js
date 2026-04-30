import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { withAdmin } from '@/middleware/withAdmin';
import { errorHandler } from '@/middleware/errorHandler';

async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const settings = await Settings.findOne({ key: 'global' }).lean();
    return res.json({
      success: true,
      data: {
        bankIban: settings?.bankIban || '',
        bankBic: settings?.bankBic || '',
        bankBeneficiary: settings?.bankBeneficiary || '',
      },
    });
  }

  if (req.method === 'PUT') {
    const { bankIban, bankBic, bankBeneficiary } = req.body;
    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { bankIban: bankIban?.trim() || '', bankBic: bankBic?.trim() || '', bankBeneficiary: bankBeneficiary?.trim() || '' },
      { upsert: true, new: true }
    );
    return res.json({ success: true, data: settings });
  }

  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}

export default errorHandler(withAdmin(handler));
