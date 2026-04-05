import dbConnect from '@/lib/db';
import User from '@/models/User';
import { withAdmin } from '@/middleware/withAdmin';
import { errorHandler } from '@/middleware/errorHandler';

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: user });
  }

  if (req.method === 'PUT') {
    const { name, role, phone } = req.body;
    const allowed = ['user', 'admin', 'owner'];
    if (role && !allowed.includes(role)) {
      return res.status(400).json({ success: false, error: 'Rôle invalide' });
    }
    if (name) user.name = name;
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    await user.save();
    return res.status(200).json({ success: true, data: user });
  }

  if (req.method === 'DELETE') {
    // Prevent self-deletion
    if (req.user?.id === id) {
      return res.status(400).json({ success: false, error: 'Impossible de supprimer votre propre compte' });
    }
    await user.deleteOne();
    return res.status(200).json({ success: true, message: 'Utilisateur supprimé' });
  }

  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}

export default errorHandler(withAdmin(handler));
