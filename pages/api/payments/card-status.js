import dbConnect from '@/lib/db';
import CardPaymentAttempt from '@/models/CardPaymentAttempt';
import { withAuth } from '@/middleware/withAuth';
import { errorHandler } from '@/middleware/errorHandler';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    await dbConnect();

    const { attemptId } = req.query;
    const userId = req.user?.id;

    if (!attemptId || !userId) {
      return res.status(400).json({ error: 'ID de tentative manquant' });
    }

    // Récupérer la tentative de paiement
    const attempt = await CardPaymentAttempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({ error: 'Tentative de paiement non trouvée' });
    }

    // Vérifier que la tentative appartient à l'utilisateur actuel
    if (attempt.user.toString() !== userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Retourner le statut et les détails pertinents
    res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id.toString(),
        status: attempt.status,
        createdAt: attempt.createdAt,
        expiresAt: attempt.expiresAt,
        otp: {
          verified: attempt.otp.verified,
          attemptsRemaining: attempt.otp.maxAttempts - attempt.otp.attempts,
        },
        // Messages de statut pour l'UI
        statusMessage: getStatusMessage(attempt.status),
      },
    });
  } catch (err) {
    console.error('[v0] Card status error:', err);
    return errorHandler(res, err);
  }
}

function getStatusMessage(status) {
  const messages = {
    pending_otp: 'En attente du code OTP...',
    otp_verified: 'Code OTP vérifié. En attente de la confirmation de l\'admin...',
    processing: 'Paiement en cours de traitement...',
    approved: 'Paiement approuvé!',
    rejected: 'Paiement rejeté. Veuillez réessayer ou changer de carte.',
    expired: 'La tentative de paiement a expiré.',
    cancelled: 'Paiement annulé.',
  };
  return messages[status] || 'Statut inconnu';
}

export default withAuth(handler);
