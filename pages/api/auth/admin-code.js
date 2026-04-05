import jwt from 'jsonwebtoken';

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';
const COOKIE_NAME = 'admin-token';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { code } = req.body;

    if (!code || code !== process.env.ADMIN_ACCESS_CODE) {
      return res.status(401).json({ success: false, error: 'Code incorrect' });
    }

    const token = jwt.sign({ admin: true }, SECRET, { expiresIn: '7d' });

    res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
