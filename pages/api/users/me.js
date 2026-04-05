import dbConnect from '@/lib/db';
import User from '@/models/User';
import { errorHandler } from '@/middleware/errorHandler';
import { withAuth } from '@/middleware/withAuth';

async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    return res.status(200).json({ success: true, data: user });
  }

  if (req.method === 'PUT') {
    const { name, phone, avatar, currentPassword, newPassword } = req.body;

    // Password change flow
    if (newPassword !== undefined) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, error: 'Mot de passe actuel requis' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      }
      const userWithPw = await User.findById(req.user.id).select('+password');
      if (!userWithPw) {
        return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
      }
      const valid = await userWithPw.comparePassword(currentPassword);
      if (!valid) {
        return res.status(400).json({ success: false, error: 'Mot de passe actuel incorrect' });
      }
      userWithPw.password = newPassword;
      if (name !== undefined) userWithPw.name = name;
      if (phone !== undefined) userWithPw.phone = phone;
      if (avatar !== undefined) userWithPw.avatar = avatar;
      await userWithPw.save();
      return res.status(200).json({ success: true, data: userWithPw });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    return res.status(200).json({ success: true, data: user });
  }

  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}

export default errorHandler(withAuth(handler));
