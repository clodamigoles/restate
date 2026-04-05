import jwt from 'jsonwebtoken';

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

export function withAdmin(handler) {
  return async (req, res) => {
    const token = req.cookies['admin-token'];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Acces non autorise' });
    }

    try {
      jwt.verify(token, SECRET);
    } catch {
      return res.status(401).json({ success: false, error: 'Session expiree' });
    }

    req.user = { role: 'admin', id: null, isAdminCookie: true };
    return handler(req, res);
  };
}
