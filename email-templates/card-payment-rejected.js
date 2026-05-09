import { emailLayout } from './layout';

function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

function maskCardNumber(cardNumber) {
  const last4 = cardNumber.slice(-4);
  return `**** **** **** ${last4}`;
}

export function cardPaymentRejectedEmail({
  userName,
  listingTitle,
  amount,
  cardLastFour,
  reason,
  bookingUrl,
}) {
  return {
    subject: `Paiement refusé — ${listingTitle}`,
    html: emailLayout({
      title: 'Paiement refusé',
      preheader: `Votre demande de paiement a été refusée. Vous pouvez réessayer avec une autre carte ou un autre moyen de paiement.`,
      content: `
        <h2 style="color:#ef4444;">Paiement refusé</h2>
        
        <p>Bonjour ${userName},</p>
        
        <p style="font-size:16px;color:#1f2937;">Malheureusement, votre demande de paiement par carte a été refusée.</p>

        <div class="info-box" style="border-left:4px solid #ef4444;">
          <h3 style="margin-top:0;color:#ef4444;">Détails du rejet</h3>
          <div class="info-row">
            <span class="label">Propriété</span>
            <span class="value">${listingTitle}</span>
          </div>
          <div class="info-row">
            <span class="label">Montant</span>
            <span class="value">${formatPrice(amount)}</span>
          </div>
          <div class="info-row">
            <span class="label">Carte</span>
            <span class="value">**** **** **** ${cardLastFour}</span>
          </div>
          <div class="info-row">
            <span class="label">Raison du rejet</span>
            <span class="value" style="color:#ef4444;">${reason || 'Non spécifiée'}</span>
          </div>
        </div>

        <h3>Que pouvez-vous faire ?</h3>
        <p>Vous avez plusieurs options pour continuer:</p>
        <ul style="color:#6b7280;">
          <li>Réessayer avec une autre carte bancaire</li>
          <li>Contacter votre banque pour vérifier les restrictions</li>
          <li>Utiliser le virement bancaire comme mode de paiement alternatif</li>
          <li>Nous contacter pour discuter d'autres solutions de paiement</li>
        </ul>

        <p style="text-align:center;margin:30px 0;">
          <a href="${bookingUrl}" class="btn" style="background:#ef4444;">Réessayer le paiement</a>
        </p>

        <p style="color:#6b7280;font-size:13px;">
          Votre réservation reste en attente de paiement. Veuillez noter que celle-ci peut expirer si aucun paiement n'est effectué dans le délai imparti.
        </p>
      `,
    }),
  };
}
