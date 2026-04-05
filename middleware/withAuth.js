import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export function withAuth(handler) {
  return async (req, res) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ success: false, error: 'Non authentifié' });
    }

    req.user = session.user;
    return handler(req, res);
  };
}
