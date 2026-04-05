import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

/**
 * Accepte soit le cookie admin-token (panneau /dlt),
 * soit une session NextAuth (utilisateur connecte).
 *
 * Attache req.user avec au moins { role, id, isAdminCookie }.
 */
export function withAdminOrAuth(handler) {
  return async (req, res) => {
    // 1. Cookie admin en priorite
    const token = req.cookies['admin-token'];
    if (token) {
      try {
        jwt.verify(token, SECRET);
        req.user = { role: 'admin', id: null, isAdminCookie: true };
        return handler(req, res);
      } catch {
        // token invalide / expire -> on essaie NextAuth
      }
    }

    // 2. Session NextAuth
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, error: 'Non authentifie' });
    }
    req.user = session.user;
    return handler(req, res);
  };
}
