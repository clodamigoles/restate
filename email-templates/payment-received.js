import { emailLayout } from './layout';

function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' \u20ac';
}

function t(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.fr || Object.values(field).find((v) => v) || '';
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function paymentReceivedEmail({ userName, booking, payment, listing, bookingUrl }) {
  const methodLabel = payment.method === 'paypal' ? 'PayPal' : 'Virement bancaire';

  return {
    subject: `Paiement confirmé — ${t(listing.title)}`,
    html: emailLayout({
      title: 'Confirmation de paiement',
      preheader: `Votre paiement de ${formatPrice(payment.amount)} a bien été reçu.`,
      content: `
        <h2>Paiement confirmé ✓</h2>
        <p>Bonjour ${userName},</p>
        <p>Nous avons bien reçu votre paiement pour la réservation de <strong>${t(listing.title)}</strong>. Votre réservation est désormais <strong>confirmée</strong>.</p>

        <div class="info-box">
          <div class="info-row">
            <span class="label">Logement</span>
            <span class="value">${t(listing.title)}</span>
          </div>
          <div class="info-row">
            <span class="label">Arrivée</span>
            <span class="value">${formatDate(booking.checkIn)}</span>
          </div>
          <div class="info-row">
            <span class="label">Départ</span>
            <span class="value">${formatDate(booking.checkOut)}</span>
          </div>
          <div class="info-row">
            <span class="label">Mode de paiement</span>
            <span class="value">${methodLabel}</span>
          </div>
          <div class="total-row">
            <span>Montant payé</span>
            <span>${formatPrice(payment.amount)}</span>
          </div>
        </div>

        <p>Conservez cet email comme preuve de paiement. Référence&nbsp;: <code>${payment._id}</code></p>
        <p style="text-align:center;">
          <a href="${bookingUrl}" class="btn">Voir ma réservation</a>
        </p>
      `,
    }),
  };
}
