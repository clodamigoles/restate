import dbConnect from '@/lib/db';
import CardPaymentAttempt from '@/models/CardPaymentAttempt';
import { withAuth } from '@/middleware/withAuth';
import { errorHandler } from '@/middleware/errorHandler';

/**
 * POST /api/payments/card-verify-otp
 * Vérifie le code OTP saisi par l'utilisateur
 * 
 * Body:
 * - attemptId: ID de la tentative de paiement
 * - otp: Code OTP à 6 chiffres saisi par l'utilisateur
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  try {
    await dbConnect();

    const { attemptId, otp } = req.body;
    const userId = req.user._id;

    // Validation des données
    if (!attemptId || !otp) {
      return res.status(400).json({
        message: 'Données manquantes',
        errors: {
          attemptId: !attemptId ? 'ID de tentative requis' : undefined,
          otp: !otp ? 'Code OTP requis' : undefined,
        },
      });
    }

    // Validation du format OTP (6 chiffres)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: 'Format OTP invalide',
        error: 'Le code OTP doit contenir 6 chiffres',
      });
    }

    // Récupérer la tentative de paiement
    const attempt = await CardPaymentAttempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        message: 'Tentative de paiement non trouvée',
      });
    }

    // Vérifier que la tentative appartient à l'utilisateur courant
    if (attempt.user.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'Accès refusé',
        error: 'Cette tentative ne vous appartient pas',
      });
    }

    // Vérifier que la tentative est au statut 'pending_otp'
    if (attempt.status !== 'pending_otp') {
      return res.status(400).json({
        message: 'Statut de tentative invalide',
        error: `La tentative est au statut: ${attempt.status}`,
      });
    }

    // Vérifier l'OTP
    const otpVerification = attempt.verifyOtp(otp);

    if (!otpVerification.valid) {
      // Sauvegarder le nombre de tentatives augmenté
      await attempt.save();

      return res.status(400).json({
        message: 'Vérification OTP échouée',
        error: otpVerification.error,
        attemptsRemaining: Math.max(0, 3 - attempt.attempts),
      });
    }

    // Marquer l'OTP comme vérifié
    attempt.markOtpVerified();
    await attempt.save();

    // Répondre avec succès
    return res.status(200).json({
      message: 'Code OTP vérifié avec succès',
      data: {
        attemptId: attempt._id.toString(),
        status: attempt.status,
        otpVerifiedAt: attempt.otpVerifiedAt,
      },
    });
  } catch (error) {
    console.error('[v0] Erreur lors de la vérification OTP:', error);
    return res.status(500).json({
      message: 'Erreur serveur lors de la vérification OTP',
      error: error.message,
    });
  }
}

export default withAuth(handler);
