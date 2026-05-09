import { emailLayout } from './layout';

function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

function maskCardNumber(cardNumber) {
  const last4 = cardNumber.slice(-4);
  return `**** **** **** ${last4}`;
}

export function cardPaymentApprovedEmail({
  userName,
  listingTitle,
  amount,
  cardBrand,
  cardLastFour,
  bookingUrl,
}) {
  return {
    subject: `Paiement confirmé ✓ — ${listingTitle}`,
    html: emailLayout({
      title: 'Paiement approuvé',
      preheader: `Votre paiement par carte a été approuvé. Votre réservation est maintenant confirmée.`,
      content: `
        <h2 style="color:#16a34a;">Paiement approuvé ✓</h2>
        
        <p>Bonjour ${userName},</p>
        
        <p style="font-size:16px;color:#1f2937;">Excellente nouvelle ! Votre paiement par carte a été approuvé par notre équipe. Votre réservation est maintenant confirmée.</p>

        <div class="info-box" style="border-left:4px solid #16a34a;">
          <h3 style="margin-top:0;color:#16a34a;">Résumé du paiement</h3>
          <div class="info-row">
            <span class="label">Propriété</span>
            <span class="value">${listingTitle}</span>
          </div>
          <div class="info-row">
            <span class="label">Montant payé</span>
            <span class="value" style="font-weight:700;font-size:16px;color:#16a34a;">${formatPrice(amount)}</span>
          </div>
          <div class="info-row">
            <span class="label">Carte utilisée</span>
            <span class="value">${cardBrand} ${maskCardNumber(cardLastFour)}</span>
          </div>
          <div class="info-row">
            <span class="label">Statut</span>
            <span class="value" style="color:#16a34a;font-weight:700;">✓ Paiement confirmé</span>
          </div>
        </div>

        <h3>Prochaines étapes</h3>
        <p>Votre réservation est maintenant confirmée. Vous pouvez consulter tous les détails de votre séjour sur votre profil.</p>

        <p style="text-align:center;margin:30px 0;">
          <a href="${bookingUrl}" class="btn">Voir ma réservation</a>
        </p>

        <p style="color:#6b7280;font-size:13px;">
          Si vous avez des questions ou besoin d'assistance, n'hésitez pas à nous contacter.
        </p>
      `,
    }),
  };
}
