import dbConnect from '@/lib/db';
import User from '@/models/User';
import { errorHandler } from '@/middleware/errorHandler';
import crypto from 'crypto';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  await dbConnect();

  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ success: false, error: 'Token et nouveau mot de passe requis' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    return res.status(400).json({ success: false, error: 'Token invalide ou expiré' });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return res.status(200).json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
}

export default errorHandler(handler);
