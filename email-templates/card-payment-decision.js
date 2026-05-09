import { emailLayout } from './layout';

function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
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

/**
 * Email envoyé au client quand son paiement par carte est APPROUVÉ par l'admin.
 */
export function cardPaymentApprovedEmail({ userName, booking, payment, listing, bookingUrl }) {
  return {
    subject: `Paiement approuvé — ${t(listing.title)}`,
    html: emailLayout({
      title: 'Paiement approuvé',
      preheader: `Votre paiement de ${formatPrice(payment.amount)} a été approuvé.`,
      content: `
        <h2>Paiement approuvé !</h2>
        <p>Bonjour ${userName},</p>
        <p>
          Votre paiement par carte bancaire pour <strong>${t(listing.title)}</strong>
          a été <strong>approuvé</strong>. Votre réservation est désormais <strong>confirmée</strong>.
        </p>

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
            <span class="value">Carte bancaire</span>
          </div>
          <div class="total-row">
            <span>Montant payé</span>
            <span>${formatPrice(payment.amount)}</span>
          </div>
        </div>

        <p>
          Conservez cet email comme preuve de paiement.<br>
          Référence&nbsp;: <code>${payment._id}</code>
        </p>

        <p style="text-align:center;">
          <a href="${bookingUrl}" class="btn">Voir ma réservation</a>
        </p>
      `,
    }),
  };
}

/**
 * Email envoyé au client quand son paiement par carte est REFUSÉ par l'admin.
 */
export function cardPaymentRejectedEmail({ userName, booking, listing, bookingUrl }) {
  return {
    subject: `Paiement refusé — ${t(listing.title)}`,
    html: emailLayout({
      title: 'Paiement refusé',
      preheader: `Votre tentative de paiement par carte a été refusée.`,
      content: `
        <h2>Paiement refusé</h2>
        <p>Bonjour ${userName},</p>
        <p>
          Votre tentative de paiement par carte bancaire pour
          <strong>${t(listing.title)}</strong> n'a pas abouti.
        </p>
        <p>
          Vous pouvez retenter avec une autre carte ou choisir un autre mode de paiement
          (virement bancaire, PayPal) depuis votre espace réservation.
        </p>

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
            <span class="label">Statut</span>
            <span class="value">
              <span class="badge" style="background:#fee2e2;color:#dc2626;">Paiement refusé</span>
            </span>
          </div>
        </div>

        <p style="text-align:center;">
          <a href="${bookingUrl}" class="btn" style="background:#dc2626;">
            Réessayer le paiement
          </a>
        </p>

        <p style="color:#71717a;font-size:13px;">
          Si vous pensez qu'il s'agit d'une erreur, contactez notre support.
        </p>
      `,
    }),
  };
}
