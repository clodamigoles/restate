import dbConnect from '@/lib/db';
import User from '@/models/User';
import { errorHandler } from '@/middleware/errorHandler';
import { withAdmin } from '@/middleware/withAdmin';
import { sendEmail } from '@/lib/mail';
import { welcomeEmail } from '@/email-templates/welcome';
import crypto from 'crypto';

async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    return register(req, res);
  }

  // GET — admin only (liste users)
  return withAdmin(listUsers)(req, res);
}

async function register(req, res) {
  const { name, email, password, guest } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Nom, email et mot de passe requis' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, error: 'Cet email est déjà utilisé' });
  }

  const emailVerifyToken = crypto.randomBytes(32).toString('hex');

  const user = await User.create({
    name,
    email,
    password,
    emailVerifyToken,
  });

  // Pas d'email de bienvenue pour les comptes pré-créés (guest) — ils recevront
  // l'email de confirmation de réservation juste après.
  // L'envoi est toujours fire-and-forget pour ne jamais bloquer la création de compte.
  if (!guest) {
    const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${emailVerifyToken}`;
    const { subject, html } = welcomeEmail({ name, verifyUrl });
    sendEmail({ to: user.email, subject, html }).catch((err) =>
      console.error('[register] Erreur email bienvenue:', err.message)
    );
  }

  return res.status(201).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
}

async function listUsers(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const role = req.query.role || '';

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) {
    query.role = role;
  }

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return res.status(200).json({
    success: true,
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export default errorHandler(handler);
