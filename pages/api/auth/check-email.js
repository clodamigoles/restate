import dbConnect from '@/lib/db';
import User from '@/models/User';
import { errorHandler } from '@/middleware/errorHandler';

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  await dbConnect();
  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false, error: 'Email requis' });
  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  return res.json({ success: true, exists: !!user });
}

export default errorHandler(handler);
