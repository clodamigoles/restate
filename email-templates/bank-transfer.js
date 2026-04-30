import { emailLayout } from './layout';

function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

function t(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.fr || Object.values(field).find((v) => v) || '';
}

export function bankTransferEmail({ userName, listing, bankDetails, bookingUrl }) {
  return {
    subject: `Vos coordonnées bancaires — ${t(listing.title)}`,
    html: emailLayout({
      title: 'Virement bancaire',
      preheader: `Effectuez votre virement pour finaliser votre réservation de ${t(listing.title)}.`,
      content: `
        <h2>Finalisez votre paiement par virement</h2>
        <p>Bonjour ${userName},</p>
        <p>Voici les coordonnées bancaires pour régler votre réservation de <strong>${t(listing.title)}</strong>. Veuillez effectuer le virement dans les meilleurs délais afin de confirmer votre séjour.</p>

        <div class="info-box">
          <div class="info-row">
            <span class="label">Bénéficiaire</span>
            <span class="value">${bankDetails.beneficiary}</span>
          </div>
          <div class="info-row">
            <span class="label">IBAN</span>
            <span class="value" style="font-family:monospace;letter-spacing:1px;">${bankDetails.iban}</span>
          </div>
          <div class="info-row">
            <span class="label">BIC / SWIFT</span>
            <span class="value" style="font-family:monospace;">${bankDetails.bic}</span>
          </div>
          <div class="info-row">
            <span class="label">Référence à indiquer</span>
            <span class="value" style="font-family:monospace;font-weight:700;color:#1d4ed8;">${bankDetails.reference}</span>
          </div>
          <div class="total-row">
            <span>Montant à virer</span>
            <span>${formatPrice(bankDetails.amount)}</span>
          </div>
        </div>

        <p style="color:#ca8a04;font-size:13px;">⚠️ Pensez à indiquer la référence <strong>${bankDetails.reference}</strong> dans le libellé de votre virement. Sans cette référence, votre paiement ne pourra pas être identifié.</p>

        <p>Une fois le virement effectué, revenez sur votre réservation pour nous en informer.</p>

        <p style="text-align:center;">
          <a href="${bookingUrl}" class="btn">Voir ma réservation</a>
        </p>
      `,
    }),
  };
}
