import dbConnect from '@/lib/db';
import User from '@/models/User';
import { errorHandler } from '@/middleware/errorHandler';
import { sendEmail } from '@/lib/mail';
import { resetPasswordEmail } from '@/email-templates/reset-password';
import crypto from 'crypto';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  await dbConnect();

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email requis' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // On retourne toujours succès pour ne pas révéler si l'email existe
  if (!user) {
    return res.status(200).json({ success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1h
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
  const { subject, html } = resetPasswordEmail({ name: user.name, resetUrl });
  await sendEmail({ to: user.email, subject, html });

  return res.status(200).json({
    success: true,
    message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
  });
}

export default errorHandler(handler);
