import dbConnect from '@/lib/db';
import User from '@/models/User';
import { errorHandler } from '@/middleware/errorHandler';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  await dbConnect();

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'Token requis' });
  }

  const user = await User.findOne({ emailVerifyToken: token });
  if (!user) {
    return res.status(400).json({ success: false, error: 'Token invalide' });
  }

  user.emailVerified = true;
  user.emailVerifyToken = undefined;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({ success: true, message: 'Email vérifié avec succès' });
}

export default errorHandler(handler);
