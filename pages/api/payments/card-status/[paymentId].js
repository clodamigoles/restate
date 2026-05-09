/**
 * GET /api/payments/card-status/[paymentId]
 *
 * Étape 4 du flux de paiement carte :
 * Endpoint de polling appelé par le client toutes les 3 secondes
 * pour savoir si l'admin a pris une décision.
 *
 * Retourne :
 *   { status: 'pending' }   → l'admin n'a pas encore décidé (continuer à poller)
 *   { status: 'approved' }  → paiement validé → afficher succès côté client
 *   { status: 'rejected' }  → paiement refusé → afficher échec + option réessayer
 *   { status: 'expired' }   → session OTP expirée sans décision
 *
 * Authentification : withAuth (le paymentId doit appartenir au user connecté)
 */

import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import OtpSession from '@/models/OtpSession';
import mongoose from 'mongoose';
import { withAuth } from '@/middleware/withAuth';
import { errorHandler } from '@/middleware/errorHandler';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  await dbConnect();

  const { paymentId } = req.query;

  if (!mongoose.isValidObjectId(paymentId)) {
    return res.status(400).json({ success: false, error: 'ID invalide' });
  }

  // ── Récupération du Payment ───────────────────────────────────
  const payment = await Payment.findOne({
    _id: paymentId,
    user: req.user.id,
    method: 'card',
  }).lean();

  if (!payment) {
    return res.status(404).json({ success: false, error: 'Paiement introuvable' });
  }

  // ── Mapping statut Payment → réponse client ───────────────────
  if (payment.status === 'completed') {
    return res.status(200).json({ success: true, status: 'approved' });
  }

  if (payment.status === 'failed') {
    return res.status(200).json({ success: true, status: 'rejected' });
  }

  // Payment encore pending → on vérifie que la session OTP n'a pas expiré
  // (la session est déjà détruite par TTL MongoDB si expirée)
  const sessionRef = (payment.notes || '').match(/otp_session:([a-f0-9]{24})/)?.[1];

  if (sessionRef) {
    const session = await OtpSession.findById(sessionRef).lean();
    if (!session) {
      // Session expirée sans décision admin
      return res.status(200).json({ success: true, status: 'expired' });
    }
  }

  // Toujours en attente de la décision admin
  return res.status(200).json({ success: true, status: 'pending' });
}

export default errorHandler(withAuth(handler));
